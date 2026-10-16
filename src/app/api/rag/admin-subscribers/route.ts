import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';
import { isAdminEmail } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json({ subscribers: [] });
    }

    const callerEmail = await getVerifiedSessionEmail(req);
    if (!callerEmail) {
      return NextResponse.json({ error: 'Unauthorized: Session authentication required.' }, { status: 401 });
    }

    if (!isAdminEmail(callerEmail)) {
      return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
    }

    // 1. Fetch all rag_tenants
    const { data: tenants, error: tenantsErr } = await supabase
      .from('rag_tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantsErr) {
      console.warn('Admin fetch rag_tenants error:', tenantsErr);
      return NextResponse.json({ subscribers: [] });
    }

    // 2. Fetch all rag_subscriptions
    const { data: subs } = await supabase.from('rag_subscriptions').select('*');
    const subsByTenant = new Map<string, Record<string, unknown>>();
    (subs || []).forEach((s) => {
      if (s.tenant_id) subsByTenant.set(s.tenant_id, s);
    });

    // 3. Fetch all rag_tenant_members
    const { data: members } = await supabase.from('rag_tenant_members').select('*');
    const ownerByTenant = new Map<string, string>();
    (members || []).forEach((m) => {
      if (m.tenant_id && (m.role === 'owner' || !ownerByTenant.has(m.tenant_id))) {
        ownerByTenant.set(m.tenant_id, m.email);
      }
    });

    // 4. Fetch clients if client_id exists
    const { data: clientRows } = await supabase.from('clients').select('id, email, name');
    const clientsById = new Map<string, { email?: string; name?: string }>();
    (clientRows || []).forEach((c) => {
      if (c.id) clientsById.set(c.id, c);
    });

    const subscribers = (tenants || []).map((t) => {
      const sub = subsByTenant.get(t.tenant_id);
      const client = t.client_id ? clientsById.get(t.client_id) : undefined;
      const ownerEmail =
        ownerByTenant.get(t.tenant_id) || client?.email || 'Unknown Owner';

      const activePlanTier = (sub?.plan_tier as string) || (t.plan_tier as string) || 'starter';
      const isSubActive = Boolean(sub?.is_active ?? t.is_active ?? true);
      const razorpaySubId = (sub?.razorpay_subscription_id as string) || '';
      const hasPaidSubscription = Boolean(
        isSubActive &&
          (razorpaySubId.trim() !== '' ||
            (activePlanTier !== 'starter' && activePlanTier !== 'free'))
      );

      const createdAtMs = t.created_at ? new Date(t.created_at).getTime() : Date.now();
      const elapsedDays = Math.floor((Date.now() - createdAtMs) / (1000 * 60 * 60 * 24));
      const trialDaysRemaining = hasPaidSubscription ? 365 : Math.max(0, 7 - elapsedDays);
      const isExpired = !isSubActive || (!hasPaidSubscription && trialDaysRemaining <= 0);

      return {
        id: t.id,
        tenantId: t.tenant_id,
        workspaceName: t.name || 'Workspace',
        ownerEmail,
        planTier: activePlanTier,
        isActive: isSubActive,
        isPaidSubscription: hasPaidSubscription,
        isExpired,
        trialDaysRemaining,
        razorpaySubscriptionId: razorpaySubId,
        monthlyTokenLimit: Number(sub?.monthly_token_limit) || 250000,
        tokensUsedThisMonth: Number(sub?.tokens_used_this_month) || 0,
        currentPeriodEnd: sub?.current_period_end || null,
        hasApiKey: Boolean(t.api_key && String(t.api_key).trim() !== ''),
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      };
    });

    return NextResponse.json({ subscribers });
  } catch (err: unknown) {
    console.error('Admin Subscribers GET API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
