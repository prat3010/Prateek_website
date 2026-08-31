export interface RetrieverConfig {
  apiUrl: string;
  tenantId: string;
  apiKey: string;
  userId: string;
  llmKey?: string;
  llmProvider?: string;
}

const REQUEST_TIMEOUT = 90_000;
const MAX_RETRIES = 2;

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok && res.status >= 500 && attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
        continue;
      }
      return res;
    } catch (err) {
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
function requireUserId(userId?: string): string {
  if (userId && UUID_REGEX.test(userId)) return userId;
  throw new Error("A valid authenticated user ID is required for RAG requests.");
}

function generateTraceparent(): { traceparent: string; traceId: string } {
  const hex = (len: number) =>
    Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  const traceId = hex(32);
  const spanId = hex(16);
  return { traceparent: `00-${traceId}-${spanId}-01`, traceId };
}

export class RetrieverClient {
  private config: RetrieverConfig;
  public lastTraceId: string | null = null;

  constructor(config: RetrieverConfig) {
    this.config = config;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.apiUrl.replace(/\/$/, "")}${path}`;
    const validUserId = requireUserId(this.config.userId);
    const { traceparent, traceId } = generateTraceparent();
    this.lastTraceId = traceId;

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.config.apiKey}`,
      "X-User-ID": validUserId,
      "X-Tenant-ID": this.config.tenantId,
      "traceparent": traceparent,
    };
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const res = await fetchWithRetry(url, {
        ...options,
        headers: { ...headers, ...(options.headers as Record<string, string>) },
        signal: options.signal ?? controller.signal,
      });
      clearTimeout(timeoutId);
      const respTraceId = res.headers.get("x-trace-id") || res.headers.get("X-Trace-Id");
      if (respTraceId) {
        this.lastTraceId = respTraceId;
      }
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }


  async search(query: string, options?: { limit?: number; enableQueryRewriting?: boolean; enableHybrid?: boolean; strategy?: string }) {
    const limit = options?.limit ?? 5;
    return this.request<import("./rag-types").SearchResponse>(`/v1/tenants/${this.config.tenantId}/search`, {
      method: "POST",
      body: JSON.stringify({
        query,
        limit,
        top_k: limit,
        enable_query_rewriting: options?.enableQueryRewriting ?? true,
        enable_hybrid: options?.enableHybrid ?? true,
        ...(options?.strategy ? { strategy: options.strategy } : {}),
      }),
    });
  }

  async listDocuments() {
    return this.request<import("./rag-types").DocumentMeta[]>(`/v1/tenants/${this.config.tenantId}/documents`);
  }

  async createSession() {
    const validUserId = requireUserId(this.config.userId);
    return this.request<{ sessionId: string; createdAt: string }>(
      `/v1/tenants/${this.config.tenantId}/chat/sessions`,
      { method: "POST", body: JSON.stringify({ user_id: validUserId }) },
    );
  }

  async chat(sessionId: string, message: string, signal?: AbortSignal): Promise<ReadableStream<Uint8Array> | null> {
    const url = `${this.config.apiUrl.replace(/\/$/, "")}/v1/tenants/${this.config.tenantId}/chat/sessions/${sessionId}/messages`;
    const validUserId = requireUserId(this.config.userId);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.config.apiKey}`,
      "X-User-ID": validUserId,
      Accept: "text/event-stream",
    };
    if (this.config.llmKey) headers["X-LLM-Key"] = this.config.llmKey;
    if (this.config.llmProvider) headers["X-LLM-Provider"] = this.config.llmProvider;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    const combinedSignal = signal
      ? combineAbortSignals(signal, controller.signal)
      : controller.signal;

    try {
      const res = await fetchWithRetry(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ query: message, stream: true }),
        signal: combinedSignal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
      return res.body;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  async uploadDocument(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return this.request<{ documentId: string; status: string }>(`/v1/tenants/${this.config.tenantId}/documents`, {
      method: "POST",
      body: formData,
    });
  }

  async extractDocument<T = Record<string, unknown>>(
    documentId: string,
    jsonSchema: Record<string, unknown>,
    model?: string
  ): Promise<{ data: T; provider: string; model: string; inputTokens: number; outputTokens: number }> {
    return this.request<{ data: T; provider: string; model: string; inputTokens: number; outputTokens: number }>(
      `/v1/tenants/${this.config.tenantId}/documents/${documentId}/extract`,
      {
        method: "POST",
        body: JSON.stringify({ json_schema: jsonSchema, model }),
      }
    );
  }

  async deleteDocument(documentId: string) {
    return this.request(`/v1/tenants/${this.config.tenantId}/documents/${documentId}`, {
      method: "DELETE",
    });
  }

  async submitFeedback(sessionId: string, messageId: string, rating: "up" | "down", feedbackText?: string) {
    const numericRating = rating === "up" ? 1 : -1;
    return this.request(
      `/v1/tenants/${this.config.tenantId}/chat/sessions/${sessionId}/messages/${messageId}/feedback`,
      {
        method: "POST",
        body: JSON.stringify({ rating: numericRating, feedback_text: feedbackText || "" }),
      }
    );
  }

  async getDownloadUrl(documentId: string): Promise<{ downloadUrl: string }> {
    return this.request<{ downloadUrl: string }>(
      `/v1/tenants/${this.config.tenantId}/documents/${documentId}/download-url`
    );
  }

  async listTenants(): Promise<{ tenantId: string; name: string; status: string }[]> {
    const res = await this.request<unknown>("/v1/admin/tenants");
    if (Array.isArray(res)) return res as { tenantId: string; name: string; status: string }[];
    if (res && typeof res === "object" && "items" in res && Array.isArray((res as { items: unknown[] }).items)) {
      return (res as { items: { tenantId: string; name: string; status: string }[] }).items;
    }
    return [];
  }

  async getGraphCapabilities(): Promise<GraphCapabilitiesResponse> {
    return this.request<GraphCapabilitiesResponse>(
      `/v1/admin/tenants/${this.config.tenantId}/graph/capabilities`
    );
  }

  async switchGraphEngine(engine: "postgres" | "neo4j") {
    return this.request(
      `/v1/admin/tenants/${this.config.tenantId}/graph/engine`,
      {
        method: "POST",
        body: JSON.stringify({ engine }),
      }
    );
  }

  async getGraphSummary(): Promise<GraphSummaryResponse> {
    return this.request<GraphSummaryResponse>(
      `/v1/admin/tenants/${this.config.tenantId}/graph`
    );
  }

  async queryGraph(entity: string, maxHops = 2): Promise<GraphQueryResponse> {
    return this.request<GraphQueryResponse>(
      `/v1/admin/tenants/${this.config.tenantId}/graph/query`,
      {
        method: "POST",
        body: JSON.stringify({ entity, max_hops: maxHops }),
      }
    );
  }

  async deleteTriple(tripleId: string) {
    return this.request(
      `/v1/admin/tenants/${this.config.tenantId}/graph/triples/${tripleId}`,
      {
        method: "DELETE",
      }
    );
  }

  async compressContext(text: string, compressionRatio = 0.5): Promise<import("./rag-types").CompressionResponse> {
    return this.request<import("./rag-types").CompressionResponse>(
      `/v1/tenants/${this.config.tenantId}/context/compress`,
      {
        method: "POST",
        body: JSON.stringify({ text, target_ratio: compressionRatio }),
      }
    );
  }

  async generateConsensus(
    query: string,
    options?: { generatorProvider?: string; criticProvider?: string }
  ): Promise<import("./rag-types").ConsensusResponse> {
    return this.request<import("./rag-types").ConsensusResponse>(
      `/v1/tenants/${this.config.tenantId}/consensus/generate`,
      {
        method: "POST",
        body: JSON.stringify({
          query,
          generator_provider: options?.generatorProvider,
          critic_provider: options?.criticProvider,
        }),
      }
    );
  }

  async executeRlmSubroutine(
    query: string,
    maxSteps = 3
  ): Promise<import("./rag-types").RlmExecutionResponse> {
    return this.request<import("./rag-types").RlmExecutionResponse>(
      `/v1/tenants/${this.config.tenantId}/rlm/analyze`,
      {
        method: "POST",
        body: JSON.stringify({
          tenant_id: this.config.tenantId,
          prompt: query,
          max_depth: maxSteps,
        }),
      }
    );
  }

  async getOnlineEvaluationSummary(): Promise<import("./rag-types").OnlineEvaluationSummaryResponse> {
    return this.request<import("./rag-types").OnlineEvaluationSummaryResponse>(
      `/v1/admin/tenants/${this.config.tenantId}/evaluation/online/summary`
    );
  }
}

export interface GraphCapabilitiesResponse {
  machine_profile: string;
  supported_engines: string[];
  active_engine: string;
  neo4j_status: string;
  message: string;
}

export interface GraphSummaryResponse {
  tenant_id: string;
  total_triples: number;
  unique_entities: number;
  storage_engine: string;
  neo4j_status?: string;
}

export interface EntityTripleItem {
  triple_id?: string;
  subject: string;
  predicate: string;
  object: string;
  chunk_id?: string;
  confidence?: number;
}

export interface GraphQueryResponse {
  root_entity: string;
  max_hops: number;
  triples: EntityTripleItem[];
  connected_entities: string[];
}

function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
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

export interface ParseIntentRequest {
  prompt: string;
  currency?: 'INR' | 'USD';
  currentContext?: {
    existingEngineId?: string;
    existingFeatureIds?: string[];
  };
}

export interface ScopingTelemetry {
  latencyMs: number;
  semanticCacheHit: boolean;
  tenantId: string;
  modelUsed?: string;
}

export interface ParseIntentResponse {
  success: boolean;
  archetypeId: string;
  baseEngineId: string;
  featureIds: string[];
  brandAssetId: string;
  maintenancePlanId: string;
  suggestedTimeline: string;
  confidenceScore: number;
  summaryRationale: string;
  retrieverEngineRecommended: boolean;
  telemetry: ScopingTelemetry;
  unrecognizedRequirements?: string[];
}

