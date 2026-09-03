import { NextRequest, NextResponse } from 'next/server';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { estimateScopeTimeline, type TimelineEstimateResult } from '@/lib/pricing';
import type { FeatureItem } from '@/data/resume';
import { checkRateLimit, rateLimitResponse, applyRateLimitHeaders } from '@/lib/rateLimit';

const { features: rawFeatures } = questionnaireDefaults;
const featureCatalog = rawFeatures as FeatureItem[];

export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { limit: 60, windowMs: 60_000 });
  if (rl.limited) {
    return rateLimitResponse(rl);
  }

  let body: {
    engineId?: string;
    featureIds?: string[];
    brandAssetId?: string;
    maintenancePlanId?: string;
    customNotes?: string;
  };

  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const selection = {
    engineId: body.engineId || 'saas',
    featureIds: Array.isArray(body.featureIds) ? body.featureIds : [],
    brandAssetId: body.brandAssetId || '',
    maintenancePlanId: body.maintenancePlanId || '',
  };

  // Attempt ML inference via Retriever Cognitive Engine
  const retrieverBaseUrl =
    process.env.RETRIEVER_API_URL ||
    process.env.NEXT_PUBLIC_RETRIEVER_API_URL ||
    'https://rag.prateeq.in';

  try {
    const res = await fetch(`${retrieverBaseUrl}/v1/scoping/estimate-timeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        engine_id: selection.engineId,
        feature_ids: selection.featureIds,
        brand_asset_id: selection.brandAssetId || null,
        maintenance_plan_id: selection.maintenancePlanId || null,
        custom_notes: body.customNotes || null,
      }),
      signal: AbortSignal.timeout(2500),
    });

    if (res.ok) {
      const data = await res.json();
      const responsePayload: TimelineEstimateResult = {
        hoursP50: data.hours_p50,
        hoursP90: data.hours_p90,
        calendarDaysMin: data.calendar_days_min,
        calendarDaysMax: data.calendar_days_max,
        complexityIndex: data.complexity_index,
        recommendedSprintWeeks: data.recommended_sprint_weeks,
        confidenceScore: data.confidence_score,
        topEffortDrivers: (data.top_effort_drivers || []).map((d: {
          feature_name: string;
          category: string;
          added_hours_estimate: number;
          risk_level: 'low' | 'medium' | 'high';
        }) => ({
          featureName: d.feature_name,
          category: d.category,
          addedHoursEstimate: d.added_hours_estimate,
          riskLevel: d.risk_level,
        })),
        riskFactors: data.risk_factors || [],
        isFallback: false,
      };

      const response = NextResponse.json(responsePayload);
      applyRateLimitHeaders(response, rl);
      return response;
    }
  } catch {
    // Graceful fallback to deterministic pricing.ts estimator
  }

  const fallbackResult = estimateScopeTimeline(selection, featureCatalog);
  const response = NextResponse.json(fallbackResult);
  applyRateLimitHeaders(response, rl);
  return response;
}
