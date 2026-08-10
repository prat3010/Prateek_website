import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

const mocks = vi.hoisted(() => {
  const state = {
    invalidToken: false,
    invalidSignature: false,
  };

  const mockScopeRow = {
    id: 'scope-uuid-1',
    scope_code: 'SCOPE-10001',
    client_id: 'client-uuid-1',
    client_email: 'client@example.com',
    company_name: 'Acme Test Corp',
    total_cost_inr: 175000,
    total_cost_usd: 2500,
    currency: 'INR',
  };

  const selectFn = vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({
        data: mockScopeRow,
        error: null,
      }),
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: mockScopeRow,
          error: null,
        }),
      }),
    }),
  });

  const insertFn = vi.fn().mockResolvedValue({ data: null, error: null });
  const updateFn = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
  });

  return { state, selectFn, insertFn, updateFn };
});

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return {
      from: vi.fn(() => ({
        select: mocks.selectFn,
        insert: mocks.insertFn,
        update: mocks.updateFn,
      })),
    };
  },
}));

vi.mock('@/lib/sessionVerify', () => ({
  getVerifiedSessionEmail: vi.fn(async (req: Request) => {
    const token = req.headers.get('authorization') || '';
    if (!token.startsWith('Bearer ')) return null;
    if (mocks.state.invalidToken) return null;
    return 'client@example.com';
  }),
}));

import { POST as createOrderPOST } from '@/app/api/client/create-razorpay-order/route';
import { POST as verifyPaymentPOST } from '@/app/api/client/verify-razorpay-payment/route';
import { POST as webhookPOST } from '@/app/api/webhooks/razorpay/route';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.invalidToken = false;
  mocks.state.invalidSignature = false;
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_TNlzrkOYoHQLxv';
  process.env.RAZORPAY_KEY_SECRET = 'ocJs7m0Gr5GxIm4cMnyNT0pK';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'ocJs7m0Gr5GxIm4cMnyNT0pK';
});

const authorizedHeaders = { Authorization: 'Bearer valid-token' };

describe('POST /api/client/create-razorpay-order', () => {
  it('returns 401 without valid session', async () => {
    const req = new Request('http://localhost/api/client/create-razorpay-order', {
      method: 'POST',
      body: JSON.stringify({ scopeCode: 'SCOPE-10001' }),
    });
    const res = await createOrderPOST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 if scopeCode is missing', async () => {
    const req = new Request('http://localhost/api/client/create-razorpay-order', {
      method: 'POST',
      headers: authorizedHeaders,
      body: JSON.stringify({}),
    });
    const res = await createOrderPOST(req);
    expect(res.status).toBe(400);
  });

  it('creates Razorpay order and returns keyId with order details', async () => {
    // Mock global fetch for Razorpay API call
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'order_test_123456789',
          amount: 8750000,
          currency: 'INR',
        }),
      })
    );

    const req = new Request('http://localhost/api/client/create-razorpay-order', {
      method: 'POST',
      headers: authorizedHeaders,
      body: JSON.stringify({ scopeCode: 'SCOPE-10001' }),
    });

    const res = await createOrderPOST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.orderId).toBe('order_test_123456789');
    expect(json.amount).toBe(8750000);
    expect(json.keyId).toBe('rzp_test_TNlzrkOYoHQLxv');

    vi.unstubAllGlobals();
  });
});

describe('POST /api/client/verify-razorpay-payment', () => {
  const keySecret = 'ocJs7m0Gr5GxIm4cMnyNT0pK';
  const orderId = 'order_test_123456789';
  const paymentId = 'pay_test_987654321';
  const validSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  it('returns 400 when signature mismatches', async () => {
    const req = new Request('http://localhost/api/client/verify-razorpay-payment', {
      method: 'POST',
      headers: authorizedHeaders,
      body: JSON.stringify({
        scopeCode: 'SCOPE-10001',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: 'invalid_signature_hash',
      }),
    });

    const res = await verifyPaymentPOST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('verification failed');
  });

  it('verifies valid signature and activates scope deposit', async () => {
    const req = new Request('http://localhost/api/client/verify-razorpay-payment', {
      method: 'POST',
      headers: authorizedHeaders,
      body: JSON.stringify({
        scopeCode: 'SCOPE-10001',
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      }),
    });

    const res = await verifyPaymentPOST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toContain('Payment verified');
  });
});

describe('POST /api/webhooks/razorpay', () => {
  const secret = 'ocJs7m0Gr5GxIm4cMnyNT0pK';

  it('returns 400 when signature is missing', async () => {
    const req = new Request('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      body: JSON.stringify({ event: 'payment.captured' }),
    });
    const res = await webhookPOST(req);
    expect(res.status).toBe(400);
  });

  it('verifies valid webhook signature and updates invoice', async () => {
    const payload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_test_99999',
            order_id: 'order_test_123456789',
            notes: { scope_code: 'SCOPE-10001' },
          },
        },
      },
    });

    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const req = new Request('http://localhost/api/webhooks/razorpay', {
      method: 'POST',
      headers: {
        'x-razorpay-signature': signature,
        'content-type': 'application/json',
      },
      body: payload,
    });

    const res = await webhookPOST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
  });
});

import { POST as createSubPOST } from '@/app/api/client/create-razorpay-subscription/route';
import { POST as createQrPOST } from '@/app/api/terminal/create-qr/route';

describe('POST /api/client/create-razorpay-subscription', () => {
  it('creates mock subscription when credentials are missing or in dev', async () => {
    delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    const req = new Request('http://localhost/api/client/create-razorpay-subscription', {
      method: 'POST',
      body: JSON.stringify({ planId: 'plan_starter_inr' }),
    });

    const res = await createSubPOST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.isMock).toBe(true);
    expect(json.subscriptionId).toContain('sub_mock_');
  });
});

describe('POST /api/terminal/create-qr', () => {
  it('generates dynamic QR response with provided amount', async () => {
    const req = new Request('http://localhost/api/terminal/create-qr', {
      method: 'POST',
      body: JSON.stringify({ amount: 500 }),
    });

    const res = await createQrPOST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.amount).toBe(500);
    expect(json.qr_id).toBeDefined();
  });
});

