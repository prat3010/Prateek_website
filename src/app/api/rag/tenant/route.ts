import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { ensureRetrieverEngineTenant } from '@/lib/retrieverProvision';
import { getVerifiedSessionUser } from '@/lib/sessionVerify';

export async function GET(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase client unavailable' }, { status: 503 });
    }

    const sessionUser = await getVerifiedSessionUser(req);
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized: valid session required.' }, { status: 401 });
    }

    // 1. Check existing tenant membership for this user or email
    const { data: member } = await supabase
      .from('rag_tenant_members')
      .select('tenant_id, role, email')
      .or(`user_id.eq.${sessionUser.id},email.eq.${sessionUser.email}`)
      .limit(1)
      .maybeSingle();

    if (member) {
      const { data: tenant } = await supabase
        .from('rag_tenants')
        .select('*')
        .eq('tenant_id', member.tenant_id)
        .maybeSingle();

      const { data: sub } = await supabase
        .from('rag_subscriptions')
        .select('*')
        .eq('tenant_id', member.tenant_id)
        .maybeSingle();

      const activePlanTier = sub?.plan_tier || tenant?.plan_tier || 'starter';
      const isSubActive = sub?.is_active ?? tenant?.is_active ?? true;
      const hasPaidRazorpaySub = Boolean(sub?.razorpay_subscription_id && String(sub.razorpay_subscription_id).trim() !== '');
      const isPaidSubscription =
        isSubActive && (hasPaidRazorpaySub || (activePlanTier !== 'starter' && activePlanTier !== 'free'));

      const createdAtMs = tenant?.created_at ? new Date(tenant.created_at).getTime() : Date.now();
      const elapsedDays = Math.floor((Date.now() - createdAtMs) / (1000 * 60 * 60 * 24));

      let trialDaysRemaining = 7;
      if (!isSubActive) {
        // Cancelled or suspended subscription
        trialDaysRemaining = 0;
      } else if (isPaidSubscription) {
        // Active paid Starter, Pro, or Business subscription
        trialDaysRemaining = 365;
      } else {
        // Unpaid 7-day Starter free trial
        trialDaysRemaining = Math.max(0, 7 - elapsedDays);
      }

      const isExpired = !isSubActive || (!isPaidSubscription && trialDaysRemaining <= 0);

      let workspaceTenantId = member.tenant_id;
      let workspaceApiKey = (tenant?.api_key as string | undefined)?.trim() || '';

      // Self-heal returning workspaces missing a stored API key or OCI provisioning
      if (!workspaceApiKey || workspaceTenantId.startsWith('tenant_')) {
        const reconciled = await ensureRetrieverEngineTenant({
          existingTenantId: workspaceTenantId,
          existingApiKey: workspaceApiKey,
          workspaceName: tenant?.name || `${sessionUser.email.split('@')[0]}'s Workspace`,
          planTier: activePlanTier,
        });
        workspaceTenantId = reconciled.tenantId;
        workspaceApiKey = reconciled.apiKey;
      }

      return NextResponse.json({
        tenantId: workspaceTenantId,
        userId: sessionUser.id,
        email: sessionUser.email,
        role: member.role,
        planTier: activePlanTier,
        name: tenant?.name || 'My Workspace',
        isActive: isSubActive,
        isPaidSubscription,
        isExpired,
        apiKey: workspaceApiKey,
        currentPeriodEnd: sub?.current_period_end || null,
        trialDaysRemaining,
        createdAt: tenant?.created_at,
      });
    }

    // 2. Bootstrap default workspace for new authenticated user
    const displayName = sessionUser.email.split('@')[0];
    const workspaceName = `${displayName}'s Workspace`;
    const nowIso = new Date().toISOString();

    const provisioned = await ensureRetrieverEngineTenant({
      workspaceName,
      planTier: 'starter',
    });

    const newTenantId = provisioned.tenantId;
    const mintedApiKey = provisioned.apiKey;

    const { data: newTenant, error: tenantErr } = await supabase
      .from('rag_tenants')
      .insert({
        tenant_id: newTenantId,
        name: workspaceName,
        plan_tier: 'starter',
        api_key: mintedApiKey,
        api_key_hash: provisioned.apiKeyHash,
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      })
      .select()
      .maybeSingle();

    if (tenantErr) {
      console.warn('Bootstrapping rag_tenants warning:', tenantErr.message);
    }

    const { error: memberErr } = await supabase
      .from('rag_tenant_members')
      .insert({
        tenant_id: newTenantId,
        user_id: sessionUser.id,
        email: sessionUser.email,
        role: 'owner',
        created_at: nowIso,
        updated_at: nowIso,
      });

    if (memberErr) {
      console.warn('Bootstrapping rag_tenant_members warning:', memberErr.message);
    }

    // Seed baseline starter subscription record
    await supabase.from('rag_subscriptions').upsert(
      {
        tenant_id: newTenantId,
        plan_tier: 'starter',
        monthly_token_limit: 250000,
        api_key_hash: provisioned.apiKeyHash,
        is_active: true,
        created_at: nowIso,
        updated_at: nowIso,
      },
      { onConflict: 'tenant_id' }
    );

    return NextResponse.json({
      tenantId: newTenantId,
      userId: sessionUser.id,
      email: sessionUser.email,
      role: 'owner',
      planTier: newTenant?.plan_tier || 'starter',
      name: newTenant?.name || workspaceName,
      isActive: true,
      isPaidSubscription: false,
      isExpired: false,
      apiKey: mintedApiKey,
      trialDaysRemaining: 7,
      createdAt: nowIso,
    });
  } catch (err: unknown) {
    console.error('Get RAG Tenant API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
