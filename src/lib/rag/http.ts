export interface RetrieverConfig {
  apiUrl: string;
  tenantId: string;
  apiKey: string;
  userId: string;
  llmKey?: string;
  llmProvider?: string;
}

export interface ChatCompletionOptions {
  temperature?: number;
  max_tokens?: number;
  enable_reranking?: boolean;
  top_k?: number;
  enable_query_rewriting?: boolean;
  enable_self_query?: boolean;
  enable_colbert_rerank?: boolean;
  signal?: AbortSignal;
}

export const REQUEST_TIMEOUT = 90_000;
const MAX_RETRIES = 2;

export async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && res.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      return res;
    } catch (err) {
      if ((err as Error)?.name === 'AbortError' || options.signal?.aborted) {
        throw err;
      }
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Request failed after retries");
}

const UUID_REGEX = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
export function requireUserId(userId?: string): string {
  if (userId && UUID_REGEX.test(userId)) return userId;
  throw new Error("A valid authenticated user ID is required for RAG requests.");
}

export function generateTraceparent(): { traceparent: string; traceId: string } {
  const hex = (len: number) =>
    Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  const traceId = hex(32);
  const spanId = hex(16);
  return { traceparent: `00-${traceId}-${spanId}-01`, traceId };
}

export interface RagRequestContext {
  config: RetrieverConfig;
  request<T>(path: string, options?: RequestInit): Promise<T>;
  setTraceId(traceId: string | null): void;
}

export function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener("abort", () => controller.abort(signal.reason), { once: true });
  }
  return controller.signal;
}

