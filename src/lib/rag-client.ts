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

  get tenantId(): string {
    return this.config.tenantId;
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


  async search(query: string, options?: { limit?: number; enableQueryRewriting?: boolean; enableHybrid?: boolean; strategy?: string; hybridAlpha?: number; enableLoraAdapter?: boolean; rerankerEngine?: "cohere" | "colbert" | "none"; enableColbertRerank?: boolean }) {
    const limit = options?.limit ?? 5;
    return this.request<import("./rag-types").SearchResponse>(`/v1/tenants/${this.config.tenantId}/search`, {
      method: "POST",
      body: JSON.stringify({
        query,
        limit,
        top_k: limit,
        enable_query_rewriting: options?.enableQueryRewriting ?? true,
        enable_hybrid: options?.enableHybrid ?? true,
        hybridAlpha: options?.hybridAlpha ?? 0.7,
        enableLoraAdapter: options?.enableLoraAdapter ?? false,
        rerankerEngine: options?.rerankerEngine ?? "colbert",
        enableColbertRerank: options?.enableColbertRerank ?? (options?.rerankerEngine === "colbert"),
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

  async chat(sessionId: string, message: string, signal?: AbortSignal, lastEventId?: string): Promise<ReadableStream<Uint8Array> | null> {
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
    if (lastEventId) headers["Last-Event-ID"] = lastEventId;

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
    jsonSchema: Record<string, unknown> | string,
    model?: string
  ): Promise<{ data: T; provider?: string; model?: string; inputTokens?: number; outputTokens?: number }> {
    let schemaObj = jsonSchema;
    if (typeof jsonSchema === "string") {
      try {
        schemaObj = JSON.parse(jsonSchema);
      } catch {
        schemaObj = { schema: jsonSchema };
      }
    }
    return this.request<{ data: T; provider?: string; model?: string; inputTokens?: number; outputTokens?: number }>(
      `/v1/tenants/${this.config.tenantId}/documents/${documentId}/extract`,
      {
        method: "POST",
        body: JSON.stringify({ json_schema: schemaObj, model }),
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
      `/v1/tenants/${this.config.tenantId}/graph`
    );
  }

  async queryGraph(entity: string, maxHops = 2): Promise<GraphQueryResponse> {
    return this.request<GraphQueryResponse>(
      `/v1/tenants/${this.config.tenantId}/graph/query`,
      {
        method: "POST",
        body: JSON.stringify({ entity, max_hops: maxHops }),
      }
    );
  }

  async deleteTriple(tripleId: string) {
    return this.request(
      `/v1/tenants/${this.config.tenantId}/graph/triples/${tripleId}`,
      {
        method: "DELETE",
      }
    );
  }


  async purgeCache(): Promise<{ status: string; purged: boolean; deleted_count?: number }> {
    return this.request<{ status: string; purged: boolean; deleted_count?: number }>(
      `/v1/tenants/${this.config.tenantId}/cache/purge`,
      {
        method: "POST",
      }
    );
  }

  async getCacheStats(): Promise<{ status: string; total_vectors: number }> {
    return this.request<{ status: string; total_vectors: number }>(
      `/v1/tenants/${this.config.tenantId}/cache/stats`,
      {
        method: "GET",
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
          tenant_id: this.config.tenantId,
          prompt: query,
          query,
          generator_provider_name: options?.generatorProvider,
          critic_provider_name: options?.criticProvider,
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
      `/v1/tenants/${this.config.tenantId}/evaluations/summary`
    );
  }

  async computeGroundingDiff(
    answer: string,
    contexts: string[] = []
  ): Promise<import("./rag-types").GroundingDiffResponse> {
    return this.request<import("./rag-types").GroundingDiffResponse>(
      `/v1/tenants/${this.config.tenantId}/evaluations/grounding-diff`,
      {
        method: "POST",
        body: JSON.stringify({ answer, contexts }),
      }
    );
  }


  async listLoraAdapters(): Promise<import("./rag-types").LoraAdapterInfo[]> {
    return this.request<import("./rag-types").LoraAdapterInfo[]>(
      `/v1/admin/tenants/${this.config.tenantId}/lora/adapters`
    );
  }

  async trainLoraAdapter(payload: {
    name?: string;
    domain_tag?: string;
    rank?: number;
    epochs?: number;
    learning_rate?: number;
  }): Promise<import("./rag-types").LoraTrainResponse> {
    return this.request<import("./rag-types").LoraTrainResponse>(
      `/v1/admin/tenants/${this.config.tenantId}/lora/train`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async projectEmbeddings(
    options?: import("./rag-types").EmbeddingProjectionRequest
  ): Promise<import("./rag-types").EmbeddingProjectionResponse> {
    return this.request<import("./rag-types").EmbeddingProjectionResponse>(
      `/v1/tenants/${this.config.tenantId}/embeddings/project`,
      {
        method: "POST",
        body: JSON.stringify(options || {}),
      }
    );
  }

  async classifyIntent(
    prompt: string,
    model?: string
  ): Promise<import("./rag-types").IntentClassificationResponse> {
    return this.request<import("./rag-types").IntentClassificationResponse>(
      `/v1/tenants/${this.config.tenantId}/intent/classify`,
      {
        method: "POST",
        body: JSON.stringify({ prompt, ...(model ? { model } : {}) }),
      }
    );
  }

  // ── Milestone 91: LangGraph Cyclic Agentic Workflows & HITL State Engine ────

  async listAgentTools(): Promise<import("./rag-types").ToolDefinition[]> {
    return this.request<import("./rag-types").ToolDefinition[]>(
      `/v1/tenants/${this.config.tenantId}/agentic/tools`
    );
  }

  async executeAgentWorkflow(
    prompt: string,
    options?: {
      threadId?: string;
      maxSteps?: number;
      allowedTools?: string[];
    }
  ): Promise<import("./rag-types").AgentExecutionResult> {
    return this.request<import("./rag-types").AgentExecutionResult>(
      `/v1/tenants/${this.config.tenantId}/agentic/execute`,
      {
        method: "POST",
        body: JSON.stringify({
          tenant_id: this.config.tenantId,
          prompt,
          thread_id: options?.threadId,
          max_steps: options?.maxSteps ?? 10,
          allowed_tools: options?.allowedTools,
        }),
      }
    );
  }

  async resumeAgentWorkflow(
    threadId: string,
    decision: import("./rag-types").HITLApprovalDecision
  ): Promise<import("./rag-types").AgentExecutionResult> {
    return this.request<import("./rag-types").AgentExecutionResult>(
      `/v1/tenants/${this.config.tenantId}/agentic/threads/${threadId}/resume`,
      {
        method: "POST",
        body: JSON.stringify(decision),
      }
    );
  }

  async getAgentThreadHistory(
    threadId: string
  ): Promise<import("./rag-types").ThreadHistoryResponse> {
    return this.request<import("./rag-types").ThreadHistoryResponse>(
      `/v1/tenants/${this.config.tenantId}/agentic/threads/${threadId}/history`
    );
  }

  async rollbackAgentThread(
    threadId: string,
    checkpointId: string,
    fork = false
  ): Promise<import("./rag-types").ThreadCheckpointItem> {
    return this.request<import("./rag-types").ThreadCheckpointItem>(
      `/v1/tenants/${this.config.tenantId}/agentic/threads/${threadId}/rollback`,
      {
        method: "POST",
        body: JSON.stringify({
          target_checkpoint_id: checkpointId,
          fork,
        }),
      }
    );
  }

  // ── Milestone 92: DSPy Declarative Prompt Compilation & Algorithmic Self-Optimization Pipeline ────

  async compilePrompt(
    payload: import("./rag-types").PromptCompilationRequest
  ): Promise<import("./rag-types").PromptCompilationResult> {
    return this.request<import("./rag-types").PromptCompilationResult>(
      `/v1/tenants/${this.config.tenantId}/prompts/compile`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  }

  async getCompiledPrompts(): Promise<import("./rag-types").CompiledPromptProgram[]> {
    return this.request<import("./rag-types").CompiledPromptProgram[]>(
      `/v1/tenants/${this.config.tenantId}/prompts/compiled`
    );
  }

  async getActiveCompiledPrompt(): Promise<import("./rag-types").CompiledPromptProgram | null> {
    return this.request<import("./rag-types").CompiledPromptProgram | null>(
      `/v1/tenants/${this.config.tenantId}/prompts/compiled/active`
    );
  }

  async activateCompiledPrompt(
    programId: string
  ): Promise<import("./rag-types").CompiledPromptProgram> {
    return this.request<import("./rag-types").CompiledPromptProgram>(
      `/v1/tenants/${this.config.tenantId}/prompts/compiled/${encodeURIComponent(programId)}/activate`,
      {
        method: "POST",
      }
    );
  }

  async deactivateCompiledPrompt(
    programId: string
  ): Promise<import("./rag-types").CompiledPromptProgram> {
    return this.request<import("./rag-types").CompiledPromptProgram>(
      `/v1/tenants/${this.config.tenantId}/prompts/compiled/${encodeURIComponent(programId)}/deactivate`,
      {
        method: "POST",
      }
    );
  }

  async deleteCompiledPrompt(
    programId: string
  ): Promise<{ success: boolean; program_id: string }> {
    return this.request<{ success: boolean; program_id: string }>(
      `/v1/tenants/${this.config.tenantId}/prompts/compiled/${encodeURIComponent(programId)}`,
      {
        method: "DELETE",
      }
    );
  }

  // ── Milestone 93: Enterprise LLM Gateway & Smart Router ────

  async getGatewayModels(): Promise<import("./rag-types").GatewayModelInfo[]> {
    return this.request<import("./rag-types").GatewayModelInfo[]>("/v1/gateway/models");
  }

  async probeGateway(): Promise<import("./rag-types").GatewayProbeResult[]> {
    return this.request<import("./rag-types").GatewayProbeResult[]>("/v1/gateway/probe", {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  async getTenantGatewayRoutes(
    tenantId?: string
  ): Promise<import("./rag-types").TenantGatewayRoutesResponse> {
    const tid = tenantId || this.config.tenantId;
    return this.request<import("./rag-types").TenantGatewayRoutesResponse>(
      `/v1/tenants/${tid}/gateway/routes`
    );
  }

  async updateTenantGatewayRoutes(
    payload: import("./rag-types").UpdateGatewayRoutesPayload,
    tenantId?: string
  ): Promise<{ status: string; tenant_id: string; gateway_settings: any; budget_settings: any }> {
    const tid = tenantId || this.config.tenantId;
    return this.request<{ status: string; tenant_id: string; gateway_settings: any; budget_settings: any }>(
      `/v1/tenants/${tid}/gateway/routes`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    );
  }

  async getTenantGatewayBudget(
    tenantId?: string
  ): Promise<import("./rag-types").VirtualTenantBudget> {
    const tid = tenantId || this.config.tenantId;
    return this.request<import("./rag-types").VirtualTenantBudget>(
      `/v1/tenants/${tid}/gateway/budget`
    );
  }

  // ── Milestone 94: NeMo Guardrails & Safety API Methods ─────────────────────

  async getGuardrailTemplates(): Promise<Record<string, import("./rag-types").ColangTemplate>> {
    return this.request<Record<string, import("./rag-types").ColangTemplate>>("/v1/guardrails/templates");
  }

  async getGuardrailConfig(tenantId?: string): Promise<import("./rag-types").TenantGuardrailsConfig> {
    const tid = tenantId || this.config.tenantId;
    return this.request<import("./rag-types").TenantGuardrailsConfig>(`/v1/tenants/${tid}/guardrails/config`);
  }

  async updateGuardrailConfig(
    payload: Partial<import("./rag-types").TenantGuardrailsConfig>,
    tenantId?: string
  ): Promise<import("./rag-types").TenantGuardrailsConfig> {
    const tid = tenantId || this.config.tenantId;
    return this.request<import("./rag-types").TenantGuardrailsConfig>(`/v1/tenants/${tid}/guardrails/config`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  }

  async validateGuardrailInput(
    query: string,
    history?: Array<{ role: string; content: string }>,
    tenantId?: string
  ): Promise<import("./rag-types").GuardrailCheckResult> {
    const tid = tenantId || this.config.tenantId;
    return this.request<import("./rag-types").GuardrailCheckResult>(`/v1/tenants/${tid}/guardrails/validate-input`, {
      method: "POST",
      body: JSON.stringify({ query, conversation_history: history }),
    });
  }

  async validateGuardrailOutput(
    query: string,
    generatedResponse: string,
    retrievedContexts: string[] = [],
    tenantId?: string
  ): Promise<import("./rag-types").GuardrailCheckResult> {
    const tid = tenantId || this.config.tenantId;
    return this.request<import("./rag-types").GuardrailCheckResult>(`/v1/tenants/${tid}/guardrails/validate-output`, {
      method: "POST",
      body: JSON.stringify({
        query,
        generated_response: generatedResponse,
        retrieved_contexts: retrievedContexts,
      }),
    });
  }

  async testGuardrailFlow(
    query: string,
    customColang?: string,
    tenantId?: string
  ): Promise<import("./rag-types").GuardrailCheckResult> {
    const tid = tenantId || this.config.tenantId;
    return this.request<import("./rag-types").GuardrailCheckResult>(`/v1/tenants/${tid}/guardrails/test-flow`, {
      method: "POST",
      body: JSON.stringify({ query, custom_colang: customColang }),
    });
  }

  async getGuardrailTelemetry(tenantId?: string): Promise<import("./rag-types").GuardrailTelemetry> {
    const tid = tenantId || this.config.tenantId;
    return this.request<import("./rag-types").GuardrailTelemetry>(`/v1/tenants/${tid}/guardrails/telemetry`);
  }

  // ── Milestone 95: Durable Asynchronous Workflows & Jobs Methods ─────────────

  async listWorkflowBlueprints(tenantId?: string): Promise<import("./rag-types").WorkflowDefinition[]> {
    const tid = tenantId || this.config.tenantId;
    return this.request<import("./rag-types").WorkflowDefinition[]>(`/v1/tenants/${tid}/workflows/blueprints`);
  }

  async startWorkflow(
    workflowName: string,
    inputPayload: Record<string, unknown> = {},
    idempotencyKey?: string | null,
    webhookUrl?: string | null,
    tenantId?: string
  ): Promise<import("./rag-types").WorkflowExecution> {
    const tid = tenantId || this.config.tenantId;
    return this.request<import("./rag-types").WorkflowExecution>(`/v1/tenants/${tid}/workflows/${workflowName}/run`, {
      method: "POST",
      body: JSON.stringify({
        input_payload: inputPayload,
        idempotency_key: idempotencyKey,
        webhook_url: webhookUrl,
      }),
    });
  }

  async listWorkflowExecutions(
    params: { limit?: number; offset?: number; status?: string; tenantId?: string } = {}
  ): Promise<import("./rag-types").WorkflowListResponse> {
    const tid = params.tenantId || this.config.tenantId;
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", String(params.limit));
    if (params.offset) query.set("offset", String(params.offset));
    if (params.status) query.set("status", params.status);
    const qs = query.toString();
    return this.request<import("./rag-types").WorkflowListResponse>(
      `/v1/tenants/${tid}/workflows/executions${qs ? `?${qs}` : ""}`
    );
  }

  async getWorkflowExecution(
    executionId: string,
    tenantId?: string
  ): Promise<import("./rag-types").WorkflowExecution> {
    const tid = tenantId || this.config.tenantId;
    return this.request<import("./rag-types").WorkflowExecution>(
      `/v1/tenants/${tid}/workflows/executions/${executionId}`
    );
  }

  async retryWorkflowExecution(
    executionId: string,
    tenantId?: string
  ): Promise<import("./rag-types").WorkflowExecution> {
    const tid = tenantId || this.config.tenantId;
    return this.request<import("./rag-types").WorkflowExecution>(
      `/v1/tenants/${tid}/workflows/executions/${executionId}/retry`,
      { method: "POST" }
    );
  }

  async cancelWorkflowExecution(
    executionId: string,
    tenantId?: string
  ): Promise<import("./rag-types").WorkflowExecution> {
    const tid = tenantId || this.config.tenantId;
    return this.request<import("./rag-types").WorkflowExecution>(
      `/v1/tenants/${tid}/workflows/executions/${executionId}/cancel`,
      { method: "POST" }
    );
  }

  async getWorkflowOverview(): Promise<import("./rag-types").WorkflowOverviewResponse> {
    return this.request<import("./rag-types").WorkflowOverviewResponse>("/v1/admin/workflows/overview");
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
  fallbackMode?: boolean;
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

