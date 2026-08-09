import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { CreateInvoiceInput } from '@/lib/clientOrder';
import { calculateInvoiceTotals, generateInvoiceNumber } from '@/lib/invoicing';

export async function POST(req: Request) {
  try {
    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    const payload: CreateInvoiceInput = await req.json();

    if (!payload.customer_name || !payload.customer_email) {
      return NextResponse.json(
        { error: 'Customer Name and Customer Email are required fields.' },
        { status: 400 }
      );
    }

    if (!payload.line_items || payload.line_items.length === 0) {
      return NextResponse.json({ error: 'At least one line item is required.' }, { status: 400 });
    }

    const isDev = process.env.NODE_ENV === 'development';
    const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

    // Calculate itemized invoice totals, tax breakup, and grand total
    const invoiceCalc = calculateInvoiceTotals({
      currency: payload.currency || 'INR',
      place_of_supply: payload.place_of_supply,
      billing_address: payload.billing_address,
      line_items: payload.line_items,
    });

    const invoiceNumber = generateInvoiceNumber('INV');
    const issueDateIso = payload.issue_date || new Date().toISOString();
    const expiryDateIso = payload.expiry_date || new Date(Date.now() + 14 * 86400 * 1000).toISOString();

    // Notes and terms truncation to max 2048 chars per Razorpay spec
    const customerNotes = (payload.customer_notes || '').slice(0, 2048);
    const termsAndConditions = (payload.terms_and_conditions || '').slice(0, 2048);

    let scopeId: string | null = null;
    let clientId: string | null = null;

    if (supabase && payload.scope_code) {
      try {
        const { data: scope } = await supabase
          .from('client_scopes')
          .select('id, client_id')
          .eq('scope_code', payload.scope_code)
          .maybeSingle();

        if (scope) {
          scopeId = scope.id;
          clientId = scope.client_id;
        }
      } catch (err) {
        console.warn('Scope lookup warning in create-razorpay-invoice:', err);
      }
    }

    // Call Razorpay Invoices API if credentials present
    let razorpayInvoiceId = '';
    let paymentUrl = '';

    if (KEY_ID && KEY_SECRET) {
      try {
        const authHeader = 'Basic ' + Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
        const expireByUnix = Math.floor(new Date(expiryDateIso).getTime() / 1000);

        const rzpPayload = {
          type: 'invoice',
          label: 'Invoice',
          invoice_number: invoiceNumber,
          customer: {
            name: payload.customer_name,
            email: payload.customer_email,
            contact: payload.customer_phone || '',
            gstin: payload.customer_gstin || '',
            billing_address: payload.billing_address || {},
            shipping_address: payload.shipping_address || {},
          },
          line_items: invoiceCalc.line_items.map((item) => ({
            name: item.name,
            description: item.description,
            amount: Math.round(item.rate * 100),
            quantity: item.quantity,
            hsn_code: item.sac_hsn,
            sac_code: item.sac_hsn,
          })),
          currency: invoiceCalc.currency,
          expire_by: expireByUnix > 0 ? expireByUnix : undefined,
          notes: {
            scope_code: payload.scope_code || '',
            place_of_supply: payload.place_of_supply || '',
          },
          sms_notify: 0,
          email_notify: 0,
          partial_payment: payload.allow_partial ? 1 : 0,
        };

        const res = await fetch('https://api.razorpay.com/v1/invoices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify(rzpPayload),
        });

        if (res.ok) {
          const rzpData = await res.json();
          razorpayInvoiceId = rzpData.id || '';
          paymentUrl = rzpData.short_url || rzpData.payment_url || '';
        } else {
          const rzpErr = await res.text();
          console.warn('Razorpay Invoice API create response warning:', rzpErr);
        }
      } catch (rzpErr) {
        console.warn('Razorpay Invoice API create offline/error:', rzpErr);
      }
    }

    if (isDev && !razorpayInvoiceId) {
      razorpayInvoiceId = `inv_mock_${Date.now()}`;
      paymentUrl = `https://rzp.io/i/mock_${Date.now()}`;
    }

    const invoiceRecord = {
      invoice_number: invoiceNumber,
      scope_id: scopeId,
      client_id: clientId,
      customer_name: payload.customer_name,
      customer_email: payload.customer_email,
      customer_phone: payload.customer_phone || null,
      customer_gstin: payload.customer_gstin || null,
      billing_address: payload.billing_address || null,
      shipping_address: payload.shipping_address || payload.billing_address || null,
      place_of_supply: payload.place_of_supply || payload.billing_address?.state || 'Delhi',
      is_gst: invoiceCalc.is_gst,
      line_items: invoiceCalc.line_items,
      tax_breakup: invoiceCalc.tax_breakup,
      milestone_name: payload.milestone_name || 'Project Service Invoice',
      amount: invoiceCalc.grand_total,
      currency: invoiceCalc.currency,
      payment_status: 'issued',
      razorpay_invoice_id: razorpayInvoiceId,
      payment_url: paymentUrl,
      issue_date: issueDateIso,
      due_date: expiryDateIso,
      expiry_date: expiryDateIso,
      customer_notes: customerNotes,
      terms_and_conditions: termsAndConditions,
      allow_partial: Boolean(payload.allow_partial),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        await supabase.from('invoices').insert(invoiceRecord);
      } catch (dbErr) {
        console.warn('Supabase invoice insert warning:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      invoice: invoiceRecord,
      message: `Invoice ${invoiceNumber} created and issued successfully!`,
    });
  } catch (err: unknown) {
    console.error('Create Razorpay Invoice API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
