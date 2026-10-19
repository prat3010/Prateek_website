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
    maintenance_plan: 'Standard Care Plan',
    maintenance_status: 'inactive',
    maintenance_subscription_id: '',
    maintenance_current_period_end: null,
  };

  const mockInvoiceRow = {
    id: 'invoice-uuid-1',
    scope_id: 'scope-uuid-1',
    customer_email: 'client@example.com',
    payment_status: 'pending',
    razorpay_payment_id: null,
  };

  const makeSelectQuery = (data: unknown) => {
    const query: Record<string, ReturnType<typeof vi.fn>> = {
      eq: vi.fn(),
      or: vi.fn(),
      limit: vi.fn(),
      order: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    };
    query.eq.mockReturnValue(query);
    query.or.mockReturnValue(query);
    query.limit.mockReturnValue(query);
    query.order.mockReturnValue(query);
    return query;
  };

  const makeUpdateQuery = () => {
    const query = {
      eq: vi.fn().mockResolvedValue({ data: [{ id: 'updated-record' }], error: null }),
      select: vi.fn().mockResolvedValue({ data: [{ id: 'updated-record' }], error: null }),
    };
    return query;
  };

  const insertFn = vi.fn().mockResolvedValue({ data: null, error: null });
  const upsertFn = vi.fn().mockResolvedValue({ data: null, error: null });
  const fromFn = vi.fn((table: string) => ({
    select: vi.fn(() => makeSelectQuery(table === 'invoices' ? mockInvoiceRow : mockScopeRow)),
    insert: insertFn,
    update: vi.fn(() => makeUpdateQuery()),
    upsert: upsertFn,
  }));

  return { state, fromFn, insertFn, upsertFn, mockScopeRow, mockInvoiceRow };
});

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return {
      from: mocks.fromFn,
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
  getVerifiedSessionUser: vi.fn(async (req: Request) => {
    const token = req.headers.get('authorization') || '';
    if (!token.startsWith('Bearer ')) return null;
    if (mocks.state.invalidToken) return null;
    return { id: 'user-uuid-1', email: 'client@example.com' };
  }),
}));

vi.mock('@/lib/emailNotification', () => ({
  sendPaymentConfirmationNotifications: vi.fn().mockResolvedValue(true),
  sendRetrieverSubscriptionNotifications: vi.fn().mockResolvedValue(true),
  sendFinalBalanceSettlementNotifications: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/retrieverProvision', () => ({
  ensureRetrieverEngineTenant: vi.fn().mockResolvedValue({
    tenantId: 'tn_mock_test',
    apiKey: 'ret_live_mock',
    apiKeyHash: 'hash_mock',
  }),
}));

import { resolvePlanSpec, POST as createSubPOST } from '@/app/api/client/create-razorpay-subscription/route';
import { POST as verifySubPOST } from '@/app/api/client/verify-razorpay-subscription/route';
import { POST as webhookPOST } from '@/app/api/webhooks/razorpay/route';
import { resolveMaintenancePlanKey } from '@/lib/clientOrder';
import { sendPaymentConfirmationNotifications } from '@/lib/emailNotification';
import { ensureRetrieverEngineTenant } from '@/lib/retrieverProvision';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.state.invalidToken = false;
  mocks.state.invalidSignature = false;
  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_mock_key';
  process.env.RAZORPAY_KEY_SECRET = 'test_secret_mock_key';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'test_secret_mock_key';
});

const authorizedHeaders = { Authorization: 'Bearer valid-token' };

