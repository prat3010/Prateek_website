import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/data/supabase';
import { resolvePlanSpec } from '@/app/api/client/create-razorpay-subscription/route';
import {
  sendRetrieverSubscriptionNotifications,
  sendPaymentConfirmationNotifications,
} from '@/lib/emailNotification';
import { ensureRetrieverEngineTenant } from '@/lib/retrieverProvision';
import { getVerifiedSessionUser } from '@/lib/sessionVerify';

export async function POST(req: Request) {
  try {
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
    const payload = await req.json().catch(() => ({}));
    const {
      razorpaySubscriptionId,
      razorpayPaymentId,
      razorpaySignature,
      planId = 'pro_inr',
      scopeCode = '',
      subscriptionType = '',
    } = payload;

    if (!razorpaySubscriptionId) {
      return NextResponse.json(
        { error: 'Missing required Razorpay subscription identifier.' },
        { status: 400 }
      );
    }

    const sessionUser = await getVerifiedSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !supabase;
    const isMock =
      isDev &&
      (razorpaySubscriptionId.startsWith('sub_mock_') ||
        razorpaySignature === 'test_sub_signature_mock');

    if (!isMock && !KEY_SECRET) {
      return NextResponse.json(
        { error: 'Razorpay secret key not configured on server.' },
        { status: 500 }
      );
    }

    if (!isMock) {
      if (!razorpayPaymentId || !razorpaySignature) {
        return NextResponse.json(
          { error: 'Missing payment verification signature fields.' },
          { status: 400 }
        );
      }

      // Razorpay Subscription verification signature string: payment_id|subscription_id
      const expectedSignature = crypto
        .createHmac('sha256', KEY_SECRET)
        .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
        .digest('hex');

      if (
        expectedSignature.length !== razorpaySignature.length ||
        !crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpaySignature))
      ) {
        console.warn('Razorpay subscription signature mismatch:', {
          expectedSignature,
          razorpaySignature,
        });
        return NextResponse.json(
          { error: 'Subscription payment signature verification failed.' },
          { status: 400 }
        );
      }
    }

    const planSpec = resolvePlanSpec(planId);
    const planTier = planSpec.tier;
    const isCarePlan =
      subscriptionType === 'care_plan' ||
      Boolean(planSpec.isCarePlan) ||
      Boolean(scopeCode) ||
      planId.startsWith('care_');

    if (isCarePlan) {
      if (!supabase) {
        return NextResponse.json({
          success: true,
          subscriptionType: 'care_plan',
          planTier,
          message: 'Maintenance retainer verified in degraded mode.',
        });
      }

      const nowIso = new Date().toISOString();
      const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      let targetScope: {
        id: string;
        scope_code: string;
        client_id: string | null;
        company_name: string;
      } | null = null;

      if (scopeCode) {
        const { data } = await supabase
          .from('client_scopes')
          .select('id, scope_code, client_id, company_name')
          .eq('scope_code', scopeCode)
          .maybeSingle();
        targetScope = data;
      } else {
        const { data } = await supabase
          .from('client_scopes')
          .select('id, scope_code, client_id, company_name')
          .eq('client_email', sessionUser.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        targetScope = data;
      }

      if (targetScope) {
        await supabase
          .from('client_scopes')
          .update({
            maintenance_subscription_id: razorpaySubscriptionId,
            maintenance_status: 'active',
            maintenance_current_period_end: currentPeriodEnd,
            maintenance_plan: planSpec.name,
            updated_at: nowIso,
          })
          .eq('id', targetScope.id);
      }

      const invoiceRef = razorpayPaymentId || razorpaySubscriptionId;
      const invoiceNumber = `CARE-${invoiceRef.replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase()}`;
      const amountMajor = Math.round(planSpec.amount / 100);

      try {
        await supabase.from('invoices').upsert(
          {
            invoice_number: invoiceNumber,
            client_id: targetScope?.client_id || null,
            scope_id: targetScope?.id || null,
            customer_name: sessionUser.email.split('@')[0],
            customer_email: sessionUser.email,
            milestone_name: `Maintenance Retainer (${planSpec.name})`,
            amount: amountMajor,
            currency: planSpec.currency,
            payment_status: 'paid',
            razorpay_order_id: razorpaySubscriptionId,
            razorpay_payment_id: razorpayPaymentId || razorpaySubscriptionId,
            paid_at: nowIso,
            updated_at: nowIso,
          },
          { onConflict: 'invoice_number' }
        );
      } catch (invErr) {
        console.warn('Care plan invoice ledger insert warning:', invErr);
      }

      sendPaymentConfirmationNotifications({
        clientEmail: sessionUser.email,
        clientName: targetScope?.company_name || sessionUser.email.split('@')[0],
        scopeCode: targetScope?.scope_code || scopeCode || 'RETAINER',
        projectName: targetScope?.company_name || 'Project Care Plan',
        invoiceNumber,
        milestoneName: `Monthly Maintenance Retainer (${planSpec.name})`,
        amount: amountMajor,
        currency: planSpec.currency,
        paymentId: razorpayPaymentId || razorpaySubscriptionId,
      }).catch((err) => console.warn('Care plan payment notification warning:', err));

      return NextResponse.json({
        success: true,
        subscriptionType: 'care_plan',
        planTier,
        scopeCode: targetScope?.scope_code || scopeCode,
        currentPeriodEnd,
        message: 'Monthly maintenance care retainer successfully activated.',
      });
    }

    if (!supabase) {
      return NextResponse.json({
        success: true,
        planTier,
        message: 'Subscription verified in degraded mode.',
      });
    }

    const nowIso = new Date().toISOString();
    const tokenLimit =
      planTier === 'business' ? 10_000_000 : planTier === 'pro' ? 1_500_000 : 250_000;
    const displayName = sessionUser.email.split('@')[0];
    const workspaceName = `${displayName}'s Workspace`;

    // 1. Upsert client record in `clients` so subscriber appears in unified CRM / invoice ledger
    let clientId: string | null = null;
    try {
      const { data: clientData } = await supabase
        .from('clients')
        .upsert(
          {
            email: sessionUser.email,
            name: displayName,
            company_name: workspaceName,
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
      console.warn('Retriever subscription client upsert warning:', clientErr);
    }

    // 2. Resolve existing tenant membership for authenticated user
    const { data: member } = await supabase
      .from('rag_tenant_members')
      .select('tenant_id')
      .or(`user_id.eq.${sessionUser.id},email.eq.${sessionUser.email}`)
      .limit(1)
      .maybeSingle();

    let existingApiKey: string | null = null;
    if (member?.tenant_id) {
      const { data: existingTenant } = await supabase
        .from('rag_tenants')
        .select('api_key')
        .eq('tenant_id', member.tenant_id)
        .maybeSingle();
      existingApiKey = (existingTenant?.api_key as string | null) || null;
    }

    // 3. Provision or reconcile tenant on Retriever OCI backend & ensure API key
    const provisioned = await ensureRetrieverEngineTenant({
      existingTenantId: member?.tenant_id || null,
      existingApiKey,
      workspaceName,
      planTier,
    });

    const targetTenantId = provisioned.tenantId;

    if (!member?.tenant_id) {
      await supabase.from('rag_tenants').insert({
        tenant_id: targetTenantId,
        client_id: clientId,
        name: workspaceName,
        plan_tier: planTier,
        api_key: provisioned.apiKey,
        api_key_hash: provisioned.apiKeyHash,
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      });

      await supabase.from('rag_tenant_members').insert({
        tenant_id: targetTenantId,
        user_id: sessionUser.id,
        email: sessionUser.email,
        role: 'owner',
        created_at: nowIso,
        updated_at: nowIso,
      });
    } else {
      const tenantsTable = supabase.from('rag_tenants') as unknown as {
        update?: (u: Record<string, unknown>) => { eq?: (col: string, val: string) => Promise<unknown> };
      };
      await tenantsTable
        .update?.({
          client_id: clientId,
          plan_tier: planTier,
          api_key: provisioned.apiKey,
          api_key_hash: provisioned.apiKeyHash,
          is_active: true,
          updated_at: nowIso,
        })
        ?.eq?.('tenant_id', targetTenantId);
    }

    // 4. Upsert subscription ledger
    const currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('rag_subscriptions').upsert(
      {
        client_id: clientId,
        tenant_id: targetTenantId,
        razorpay_subscription_id: razorpaySubscriptionId,
        plan_tier: planTier,
        monthly_token_limit: tokenLimit,
        api_key_hash: provisioned.apiKeyHash,
        is_active: true,
        current_period_end: currentPeriodEnd,
        updated_at: nowIso,
      },
      { onConflict: 'tenant_id' }
    );

    // 5. Record paid invoice row in `invoices` ledger (idempotent on subscription/payment ref)
    try {
      const invoiceRef = razorpayPaymentId || razorpaySubscriptionId;
      const invoiceNumber = `RET-${invoiceRef.replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase()}`;
      const amountMajor = Math.round(planSpec.amount / 100);
      await supabase.from('invoices').upsert(
        {
          invoice_number: invoiceNumber,
          client_id: clientId,
          customer_name: displayName,
          customer_email: sessionUser.email,
          milestone_name: `Retriever ${planTier.toUpperCase()} Monthly Subscription`,
          amount: amountMajor,
          currency: planSpec.currency,
          payment_status: 'paid',
          razorpay_order_id: razorpaySubscriptionId,
          razorpay_payment_id: razorpayPaymentId || razorpaySubscriptionId,
          paid_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: 'invoice_number' }
      );
    } catch (invErr) {
      console.warn('Retriever subscription invoice ledger insert warning:', invErr);
    }

    // 6. Dispatch Owner Alert + Subscriber Receipt Emails via Resend
    await sendRetrieverSubscriptionNotifications({
      subscriberEmail: sessionUser.email,
      subscriberName: displayName,
      planTier,
      amountFormatted: planSpec.formattedPrice,
      subscriptionId: razorpaySubscriptionId,
      paymentId: razorpayPaymentId,
      tenantId: targetTenantId,
      monthlyTokenLimit: tokenLimit,
    }).catch((err) => console.warn('Retriever subscription notification warning:', err));

    return NextResponse.json({
      success: true,
      planTier,
      tenantId: targetTenantId,
      apiKey: provisioned.apiKey,
      message: 'Subscription successfully verified and upgraded.',
    });
  } catch (err: unknown) {
    console.error('Verify Razorpay Subscription API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
