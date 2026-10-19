import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail, getVerifiedSessionUser } from '@/lib/sessionVerify';

export interface SubscriptionPlanSpec {
  planKey:
    | 'starter_inr'
    | 'pro_inr'
    | 'business_inr'
    | 'starter_usd'
    | 'pro_usd'
    | 'business_usd'
    | 'care_basic_inr'
    | 'care_basic_usd'
    | 'care_standard_inr'
    | 'care_standard_usd'
    | 'care_premium_inr'
    | 'care_premium_usd';
  tier: 'starter' | 'pro' | 'business' | 'basic' | 'standard' | 'premium';
  name: string;
  description: string;
  amount: number; // paise or cents
  currency: 'INR' | 'USD';
  formattedPrice: string;
  envKey: string;
  isCarePlan?: boolean;
}

export type RetrieverPlanSpec = SubscriptionPlanSpec;

const CANONICAL_PLANS: Record<SubscriptionPlanSpec['planKey'], SubscriptionPlanSpec> = {
  starter_inr: {
    planKey: 'starter_inr',
    tier: 'starter',
    name: 'Retriever Starter (INR Monthly)',
    description: 'Retriever AI RAG Engine — Starter Plan (1 Workspace, 20 Docs, 1,000 Queries/mo)',
    amount: 199900,
    currency: 'INR',
    formattedPrice: '₹1,999',
    envKey: 'RAZORPAY_PLAN_STARTER_INR',
  },
  pro_inr: {
    planKey: 'pro_inr',
    tier: 'pro',
    name: 'Retriever Pro (INR Monthly)',
    description: 'Retriever AI RAG Engine — Pro Plan (5 Workspaces, 100 Docs, 5,000 Queries/mo)',
    amount: 599900,
    currency: 'INR',
    formattedPrice: '₹5,999',
    envKey: 'RAZORPAY_PLAN_PRO_INR',
  },
  business_inr: {
    planKey: 'business_inr',
    tier: 'business',
    name: 'Retriever Business (INR Monthly)',
    description: 'Retriever AI RAG Engine — Business Plan (Unlimited Workspaces, 500 Docs, 20,000 Queries/mo)',
    amount: 1499900,
    currency: 'INR',
    formattedPrice: '₹14,999',
    envKey: 'RAZORPAY_PLAN_BUSINESS_INR',
  },
  starter_usd: {
    planKey: 'starter_usd',
    tier: 'starter',
    name: 'Retriever Starter (USD Monthly)',
    description: 'Retriever AI RAG Engine — Starter Plan (1 Workspace, 20 Docs, 1,000 Queries/mo)',
    amount: 2900,
    currency: 'USD',
    formattedPrice: '$29',
    envKey: 'RAZORPAY_PLAN_STARTER_USD',
  },
  pro_usd: {
    planKey: 'pro_usd',
    tier: 'pro',
    name: 'Retriever Pro (USD Monthly)',
    description: 'Retriever AI RAG Engine — Pro Plan (5 Workspaces, 100 Docs, 5,000 Queries/mo)',
    amount: 7900,
    currency: 'USD',
    formattedPrice: '$79',
    envKey: 'RAZORPAY_PLAN_PRO_USD',
  },
  business_usd: {
    planKey: 'business_usd',
    tier: 'business',
    name: 'Retriever Business (USD Monthly)',
    description: 'Retriever AI RAG Engine — Business Plan (Unlimited Workspaces, 500 Docs, 20,000 Queries/mo)',
    amount: 19900,
    currency: 'USD',
    formattedPrice: '$199',
    envKey: 'RAZORPAY_PLAN_BUSINESS_USD',
  },
  care_basic_inr: {
    planKey: 'care_basic_inr',
    tier: 'basic',
    name: 'Basic Care Plan (INR Monthly)',
    description: 'Basic Care Plan — Daily Backups, Uptime Monitoring, Security Patches (2-day SLA)',
    amount: 500000,
    currency: 'INR',
    formattedPrice: '₹5,000',
    envKey: 'RAZORPAY_PLAN_CARE_BASIC_INR',
    isCarePlan: true,
  },
  care_basic_usd: {
    planKey: 'care_basic_usd',
    tier: 'basic',
    name: 'Basic Care Plan (USD Monthly)',
    description: 'Basic Care Plan — Daily Backups, Uptime Monitoring, Security Patches (2-day SLA)',
    amount: 7000,
    currency: 'USD',
    formattedPrice: '$70',
    envKey: 'RAZORPAY_PLAN_CARE_BASIC_USD',
    isCarePlan: true,
  },
  care_standard_inr: {
    planKey: 'care_standard_inr',
    tier: 'standard',
    name: 'Standard Care Plan (INR Monthly)',
    description: 'Standard Care Plan — 3-4 Hours Dedicated Dev, Performance Tuning, Content Updates (1-day SLA)',
    amount: 1000000,
    currency: 'INR',
    formattedPrice: '₹10,000',
    envKey: 'RAZORPAY_PLAN_CARE_STANDARD_INR',
    isCarePlan: true,
  },
  care_standard_usd: {
    planKey: 'care_standard_usd',
    tier: 'standard',
    name: 'Standard Care Plan (USD Monthly)',
    description: 'Standard Care Plan — 3-4 Hours Dedicated Dev, Performance Tuning, Content Updates (1-day SLA)',
    amount: 14000,
    currency: 'USD',
    formattedPrice: '$140',
    envKey: 'RAZORPAY_PLAN_CARE_STANDARD_USD',
    isCarePlan: true,
  },
  care_premium_inr: {
    planKey: 'care_premium_inr',
    tier: 'premium',
    name: 'Premium AI & Dev SLA Care Plan (INR Monthly)',
    description: 'Premium SLA Care Plan — Up to 8 Dev Hours, AI Vector/LLM Tuning, SEO Reports (24-hr Priority SLA)',
    amount: 3500000,
    currency: 'INR',
    formattedPrice: '₹35,000',
    envKey: 'RAZORPAY_PLAN_CARE_PREMIUM_INR',
    isCarePlan: true,
  },
  care_premium_usd: {
    planKey: 'care_premium_usd',
    tier: 'premium',
    name: 'Premium AI & Dev SLA Care Plan (USD Monthly)',
    description: 'Premium SLA Care Plan — Up to 8 Dev Hours, AI Vector/LLM Tuning, SEO Reports (24-hr Priority SLA)',
    amount: 47500,
    currency: 'USD',
    formattedPrice: '$475',
    envKey: 'RAZORPAY_PLAN_CARE_PREMIUM_USD',
    isCarePlan: true,
  },
};