describe('Milestone 4: Care Plan Recurring Billing & Subscriptions', () => {
  describe('Plan Specification & Resolution', () => {
    it('correctly maps maintenance plan names and currencies via resolveMaintenancePlanKey', () => {
      expect(resolveMaintenancePlanKey('Basic Care Plan', 'INR')).toBe('care_basic_inr');
      expect(resolveMaintenancePlanKey('Basic Care Plan', 'USD')).toBe('care_basic_usd');
      expect(resolveMaintenancePlanKey('Standard Care Plan', 'INR')).toBe('care_standard_inr');
      expect(resolveMaintenancePlanKey('Standard Care Plan', 'USD')).toBe('care_standard_usd');
      expect(resolveMaintenancePlanKey('Premium AI & Dev SLA Care Plan', 'INR')).toBe('care_premium_inr');
      expect(resolveMaintenancePlanKey('Premium AI & Dev SLA Care Plan', 'USD')).toBe('care_premium_usd');
    });

    it('resolves canonical plan specifications for Care Plans', () => {
      const basicInr = resolvePlanSpec('care_basic_inr');
      expect(basicInr.amount).toBe(500000);
      expect(basicInr.currency).toBe('INR');
      expect(basicInr.tier).toBe('basic');
      expect(basicInr.isCarePlan).toBe(true);

      const standardUsd = resolvePlanSpec('care_standard_usd');
      expect(standardUsd.amount).toBe(14000);
      expect(standardUsd.currency).toBe('USD');
      expect(standardUsd.tier).toBe('standard');
      expect(standardUsd.isCarePlan).toBe(true);

      const premiumInr = resolvePlanSpec('care_premium_inr');
      expect(premiumInr.amount).toBe(3500000);
      expect(premiumInr.currency).toBe('INR');
      expect(premiumInr.tier).toBe('premium');
      expect(premiumInr.isCarePlan).toBe(true);
    });

    it('preserves Retriever SaaS resolution without regression', () => {
      const starterInr = resolvePlanSpec('starter_inr');
      expect(starterInr.tier).toBe('starter');
      expect(starterInr.currency).toBe('INR');
      expect(starterInr.isCarePlan).toBeFalsy();

      const proUsd = resolvePlanSpec('pro_usd');
      expect(proUsd.tier).toBe('pro');
      expect(proUsd.currency).toBe('USD');
    });
  });

  describe('POST /api/client/create-razorpay-subscription', () => {
    it('creates a care plan subscription with scopeCode and subscriptionType', async () => {
      const req = new Request('http://localhost/api/client/create-razorpay-subscription', {
        method: 'POST',
        headers: authorizedHeaders,
        body: JSON.stringify({
          planId: 'care_standard_inr',
          scopeCode: 'SCOPE-10001',
        }),
      });

      const res = await createSubPOST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.isMock).toBe(true);
      expect(json.planId).toBe('care_standard_inr');
      expect(json.tier).toBe('standard');
      expect(json.subscriptionType).toBe('care_plan');
      expect(json.scopeCode).toBe('SCOPE-10001');
    });

    it('rejects unauthenticated requests in production mode', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mocks.state.invalidToken = true;

      const req = new Request('http://localhost/api/client/create-razorpay-subscription', {
        method: 'POST',
        headers: { Authorization: 'Bearer invalid' },
        body: JSON.stringify({ planId: 'care_basic_inr' }),
      });

      const res = await createSubPOST(req);
      expect(res.status).toBe(401);

      vi.unstubAllEnvs();
    });
  });

  describe('POST /api/client/verify-razorpay-subscription', () => {
    it('verifies care plan subscription, updates client_scopes, and skips Retriever engine provisioning', async () => {
      const req = new Request('http://localhost/api/client/verify-razorpay-subscription', {
        method: 'POST',
        headers: authorizedHeaders,
        body: JSON.stringify({
          razorpaySubscriptionId: 'sub_mock_care_123',
          razorpayPaymentId: 'pay_mock_care_456',
          razorpaySignature: 'test_sub_signature_mock',
          planId: 'care_standard_inr',
          scopeCode: 'SCOPE-10001',
          subscriptionType: 'care_plan',
        }),
      });

      const res = await verifySubPOST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.subscriptionType).toBe('care_plan');
      expect(json.planTier).toBe('standard');
      expect(json.scopeCode).toBe('SCOPE-10001');

      // Verify Retriever engine tenant was NOT provisioned
      expect(ensureRetrieverEngineTenant).not.toHaveBeenCalled();

      // Verify invoice upsert was called
      expect(mocks.upsertFn).toHaveBeenCalled();

      // Verify payment confirmation email was triggered
      expect(sendPaymentConfirmationNotifications).toHaveBeenCalledWith(
        expect.objectContaining({
          clientEmail: 'client@example.com',
          scopeCode: 'SCOPE-10001',
          amount: 10000,
          currency: 'INR',
        })
      );
    });
  });

  describe('POST /api/webhooks/razorpay (Care Plan Lifecycle)', () => {
    const generateWebhookRequest = (event: string, payload: unknown) => {
      const rawBody = JSON.stringify(payload);
      const signature = crypto
        .createHmac('sha256', 'test_secret_mock_key')
        .update(rawBody)
        .digest('hex');

      return new Request('http://localhost/api/webhooks/razorpay', {
        method: 'POST',
        headers: {
          'x-razorpay-signature': signature,
          'Content-Type': 'application/json',
        },
        body: rawBody,
      });
    };

    it('handles subscription.charged for a care plan without triggering Retriever engine', async () => {
      const webhookPayload = {
        event: 'subscription.charged',
        event_id: 'evt_care_charged_1',
        payload: {
          subscription: {
            entity: {
              id: 'sub_care_test_999',
              current_end: Math.floor(Date.now() / 1000) + 30 * 86400,
              notes: {
                subscription_type: 'care_plan',
                scope_code: 'SCOPE-10001',
                client_email: 'client@example.com',
                plan_id: 'care_standard_inr',
              },
            },
          },
          payment: {
            entity: {
              id: 'pay_care_test_888',
            },
          },
        },
      };

      const req = generateWebhookRequest('subscription.charged', webhookPayload);
      const res = await webhookPOST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.subscription_type).toBe('care_plan');
      expect(json.maintenance_status).toBe('active');
      expect(json.scope_code).toBe('SCOPE-10001');

      // Ensure Retriever engine tenant provisioning was bypassed
      expect(ensureRetrieverEngineTenant).not.toHaveBeenCalled();
    });

    it('handles subscription.cancelled for a care plan by marking status cancelled', async () => {
      const webhookPayload = {
        event: 'subscription.cancelled',
        event_id: 'evt_care_cancelled_1',
        payload: {
          subscription: {
            entity: {
              id: 'sub_care_test_999',
              notes: {
                subscription_type: 'care_plan',
                scope_code: 'SCOPE-10001',
                client_email: 'client@example.com',
                plan_id: 'care_standard_inr',
              },
            },
          },
        },
      };

      const req = generateWebhookRequest('subscription.cancelled', webhookPayload);
      const res = await webhookPOST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.subscription_type).toBe('care_plan');
      expect(json.maintenance_status).toBe('cancelled');
    });

    it('handles subscription.paused for a care plan by marking status paused', async () => {
      const webhookPayload = {
        event: 'subscription.paused',
        event_id: 'evt_care_paused_1',
        payload: {
          subscription: {
            entity: {
              id: 'sub_care_test_999',
              notes: {
                subscription_type: 'care_plan',
                scope_code: 'SCOPE-10001',
                client_email: 'client@example.com',
                plan_id: 'care_standard_inr',
              },
            },
          },
        },
      };

      const req = generateWebhookRequest('subscription.paused', webhookPayload);
      const res = await webhookPOST(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.subscription_type).toBe('care_plan');
      expect(json.maintenance_status).toBe('paused');
    });
  });
});
