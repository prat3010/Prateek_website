import { NextResponse } from 'next/server';
import { supabase } from '@/data/supabase';
import { getVerifiedSessionEmail } from '@/lib/sessionVerify';

export async function GET(req: Request) {
  try {
    const callerEmail = await getVerifiedSessionEmail(req);
    if (!callerEmail) {
      return NextResponse.json({ error: 'Unauthorized: Session authentication required.' }, { status: 401 });
    }

    const searchParams = new URL(req.url).searchParams;
    const requestedTenantId = searchParams.get('tenantId');

    let tenantId = requestedTenantId;
    let planTier = 'starter';

    if (supabase) {
      if (!tenantId) {
        const { data: member } = await supabase
          .from('rag_tenant_members')
          .select('tenant_id')
          .eq('email', callerEmail)
          .maybeSingle();

        if (member) {
          tenantId = member.tenant_id;
        }
      }

      if (tenantId) {
        const { data: tenant } = await supabase
          .from('rag_tenants')
          .select('plan_tier')
          .eq('tenant_id', tenantId)
          .maybeSingle();

        if (tenant?.plan_tier) {
          planTier = tenant.plan_tier;
        }
      }
    }

    // Set tier quota defaults
    let maxMonthlyTokens = 250_000;
    let maxDocuments = 1_000;
    let maxStorageBytes = 100 * 1024 * 1024; // 100 MB

    if (planTier === 'growth') {
      maxMonthlyTokens = 1_500_000;
      maxDocuments = 10_000;
      maxStorageBytes = 1024 * 1024 * 1024; // 1 GB
    } else if (planTier === 'enterprise') {
      maxMonthlyTokens = 10_000_000;
      maxDocuments = 50_000;
      maxStorageBytes = 10 * 1024 * 1024 * 1024; // 10 GB
    }

    // Sample/Default Usage metrics for display
    const monthlyTokensUsed = 18_500;
    const documentsCount = 14;
    const storageBytesUsed = 4.2 * 1024 * 1024; // 4.2 MB

    const cacheHits = 124;
    const latencySavedMs = 850 * cacheHits;
    const costSavedUSD = 4.12;

    const thumbsUp = 45;
    const thumbsDown = 3;
    const totalFeedback = thumbsUp + thumbsDown;
    const satisfactionRate = totalFeedback > 0 ? Math.round((thumbsUp / totalFeedback) * 100) : 100;

    return NextResponse.json({
      success: true,
      tenantId: tenantId || 'tenant_default',
      planTier,
      quotas: {
        maxMonthlyTokens,
        maxDocuments,
        maxStorageBytes,
      },
      usage: {
        monthlyTokensUsed,
        documentsCount,
        storageBytesUsed,
        tokenUsagePercentage: Math.min(100, Math.round((monthlyTokensUsed / maxMonthlyTokens) * 100)),
        documentsPercentage: Math.min(100, Math.round((documentsCount / maxDocuments) * 100)),
        storagePercentage: Math.min(100, Math.round((storageBytesUsed / maxStorageBytes) * 100)),
      },
      semanticCache: {
        cacheHits,
        latencySavedMs,
        costSavedUSD,
      },
      feedback: {
        thumbsUp,
        thumbsDown,
        totalFeedback,
        satisfactionRate,
      },
    });
  } catch (err: unknown) {
    console.error('RAG Telemetry GET API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
