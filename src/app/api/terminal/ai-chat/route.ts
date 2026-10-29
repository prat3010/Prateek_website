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

function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === 'TimeoutError' ||
      error.name === 'AbortError' ||
      /timeout|timed out/i.test(error.message))
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = (body.query || '').trim();
    const history = Array.isArray(body.history) ? body.history.slice(-16) : [];
    const wantsStream = body.stream === true;

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
        stream: wantsStream,
        use_repl: false,
        temperature: 0.5,
        max_tokens: 700,
        top_k: 3,
        enable_reranking: false,
        enable_query_rewriting: false,
        enable_self_query: false,
        enable_colbert_rerank: false,
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      const isTimeout = res.status === 504 || res.status === 408;
      console.error(`Retriever API chat completion error [${res.status}]:`, errText);
      return NextResponse.json({
        reply: `⚠️ [Neural Glitch] The Oracle VPS cognitive engine returned status ${res.status}. Even sovereign cloud services stumble occasionally. Give it one more second and try again.`,
        error: errText || `Upstream status ${res.status}`,
        retryable: true,
      }, { status: isTimeout ? 504 : 502 });
    }

    const contentType = res.headers.get('content-type') || '';
    if (!wantsStream || !contentType.includes('text/event-stream')) {
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
    }

    if (!res.body) {
      return NextResponse.json({
        reply: '⚠️ [Neural Glitch] The cognitive engine returned an empty stream.',
        error: 'Empty upstream stream',
        retryable: true,
      }, { status: 502 });
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const cacheLookup = res.headers.get('x-cache-lookup') || 'MISS';
    const upstreamBody = res.body;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstreamBody.getReader();
        let buffer = '';
        let closed = false;

        const sendRaw = (frame: string) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(`data: ${frame}\n\n`));
          } catch {
            closed = true;
          }
        };

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;

              const payload = trimmed.slice(5).trim();
              if (!payload) continue;
              if (payload === '[DONE]') {
                sendRaw('[DONE]');
                closed = true;
                continue;
              }

              try {
                const parsed = JSON.parse(payload);
                const delta =
                  parsed?.choices?.[0]?.delta?.content ??
                  parsed?.delta ??
                  parsed?.text ??
                  parsed?.content;

                if (typeof delta === 'string' && delta.length > 0) {
                  // Strip citations per-chunk; the model is instructed not to
                  // emit bracketed citations, so split-token edge cases are rare.
                  const clean = delta.replace(/\[\d+(?:,\s*\d+)*\]/g, '');
                  if (clean) sendRaw(JSON.stringify({ delta: clean }));
                }

                if (parsed?.error) {
                  sendRaw(JSON.stringify({
                    error: String(parsed.error),
                    retryable: parsed.retryable !== false,
                  }));
                }
              } catch {
                // Ignore non-JSON frames
              }
            }
          }
        } catch (error) {
          const message = isTimeoutError(error)
            ? 'The cognitive engine took longer than 45 seconds. Please retry.'
            : error instanceof Error
              ? error.message
              : 'Stream interrupted';
          sendRaw(JSON.stringify({ error: message, retryable: true }));
        } finally {
          try {
            controller.close();
          } catch {
            // already closed
          }
          try {
            reader.releaseLock();
          } catch {
            // already released
          }
        }
      },
      cancel() {
        upstreamBody.cancel().catch(() => {});
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
        'X-Cache-Lookup': cacheLookup,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown network failure';
    console.error('Terminal AI Chat Route Exception:', error);
    return NextResponse.json({
      reply: `⚠️ [Connection Timeout] Could not establish neural bridge to rag.prateeq.in: ${msg}. Check network connectivity.`,
      error: msg,
      retryable: true,
    }, { status: isTimeoutError(error) ? 504 : 500 });
  }
}
