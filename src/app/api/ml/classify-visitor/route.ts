import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse, applyRateLimitHeaders } from '@/lib/rateLimit';
import { classifyVisitorLocally, type VisitorTelemetry } from '@/lib/persona';

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

  const result = classifyVisitorLocally(body);
  const response = NextResponse.json({
    ...result,
    isFallback: false,
    engine: 'deterministic_persona_v1',
  });
  applyRateLimitHeaders(response, rl);
  return response;
}