export function resolvePlanSpec(rawPlanId: string): SubscriptionPlanSpec {
  const lower = (rawPlanId || '').toLowerCase().trim();
  const isUsd = lower.includes('usd');

  // Care Plan Matchers
  if (lower.startsWith('care_') || lower.includes('care') || lower.includes('retainer') || lower.includes('sla')) {
    if (lower.includes('premium') || lower.includes('sla') || lower.includes('ai')) {
      return isUsd ? CANONICAL_PLANS.care_premium_usd : CANONICAL_PLANS.care_premium_inr;
    }
    if (lower.includes('standard')) {
      return isUsd ? CANONICAL_PLANS.care_standard_usd : CANONICAL_PLANS.care_standard_inr;
    }
    return isUsd ? CANONICAL_PLANS.care_basic_usd : CANONICAL_PLANS.care_basic_inr;
  }

  // Retriever SaaS Matchers
  if (lower.includes('business') || lower.includes('enterprise')) {
    return isUsd ? CANONICAL_PLANS.business_usd : CANONICAL_PLANS.business_inr;
  }
  if (lower.includes('pro') || lower.includes('growth')) {
    return isUsd ? CANONICAL_PLANS.pro_usd : CANONICAL_PLANS.pro_inr;
  }
  return isUsd ? CANONICAL_PLANS.starter_usd : CANONICAL_PLANS.starter_inr;
}

const planIdCache = new Map<string, string>();

async function resolveOrCreateRazorpayPlanId(
  rawPlanId: string,
  spec: SubscriptionPlanSpec,
  authHeader: string
): Promise<string> {
  // 1. If caller already passed a real Razorpay generated plan ID (plan_ + 14 alphanumeric chars)
  if (/^plan_[A-Za-z0-9]{14}$/.test(rawPlanId)) {
    return rawPlanId;
  }

  // 2. Check environment variable override
  const envOverride = process.env[spec.envKey]?.trim();
  if (envOverride && /^plan_[A-Za-z0-9]{14}$/.test(envOverride)) {
    return envOverride;
  }

  // 3. Check in-memory process cache
  const cached = planIdCache.get(spec.planKey);
  if (cached) {
    return cached;
  }

  // 4. Query existing Razorpay plans
  const listRes = await fetch('https://api.razorpay.com/v1/plans?count=100', {
    method: 'GET',
    headers: { Authorization: authHeader },
  });

  if (listRes.ok) {
    const listData = await listRes.json().catch(() => ({}));
    const items: Array<{
      id?: string;
      period?: string;
      interval?: number;
      item?: { name?: string; amount?: number; currency?: string };
      notes?: Record<string, string>;
    }> = Array.isArray(listData?.items) ? listData.items : [];

    const match = items.find(
      (p) =>
        p.id &&
        p.period === 'monthly' &&
        Number(p.item?.amount) === spec.amount &&
        (p.item?.currency || '').toUpperCase() === spec.currency &&
        (p.notes?.plan_key === spec.planKey || p.item?.name === spec.name)
    );

    if (match?.id) {
      planIdCache.set(spec.planKey, match.id);
      return match.id;
    }
  }

  // 5. Auto-create the monthly plan in Razorpay
  const createPlanRes = await fetch('https://api.razorpay.com/v1/plans', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: authHeader,
    },
    body: JSON.stringify({
      period: 'monthly',
      interval: 1,
      item: {
        name: spec.name,
        amount: spec.amount,
        currency: spec.currency,
        description: spec.description,
      },
      notes: {
        plan_key: spec.planKey,
        tier: spec.tier,
        source: 'prateeq_website',
      },
    }),
  });

  if (!createPlanRes.ok) {
    const errText = await createPlanRes.text();
    throw new Error(`Razorpay plan auto-creation failed (${createPlanRes.status}): ${errText}`);
  }

  const createdPlan = await createPlanRes.json();
  if (createdPlan?.id) {
    planIdCache.set(spec.planKey, createdPlan.id);
    return createdPlan.id;
  }

  throw new Error('Razorpay plan auto-creation did not return a plan ID.');
}

