import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';

const RETRIEVER_API_URL = (
  process.env.RETRIEVER_API_URL || 
  process.env.NEXT_PUBLIC_RETRIEVER_API_URL || 
  'https://rag.prateeq.in'
).replace(/\/$/, '');

const PORTFOLIO_TENANT_ID = 
  process.env.RETRIEVER_PORTFOLIO_TENANT_ID || '6797e2c8-745a-4bd1-aa4c-3854b8d79c22';

const PORTFOLIO_API_KEY = 
  process.env.RETRIEVER_PORTFOLIO_API_KEY || 'ret_live_TaaRP0w94H8.a3_CjGsoQY57Fy5bv9Kk40zfUOoH4ak2';

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

    // Build standard OpenAI/Retriever message thread
    const messages = [
      ...history.map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || ''),
      })),
      { role: 'user', content: query },
    ];

    const endpoint = `${RETRIEVER_API_URL}/v1/tenants/${PORTFOLIO_TENANT_ID}/chat/completions`;

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PORTFOLIO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        stream: false,
        use_repl: true,
      }),
      // Set reasonable timeout
      signal: AbortSignal.timeout(12000),
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
    const choice = 
      data?.choices?.[0]?.message?.content || 
      data?.analysis_summary || 
      data?.content || 
      'Cognitive dossier synthesized.';
    const citations = data?.citations || data?.chunks || [];
    const isCached = res.headers.get('x-cache-lookup') === 'HIT' || Boolean(data?.cached);

    return NextResponse.json({
      reply: choice,
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
