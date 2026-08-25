import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/data/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        ilike: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockImplementation(async () => {
            return { data: null, error: null };
          }),
        }),
      }),
    }),
  },
}));

import { POST } from '../scoping/validate-promo/route';

describe('POST /api/scoping/validate-promo', () => {
  it('returns 400 when promo code is empty', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/validate-promo', {
      method: 'POST',
      body: JSON.stringify({ code: '', subtotal: 100000, currency: 'INR' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.valid).toBe(false);
  });

  it('validates PRATEEQ10 (10% discount) successfully via fallback / DB', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/validate-promo', {
      method: 'POST',
      body: JSON.stringify({ code: 'prateeq10', subtotal: 100000, currency: 'INR' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.code).toBe('PRATEEQ10');
    expect(data.discountType).toBe('percentage');
    expect(data.discountValue).toBe(10);
    expect(data.discountAmountINR).toBe(10000);
  });

  it('validates GROWTH5 (5% discount) successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/validate-promo', {
      method: 'POST',
      body: JSON.stringify({ code: 'GROWTH5', subtotal: 200000, currency: 'INR' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
    expect(data.discountAmountINR).toBe(10000);
  });

  it('returns 404 for invalid/unknown promo codes', async () => {
    const req = new NextRequest('http://localhost:3000/api/scoping/validate-promo', {
      method: 'POST',
      body: JSON.stringify({ code: 'INVALID_CODE_123', subtotal: 100000, currency: 'INR' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.valid).toBe(false);
    expect(data.error).toContain('invalid');
  });
});
