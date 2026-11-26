import { NextRequest, NextResponse } from 'next/server';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { estimateScopeTimeline } from '@/lib/pricing';
import type { FeatureItem } from '@/data/resume';
import { checkRateLimit, rateLimitResponse, applyRateLimitHeaders } from '@/lib/rateLimit';

const { features: rawFeatures } = questionnaireDefaults;
const featureCatalog = rawFeatures as FeatureItem[];

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, { scope: 'estimate-timeline', limit: 60, windowSeconds: 60 });
  if (!rl.success) {
    return rateLimitResponse(rl);
  }

  let body: {
    engineId?: string;
    featureIds?: string[];
    brandAssetId?: string;
    maintenancePlanId?: string;
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

  const result = estimateScopeTimeline(selection, featureCatalog);
  const response = NextResponse.json({
    ...result,
    isFallback: false,
    engine: 'deterministic_pricing_v1',
  });
  applyRateLimitHeaders(response, rl);
  return response;
}
