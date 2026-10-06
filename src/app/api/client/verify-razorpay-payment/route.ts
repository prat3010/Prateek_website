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

    const clientEmail = await getVerifiedSessionEmail(req);
    if (!clientEmail) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    const isDev = process.env.NODE_ENV === 'development' || !supabase;
    const isMockBypass =
      isDev &&
      (razorpayOrderId.startsWith('order_mock_') ||
        razorpaySignature === 'test_signature_mock_fallback' ||
        razorpaySignature === 'mock_signature_dev_pass');

    if (!isMockBypass && !KEY_SECRET) {
      return NextResponse.json({ error: 'Razorpay secret key not configured on server.' }, { status: 500 });
    }

    if (!isMockBypass) {
      const expectedSignature = crypto
        .createHmac('sha256', KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      if (
        expectedSignature.length !== razorpaySignature.length ||
        !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpaySignature))
      ) {
        console.warn('Razorpay signature mismatch:', { expectedSignature, razorpaySignature });
        return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 });
      }
    }

    if (!supabase) {
      return NextResponse.json({ success: true, message: 'Payment acknowledged (degraded mode).' });
    }

    // Verify scope if scopeCode provided
    let scope: { id: string; deposit_paid: boolean; scope_code?: string } | null = null;
    if (scopeCode) {
      const { data: scopeData, error: scopeError } = await supabase
        .from('client_scopes')
        .select('id, deposit_paid, scope_code')
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
      if (scope.deposit_paid) {
        return NextResponse.json({ error: 'Deposit has already been recorded for this scope.' }, { status: 409 });
      }
    }

    // Look up invoice by razorpay_order_id first, falling back to invoiceId or invoiceNumber
    let invoice: { id: string; payment_status: string; razorpay_payment_id: string | null; scope_id: string | null } | null = null;
    const { data: invByOrder, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, payment_status, razorpay_payment_id, scope_id')
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
        .select('id, payment_status, razorpay_payment_id, scope_id')
        .eq('customer_email', clientEmail);
      if (invoiceId) altQuery = altQuery.eq('id', invoiceId);
      else if (invoiceNumber) altQuery = altQuery.eq('invoice_number', invoiceNumber);
      const { data: altInv } = await altQuery.maybeSingle();
      if (altInv) {
        invoice = altInv;
      }
    }

    if (!invoice && !scope && !isMockBypass) {
      return NextResponse.json({ error: 'Payment invoice was not found.' }, { status: 404 });
    }

    if (invoice && (invoice.payment_status === 'paid' || invoice.razorpay_payment_id)) {
      return NextResponse.json({ error: 'This payment has already been recorded.' }, { status: 409 });
    }

    // If scope wasn't loaded from scopeCode, but invoice has scope_id, check scope status
    if (!scope && invoice?.scope_id) {
      const { data: linkedScope } = await supabase
        .from('client_scopes')
        .select('id, deposit_paid, scope_code')
        .eq('id', invoice.scope_id)
        .eq('client_email', clientEmail)
        .maybeSingle();
      if (linkedScope) {
        scope = linkedScope;
        if (scope.deposit_paid) {
          return NextResponse.json({ error: 'Deposit has already been recorded for this scope.' }, { status: 409 });
        }
      }
    }

    // In dev / mock bypass mode, update the records immediately so local testing reflects paid state
    if (isMockBypass) {
      const nowIso = new Date().toISOString();
      if (invoice && invoice.payment_status !== 'paid') {
        await supabase
          .from('invoices')
          .update({
            payment_status: 'paid',
            paid_at: nowIso,
            razorpay_payment_id: razorpayPaymentId,
            updated_at: nowIso,
          })
          .eq('id', invoice.id);
      }

      if (scope && !scope.deposit_paid) {
        await supabase
          .from('client_scopes')
          .update({
            deposit_paid: true,
            delivery_stage: 'engineering',
            status: 'Active Sprint — In Engineering',
            updated_at: nowIso,
          })
          .eq('id', scope.id);
      }

      return NextResponse.json({
        success: true,
        message: 'Mock payment verified and ledger updated (dev mode).',
      });
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
