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

    if (
      expectedSignature.length !== signature.length ||
      !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
    ) {
      console.warn('Razorpay webhook signature mismatch');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    const eventId = payload.event_id || payload.payload?.payment?.entity?.id;
    if (!eventId) {
      return NextResponse.json({ error: 'Webhook event is missing an event identifier.' }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ status: 'ok', mode: 'degraded' });
    }

    // Insert into the unique event ledger before processing. If Razorpay
    // retries the same event, the database uniqueness constraint blocks it.
    const { error: idempotencyError } = await supabase.from('processed_webhooks').insert({
      event_id: eventId,
      event_type: event,
      processed_at: new Date().toISOString(),
    });
    if (idempotencyError) {
      if (idempotencyError.code === '23505') {
        return NextResponse.json({ status: 'ok', duplicate: true });
      }
      console.error('Webhook idempotency ledger failure:', idempotencyError);
      return NextResponse.json({ error: 'Could not record webhook event.' }, { status: 500 });
    }

    if (event === 'payment.captured' || event === 'order.paid') {
      const entity = payload.payload?.payment?.entity || payload.payload?.order?.entity;
      const razorpayOrderId = entity?.order_id || entity?.id;
      const razorpayPaymentId = entity?.id;
      const nowIso = new Date().toISOString();

      // Resolve the internal invoice from the provider order, then use its
      // scope id. Never trust a user-controlled scope code from payment notes.
      if (razorpayOrderId) {
        const { data: invoice, error: invoiceError } = await supabase
          .from('invoices')
          .select('id, scope_id, payment_status, razorpay_payment_id')
          .eq('razorpay_order_id', razorpayOrderId)
          .maybeSingle();

        if (invoiceError) {
          console.error('Webhook invoice lookup failure:', invoiceError);
          return NextResponse.json({ error: 'Could not load payment invoice.' }, { status: 500 });
        }
        if (!invoice) {
          return NextResponse.json({ status: 'ok', ignored: 'unknown_order' });
        }

        if (invoice.payment_status !== 'paid') {
          const { error: updateInvoiceError } = await supabase
            .from('invoices')
            .update({
              payment_status: 'paid',
              paid_at: nowIso,
              razorpay_payment_id: razorpayPaymentId || '',
              updated_at: nowIso,
            })
            .eq('id', invoice.id)
            .eq('payment_status', 'pending');

          if (updateInvoiceError) {
            console.error('Webhook invoice update failure:', updateInvoiceError);
            return NextResponse.json({ error: 'Could not update payment invoice.' }, { status: 500 });
          }
        }

        if (invoice.scope_id) {
          const { error: updateScopeError } = await supabase
            .from('client_scopes')
            .update({
              deposit_paid: true,
              delivery_stage: 'engineering',
              status: 'Deposit Paid — In Development',
              updated_at: nowIso,
            })
            .eq('id', invoice.scope_id)
            .eq('deposit_paid', false);

          if (updateScopeError) {
            console.error('Webhook scope update failure:', updateScopeError);
            return NextResponse.json({ error: 'Could not activate payment scope.' }, { status: 500 });
          }
        }
      }
    } else if (event === 'subscription.charged' || event === 'subscription.authenticated') {
      const subEntity = payload.payload?.subscription?.entity;
      const subId = subEntity?.id;
      const clientEmail = subEntity?.notes?.client_email;
      const planId = subEntity?.plan_id || 'plan_starter_inr';
      const nowIso = new Date().toISOString();

      if (subId) {
        await supabase
          .from('rag_subscriptions')
          .upsert(
            {
              razorpay_subscription_id: subId,
              plan_tier: planId.includes('pro') ? 'pro' : planId.includes('business') ? 'business' : 'starter',
              is_active: true,
              current_period_end: subEntity?.current_end ? new Date(subEntity.current_end * 1000).toISOString() : null,
              updated_at: nowIso,
            },
            { onConflict: 'razorpay_subscription_id' }
          );

        if (clientEmail) {
          try {
            await supabase
              .from('rag_tenant_members')
              .upsert(
                {
                  email: clientEmail,
                  role: 'owner',
                  updated_at: nowIso,
                },
                { onConflict: 'email' }
              );
          } catch {}
        }
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
