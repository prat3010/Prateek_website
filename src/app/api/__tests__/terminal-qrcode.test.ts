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

  it('returns 503 if Razorpay env credentials are missing', async () => {
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

  it('calls Razorpay API and extracts direct upi:// link when available', async () => {
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = 'rzp_test_123';
    process.env.RAZORPAY_KEY_SECRET = 'secret_456';

    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url === 'https://api.razorpay.com/v1/payments/qr_codes') {
        return Promise.resolve({
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
      }

      if (url === 'https://rzp.io/i/mock_qr_image') {
        return Promise.resolve({
          ok: true,
          text: async () => `
            <html>
              <body>
                <a href="upi://pay?pa=razorpay@icici&pn=Prateek%20Sharma&am=500.00&cu=INR">Pay via UPI</a>
              </body>
            </html>
          `,
        });
      }

      return Promise.reject(new Error('Unknown URL'));
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
    expect(data.imageUrl).toMatch(/^data:image\/png;base64,/);
  });
});
