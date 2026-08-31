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
      if (requestedTenantId) {
        // Confirm caller belongs to requestedTenantId
        const { data: callerMembership } = await supabase
          .from('rag_tenant_members')
          .select('tenant_id')
          .eq('email', callerEmail)
          .eq('tenant_id', requestedTenantId)
          .maybeSingle();

        if (!callerMembership) {
          return NextResponse.json({ error: 'Forbidden: Access denied to requested tenant workspace.' }, { status: 403 });
        }
        tenantId = requestedTenantId;
      } else {
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

    // Fetch Live Metrics from Retriever Backend
    let monthlyTokensUsed = 0;
    let documentsCount = 0;
    let storageBytesUsed = 0;
    let cacheHits = 0;
    let latencySavedMs = 0;
    let costSavedUSD = 0.0;
    let thumbsUp = 0;
    let thumbsDown = 0;
    let satisfactionRate = 100;
    let avgFaithfulness = 1.0;
    let avgPrecision = 1.0;
    let hallucinationIndex = 0.0;
    let p99LatencyMs = 0.0;

    const retrieverApiUrl = process.env.RETRIEVER_API_URL || 'https://rag.prateeq.in';
    const adminKey = process.env.RETRIEVER_ADMIN_KEY || process.env.ADMIN_MASTER_KEY;

    if (tenantId && adminKey) {
      try {
        const liveRes = await fetch(`${retrieverApiUrl}/v1/admin/tenants/${tenantId}/telemetry/live`, {
          headers: {
            'X-Admin-Master-Key': adminKey,
          },
          next: { revalidate: 30 },
        });

        if (liveRes.ok) {
          const liveData = await liveRes.json();
          monthlyTokensUsed = liveData.monthly_tokens_used ?? 0;
          documentsCount = liveData.documents_count ?? 0;
          storageBytesUsed = liveData.storage_bytes_used ?? 0;
          cacheHits = liveData.cache_hits ?? 0;
          latencySavedMs = liveData.latency_saved_ms ?? 0;
          costSavedUSD = liveData.cost_saved_usd ?? 0.0;
          thumbsUp = liveData.thumbs_up ?? 0;
          thumbsDown = liveData.thumbs_down ?? 0;
          satisfactionRate = liveData.satisfaction_rate ?? 100;
          avgFaithfulness = liveData.avg_faithfulness ?? 1.0;
          avgPrecision = liveData.avg_precision ?? 1.0;
          hallucinationIndex = liveData.hallucination_index ?? 0.0;
          p99LatencyMs = liveData.p99_latency_ms ?? 0.0;
        }
      } catch (e) {
        console.warn('Could not reach Retriever live telemetry backend, using baseline:', e);
      }
    }

    const totalFeedback = thumbsUp + thumbsDown;

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
      sla: {
        avgFaithfulness,
        avgPrecision,
        hallucinationIndex,
        p99LatencyMs,
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
