import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
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
      const createdAtMs = tenant?.created_at ? new Date(tenant.created_at).getTime() : Date.now();
      const elapsedDays = Math.floor((Date.now() - createdAtMs) / (1000 * 60 * 60 * 24));
      const trialDaysRemaining = activePlanTier === 'starter' ? Math.max(0, 7 - elapsedDays) : 365;

      return NextResponse.json({
        tenantId: member.tenant_id,
        userId: sessionUser.id,
        email: sessionUser.email,
        role: member.role,
        planTier: activePlanTier,
        name: tenant?.name || 'My Workspace',
        isActive: isSubActive,
        currentPeriodEnd: sub?.current_period_end || null,
        trialDaysRemaining,
        createdAt: tenant?.created_at,
      });
    }

    // 2. Bootstrap default workspace for new authenticated user
    const displayName = sessionUser.email.split('@')[0];
    let newTenantId = crypto.randomUUID();
    let mintedApiKey = '';
    const nowIso = new Date().toISOString();

    const retrieverUrl = (process.env.RETRIEVER_API_URL || 'https://rag.prateeq.in').replace(/\/$/, '');
    const adminKey = process.env.RETRIEVER_ADMIN_KEY || process.env.ADMIN_MASTER_KEY;

    // Call sovereign Retriever engine to provision isolated OCI pgvector tenant
    if (adminKey) {
      try {
        const createRes = await fetch(`${retrieverUrl}/v1/tenants`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Master-Key': adminKey,
          },
          body: JSON.stringify({
            name: `${displayName}'s Workspace`,
            tier: 'standard',
            isolation_level: 'logical',
          }),
        });

        if (createRes.ok) {
          const tenantItem = await createRes.json();
          if (tenantItem?.tenantId) {
            newTenantId = tenantItem.tenantId;

            // Mint default workspace API key
            const keyRes = await fetch(`${retrieverUrl}/v1/admin/tenants/${newTenantId}/api-keys`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Admin-Master-Key': adminKey,
              },
              body: JSON.stringify({
                name: 'Default Workspace Key',
                role: 'admin',
              }),
            });

            if (keyRes.ok) {
              const keyData = await keyRes.json();
              mintedApiKey = keyData.apiKey || '';
            }
          }
        }
      } catch (engineErr) {
        console.warn('Could not provision tenant in Retriever engine, falling back to local:', engineErr);
      }
    }

    const { data: newTenant, error: tenantErr } = await supabase
      .from('rag_tenants')
      .insert({
        tenant_id: newTenantId,
        name: `${displayName}'s Workspace`,
        plan_tier: 'starter',
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
      name: newTenant?.name || `${displayName}'s Workspace`,
      isActive: true,
      apiKey: mintedApiKey,
      trialDaysRemaining: 7,
      createdAt: nowIso,
    });
  } catch (err: unknown) {
    console.error('Get RAG Tenant API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
