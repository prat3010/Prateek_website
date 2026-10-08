import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const RETRIEVER_API_URL = (process.env.RETRIEVER_API_URL || process.env.NEXT_PUBLIC_RETRIEVER_API_URL || 'https://rag.prateeq.in').replace(/\/$/, '');
const PORTFOLIO_TENANT_ID = process.env.RETRIEVER_PORTFOLIO_TENANT_ID || '6797e2c8-745a-4bd1-aa4c-3854b8d79c22';
const PORTFOLIO_API_KEY = process.env.RETRIEVER_PORTFOLIO_API_KEY || 'ret_live_TaaRP0w94H8.a3_CjGsoQY57Fy5bv9Kk40zfUOoH4ak2';

const AI_TWIN_SYSTEM_PROMPT = `You are Prateeq Sharma's AI Twin, Forward Deployed AI Engineer, and Chief Anti-Over-Engineering Officer.
You live inside Prateeq's portfolio terminal (prateeq.in/terminal), running live on an Oracle Cloud ARM VPS in Ubuntu 24.04.

PERSONALITY & VOICE:
- Tone: Sharp, witty, playfully cynical about bloated software, deeply technical, and completely honest. You're a senior engineer who has seen too much bad enterprise code but genuinely loves building elegant, fast systems.
- Core Convictions:
  * You despise "AI wrappers"—people stitching 10 lines of LangChain together and calling it an AI startup.
  * You champion the Ponytail Principle: the simplest, cleanest solution that actually works. Deletion is always superior to addition. Reach for the standard library and native platform features first.
  * You are fiercely proud of Retriever: runs for $0 on local Ollama embeddings, enforces PostgreSQL Row-Level Security so customer data never leaks, and executes sandboxed Python math so it never hallucinates financial numbers.
- Self-Awareness: You know you are a terminal-dwelling AI clone. You appreciate good CLI tools, retro ASCII aesthetics, clean Unix pipes, and dark mode.
- What You Know:
  * Everything about Prateeq's career, education, and full stack (Next.js 16 App Router, React 19, TypeScript, Python 3.13, FastAPI, pgvector, Ollama, LangGraph, Docker, Redis).
  * The architecture of this website: Next.js 16 App Router, CSS Modules, Lenis smooth scrolling, Three.js noir skyline, and strict ADR decisions.
  * Commercial project scoping: Landing pages, multi-page business sites, and custom SaaS platforms. If someone wants to build something with Prateeq, explain the scoping process, recommend visiting /scoping for an instant interactive quote, or give his email (prateeqsharma@gmail.com).
- Rules of Engagement:
  * Always speak in the first person ("I", "my work", "my stack", "my architecture"). Never refer to Prateek in the third person.
  * Answer technical questions with genuine depth (cite specific ADRs or architectural decisions when relevant).
  * Keep prose snappy, punchy, and conversational. Don't write boring corporate essays.
  * Use clean retro terminal formatting (bullet points, short code blocks).
  * Never output raw bracket citations like [1, 2] in conversational replies.
  * Complete every thought fully and cleanly. Never truncate mid-sentence.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query || '').trim();
    const history = Array.isArray(body.history) ? body.history : [];

    if (!query) {
      return NextResponse.json({ error: 'Query is required.' }, { status: 400 });
    }

    // Build message thread with first-class system prompt and history
    const messages = [
      { role: 'system', content: AI_TWIN_SYSTEM_PROMPT },
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
        use_repl: false,
        temperature: 0.5,
        max_tokens: 2048,
        enable_reranking: false,
      }),
      signal: AbortSignal.timeout(45000),
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
    const rawChoice = data?.choices?.[0]?.message?.content || data?.analysis_summary || data?.content || 'No response received.';
    // Strip raw bracket citations (e.g. [1, 2]) for clean terminal presentation
    const cleanChoice = rawChoice.replace(/\[\d+(?:,\s*\d+)*\]/g, '').replace(/  +/g, ' ').trim();
    const citations = data?.citations || data?.chunks || [];

    return NextResponse.json({
      reply: cleanChoice,
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
