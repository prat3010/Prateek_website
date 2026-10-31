import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { generateTraceparent } from '@/lib/tracing';

export const maxDuration = 60;

const RETRIEVER_API_URL = (
  process.env.RETRIEVER_API_URL || 'https://rag.prateeq.in'
).replace(/\/$/, '');

export async function POST(req: NextRequest) {
  // 1. Sliding window rate limit check (20 requests / minute)
  const rateResult = await checkRateLimit(req, {
    scope: 'playground-chat',
    limit: 20,
    windowSeconds: 60,
  });

  if (!rateResult.success) {
    return rateLimitResponse(rateResult);
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const query = (body.query || '').trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!query) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    const tenantId = process.env.RETRIEVER_PORTFOLIO_TENANT_ID || '';
    const apiKey = process.env.RETRIEVER_PORTFOLIO_API_KEY || '';
    if (!tenantId || !apiKey) {
      return NextResponse.json(
        { error: 'Retriever portfolio tenant or API key is not configured.' },
        { status: 503 }
      );
    }
    const resolvedApiKey = apiKey;

    // Build standard OpenAI/Retriever message thread
    const messages = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || ''),
      })),
      { role: 'user', content: query },
    ];

    const endpoint = `${RETRIEVER_API_URL}/v1/tenants/${tenantId}/chat/completions`;
    const { traceparent } = generateTraceparent();

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resolvedApiKey}`,
        'Content-Type': 'application/json',
        traceparent,
        'X-Tenant-ID': tenantId,
      },
      body: JSON.stringify({
        messages,
        stream: false,
        use_repl: false,
        temperature: 0.4,
        max_tokens: 2048,
      }),
      // Set reasonable timeout
      signal: AbortSignal.timeout(35000),
    });

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`Retriever Playground API chat error [${res.status}]:`, errText);
      return NextResponse.json({
        reply: `⚠️ [Neural Handshake Issue] Oracle Cloud VPS cognitive engine returned status ${res.status}. Falling back to internal engineering heuristic.`,
        error: errText,
        latencyMs,
        cached: false,
      });
    }

    const data = await res.json();
    const rawChoice = 
      data?.choices?.[0]?.message?.content || 
      data?.analysis_summary || 
      data?.content || 
      'Cognitive dossier synthesized.';
    const cleanChoice = rawChoice.replace(/\[\d+(?:,\s*\d+)*\]/g, '').replace(/  +/g, ' ').trim();
    const citations = data?.citations || data?.chunks || [];
    const isCached = res.headers.get('x-cache-lookup') === 'HIT' || Boolean(data?.cached);

    return NextResponse.json({
      reply: cleanChoice,
      citations,
      cached: isCached,
      latencyMs,
      sourceDoc: 'PRATEEQ_KNOWLEDGE_DOSSIER.md',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown network failure';
    const latencyMs = Date.now() - startTime;
    console.error('Playground AI Chat Route Exception:', error);
    return NextResponse.json({
      reply: `⚠️ [Connection Fault] Could not connect to Oracle Cloud VPS (rag.prateeq.in): ${msg}. Fallback mode active.`,
      error: msg,
      latencyMs,
      cached: false,
    }, { status: 500 });
  }
}
