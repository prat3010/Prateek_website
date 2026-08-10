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

      if (expectedSignature !== razorpaySignature) {
        console.warn('Razorpay signature mismatch:', { expectedSignature, razorpaySignature });
        return NextResponse.json({ error: 'Payment signature verification failed.' }, { status: 400 });
      }
    }

    if (!supabase) {
      return NextResponse.json({ success: true, message: 'Payment acknowledged (degraded mode).' });
    }

    const nowIso = new Date().toISOString();

    // 1. Update Invoices Ledger
    try {
      await supabase
        .from('invoices')
        .update({
          payment_status: 'paid',
          paid_at: nowIso,
          razorpay_payment_id: razorpayPaymentId,
          updated_at: nowIso,
        })
        .eq('razorpay_order_id', razorpayOrderId);
    } catch (invErr) {
      console.warn('Invoice update error:', invErr);
    }

    // 2. Update client_scopes status & milestone stage
    try {
      await supabase
        .from('client_scopes')
        .update({
          deposit_paid: true,
          delivery_stage: 'engineering',
          status: 'Deposit Paid — In Development',
          updated_at: nowIso,
        })
        .eq('scope_code', scopeCode);
    } catch (scopeErr) {
      console.warn('Client scope update error:', scopeErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and scope deposit locked successfully!',
    });
  } catch (err: unknown) {
    console.error('Verify Razorpay Payment API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
