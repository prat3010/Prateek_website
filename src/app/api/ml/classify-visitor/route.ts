import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse, applyRateLimitHeaders } from '@/lib/rateLimit';
import { classifyVisitorLocally, type VisitorTelemetry, type PersonaRecommendation } from '@/lib/persona';

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(req, { scope: 'classify-visitor', limit: 120, windowSeconds: 60 });
  if (!rl.success) {
    return rateLimitResponse(rl);
  }

  let body: VisitorTelemetry;
  try {
    body = await req.json();
  } catch {
    body = {
      commercialIntentRatio: 0,
      credibilityIntentRatio: 0,
      productIntentRatio: 0,
      contentIntentRatio: 0,
      dwellTimeSeconds: 0,
      interactionDepthScore: 0,
    };
  }

  const retrieverBaseUrl =
    process.env.RETRIEVER_API_URL ||
    process.env.NEXT_PUBLIC_RETRIEVER_API_URL ||
    'https://rag.prateeq.in';

  try {
    const res = await fetch(`${retrieverBaseUrl}/v1/ml/classify-visitor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        commercial_intent_ratio: body.commercialIntentRatio,
        credibility_intent_ratio: body.credibilityIntentRatio,
        product_intent_ratio: body.productIntentRatio,
        content_intent_ratio: body.contentIntentRatio,
        dwell_time_seconds: body.dwellTimeSeconds,
        interaction_depth_score: body.interactionDepthScore,
      }),
      signal: AbortSignal.timeout(2000),
    });

    if (res.ok) {
      const data = await res.json();
      const localMeta = classifyVisitorLocally(body);
      const recommendation: PersonaRecommendation = {
        personaCategory: data.persona_category,
        confidenceScore: data.confidence_score,
        recommendedAction: data.recommended_action,
        badgeLabel: localMeta.badgeLabel,
        headline: localMeta.headline,
        ctaText: localMeta.ctaText,
        ctaHref: localMeta.ctaHref,
        isPdfDownload: localMeta.isPdfDownload,
        isFallback: false,
      };

      const response = NextResponse.json(recommendation);
      applyRateLimitHeaders(response, rl);
      return response;
    }
  } catch {
    // Graceful offline fallback
  }

  const fallbackResult = classifyVisitorLocally(body);
  const response = NextResponse.json(fallbackResult);
  applyRateLimitHeaders(response, rl);
  return response;
}
