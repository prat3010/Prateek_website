import { describe, it, expect, vi } from 'vitest';
import { calculateInvoiceTotals, formatCurrencyAmount } from '@/lib/invoicing';

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return {
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    };
  },
}));

vi.mock('@/lib/sessionVerify', () => ({
  getVerifiedSessionEmail: vi.fn(async (req: Request) => {
    const token = req.headers.get('authorization') || '';
    if (!token.startsWith('Bearer ')) return null;
    return 'client@example.com';
  }),
}));

import { POST as createInvoicePOST } from '@/app/api/client/create-razorpay-invoice/route';

describe('Invoice Tax & Currency Calculations', () => {
  it('correctly calculates Intra-State CGST + SGST for Delhi place of supply', () => {
    const result = calculateInvoiceTotals({
      currency: 'INR',
      place_of_supply: 'Delhi',
      line_items: [
        {
          name: 'Software Engineering',
          sac_hsn: '998314',
          rate: 100000,
          quantity: 1,
          tax_rate: 18,
          tax_type: 'exclusive',
        },
      ],
    });

    expect(result.is_gst).toBe(true);
    expect(result.subtotal).toBe(100000);
    expect(result.tax_breakup.is_interstate).toBe(false);
    expect(result.tax_breakup.cgst_rate).toBe(9);
    expect(result.tax_breakup.cgst_amount).toBe(9000);
    expect(result.tax_breakup.sgst_rate).toBe(9);
    expect(result.tax_breakup.sgst_amount).toBe(9000);
    expect(result.grand_total).toBe(118000);
  });

  it('correctly calculates Inter-State IGST for Karnataka place of supply', () => {
    const result = calculateInvoiceTotals({
      currency: 'INR',
      place_of_supply: 'Karnataka',
      line_items: [
        {
          name: 'Software Engineering',
          sac_hsn: '998314',
          rate: 100000,
          quantity: 1,
          tax_rate: 18,
          tax_type: 'exclusive',
        },
      ],
    });

    expect(result.is_gst).toBe(true);
    expect(result.subtotal).toBe(100000);
    expect(result.tax_breakup.is_interstate).toBe(true);
    expect(result.tax_breakup.igst_rate).toBe(18);
    expect(result.tax_breakup.igst_amount).toBe(18000);
    expect(result.grand_total).toBe(118000);
  });

  it('resets tax rates to 0% for international currencies (USD)', () => {
    const result = calculateInvoiceTotals({
      currency: 'USD',
      place_of_supply: 'Outside India',
      line_items: [
        {
          name: 'Global Consulting',
          sac_hsn: '998314',
          rate: 2500,
          quantity: 1,
          tax_rate: 18, // Should be overridden to 0 for non-INR
          tax_type: 'exclusive',
        },
      ],
    });

    expect(result.is_gst).toBe(false);
    expect(result.subtotal).toBe(2500);
    expect(result.tax_breakup.total_tax).toBe(0);
    expect(result.grand_total).toBe(2500);
  });

  it('correctly calculates mixed-rate line items without assuming line item 0 tax rate', () => {
    const result = calculateInvoiceTotals({
      currency: 'INR',
      place_of_supply: 'Delhi',
      line_items: [
        {
          name: 'Exempt Technical Architecture Audit',
          rate: 50000,
          quantity: 1,
          tax_rate: 0,
          tax_type: 'exclusive',
        },
        {
          name: 'Taxable Custom Implementation',
          rate: 100000,
          quantity: 1,
          tax_rate: 18,
          tax_type: 'exclusive',
        },
      ],
    });

    expect(result.is_gst).toBe(true);
    expect(result.subtotal).toBe(150000);
    expect(result.tax_breakup.total_tax).toBe(18000);
    expect(result.tax_breakup.cgst_amount).toBe(9000);
    expect(result.tax_breakup.sgst_amount).toBe(9000);
    // Effective tax rate: 18000 / 150000 = 12% total, split 6% CGST + 6% SGST
    expect(result.tax_breakup.cgst_rate).toBe(6);
    expect(result.tax_breakup.sgst_rate).toBe(6);
    expect(result.grand_total).toBe(168000);
  });

  it('formats currency strings properly', () => {
    expect(formatCurrencyAmount(118000, 'INR')).toContain('₹');
    expect(formatCurrencyAmount(2500, 'USD')).toContain('$');
  });
});

describe('POST /api/client/create-razorpay-invoice', () => {
  const authorizedHeaders = { Authorization: 'Bearer valid-token' };

  it('returns 401 without valid session token', async () => {
    const req = new Request('http://localhost/api/client/create-razorpay-invoice', {
      method: 'POST',
      body: JSON.stringify({ customer_name: 'Test', customer_email: 'test@example.com' }),
    });
    const res = await createInvoicePOST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 if required fields are missing', async () => {
    const req = new Request('http://localhost/api/client/create-razorpay-invoice', {
      method: 'POST',
      headers: authorizedHeaders,
      body: JSON.stringify({ customer_name: '' }),
    });
    const res = await createInvoicePOST(req);
    expect(res.status).toBe(400);
  });

  it('successfully creates and returns issued invoice', async () => {
    const req = new Request('http://localhost/api/client/create-razorpay-invoice', {
      method: 'POST',
      headers: authorizedHeaders,
      body: JSON.stringify({
        customer_name: 'Acme Corp',
        customer_email: 'client@example.com',
        place_of_supply: 'Delhi',
        currency: 'INR',
        line_items: [
          {
            name: 'Web Engineering',
            sac_hsn: '998314',
            rate: 50000,
            quantity: 1,
            tax_rate: 18,
          },
        ],
      }),
    });

    const res = await createInvoicePOST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.invoice.invoice_number).toContain('INV-');
    expect(json.invoice.amount).toBe(59000);
  });
});
