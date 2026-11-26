import type {
  TenantPromptResponse,
} from "../rag-types";
import { combineAbortSignals, fetchWithRetry, generateTraceparent, REQUEST_TIMEOUT, requireUserId, type ChatCompletionOptions, type RagRequestContext } from "./http";

export async function createSession(ctx: RagRequestContext, signal?: AbortSignal) {
  const validUserId = requireUserId(ctx.config.userId);
  return ctx.request<{ sessionId: string; createdAt: string }>(
    `/v1/tenants/${ctx.config.tenantId}/chat/sessions`,
    { method: "POST", body: JSON.stringify({ user_id: validUserId }), signal },
  );
}


export async function chat(ctx: RagRequestContext, sessionId: string, message: string, signal?: AbortSignal, lastEventId?: string): Promise<ReadableStream<Uint8Array> | null> {
  const url = `${ctx.config.apiUrl.replace(/\/$/, "")}/v1/tenants/${ctx.config.tenantId}/chat/sessions/${sessionId}/messages`;
  const validUserId = requireUserId(ctx.config.userId);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${ctx.config.apiKey}`,
    "X-User-ID": validUserId,
    Accept: "text/event-stream",
  };
  if (ctx.config.llmKey) headers["X-LLM-Key"] = ctx.config.llmKey;
  if (ctx.config.llmProvider) headers["X-LLM-Provider"] = ctx.config.llmProvider;
  if (lastEventId) headers["Last-Event-ID"] = lastEventId;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  const combinedSignal = signal
    ? combineAbortSignals(signal, controller.signal)
    : controller.signal;

  try {
    // A chat POST persists a message upstream; retrying on 5xx can duplicate
    // the user turn and generate a second answer, so send it exactly once.
    const res = await fetchWithRetry(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query: message, stream: true }),
      signal: combinedSignal,
    }, 0);
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    return res.body;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}


export async function chatComplete(ctx: RagRequestContext, sessionId: string, message: string, signal?: AbortSignal): Promise<{ text: string; citations: unknown[] }> {
  const stream = await chat(ctx, sessionId, message, signal);
  if (!stream) {
    return { text: '', citations: [] };
  }
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let citations: unknown[] = [];
  let buffer = '';
  let streamError = '';

  const handleFrame = (rawLine: string) => {
    const line = rawLine.replace(/\r$/, '');
    if (!line.startsWith('data:')) return;
    const jsonStr = line.slice(5).trim();
    if (!jsonStr || jsonStr === '[DONE]') return;

    let data: Record<string, unknown>;
    try {
      data = JSON.parse(jsonStr) as Record<string, unknown>;
    } catch {
      return;
    }

    if (data.event === 'error') {
      streamError =
        typeof data.message === 'string' && data.message.trim()
          ? data.message
          : 'Retriever stream failed.';
      return;
    }
    if (data.event === 'token' && typeof data.delta === 'string') {
      text += data.delta;
      return;
    }
    if (data.event === 'done' && Array.isArray(data.citations)) {
      citations = data.citations;
      return;
    }

    // OpenAI-compatible frames from the completions endpoint.
    const choices = data.choices as Array<{ delta?: { content?: unknown } }> | undefined;
    const delta = choices?.[0]?.delta?.content;
    if (typeof delta === 'string') text += delta;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) handleFrame(line);
  }

  buffer += decoder.decode();
  if (buffer.trim()) handleFrame(buffer);

  if (streamError) {
    throw new Error(streamError);
  }

  // Some guardrail paths return a plain JSON body instead of SSE.
  if (!text.trim() && buffer.trim() && !buffer.trim().startsWith('data:')) {
    try {
      const payload = JSON.parse(buffer.trim()) as {
        content?: unknown;
        choices?: Array<{ message?: { content?: unknown }; delta?: { content?: unknown } }>;
      };
      const plain =
        typeof payload.content === 'string'
          ? payload.content
          : payload.choices?.[0]?.message?.content ??
            payload.choices?.[0]?.delta?.content;
      if (typeof plain === 'string') text = plain;
    } catch {}
  }

  return { text: text.trim(), citations };
}


export async function completions(ctx: RagRequestContext, 
  messages: { role: string; content: string }[],
  options?: ChatCompletionOptions
): Promise<{ content: string; citations?: unknown[]; id?: string; model?: string }> {
  const url = `${ctx.config.apiUrl.replace(/\/$/, "")}/v1/tenants/${ctx.config.tenantId}/chat/completions`;
  const validUserId = requireUserId(ctx.config.userId);
  const { traceparent, traceId } = generateTraceparent();
  ctx.setTraceId(traceId);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${ctx.config.apiKey}`,
    "X-User-ID": validUserId,
    "X-Tenant-ID": ctx.config.tenantId,
    "traceparent": traceparent,
  };
  if (ctx.config.llmKey) headers["X-LLM-Key"] = ctx.config.llmKey;
  if (ctx.config.llmProvider) headers["X-LLM-Provider"] = ctx.config.llmProvider;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(buildCompletionsPayload(messages, options, false)),
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`Retriever completions error [${res.status}]: ${await res.text()}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || data?.content || '';
  return {
    content,
    citations: data?.citations || [],
    id: data?.id,
    model: data?.model,
  };
}

/**
 * Open a true token stream from Retriever's OpenAI-compatible completions
 * endpoint. The caller owns the abort signal and must consume/cancel the body.
 */

export async function completionsStream(ctx: RagRequestContext, 
  messages: { role: string; content: string }[],
  options?: ChatCompletionOptions
): Promise<ReadableStream<Uint8Array>> {
  const url = `${ctx.config.apiUrl.replace(/\/$/, "")}/v1/tenants/${ctx.config.tenantId}/chat/completions`;
  const validUserId = requireUserId(ctx.config.userId);
  const { traceparent, traceId } = generateTraceparent();
  ctx.setTraceId(traceId);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${ctx.config.apiKey}`,
    "X-User-ID": validUserId,
    "X-Tenant-ID": ctx.config.tenantId,
    "traceparent": traceparent,
    Accept: "text/event-stream",
  };
  if (ctx.config.llmKey) headers["X-LLM-Key"] = ctx.config.llmKey;
  if (ctx.config.llmProvider) headers["X-LLM-Provider"] = ctx.config.llmProvider;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(buildCompletionsPayload(messages, options, true)),
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`Retriever completions stream error [${res.status}]: ${await res.text()}`);
  }
  if (!res.body) {
    throw new Error("Retriever completions stream returned an empty body.");
  }

  return res.body;
}

