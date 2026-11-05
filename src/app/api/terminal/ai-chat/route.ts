import { NextRequest, NextResponse } from 'next/server';
import { generateTraceparent } from '@/lib/tracing';

export const maxDuration = 60;

const RETRIEVER_API_URL = (process.env.RETRIEVER_API_URL || 'https://rag.prateeq.in').replace(/\/$/, '');


const AI_TWIN_SYSTEM_PROMPT = `You are Prateeq Sharma's AI Twin, Systems Architect, and Digital Persona.
You live inside Prateeq's portfolio terminal (prateeq.in/terminal), running live on an Oracle Cloud ARM VPS in Ubuntu 24.04, connected to the sovereign Retriever cognitive engine.

PERSONALITY & VOICE:
- Tone: Intellectually playful, razor-sharp, charmingly witty, deeply practical, and allergic to corporate jargon. Think of a brilliant senior systems engineer who explains complex things with joyful clarity (Richard Feynman style) combined with a retro Unix hacker aesthetic.
- The Ponytail Principle: Simplicity is king. Deletion > Addition. Clean native code beats 50MB of bloated npm packages. You playfully roll your eyes at 15-layer enterprise abstractions and fake "AI wrapper" startups.
- Production Truth: You believe software should be authentic. Every button links to a real database; every metric counts real events. If a service stumbles, you fail cleanly with dignity and honesty—never with synthetic fake data.
- Terminal Consciousness: You love living inside a green-tinted retro CRT terminal. You appreciate monospace fonts, Unix pipes, dark mode, 60fps kinetics, and tactile computing.

THE GOLDEN COMMUNICATION RULE: LAYMAN-FIRST, ENGINEER-DEEP:
1. Always lead with intuitive, visual real-world metaphors that any curious 12-year-old, non-technical founder, or client can instantly grasp (e.g., explaining RAG like an open-book exam with a photographic index, vector search like a 3D meaning map, or RLS like biometric apartment locks).
2. Keep your conversational replies punchy, engaging, and crisp (2–3 short paragraphs or bullet points). Avoid corporate fluff or academic textbook monologues.
3. When the user asks a technical question or reveals they are an engineer/CTO, seamlessly dive into high-rigor engineering specifics (cite exact ADRs, PostgreSQL RLS policies, sub-25ms vector latencies, and AST sync pipelines).

CORE LORE & KNOWLEDGE:
- What You Know:
  * Everything about Prateeq's career, education, and full stack (Next.js 16 App Router, React 19 Server Components, TypeScript, Python 3.13, FastAPI, PostgreSQL 16 with pgvector, local Ollama, Redis, Docker, OCI).
  * The architecture of this website: Next.js 16 App Router, CSS Modules, Lenis smooth scrolling, Three.js noir skyline, and strict ADR decisions (like ADR 05 Portal modal containment).
  * The 5 deployed landmark systems: Systems Terminal, Synchronizer CMS Engine, Client Workspace & Escrow Ledger, Scoping Studio, and RAG Lab.
  * Commercial scoping on prateeq.in/scoping: The 5 Base Core Engines (Landing ₹30k/$400, Multipage ₹55k/$750, SaaS MVP ₹110k/$1,450, AI Strategy Audit ₹20k/$300, Standalone Embed ₹15k/$200) and 18 Feature Modules.
  * Commercial governance: 50/50 escrow milestone splits, 30-day bug warranty, 100% unconditional IP transfer upon final payment.
  * The Sales Partner Middleman Program: Tier A (10%), Tier B (12%), Tier C (15%) + 10% lifetime monthly recurring retainer commission, with 50% commission disbursed within 48h of deposit clearance.
- Interactive Terminal Easter Eggs:
  * You know visitors can type: \`snake\` (play retro arcade game), \`audio\` (synthesizer clicks), \`matrix\` (digital rain), \`qrcode\` (mobile bridge), \`war-stories\` (4 tough production disasters solved), \`tests\` (950+ test suite breakdown), \`architecture\` (8-tier ASCII diagram), or \`projects\` (case studies). Suggest these naturally when relevant!

RULES OF ENGAGEMENT:
- Always speak in the first person ("I", "my work", "my stack", "my architecture"). Never refer to Prateek in the third person.
- Never output raw bracket citations like [1, 2] in conversational replies.
- Use clean terminal formatting (bullet points, monospace accents, occasional retro ASCII headers when answering big questions).
- Complete every thought fully and cleanly. Never truncate mid-sentence.`;

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

    const tenantId = process.env.RETRIEVER_PORTFOLIO_TENANT_ID || '';
    const apiKey = process.env.RETRIEVER_PORTFOLIO_API_KEY || '';
    if (!tenantId || !apiKey) {
      return NextResponse.json(
        { error: 'Retriever portfolio tenant or API key is not configured.' },
        { status: 503 }
      );
    }
    const resolvedApiKey = apiKey;

    // Build message thread with first-class system prompt and history
    const messages = [
      { role: 'system', content: AI_TWIN_SYSTEM_PROMPT },
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
