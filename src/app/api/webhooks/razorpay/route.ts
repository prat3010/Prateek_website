import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/data/supabase';

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || 'ovUdxjgONEk4RFGhqhabWKR0';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing Razorpay signature header' }, { status: 400 });
    }

    // Verify HMAC-SHA256 signature against raw body
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      console.warn('Razorpay webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    if (event === 'payment.captured' || event === 'order.paid') {
      const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity;
      const razorpayOrderId = entity?.order_id || entity?.id;
      const razorpayPaymentId = entity?.id;
      const scopeCode = entity?.notes?.scope_code;

      if (!supabase) {
        return NextResponse.json({ status: 'ok', mode: 'degraded' });
      }

      const nowIso = new Date().toISOString();

      // 1. Update Invoices Table
      if (razorpayOrderId) {
        await supabase
          .from('invoices')
          .update({
            payment_status: 'paid',
            paid_at: nowIso,
            razorpay_payment_id: razorpayPaymentId || '',
            updated_at: nowIso,
          })
          .eq('razorpay_order_id', razorpayOrderId);
      }

      // 2. Update client_scopes status
      if (scopeCode) {
        await supabase
          .from('client_scopes')
          .update({
            deposit_paid: true,
            delivery_stage: 'engineering',
            status: 'Deposit Paid — In Development',
            updated_at: nowIso,
          })
          .eq('scope_code', scopeCode);
      }
    }

    return NextResponse.json({ status: 'ok', event });
  } catch (err: unknown) {
    console.error('Razorpay webhook error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