function buildCompletionsPayload(
  messages: { role: string; content: string }[],
  options: ChatCompletionOptions | undefined,
  stream: boolean
) {
  return {
    messages,
    stream,
    use_repl: false,
    temperature: options?.temperature ?? 0.4,
    max_tokens: options?.max_tokens ?? 2048,
    enable_reranking: options?.enable_reranking ?? false,
    ...(options?.top_k !== undefined ? { top_k: options.top_k } : {}),
    ...(options?.enable_query_rewriting !== undefined
      ? { enable_query_rewriting: options.enable_query_rewriting }
      : {}),
    ...(options?.enable_self_query !== undefined
      ? { enable_self_query: options.enable_self_query }
      : {}),
    ...(options?.enable_colbert_rerank !== undefined
      ? { enable_colbert_rerank: options.enable_colbert_rerank }
      : {}),
  };
}


export async function submitFeedback(ctx: RagRequestContext, sessionId: string, messageId: string, rating: "up" | "down", feedbackText?: string) {
  const numericRating = rating === "up" ? 1 : -1;
  return ctx.request(
    `/v1/tenants/${ctx.config.tenantId}/chat/sessions/${sessionId}/messages/${messageId}/feedback`,
    {
      method: "POST",
      body: JSON.stringify({ rating: numericRating, feedback_text: feedbackText || "" }),
    }
  );
}


