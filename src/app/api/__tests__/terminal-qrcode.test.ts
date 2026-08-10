import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../terminal/qrcode/route';

describe('POST /api/terminal/qrcode', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns 400 if amount is missing or invalid', async () => {
    const req = new Request('http://localhost/api/terminal/qrcode', {
      method: 'POST',
      body: JSON.stringify({ amount: 'invalid' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('returns 400 if amount is zero or negative', async () => {
    const req = new Request('http://localhost/api/terminal/qrcode', {
      method: 'POST',
      body: JSON.stringify({ amount: -100 }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it('returns 400 if amount exceeds max limit', async () => {
    const req = new Request('http://localhost/api/terminal/qrcode', {
      method: 'POST',
      body: JSON.stringify({ amount: 600000 }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/exceeds maximum/i);
  });

  it('returns 503 if Razorpay credentials are not set', async () => {
    delete process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    delete process.env.RAZORPAY_KEY_SECRET;

    const req = new Request('http://localhost/api/terminal/qrcode', {
      method: 'POST',
      body: JSON.stringify({ amount: 500 }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(503);
    expect(data.error).toMatch(/not configured/i);
  });

  it('calls Razorpay API and returns exact QR payload on success', async () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_123';
    process.env.RAZORPAY_KEY_SECRET = 'secret_456';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'qr_test_id_99',
        entity: 'qr_code',
        type: 'upi_qr',
        fixed_amount: true,
        payment_amount: 50000,
        image_url: 'https://rzp.io/i/mock_qr_image',
      }),
    });

    vi.stubGlobal('fetch', mockFetch);

    const req = new Request('http://localhost/api/terminal/qrcode', {
      method: 'POST',
      body: JSON.stringify({ amount: 500 }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.amount).toBe(500);
    expect(data.qrId).toBe('qr_test_id_99');
    expect(data.imageUrl).toMatch(/^data:image\/png;base64,/);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.razorpay.com/v1/payments/qr_codes',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: expect.stringContaining('"payment_amount":50000'),
      })
    );
  });
});
