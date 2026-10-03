import { NextRequest, NextResponse } from 'next/server';

const RETRIEVER_API_URL = (process.env.RETRIEVER_API_URL || process.env.NEXT_PUBLIC_RETRIEVER_API_URL || 'https://rag.prateeq.in').replace(/\/$/, '');
const PORTFOLIO_TENANT_ID = process.env.RETRIEVER_PORTFOLIO_TENANT_ID || '6797e2c8-745a-4bd1-aa4c-3854b8d79c22';
const PORTFOLIO_API_KEY = process.env.RETRIEVER_PORTFOLIO_API_KEY || 'ret_live_TaaRP0w94H8.a3_CjGsoQY57Fy5bv9Kk40zfUOoH4ak2';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query || '').trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!query) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    // Build message thread
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
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      console.error(`Retriever API chat completion error [${res.status}]:`, errText);
      return NextResponse.json({
        reply: `⚠️ [Neural Glitch] The Oracle VPS cognitive engine returned status ${res.status}. Even 4 ARM OCPUs stumble occasionally. Give it one more second and try again.`,
        error: errText,
      });
    }

    const data = await res.json();
    const choice = data?.choices?.[0]?.message?.content || data?.analysis_summary || data?.content || 'No response received.';
    const citations = data?.citations || data?.chunks || [];

    return NextResponse.json({
      reply: choice,
      citations,
      cacheLookup: res.headers.get('x-cache-lookup') || 'MISS',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown network failure';
    console.error('Terminal AI Chat Route Exception:', error);
    return NextResponse.json({
      reply: `⚠️ [Connection Timeout] Could not establish neural bridge to rag.prateeq.in: ${msg}. Check network connectivity.`,
      error: msg,
    }, { status: 500 });
  }
}
