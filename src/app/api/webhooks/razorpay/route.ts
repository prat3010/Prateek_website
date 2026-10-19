import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/data/supabase';
import { resolvePlanSpec } from '@/app/api/client/create-razorpay-subscription/route';
import {
  sendPaymentConfirmationNotifications,
  sendRetrieverSubscriptionNotifications,
} from '@/lib/emailNotification';
import { ensureRetrieverEngineTenant } from '@/lib/retrieverProvision';

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
    const eventId =
      payload.event_id ||
      payload.payload?.payment?.entity?.id ||
      payload.payload?.order?.entity?.id ||
      payload.payload?.invoice?.entity?.id;
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

    if (event === 'payment.captured' || event === 'order.paid' || event === 'invoice.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;
      const invoiceEntity = payload.payload?.invoice?.entity;

      const razorpayOrderId =
        paymentEntity?.order_id ||
        orderEntity?.id ||
        invoiceEntity?.order_id ||
        (paymentEntity?.id?.startsWith('order_') ? paymentEntity?.id : '');

      const razorpayInvoiceId =
        invoiceEntity?.id ||
        paymentEntity?.invoice_id ||
        orderEntity?.invoice_id ||
        (paymentEntity?.id?.startsWith('inv_') ? paymentEntity?.id : '');

      const razorpayPaymentId =
        (paymentEntity?.id?.startsWith('pay_') ? paymentEntity?.id : '') ||
        invoiceEntity?.payment_id ||
        paymentEntity?.id ||
        '';

      const nowIso = new Date().toISOString();

      // Resolve the internal invoice: try razorpay_order_id, razorpay_invoice_id, or notes
      let invoice: {
        id: string;
        invoice_number: string;
        scope_id: string | null;
        payment_status: string;
        razorpay_payment_id: string | null;
        amount: number;
        currency: string;
        customer_email: string;
        customer_name: string;
        milestone_name: string;
      } | null = null;

      if (razorpayOrderId) {
        const { data, error: invoiceError } = await supabase
          .from('invoices')
          .select('id, invoice_number, scope_id, payment_status, razorpay_payment_id, amount, currency, customer_email, customer_name, milestone_name')
          .eq('razorpay_order_id', razorpayOrderId)
          .maybeSingle();
        if (invoiceError) {
          console.error('Webhook invoice lookup by order failure:', invoiceError);
        } else if (data) {
          invoice = data;
        }
      }

      if (!invoice && razorpayInvoiceId) {
        const { data, error: invoiceError } = await supabase
          .from('invoices')
          .select('id, invoice_number, scope_id, payment_status, razorpay_payment_id, amount, currency, customer_email, customer_name, milestone_name')
          .eq('razorpay_invoice_id', razorpayInvoiceId)
          .maybeSingle();
        if (invoiceError) {
          console.error('Webhook invoice lookup by invoice_id failure:', invoiceError);
        } else if (data) {
          invoice = data;
        }
      }

      // Fallback: check notes for invoice_id or invoice_number
      const noteInvId = paymentEntity?.notes?.invoice_id || invoiceEntity?.notes?.invoice_id;
      const noteInvNum = paymentEntity?.notes?.invoice_number || invoiceEntity?.notes?.invoice_number;
      if (!invoice && (noteInvId || noteInvNum)) {
        let altQuery = supabase
          .from('invoices')
          .select('id, invoice_number, scope_id, payment_status, razorpay_payment_id, amount, currency, customer_email, customer_name, milestone_name');
        if (noteInvId) altQuery = altQuery.eq('id', noteInvId);
        else if (noteInvNum) altQuery = altQuery.eq('invoice_number', noteInvNum);
        const { data } = await altQuery.maybeSingle();
        if (data) invoice = data;
      }

      if (!invoice) {
        return NextResponse.json({ status: 'ok', ignored: 'unknown_order_or_invoice' });
      }

      if (invoice.payment_status !== 'paid') {
        const { error: updateInvoiceError } = await supabase
          .from('invoices')
          .update({
            payment_status: 'paid',
            paid_at: nowIso,
            razorpay_payment_id: razorpayPaymentId || invoice.razorpay_payment_id || '',
            updated_at: nowIso,
          })
          .eq('id', invoice.id);

        if (updateInvoiceError) {
          console.error('Webhook invoice update failure:', updateInvoiceError);
          return NextResponse.json({ error: 'Could not update payment invoice.' }, { status: 500 });
        }
      }

      let targetScopeRow: {
        id?: string;
        scope_code?: string;
        company_name?: string;
        client_email?: string;
        base_engine?: string;
        features?: string[];
        brand_asset?: string;
        maintenance_plan?: string;
        total_cost_inr?: number;
        total_cost_usd?: number;
        currency?: string;
        timeline?: string;
        deposit_paid?: boolean;
        balance_paid?: boolean;
      } | null = null;

      if (invoice.scope_id) {
        let sowHash = '';
        try {
          const { data: targetScope } = await supabase
            .from('client_scopes')
            .select('id, scope_code, company_name, client_email, base_engine, features, brand_asset, maintenance_plan, total_cost_inr, total_cost_usd, currency, timeline, deposit_paid, balance_paid')
            .eq('id', invoice.scope_id)
            .maybeSingle();

          if (targetScope) {
            targetScopeRow = targetScope;
            const snapshot = {
              ...targetScope,
              deposit_paid_at: nowIso,
              razorpay_order_id: razorpayOrderId,
              razorpay_invoice_id: razorpayInvoiceId,
              razorpay_payment_id: razorpayPaymentId,
            };
            sowHash = crypto.createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
          }
        } catch (hashErr) {
          console.warn('Could not generate SOW hash on payment capture:', hashErr);
        }

        let isChangeOrder = false;
        // Check if this invoice settles a Change Order
        try {
          const { data: coRow } = await supabase
            .from('scope_change_orders')
            .select('id, added_features, removed_features, price_delta_inr, price_delta_usd')
            .eq('invoice_id', invoice.id)
            .maybeSingle();

          if (coRow && coRow.id) {
            isChangeOrder = true;
            await supabase
              .from('scope_change_orders')
              .update({ status: 'paid', updated_at: nowIso })
              .eq('id', coRow.id);

            if (targetScopeRow) {
              const currentFeatures = Array.isArray(targetScopeRow.features) ? targetScopeRow.features : [];
              const added = Array.isArray(coRow.added_features) ? coRow.added_features : [];
              const removed = new Set(Array.isArray(coRow.removed_features) ? coRow.removed_features : []);
              const mergedFeatures = Array.from(
                new Set([...currentFeatures.filter((f) => !removed.has(f)), ...added])
              );
              await supabase
                .from('client_scopes')
                .update({
                  features: mergedFeatures,
                  total_cost_inr: (Number(targetScopeRow.total_cost_inr) || 0) + (Number(coRow.price_delta_inr) || 0),
                  total_cost_usd: (Number(targetScopeRow.total_cost_usd) || 0) + (Number(coRow.price_delta_usd) || 0),
                  updated_at: nowIso,
                })
                .eq('id', invoice.scope_id);
            }
          }
        } catch {}

        const milestoneLower = (invoice.milestone_name || '').toLowerCase();
        const isBalanceMilestone =
          milestoneLower.includes('balance') ||
          milestoneLower.includes('final') ||
          (Boolean(targetScopeRow?.deposit_paid) && !isChangeOrder);

        const isFullMilestone =
          milestoneLower.includes('100%') ||
          milestoneLower.includes('full project');

        if (isBalanceMilestone && !isChangeOrder) {
          const { error: updateScopeError } = await supabase
            .from('client_scopes')
            .update({
              balance_paid: true,
              is_fully_paid: true,
              balance_amount_inr: (targetScopeRow?.currency === 'INR' || !targetScopeRow?.currency) ? Number(invoice.amount) || 0 : 0,
              balance_amount_usd: targetScopeRow?.currency === 'USD' ? Number(invoice.amount) || 0 : 0,
              balance_paid_at: nowIso,
              final_payment_id: razorpayPaymentId || '',
              delivery_stage: 'live',
              status: 'Project Settled — Production Live',
              updated_at: nowIso,
            })
            .eq('id', invoice.scope_id);

          if (updateScopeError) {
            console.error('Webhook scope balance update failure:', updateScopeError);
            return NextResponse.json({ error: 'Could not update scope balance.' }, { status: 500 });
          }
        } else if (!targetScopeRow?.deposit_paid && !isChangeOrder) {
          const { error: updateScopeError } = await supabase
            .from('client_scopes')
            .update({
              deposit_paid: true,
              balance_paid: isFullMilestone,
              is_fully_paid: isFullMilestone,
              delivery_stage: isFullMilestone ? 'live' : 'engineering',
              status: isFullMilestone ? 'Project Settled — Production Live' : 'Deposit Paid — In Development',
              sow_hash: sowHash,
              updated_at: nowIso,
            })
            .eq('id', invoice.scope_id);

          if (updateScopeError) {
            console.error('Webhook scope deposit update failure:', updateScopeError);
            return NextResponse.json({ error: 'Could not activate payment scope.' }, { status: 500 });
          }
        }
      }

        const notifyEmail = invoice.customer_email || targetScopeRow?.client_email || '';
        if (notifyEmail) {
          sendPaymentConfirmationNotifications({
            clientEmail: notifyEmail,
            clientName: invoice.customer_name || targetScopeRow?.company_name,
            scopeCode: targetScopeRow?.scope_code,
            projectName: targetScopeRow?.company_name || invoice.customer_name,
            invoiceNumber: invoice.invoice_number,
            milestoneName: invoice.milestone_name,
            amount: Number(invoice.amount) || 0,
            currency: invoice.currency || targetScopeRow?.currency || 'INR',
            paymentId: razorpayPaymentId,
          }).catch((err) => console.warn('Webhook payment notification warning:', err));
        }
    } else if (
      event === 'subscription.charged' ||
      event === 'subscription.authenticated' ||
      event === 'subscription.activated' ||
      event === 'subscription.cancelled' ||
      event === 'subscription.halted' ||
      event === 'subscription.paused' ||
      event === 'subscription.resumed'
    ) {
      const subEntity = payload.payload?.subscription?.entity;
      const payEntity = payload.payload?.payment?.entity;
      const subId = subEntity?.id;
      const payId = payEntity?.id;
      const notes = subEntity?.notes || {};
      const clientEmail = notes?.client_email || notes?.email;
      let targetTenantId = notes?.tenant_id;
      const rawPlanIdentifier = notes?.plan_id || notes?.tier || subEntity?.plan_id || 'starter_inr';
      const planSpec = resolvePlanSpec(rawPlanIdentifier);
      const planTier = planSpec.tier;
      const nowIso = new Date().toISOString();
      const isActive =
        event !== 'subscription.cancelled' &&
        event !== 'subscription.halted' &&
        event !== 'subscription.paused';
      const tokenLimit =
        planTier === 'business' ? 10_000_000 : planTier === 'pro' ? 1_500_000 : 250_000;

      if (subId) {
        let clientId: string | null = null;
        if (clientEmail) {
          try {
            const displayName = clientEmail.split('@')[0];
            const { data: clientData } = await supabase
              .from('clients')
              .upsert(
                {
                  email: clientEmail,
                  name: displayName,
                  company_name: `${displayName}'s Workspace`,
                  notes: `[Retriever SaaS: ${planTier.toUpperCase()}]`,
                  updated_at: nowIso,
                },
                { onConflict: 'email' }
              )
              .select('id')
              .maybeSingle();
            if (clientData?.id) {
              clientId = clientData.id;
            }
          } catch (clientErr) {
            console.warn('Webhook subscription client upsert warning:', clientErr);
          }
        }

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

        const displayName = clientEmail ? clientEmail.split('@')[0] : 'Subscriber';
        const workspaceName = `${displayName}'s Workspace`;

        let existingApiKey: string | null = null;
        if (targetTenantId) {
          const { data: existingTenant } = await supabase
            .from('rag_tenants')
            .select('api_key')
            .eq('tenant_id', targetTenantId)
            .maybeSingle();
          existingApiKey = (existingTenant?.api_key as string | null) || null;
        }

        const provisioned = await ensureRetrieverEngineTenant({
          existingTenantId: targetTenantId || null,
          existingApiKey,
          workspaceName,
          planTier,
        });

        // If still no tenant existed prior to webhook, insert the newly provisioned workspace
        if (!targetTenantId && clientEmail) {
          targetTenantId = provisioned.tenantId;
          await supabase.from('rag_tenants').insert({
            tenant_id: targetTenantId,
            client_id: clientId,
            name: workspaceName,
            plan_tier: planTier,
            api_key: provisioned.apiKey,
            api_key_hash: provisioned.apiKeyHash,
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
        } else if (targetTenantId) {
          targetTenantId = provisioned.tenantId;
        }

        if (targetTenantId) {
          await supabase.from('rag_subscriptions').upsert(
            {
              client_id: clientId,
              tenant_id: targetTenantId,
              razorpay_subscription_id: subId,
              plan_tier: planTier,
              monthly_token_limit: tokenLimit,
              api_key_hash: provisioned.apiKeyHash,
              is_active: isActive,
              current_period_end: subEntity?.current_end
                ? new Date(subEntity.current_end * 1000).toISOString()
                : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: nowIso,
            },
            { onConflict: 'tenant_id' }
          );

          await supabase
            .from('rag_tenants')
            .update({
              client_id: clientId,
              plan_tier: planTier,
              api_key: provisioned.apiKey,
              api_key_hash: provisioned.apiKeyHash,
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

          // For charged/activated events, ensure an invoice ledger entry exists and notify if not already sent
          if (isActive && (event === 'subscription.charged' || event === 'subscription.activated') && clientEmail) {
            try {
              const invoiceRef = payId || subId;
              const invoiceNumber = `RET-${String(invoiceRef).replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase()}`;
              const { data: existingInv } = await supabase
                .from('invoices')
                .select('id, payment_status')
                .eq('invoice_number', invoiceNumber)
                .maybeSingle();

              const wasAlreadyPaid = existingInv?.payment_status === 'paid';
              const amountMajor = Math.round(planSpec.amount / 100);

              await supabase.from('invoices').upsert(
                {
                  invoice_number: invoiceNumber,
                  client_id: clientId,
                  customer_name: displayName,
                  customer_email: clientEmail,
                  milestone_name: `Retriever ${planTier.toUpperCase()} Monthly Subscription`,
                  amount: amountMajor,
                  currency: planSpec.currency,
                  payment_status: 'paid',
                  razorpay_order_id: subId,
                  razorpay_payment_id: payId || subId,
                  paid_at: nowIso,
                  updated_at: nowIso,
                },
                { onConflict: 'invoice_number' }
              );

              if (!wasAlreadyPaid) {
                await sendRetrieverSubscriptionNotifications({
                  subscriberEmail: clientEmail,
                  subscriberName: displayName,
                  planTier,
                  amountFormatted: planSpec.formattedPrice,
                  subscriptionId: subId,
                  paymentId: payId,
                  tenantId: targetTenantId,
                  monthlyTokenLimit: tokenLimit,
                }).catch((err) => console.warn('Webhook Retriever notification warning:', err));
              }
            } catch (invErr) {
              console.warn('Webhook subscription invoice ledger warning:', invErr);
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
