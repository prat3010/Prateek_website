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
          let sowHash = '';
          try {
            const { data: targetScope } = await supabase
              .from('client_scopes')
              .select('scope_code, client_email, base_engine, features, brand_asset, maintenance_plan, total_cost_inr, total_cost_usd, currency, timeline')
              .eq('id', invoice.scope_id)
              .maybeSingle();

            if (targetScope) {
              const snapshot = {
                ...targetScope,
                deposit_paid_at: nowIso,
                razorpay_order_id: razorpayOrderId,
                razorpay_payment_id: razorpayPaymentId,
              };
              sowHash = crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
            }
          } catch (hashErr) {
            console.warn('Could not generate SOW hash on payment capture:', hashErr);
          }

          const { error: updateScopeError } = await supabase
            .from('client_scopes')
            .update({
              deposit_paid: true,
              delivery_stage: 'engineering',
              status: 'Deposit Paid — In Development',
              sow_hash: sowHash,
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
    } else if (
      event === 'subscription.charged' ||
      event === 'subscription.authenticated' ||
      event === 'subscription.activated' ||
      event === 'subscription.cancelled' ||
      event === 'subscription.halted'
    ) {
      const subEntity = payload.payload?.subscription?.entity;
      const subId = subEntity?.id;
      const notes = subEntity?.notes || {};
      const clientEmail = notes?.client_email || notes?.email;
      let targetTenantId = notes?.tenant_id;
      const planId = subEntity?.plan_id || 'plan_starter_inr';
      const nowIso = new Date().toISOString();
      const isActive = event !== 'subscription.cancelled' && event !== 'subscription.halted';

      const planTier = planId.includes('business')
        ? 'business'
        : planId.includes('pro')
        ? 'pro'
        : 'starter';

      const tokenLimit = planTier === 'business' ? 5000000 : planTier === 'pro' ? 1000000 : 250000;

      if (subId) {
        // Resolve tenant ID if not provided in payment notes
        if (!targetTenantId) {
          const { data: existingSub } = await supabase
            .from('rag_subscriptions')
            .select('tenant_id')
            .eq('razorpay_subscription_id', subId)
            .maybeSingle();

          if (existingSub?.tenant_id) {
            targetTenantId = existingSub.tenant_id;
          }
        }

        if (!targetTenantId && clientEmail) {
          const { data: existingMember } = await supabase
            .from('rag_tenant_members')
            .select('tenant_id')
            .eq('email', clientEmail)
            .limit(1)
            .maybeSingle();

          if (existingMember?.tenant_id) {
            targetTenantId = existingMember.tenant_id;
          }
        }

        // If still no tenant exists, bootstrap a fresh workspace
        if (!targetTenantId && clientEmail) {
          targetTenantId = crypto.randomUUID();
          const displayName = clientEmail.split('@')[0];
          await supabase.from('rag_tenants').insert({
            tenant_id: targetTenantId,
            name: `${displayName}'s Workspace`,
            plan_tier: planTier,
            is_active: isActive,
            created_at: nowIso,
            updated_at: nowIso,
          });

          await supabase.from('rag_tenant_members').insert({
            tenant_id: targetTenantId,
            email: clientEmail,
            role: 'owner',
            created_at: nowIso,
            updated_at: nowIso,
          });
        }

        if (targetTenantId) {
          await supabase.from('rag_subscriptions').upsert(
            {
              tenant_id: targetTenantId,
              razorpay_subscription_id: subId,
              plan_tier: planTier,
              monthly_token_limit: tokenLimit,
              is_active: isActive,
              current_period_end: subEntity?.current_end
                ? new Date(subEntity.current_end * 1000).toISOString()
                : null,
              updated_at: nowIso,
            },
            { onConflict: 'tenant_id' }
          );

          await supabase
            .from('rag_tenants')
            .update({
              plan_tier: planTier,
              is_active: isActive,
              updated_at: nowIso,
            })
            .eq('tenant_id', targetTenantId);

          if (clientEmail) {
            try {
              await supabase.from('rag_tenant_members').upsert(
                {
                  tenant_id: targetTenantId,
                  email: clientEmail,
                  role: 'owner',
                  updated_at: nowIso,
                },
                { onConflict: 'tenant_id,email' }
              );
            } catch (memberErr) {
              console.warn('Could not sync rag_tenant_members in webhook:', memberErr);
            }
          }

          // Sync upgraded tier to Retriever backend engine if admin credentials exist
          const retrieverUrl = process.env.RETRIEVER_API_URL || 'https://rag.prateeq.in';
          const adminKey = process.env.RETRIEVER_ADMIN_KEY || process.env.ADMIN_MASTER_KEY;
          if (adminKey) {
            try {
              await fetch(`${retrieverUrl.replace(/\/$/, '')}/v1/admin/tenants/${targetTenantId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Admin-Master-Key': adminKey,
                },
                body: JSON.stringify({
                  tier: planTier === 'starter' ? 'standard' : planTier === 'pro' ? 'premium' : 'enterprise',
                }),
              });
            } catch (engineErr) {
              console.warn('Could not sync upgraded tier to Retriever engine:', engineErr);
            }
          }
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