export async function POST(req: Request) {
  try {
    const KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';
    const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
    const payload = await req.json().catch(() => ({}));
    const rawPlanId = (payload.planId as string) || 'starter_inr';
    const scopeCode = (payload.scopeCode as string) || '';
    const totalCount = Number(payload.totalCount) || 12;
    const planSpec = resolvePlanSpec(rawPlanId);
    const isCarePlan = Boolean(planSpec.isCarePlan || scopeCode || rawPlanId.startsWith('care_'));

    const sessionUser = await getVerifiedSessionUser(req);
    const clientEmail = sessionUser?.email || (await getVerifiedSessionEmail(req));
    const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

    if (!clientEmail && !isDev) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be signed in to start or upgrade a subscription.' },
        { status: 401 }
      );
    }

    let targetTenantId = (payload.tenantId as string) || '';
    if (!isCarePlan && clientEmail && supabase) {
      const { data: member } = await supabase
        .from('rag_tenant_members')
        .select('tenant_id')
        .eq('email', clientEmail)
        .limit(1)
        .maybeSingle();
      if (member?.tenant_id) {
        targetTenantId = member.tenant_id;
      }
    }

    if (!KEY_ID || !KEY_SECRET) {
      if (isDev || !supabase) {
        return NextResponse.json({
          isMock: true,
          subscriptionId: `sub_mock_${Date.now()}`,
          planId: planSpec.planKey,
          tier: planSpec.tier,
          subscriptionType: isCarePlan ? 'care_plan' : 'retriever_saas',
          scopeCode,
          tenantId: targetTenantId || 'tn_dev_mock',
          keyId: KEY_ID || 'rzp_test_mock',
        });
      }
      return NextResponse.json({ error: 'Razorpay API credentials not configured on server.' }, { status: 500 });
    }

    const authHeader = `Basic ${Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64')}`;

    try {
      const razorpayPlanId = await resolveOrCreateRazorpayPlanId(rawPlanId, planSpec, authHeader);

      const response = await fetch('https://api.razorpay.com/v1/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          plan_id: razorpayPlanId,
          total_count: totalCount,
          quantity: 1,
          customer_notify: 1,
          notes: {
            client_email: clientEmail || 'guest@prateeq.in',
            tenant_id: isCarePlan ? '' : targetTenantId,
            scope_code: scopeCode,
            subscription_type: isCarePlan ? 'care_plan' : 'retriever_saas',
            plan_id: planSpec.planKey,
            tier: planSpec.tier,
            formatted_price: planSpec.formattedPrice,
            source: 'prateeq_website',
          },
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Razorpay create subscription API error:', errText);
        if (isDev) {
          return NextResponse.json({
            isMock: true,
            subscriptionId: `sub_mock_${Date.now()}`,
            planId: planSpec.planKey,
            tier: planSpec.tier,
            subscriptionType: isCarePlan ? 'care_plan' : 'retriever_saas',
            scopeCode,
            keyId: KEY_ID,
          });
        }
        return NextResponse.json({ error: 'Failed to initialize Razorpay subscription plan.' }, { status: 500 });
      }

      const subData = await response.json();

      return NextResponse.json({
        subscriptionId: subData.id,
        planId: planSpec.planKey,
        razorpayPlanId: subData.plan_id,
        tier: planSpec.tier,
        subscriptionType: isCarePlan ? 'care_plan' : 'retriever_saas',
        scopeCode,
        status: subData.status,
        keyId: KEY_ID,
      });
    } catch (fetchErr) {
      console.warn('Razorpay subscription fetch warning:', fetchErr);
      if (isDev) {
        return NextResponse.json({
          isMock: true,
          subscriptionId: `sub_mock_${Date.now()}`,
          planId: planSpec.planKey,
          tier: planSpec.tier,
          subscriptionType: isCarePlan ? 'care_plan' : 'retriever_saas',
          scopeCode,
          keyId: KEY_ID,
        });
      }
      return NextResponse.json({ error: 'Unable to connect to Razorpay subscription gateway.' }, { status: 502 });
    }
  } catch (err) {
    console.error('Create Razorpay Subscription API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
