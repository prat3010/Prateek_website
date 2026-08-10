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

  it('generates direct upi:// URI scheme and base64 PNG QR code', async () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_123';
    process.env.RAZORPAY_KEY_SECRET = 'secret_456';
    process.env.NEXT_PUBLIC_UPI_VPA = 'prateeqsharma@ybl';

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'qr_test_id_99',
        entity: 'qr_code',
        type: 'upi_qr',
        fixed_amount: true,
        payment_amount: 50000,
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
    expect(data.payloadType).toBe('upi_direct');
    expect(data.upiString).toContain('upi://pay?pa=prateeqsharma%40ybl&pn=Prateek%20Sharma&am=500.00&cu=INR');
    expect(data.imageUrl).toMatch(/^data:image\/png;base64,/);
  });
});
