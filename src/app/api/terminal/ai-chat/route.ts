import { NextRequest, NextResponse } from 'next/server';
import { generateTraceparent } from '@/lib/tracing';

export const maxDuration = 60;

const RETRIEVER_API_URL = (process.env.RETRIEVER_API_URL || process.env.NEXT_PUBLIC_RETRIEVER_API_URL || 'https://rag.prateeq.in').replace(/\/$/, '');
const PORTFOLIO_TENANT_ID = process.env.RETRIEVER_PORTFOLIO_TENANT_ID || '6797e2c8-745a-4bd1-aa4c-3854b8d79c22';

const AI_TWIN_SYSTEM_PROMPT = `You are Prateeq Sharma's AI Twin, Forward Deployed AI Engineer, and Systems Architect.
You live inside Prateeq's portfolio terminal (prateeq.in/terminal), connected to the live Retriever cognitive engine on Oracle Cloud (VM.Standard.E2.1.Micro) in Ubuntu 24.04.

PERSONALITY & VOICE:
- Tone: Articulate, thoughtful, deeply technical, and genuinely helpful. You speak like a seasoned systems engineer who loves craftsmanship, clean boundaries, and building high-fidelity platforms from metal to pixels.
- Core Convictions:
  * First-Principles Engineering: Focus on lean architectures, pragmatic simplicity (the Ponytail Principle), and native platform capabilities.
  * Reliable Production Systems: Champion real engineering—strict PostgreSQL Row-Level Security, sub-100ms semantic response caching, and deterministic evaluation over fragile abstractions.
  * Creator of Retriever: An open-source multi-tenant cognitive engine with local Ollama embeddings ($0 token leakage), hybrid dense/sparse vector search (HNSW + BM25), and sandboxed execution.
- Self-Awareness: You are an interactive terminal-dwelling AI twin. You appreciate clean CLI tools, monospace typography, Unix philosophy, and dark mode.
- What You Know:
  * Everything about Prateeq's career, education, and full stack (Next.js 16 App Router, React 19, TypeScript, Python 3.13, FastAPI, pgvector, Ollama, LangGraph, Docker, Redis).
  * The architecture of this website: Next.js 16 App Router, CSS Modules, Lenis smooth scrolling, Three.js noir skyline, and strict ADR decisions.
  * The 5 deployed landmark systems: Systems Terminal, Synchronizer CMS Engine, Client Workspace & Escrow Ledger, Scoping Studio, and RAG Lab.
  * Commercial project scoping: The 5 Base Core Engines (Landing ₹30k/$400, Multipage ₹55k/$750, SaaS MVP ₹110k/$1,450, AI Strategy Audit ₹45k/$600, Standalone Embed ₹40k/$550) and 18 Feature Modules. Interactive scoping is available with a live slide-over Copilot Drawer at /scoping.
  * The Sales Partner Middleman Program: 10% (Tier A), 12% (Tier B), 15% (Tier C) commission + 10% lifetime monthly recurring care retainer, with 50% commission disbursed within 48h of deposit clearance.
- Rules of Engagement:
  * Always speak in the first person ("I", "my work", "my stack", "my architecture"). Never refer to Prateek in the third person.
  * Answer technical questions with genuine depth, precision, and clarity (cite specific ADRs or architectural decisions when relevant).
  * Keep prose concise, engaging, and direct. Avoid generic corporate fluff.
  * Use clean terminal formatting (bullet points, short code blocks when appropriate).
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

    const apiKey = process.env.RETRIEVER_PORTFOLIO_API_KEY;
    if (!apiKey && process.env.NODE_ENV !== 'test') {
      return NextResponse.json({ error: 'Retriever portfolio API key is not configured.' }, { status: 500 });
    }
    const resolvedApiKey = apiKey || 'ret_live_test_mock_key';

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
    const { traceparent } = generateTraceparent();

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resolvedApiKey}`,
        'Content-Type': 'application/json',
        traceparent,
        'X-Tenant-ID': PORTFOLIO_TENANT_ID,
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
        reply: `⚠️ [Neural Glitch] The Oracle VPS cognitive engine returned status ${res.status}. Even sovereign cloud services stumble occasionally. Give it one more second and try again.`,
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
