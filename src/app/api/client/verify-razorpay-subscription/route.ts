import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionUser } from '@/lib/sessionVerify';

export async function POST(req: Request) {
  try {
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
    const payload = await req.json().catch(() => ({}));
    const {
      razorpaySubscriptionId,
      razorpayPaymentId,
      razorpaySignature,
      planId = 'plan_pro_inr',
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

    if (!supabase) {
      return NextResponse.json({
        success: true,
        planTier: planId.includes('business') ? 'business' : 'pro',
        message: 'Subscription verified in degraded mode.',
      });
    }

    const nowIso = new Date().toISOString();
    const planTier = planId.includes('business')
      ? 'business'
      : planId.includes('pro')
      ? 'pro'
      : 'starter';

    const tokenLimit = planTier === 'business' ? 5000000 : planTier === 'pro' ? 1000000 : 250000;

    // Resolve tenant ID for authenticated user
    const { data: member } = await supabase
      .from('rag_tenant_members')
      .select('tenant_id')
      .or(`user_id.eq.${sessionUser.id},email.eq.${sessionUser.email}`)
      .limit(1)
      .maybeSingle();

    let targetTenantId = member?.tenant_id;

    if (!targetTenantId) {
      targetTenantId = crypto.randomUUID();
      const displayName = sessionUser.email.split('@')[0];
      await supabase.from('rag_tenants').insert({
        tenant_id: targetTenantId,
        name: `${displayName}'s Workspace`,
        plan_tier: planTier,
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
    }

    // Upsert subscription ledger
    await supabase.from('rag_subscriptions').upsert(
      {
        tenant_id: targetTenantId,
        razorpay_subscription_id: razorpaySubscriptionId,
        plan_tier: planTier,
        monthly_token_limit: tokenLimit,
        is_active: true,
        updated_at: nowIso,
      },
      { onConflict: 'tenant_id' }
    );

    // Upgrade tenant plan tier
    await supabase
      .from('rag_tenants')
      .update({
        plan_tier: planTier,
        is_active: true,
        updated_at: nowIso,
      })
      .eq('tenant_id', targetTenantId);

    // Sync to Retriever cognitive engine backend if admin credentials exist
    const retrieverUrl = process.env.RETRIEVER_API_URL || 'https://rag.prateeq.in';
    const adminKey = process.env.RETRIEVER_ADMIN_KEY || process.env.ADMIN_MASTER_KEY;
    if (adminKey && targetTenantId) {
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
        console.warn('Could not sync upgraded tier to Retriever backend:', engineErr);
      }
    }

    return NextResponse.json({
      success: true,
      planTier,
      tenantId: targetTenantId,
      message: 'Subscription successfully verified and upgraded.',
    });
  } catch (err: unknown) {
    console.error('Verify Razorpay Subscription API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
