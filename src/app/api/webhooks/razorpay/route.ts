import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/data/supabase';

export async function POST(req: Request) {
  try {
    const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || '';
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing Razorpay signature header' }, { status: 400 });
    }

    if (!WEBHOOK_SECRET) {
      console.error('Razorpay webhook secret not configured on server.');
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
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
    const eventId = payload.event_id || payload.payload?.payment?.entity?.id || `${event}_${Date.now()}`;

    if (!supabase) {
      return NextResponse.json({ status: 'ok', mode: 'degraded' });
    }

    // Idempotency check: prevent processing duplicate webhook events
    try {
      const { data: existingEvent } = await supabase
        .from('processed_webhooks')
        .select('event_id')
        .eq('event_id', eventId)
        .maybeSingle();

      if (existingEvent) {
        return NextResponse.json({ status: 'ok', duplicate: true });
      }

      await supabase.from('processed_webhooks').insert({
        event_id: eventId,
        event_type: event,
        processed_at: new Date().toISOString(),
      });
    } catch (idemErr) {
      console.warn('Webhook idempotency log warning:', idemErr);
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity;
      const razorpayOrderId = entity?.order_id || entity?.id;
      const razorpayPaymentId = entity?.id;
      const scopeCode = entity?.notes?.scope_code;

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
    } else if (event === 'subscription.charged' || event === 'subscription.authenticated') {
      const subEntity = payload.payload?.subscription?.entity;
      const subId = subEntity?.id;
      const clientEmail = subEntity?.notes?.client_email;
      const nowIso = new Date().toISOString();

      if (subId) {
        await supabase
          .from('rag_subscriptions')
          .update({
            is_active: true,
            razorpay_subscription_id: subId,
            current_period_end: subEntity?.current_end ? new Date(subEntity.current_end * 1000).toISOString() : null,
            updated_at: nowIso,
          })
          .eq('razorpay_subscription_id', subId);
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
