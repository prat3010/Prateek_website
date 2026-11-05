import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail, getVerifiedSessionUser } from '@/lib/sessionVerify';
import { isAdminEmail } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const sessionEmail = await getVerifiedSessionEmail(req);
    const sessionUser = await getVerifiedSessionUser(req);

    if (!sessionEmail || !sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized: valid user session required.' },
        { status: 401 }
      );
    }

    const isAdmin = isAdminEmail(sessionEmail);
    const body = await req.json().catch(() => ({}));
    const { subscriptionId, tenantId, scopeCode, cancelImmediately = false } = body;

    if (!subscriptionId && !tenantId && !scopeCode) {
      return NextResponse.json(
        { error: 'Subscription identifier required (subscriptionId, tenantId, or scopeCode).' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json({
        success: true,
        message: 'Subscription marked for cancellation (degraded dev mode).',
      });
    }

    let resolvedSubId = subscriptionId;
    let isSaaSSubscription = false;
    let isCarePlanSubscription = false;

    // 1. Verify access if tenantId provided
    if (tenantId) {
      const { data: member } = await supabase
        .from('rag_tenant_members')
        .select('role')
        .eq('tenant_id', tenantId)
        .or(`user_id.eq.${sessionUser.id},email.eq.${sessionEmail}`)
        .maybeSingle();

      if (!isAdmin && (!member || member.role !== 'owner')) {
        return NextResponse.json(
          { error: 'Forbidden: only workspace owners or admins can cancel subscriptions.' },
          { status: 403 }
        );
      }

      const { data: sub } = await supabase
        .from('rag_subscriptions')
        .select('razorpay_subscription_id, plan_tier')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      if (sub?.razorpay_subscription_id) {
        resolvedSubId = sub.razorpay_subscription_id;
      }
      isSaaSSubscription = true;
    }

    // 2. Verify access if scopeCode provided
    if (scopeCode) {
      const { data: scope } = await supabase
        .from('client_scopes')
        .select('client_email, metadata')
        .eq('scope_code', scopeCode)
        .maybeSingle();

      if (!isAdmin && scope?.client_email !== sessionEmail) {
        return NextResponse.json(
          { error: 'Forbidden: scope belongs to another client account.' },
          { status: 403 }
        );
      }

      const careSubId = scope?.metadata?.razorpay_care_subscription_id;
      if (careSubId) {
        resolvedSubId = careSubId;
      }
      isCarePlanSubscription = true;
    }

    // 3. Call Razorpay API to cancel subscription if keys exist
    const KEY_ID = process.env.RAZORPAY_KEY_ID?.trim();
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET?.trim();

    if (KEY_ID && KEY_SECRET && resolvedSubId && !resolvedSubId.startsWith('sub_fake_')) {
      const authHeader = `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`;
      try {
        const rzRes = await fetch(
          `https://api.razorpay.com/v1/subscriptions/${resolvedSubId}/cancel`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: authHeader,
            },
            body: JSON.stringify({
              cancel_at_cycle_end: cancelImmediately ? 0 : 1,
            }),
          }
        );

        if (!rzRes.ok) {
          const errData = await rzRes.json().catch(() => ({}));
          console.warn('Razorpay cancel subscription notice:', errData);
        }
      } catch (rzErr) {
        console.warn('Razorpay cancel fetch warning:', rzErr);
      }
    }

    const nowIso = new Date().toISOString();

    // 4. Update Database States
    if (isSaaSSubscription || tenantId) {
      if (tenantId) {
        await supabase
          .from('rag_subscriptions')
          .update({
            is_active: false,
            updated_at: nowIso,
          })
          .eq('tenant_id', tenantId);

        await supabase
          .from('rag_tenants')
          .update({
            plan_tier: 'starter',
            updated_at: nowIso,
          })
          .eq('tenant_id', tenantId);
      } else if (resolvedSubId) {
        await supabase
          .from('rag_subscriptions')
          .update({
            is_active: false,
            updated_at: nowIso,
          })
          .eq('razorpay_subscription_id', resolvedSubId);
      }
    }

    if (isCarePlanSubscription || scopeCode) {
      if (scopeCode) {
        await supabase
          .from('client_scopes')
          .update({
            maintenance_status: 'cancelled',
            updated_at: nowIso,
          })
          .eq('scope_code', scopeCode);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription successfully cancelled.',
      subscriptionId: resolvedSubId,
      cancelledAt: nowIso,
    });
  } catch (err: unknown) {
    console.error('Cancel subscription route error:', err);
    const msg = err instanceof Error ? err.message : 'Failed to cancel subscription.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