export async function classifyIntent(ctx: RagRequestContext, 
  prompt: string,
  model?: string
): Promise<import("../rag-types").IntentClassificationResponse> {
  return ctx.request<import("../rag-types").IntentClassificationResponse>(
    `/v1/tenants/${ctx.config.tenantId}/intent/classify`,
    {
      method: "POST",
      body: JSON.stringify({ prompt, ...(model ? { model } : {}) }),
    }
  );
}

// ── Milestone 91: LangGraph Cyclic Agentic Workflows & HITL State Engine ────


export async function getMemoryStats(ctx: RagRequestContext, 
  signal?: AbortSignal
): Promise<import("../rag-types").MemoryStats> {
  return ctx.request<import("../rag-types").MemoryStats>(
    `/v1/tenants/${ctx.config.tenantId}/memory/stats`,
    { signal }
  );
}


export async function listMemoryNodes(ctx: RagRequestContext, 
  params?: { type?: import("../rag-types").MemoryType; query?: string; limit?: number },
  signal?: AbortSignal
): Promise<import("../rag-types").MemoryNode[]> {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set("type", params.type);
  if (params?.query) searchParams.set("query", params.query);
  if (params?.limit) searchParams.set("limit", params.limit.toString());
  const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
  return ctx.request<import("../rag-types").MemoryNode[]>(
    `/v1/tenants/${ctx.config.tenantId}/memory/nodes${queryStr}`,
    { signal }
  );
}


export async function testMemoryGuidance(ctx: RagRequestContext, 
  query: string,
  limit: number = 3,
  minSimilarity: number = 0.65,
  signal?: AbortSignal
): Promise<import("../rag-types").DistilledGuidance> {
  return ctx.request<import("../rag-types").DistilledGuidance>(
    `/v1/tenants/${ctx.config.tenantId}/memory/guidance`,
    {
      method: "POST",
      body: JSON.stringify({
        query,
        limit,
        min_similarity: minSimilarity,
      }),
      signal,
    }
  );
}


export async function consolidateMemoryTrace(ctx: RagRequestContext, 
  payload: Omit<import("../rag-types").ConsolidationRequestPayload, "tenant_id">,
  signal?: AbortSignal
): Promise<import("../rag-types").ConsolidationResponse> {
  return ctx.request<import("../rag-types").ConsolidationResponse>(
    `/v1/tenants/${ctx.config.tenantId}/memory/consolidate`,
    {
      method: "POST",
      body: JSON.stringify({
        tenant_id: ctx.config.tenantId,
        ...payload,
      }),
      signal,
    }
  );
}


export async function deleteMemoryNode(ctx: RagRequestContext, 
  nodeId: string,
  signal?: AbortSignal
): Promise<{ deleted: boolean; node_id: string }> {
  return ctx.request<{ deleted: boolean; node_id: string }>(
    `/v1/tenants/${ctx.config.tenantId}/memory/nodes/${nodeId}`,
    {
      method: "DELETE",
      signal,
    }
  );
}


export async function pruneMemories(ctx: RagRequestContext, 
  minRetention: number = 0.15,
  signal?: AbortSignal
): Promise<{ pruned_count: number; min_retention: number }> {
  return ctx.request<{ pruned_count: number; min_retention: number }>(
    `/v1/tenants/${ctx.config.tenantId}/memory/prune`,
    {
      method: "POST",
      body: JSON.stringify({ min_retention: minRetention }),
      signal,
    }
  );
}

// ── Milestone 93: Enterprise LLM Gateway & Smart Router ────


export async function getSystemPrompt(ctx: RagRequestContext): Promise<TenantPromptResponse> {
  return ctx.request<TenantPromptResponse>(
    `/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/prompts/default`
  );
}


export async function updateSystemPrompt(ctx: RagRequestContext, content: string): Promise<TenantPromptResponse> {
  return ctx.request<TenantPromptResponse>(
    `/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/prompts/default`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }
  );
}

