import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';

export async function POST(req: Request) {
  try {
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
    const payload = await req.json();
    const {
      scopeCode,
      invoiceId,
      invoiceNumber,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = payload;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { error: 'Missing required Razorpay payment verification fields.' },
        { status: 400 }
      );
    }

    const verifiedEmail = await getVerifiedSessionEmail(req);
    if (!verifiedEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }
    const clientEmail = verifiedEmail.toLowerCase();

    if (!KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay secret key not configured on server.' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const expBuf = Buffer.from(expectedSignature, 'utf-8');
    const sigBuf = Buffer.from(razorpaySignature, 'utf-8');

    if (
      expBuf.byteLength !== sigBuf.byteLength ||
      !crypto.timingSafeEqual(expBuf, sigBuf)
    ) {
      console.warn('Razorpay signature mismatch:', { expectedSignature, razorpaySignature });
      return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database service unavailable. Payment verification could not be recorded.' },
        { status: 503 }
      );
    }

    const isDirectInvoiceSettlement = Boolean(invoiceId || invoiceNumber);

    // Verify scope if scopeCode provided
    let scope: {
      id: string;
      deposit_paid: boolean;
      scope_code?: string;
      company_name?: string;
      features?: string[];
      total_cost_inr?: number;
      total_cost_usd?: number;
      maintenance_plan?: string;
    } | null = null;
    if (scopeCode) {
      const { data: scopeData, error: scopeError } = await supabase
        .from('client_scopes')
        .select('id, deposit_paid, scope_code, company_name, features, total_cost_inr, total_cost_usd, maintenance_plan')
        .eq('scope_code', scopeCode)
        .eq('client_email', clientEmail)
        .maybeSingle();

      if (scopeError) {
        console.error('Could not load payment scope:', scopeError);
        return NextResponse.json({ error: 'Could not load payment scope.' }, { status: 500 });
      }
      scope = scopeData;
      if (!scope) {
        return NextResponse.json({ error: 'Payment scope was not found.' }, { status: 404 });
      }
      if (scope.deposit_paid && !isDirectInvoiceSettlement) {
        return NextResponse.json({ error: 'Deposit has already been recorded for this scope.' }, { status: 409 });
      }
    }

    // Look up invoice by razorpay_order_id first, falling back to invoiceId or invoiceNumber
    let invoice: {
      id: string;
      invoice_number?: string;
      payment_status: string;
      razorpay_payment_id: string | null;
      scope_id: string | null;
      amount?: number;
      currency?: string;
      milestone_name?: string;
      customer_name?: string;
    } | null = null;
    const { data: invByOrder, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, invoice_number, payment_status, razorpay_payment_id, scope_id, amount, currency, milestone_name, customer_name')
      .eq('razorpay_order_id', razorpayOrderId)
      .eq('customer_email', clientEmail)
      .maybeSingle();

    if (invoiceError) {
      console.error('Could not load payment invoice:', invoiceError);
      return NextResponse.json({ error: 'Could not load payment invoice.' }, { status: 500 });
    }

    invoice = invByOrder;

    if (!invoice && (invoiceId || invoiceNumber)) {
      let altQuery = supabase
        .from('invoices')
        .select('id, invoice_number, payment_status, razorpay_payment_id, scope_id, amount, currency, milestone_name, customer_name')
        .eq('customer_email', clientEmail);
      if (invoiceId) altQuery = altQuery.eq('id', invoiceId);
      else if (invoiceNumber) altQuery = altQuery.eq('invoice_number', invoiceNumber);
      const { data: altInv } = await altQuery.maybeSingle();
      if (altInv) {
        invoice = altInv;
      }
    }

    if (!invoice && !scope) {
      return NextResponse.json({ error: 'Payment invoice was not found.' }, { status: 404 });
    }

    if (invoice && (invoice.payment_status === 'paid' || invoice.razorpay_payment_id)) {
      return NextResponse.json({ error: 'This payment has already been recorded.' }, { status: 409 });
    }

    // If scope wasn't loaded from scopeCode, but invoice has scope_id, load linked scope
    // Note: Do NOT block with 409 when linkedScope.deposit_paid is true if the client is paying a separate unpaid invoice (e.g. Change Order or 50% Final Milestone Balance)
    if (!scope && invoice?.scope_id) {
      const { data: linkedScope } = await supabase
        .from('client_scopes')
        .select('id, deposit_paid, scope_code, company_name, features, total_cost_inr, total_cost_usd, maintenance_plan')
        .eq('id', invoice.scope_id)
        .eq('client_email', clientEmail)
        .maybeSingle();
      if (linkedScope) {
        scope = linkedScope;
        if (scope.deposit_paid && !isDirectInvoiceSettlement && !invoice) {
          return NextResponse.json({ error: 'Deposit has already been recorded for this scope.' }, { status: 409 });
        }
      }
    }

    // Razorpay's signed webhook is the sole authority allowed to make the
    // invoice and scope paid in production. A browser callback can prove it received a
    // Razorpay response, but it must not mutate the commercial ledger.
    return NextResponse.json({
      success: true,
      message: 'Payment signature verified. Your workspace will activate once the provider webhook is processed.',
    }, { status: 202 });
  } catch (err: unknown) {
    console.error('Verify Razorpay Payment API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
