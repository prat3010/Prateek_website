import { NextRequest, NextResponse } from 'next/server';
import { type Currency } from '@/lib/pricing';
import { RetrieverClient } from '@/lib/rag-client';
import { checkRateLimit, rateLimitResponse } from '@/lib/rateLimit';
import { getIpHash } from '@/lib/security';
import { logScopingChatTrace } from '@/lib/scopingObservability';
import {
  buildCanonicalBlueprintBlock,
  classifyPromptForBlueprint,
  featureCatalog,
  type ScopeContext,
} from '@/lib/scoping/blueprintCatalog';
import {
  buildFallbackResponseText,
  SCOPING_ARCHITECT_SYSTEM_PROMPT,
} from '@/lib/scoping/promptBuilder';
import {
  createBlueprintTagFilter,
  createTextStream,
  createUpstreamSseReader,
} from '@/lib/scoping/sseBridge';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SCOPING_CONNECT_TIMEOUT_MS = 25_000;
const SCOPING_STREAM_IDLE_TIMEOUT_MS = 25_000;

export async function POST(req: NextRequest) {
  const startTime = performance.now();

  // 1. Sliding window rate limit check (25 requests / min)
  const rateLimit = await checkRateLimit(req, {
    scope: 'scoping_chat',
    limit: 25,
    windowSeconds: 60,
  });

  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const prompt = (body.message || body.query || '').trim();
    const history = Array.isArray(body.history) ? body.history : [];
    const sessionId = (body.sessionId || '').trim() || null;
    const scopeCode = (body.scopeCode || (body.currentScope as ScopeContext)?.scopeCode || '').trim();
    const turnIndex = typeof body.turnIndex === 'number' ? body.turnIndex : (history.length ? Math.floor(history.length / 2) + 1 : 1);
    const currency: Currency = body.currency === 'USD' ? 'USD' : 'INR';
    const currentScope = (body.currentScope as ScopeContext) || null;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Message is required for scoping chat.' },
        { status: 400 }
      );
    }

    const visitorCountry = req.headers.get('x-vercel-ip-country') || 'Unknown';
    const rawIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const ipHash = await getIpHash(rawIp);
    const userAgent = req.headers.get('user-agent') || '';

    // Extract preliminary intent & reasoning for deep observability
    const blueprintRec = classifyPromptForBlueprint(prompt);

    const tenantId = process.env.RETRIEVER_SCOPING_TENANT_ID || '';
    const apiKey = process.env.RETRIEVER_SCOPING_API_KEY || '';
    const apiUrl = (
      process.env.RETRIEVER_API_URL || 'https://rag.prateeq.in'
    ).replace(/\/$/, '');
    const userId = process.env.RETRIEVER_SCOPING_USER_ID || '';

    // Check if the user query is an out-of-scope physical labor request
    const pLower = prompt.toLowerCase();
    const isPhysicalOutOfScope =
      (pLower.includes('wall') ||
        pLower.includes('living room') ||
        pLower.includes('bedroom') ||
        pLower.includes('house') ||
        pLower.includes('physical') ||
        pLower.includes('plumb') ||
        pLower.includes('car')) &&
      (pLower.includes('paint') ||
        pLower.includes('clean') ||
        pLower.includes('repair') ||
        pLower.includes('fix'));

    if (isPhysicalOutOfScope) {
      const escrowText = `Your unique request has been logged directly into Prateek Sharma's executive escrow queue. Because this requires bespoke personal handling outside our automated software scoping modules, Prateek will review your inquiry personally. To receive a personal response and evaluation from Prateek, please enter your email or sign up below.`;
      const fallbackSessionId =
        sessionId || `scoping_escrow_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const escrowStream = createTextStream(escrowText, 10, req.signal);

      const elapsed = Math.round(performance.now() - startTime);
      logScopingChatTrace({
        sessionId: fallbackSessionId,
        scopeCode,
        turnIndex,
        userQuery: prompt,
        assistantResponse: escrowText,
        agentIntent: 'escrow_escalation',
        agentReasoning: 'Physical or non-software task routed to executive escrow review queue.',
        modelUsed: 'escrow-escalation-router',
        latencyMs: elapsed,
        isFallback: false,
        currency,
        currentEngine: currentScope?.baseEngineId || 'saas',
        selectedFeatures: currentScope?.selectedFeatures || [],
        quoteINR: currentScope?.totalINR || 0,
        quoteUSD: currentScope?.totalUSD || 0,
        visitorIpHash: ipHash,
        visitorCountry,
        visitorUserAgent: userAgent,
      }).catch((err) => console.warn('Escrow trace logging warning:', err));

      return new Response(escrowStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Session-ID': fallbackSessionId,
          'X-Fallback-Mode': 'false',
          'Set-Cookie': `prateeq_chat_session_id=${encodeURIComponent(fallbackSessionId)}; Path=/; Max-Age=2592000; SameSite=Lax`,
        },
      });
    }

    const cookieSessionId = req.cookies.get('prateeq_chat_session_id')?.value;
    const resolvedSessionId =
      sessionId ||
      cookieSessionId ||
      `scoping_session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    let promptWithContext = prompt;
    if (currentScope?.selectedFeatures?.length) {
      const activeLabels = currentScope.selectedFeatures
        .map((id) => featureCatalog.find((f) => f.id === id)?.label || id)
        .join(', ');
      promptWithContext = `[Client Step ${currentScope.currentStep || 2} Context: Engine=${currentScope.baseEngineId}, Modules=${activeLabels}, Total=${currency === 'USD' ? `$${currentScope.totalUSD}` : `₹${currentScope.totalINR}`}]\n\nUser Question: ${prompt}`;
    }

    // 2. Compute Blueprint Recommendation Action Payload
    const isNewBuildVision =
      pLower.includes('launch') ||
      pLower.includes('build') ||
      pLower.includes('create') ||
      pLower.includes('store') ||
      pLower.includes('shop') ||
      pLower.includes('ecommerce') ||
      pLower.includes('saas') ||
      pLower.includes('platform') ||
      pLower.includes('calling bot') ||
      pLower.includes('voice agent') ||
      pLower.includes('vault') ||
      pLower.includes('streamer') ||
      pLower.includes('podcast');

    const hasExistingScope =
      Boolean(currentScope?.selectedFeatures?.length) &&
      !isNewBuildVision &&
      (pLower.includes('budget') ||
        pLower.includes('cut') ||
        pLower.includes('timeline') ||
        pLower.includes('cheaper') ||
        pLower.includes('my scope') ||
        pLower.includes('active scope') ||
        pLower.includes('these exact'));

    const targetEngineId = hasExistingScope && currentScope?.baseEngineId ? currentScope.baseEngineId : blueprintRec.baseEngineId;
    const targetFeatures = hasExistingScope && currentScope?.selectedFeatures?.length
      ? currentScope.selectedFeatures
      : blueprintRec.featureIds;

    // 3. Attempt true token streaming from Retriever's cognitive engine.
    let usedRetriever = false;
    let upstreamReader: ReturnType<typeof createUpstreamSseReader> | null = null;
    let firstText = '';

    if (tenantId && apiKey && userId) {
      const client = new RetrieverClient({
        apiUrl,
        tenantId,
        apiKey,
        userId,
      });

      const messages = [
        { role: 'system', content: SCOPING_ARCHITECT_SYSTEM_PROMPT },
        ...history.map((m: { role: string; content: string }) => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: String(m.content || ''),
        })),
        { role: 'user', content: promptWithContext },
      ];

      const abortCtrl = new AbortController();
      const connectTimer = setTimeout(() => {
        abortCtrl.abort(
          new Error(`Retriever completions timeout (${SCOPING_CONNECT_TIMEOUT_MS / 1000}s limit)`)
        );
      }, SCOPING_CONNECT_TIMEOUT_MS);
      const onReqAbort = () => abortCtrl.abort();
      if (req.signal) {
        req.signal.addEventListener('abort', onReqAbort, { once: true });
      }

      try {
        const upstream = await client.completionsStream(messages, {
          enable_reranking: false,
          temperature: 0.4,
          max_tokens: 800,
          top_k: 3,
          enable_query_rewriting: false,
          enable_self_query: false,
          enable_colbert_rerank: false,
          signal: abortCtrl.signal,
        });

        const reader = createUpstreamSseReader(
          upstream,
          SCOPING_STREAM_IDLE_TIMEOUT_MS
        );
        upstreamReader = reader;

        // Wait for the first token before committing to a 200 streaming
        // response, so a dead upstream can still use the deterministic local
        // blueprint fallback with truthful headers.
        while (true) {
          const event = await reader.next();
          if (event.error) throw new Error(event.error);
          if (event.done) break;
          if (event.text) {
            firstText = event.text;
            break;
          }
        }

        usedRetriever = firstText.length > 0;
        if (!usedRetriever) {
          reader.cancel();
          upstreamReader = null;
        }
      } catch (err) {
        console.warn(
          'Retriever stream failed or timed out; falling back to local blueprint engine:',
          err
        );
        upstreamReader?.cancel();
        upstreamReader = null;
      } finally {
        clearTimeout(connectTimer);
        if (req.signal) {
          req.signal.removeEventListener('abort', onReqAbort);
        }
      }
    }

    const logTrace = (
      assistantResponse: string,
      latencyMs: number,
      trace: { isFallback: boolean; modelUsed: string }
    ) => {
      logScopingChatTrace({
        sessionId: resolvedSessionId,
        scopeCode,
        turnIndex,
        userQuery: prompt,
        assistantResponse,
        agentIntent: blueprintRec.archetypeId,
        agentReasoning: `${blueprintRec.title}: ${blueprintRec.summary}`,
        modelUsed: trace.modelUsed,
        latencyMs,
        isFallback: trace.isFallback,
        currency,
        currentEngine: targetEngineId,
        selectedFeatures: targetFeatures,
        quoteINR: currentScope?.totalINR || 0,
        quoteUSD: currentScope?.totalUSD || 0,
        visitorIpHash: ipHash,
        visitorCountry,
        visitorUserAgent: userAgent,
      }).catch((err) => console.warn('Trace logging warning:', err));
    };

    // 4. Graceful Fallback Mode: Local Heuristic Rule-Based Blueprint Engine
    if (!usedRetriever || !upstreamReader) {
      const fallbackText = buildFallbackResponseText(prompt, currency, currentScope);
      const fallbackStream = createTextStream(fallbackText, 6, req.signal);

      logTrace(fallbackText, Math.round(performance.now() - startTime), {
        isFallback: true,
        modelUsed: 'heuristic-rule-engine',
      });

      return new Response(fallbackStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Session-ID': resolvedSessionId,
          'X-Fallback-Mode': 'true',
          'X-Accel-Buffering': 'no',
          'Set-Cookie': `prateeq_chat_session_id=${encodeURIComponent(resolvedSessionId)}; Path=/; Max-Age=2592000; SameSite=Lax`,
        },
      });
    }

    // 5. Proxy real Retriever tokens, stripping any upstream blueprint block,
    // then append the canonical catalog-strict card.
    const reader = upstreamReader;
    const tagFilter = createBlueprintTagFilter();
    let proseText = '';
    let finalText = '';
    let servedFallback = false;
    let streamClosed = false;

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const encoder = new TextEncoder();
        const emit = (text: string) => {
          if (!text || streamClosed) return;
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ delta: text })}\n\n`));
        };

        const onAbort = () => {
          if (streamClosed) return;
          streamClosed = true;
          reader.cancel();
          try {
            controller.close();
          } catch {
            // already closed
          }
        };

        if (req.signal) {
          if (req.signal.aborted) {
            onAbort();
            return;
          }
          req.signal.addEventListener('abort', onAbort, { once: true });
        }

        try {
          const firstFiltered = tagFilter.push(firstText);
          if (firstFiltered) {
            proseText += firstFiltered;
            emit(firstFiltered);
          }

          while (!streamClosed) {
            const event = await reader.next();
            if (event.error) throw new Error(event.error);
            if (event.done) break;
            if (event.text) {
              const filtered = tagFilter.push(event.text);
              if (filtered) {
                proseText += filtered;
                emit(filtered);
              }
            }
          }

          const tail = tagFilter.flush();
          if (tail) {
            proseText += tail;
            emit(tail);
          }

          const blueprintBlock = buildCanonicalBlueprintBlock(
            proseText,
            targetEngineId,
            targetFeatures,
            blueprintRec,
            currency,
            hasExistingScope
          );
          if (blueprintBlock) emit(blueprintBlock);
          finalText = proseText + blueprintBlock;

          if (!streamClosed) {
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
            streamClosed = true;
          }
        } catch (err) {
          console.warn('Retriever token stream interrupted:', err);

          if (!proseText.trim()) {
            const fallbackText = buildFallbackResponseText(prompt, currency, currentScope);
            servedFallback = true;
            finalText = fallbackText;
            emit(fallbackText);
          } else {
            const interruption =
              '\n\nThe architecture stream was interrupted. Please retry.';
            const blueprintBlock = buildCanonicalBlueprintBlock(
              proseText,
              targetEngineId,
              targetFeatures,
              blueprintRec,
              currency,
              hasExistingScope
            );
            finalText = proseText + interruption + blueprintBlock;
            emit(interruption);
            if (blueprintBlock) emit(blueprintBlock);
          }

          if (!streamClosed) {
            try {
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            } catch {
              // already closed
            }
            streamClosed = true;
          }
        } finally {
          if (req.signal) {
            req.signal.removeEventListener('abort', onAbort);
          }
          logTrace(finalText || proseText, Math.round(performance.now() - startTime), {
            isFallback: servedFallback,
            modelUsed: servedFallback ? 'heuristic-rule-engine' : 'retriever-vps',
          });
        }
      },
      cancel() {
        streamClosed = true;
        reader.cancel();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Session-ID': resolvedSessionId,
        'X-Fallback-Mode': usedRetriever ? 'false' : 'true',
        'X-Accel-Buffering': 'no',
        'Set-Cookie': `prateeq_chat_session_id=${encodeURIComponent(resolvedSessionId)}; Path=/; Max-Age=2592000; SameSite=Lax`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown scoping chat error';
    console.error('Fatal scoping chat error:', error);
    return NextResponse.json({ error: message, success: false }, { status: 500 });
  }
}
