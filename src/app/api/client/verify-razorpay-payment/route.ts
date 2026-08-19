import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';

export async function POST(req: Request) {
  try {
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
    const payload = await req.json();
    const { scopeCode, razorpayOrderId, razorpayPaymentId, razorpaySignature } = payload;

    if (!scopeCode || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
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
        razorpaySignature === 'test_signature_mock_fallback');

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

    // Verify that both the project scope and the Razorpay order belong to the
    // authenticated client. The service-role database client bypasses RLS, so
    // these filters are mandatory authorization checks, not just convenience.
    const { data: scope, error: scopeError } = await supabase
      .from('client_scopes')
      .select('id, deposit_paid')
      .eq('scope_code', scopeCode)
      .eq('client_email', clientEmail)
      .maybeSingle();

    if (scopeError) {
      console.error('Could not load payment scope:', scopeError);
      return NextResponse.json({ error: 'Could not load payment scope.' }, { status: 500 });
    }
    if (!scope) {
      return NextResponse.json({ error: 'Payment scope was not found.' }, { status: 404 });
    }
    if (scope.deposit_paid) {
      return NextResponse.json({ error: 'Deposit has already been recorded for this scope.' }, { status: 409 });
    }

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select('id, payment_status, razorpay_payment_id')
      .eq('razorpay_order_id', razorpayOrderId)
      .eq('scope_id', scope.id)
      .eq('customer_email', clientEmail)
      .maybeSingle();

    if (invoiceError) {
      console.error('Could not load payment invoice:', invoiceError);
      return NextResponse.json({ error: 'Could not load payment invoice.' }, { status: 500 });
    }
    if (!invoice) {
      return NextResponse.json({ error: 'Payment invoice was not found.' }, { status: 404 });
    }
    if (invoice.payment_status === 'paid' || invoice.razorpay_payment_id) {
      return NextResponse.json({ error: 'This payment has already been recorded.' }, { status: 409 });
    }

    // Razorpay's signed webhook is the sole authority allowed to make the
    // invoice and scope paid. A browser callback can prove it received a
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
