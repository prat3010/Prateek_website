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

      return NextResponse.json({
        tenantId: member.tenant_id,
        userId: sessionUser.id,
        email: sessionUser.email,
        role: member.role,
        planTier: tenant?.plan_tier || 'starter',
        name: tenant?.name || 'My Workspace',
        isActive: tenant?.is_active ?? true,
      });
    }

    // 2. Bootstrap default workspace for new authenticated user
    const newTenantId = crypto.randomUUID();
    const displayName = sessionUser.email.split('@')[0];

    const { data: newTenant, error: tenantErr } = await supabase
      .from('rag_tenants')
      .insert({
        tenant_id: newTenantId,
        name: `${displayName}'s Workspace`,
        plan_tier: 'starter',
        is_active: true,
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
      });

    if (memberErr) {
      console.warn('Bootstrapping rag_tenant_members warning:', memberErr.message);
    }

    return NextResponse.json({
      tenantId: newTenantId,
      userId: sessionUser.id,
      email: sessionUser.email,
      role: 'owner',
      planTier: newTenant?.plan_tier || 'starter',
      name: newTenant?.name || `${displayName}'s Workspace`,
      isActive: true,
    });
  } catch (err: unknown) {
    console.error('Get RAG Tenant API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
