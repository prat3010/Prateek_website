import type {
  GraphCapabilitiesResponse,
  GraphQueryResponse,
  GraphSummaryResponse,
} from "../rag-types";
import { fetchWithRetry, requireUserId, type RagRequestContext } from "./http";

export async function getGraphCapabilities(ctx: RagRequestContext): Promise<GraphCapabilitiesResponse> {
  return ctx.request<GraphCapabilitiesResponse>(
    `/v1/admin/tenants/${ctx.config.tenantId}/graph/capabilities`
  );
}


export async function switchGraphEngine(ctx: RagRequestContext, engine: "postgres" | "neo4j") {
  return ctx.request(
    `/v1/admin/tenants/${ctx.config.tenantId}/graph/engine`,
    {
      method: "POST",
      body: JSON.stringify({ engine }),
    }
  );
}


export async function getGraphSummary(ctx: RagRequestContext): Promise<GraphSummaryResponse> {
  return ctx.request<GraphSummaryResponse>(
    `/v1/tenants/${ctx.config.tenantId}/graph`
  );
}


export async function queryGraph(ctx: RagRequestContext, entity: string, maxHops = 2): Promise<GraphQueryResponse> {
  return ctx.request<GraphQueryResponse>(
    `/v1/tenants/${ctx.config.tenantId}/graph/query`,
    {
      method: "POST",
      body: JSON.stringify({ entity, max_hops: maxHops }),
    }
  );
}


export async function deleteTriple(ctx: RagRequestContext, tripleId: string) {
  return ctx.request(
    `/v1/tenants/${ctx.config.tenantId}/graph/triples/${tripleId}`,
    {
      method: "DELETE",
    }
  );
}



export async function generateConsensus(ctx: RagRequestContext, 
  query: string,
  options?: { generatorProvider?: string; criticProvider?: string }
): Promise<import("../rag-types").ConsensusResponse> {
  return ctx.request<import("../rag-types").ConsensusResponse>(
    `/v1/tenants/${ctx.config.tenantId}/consensus/generate`,
    {
      method: "POST",
      body: JSON.stringify({
        tenant_id: ctx.config.tenantId,
        prompt: query,
        query,
        generator_provider_name: options?.generatorProvider,
        critic_provider_name: options?.criticProvider,
      }),
    }
  );
}



export async function executeRlmSubroutine(ctx: RagRequestContext, 
  query: string,
  maxSteps = 3
): Promise<import("../rag-types").RlmExecutionResponse> {
  return ctx.request<import("../rag-types").RlmExecutionResponse>(
    `/v1/tenants/${ctx.config.tenantId}/rlm/analyze`,
    {
      method: "POST",
      body: JSON.stringify({
        tenant_id: ctx.config.tenantId,
        prompt: query,
        max_depth: maxSteps,
      }),
    }
  );
}


export async function listAgentTools(ctx: RagRequestContext): Promise<import("../rag-types").ToolDefinition[]> {
  return ctx.request<import("../rag-types").ToolDefinition[]>(
    `/v1/tenants/${ctx.config.tenantId}/agentic/tools`
  );
}


export async function executeAgentWorkflow(ctx: RagRequestContext, 
  prompt: string,
  options?: {
    threadId?: string;
    maxSteps?: number;
    allowedTools?: string[];
  }
): Promise<import("../rag-types").AgentExecutionResult> {
  return ctx.request<import("../rag-types").AgentExecutionResult>(
    `/v1/tenants/${ctx.config.tenantId}/agentic/execute`,
    {
      method: "POST",
      body: JSON.stringify({
        tenant_id: ctx.config.tenantId,
        prompt,
        thread_id: options?.threadId,
        max_steps: options?.maxSteps ?? 10,
        allowed_tools: options?.allowedTools,
      }),
    }
  );
}


export async function streamAgenticWorkflow(ctx: RagRequestContext, 
  prompt: string,
  onEvent: (event: import("../rag-types").ReActStreamEvent) => void,
  signal?: AbortSignal,
  options?: {
    maxTurns?: number;
    timeoutSeconds?: number;
    allowedTools?: string[];
  }
): Promise<string> {
  const url = `${ctx.config.apiUrl.replace(/\/$/, "")}/v1/tenants/${ctx.config.tenantId}/agentic/stream`;
  const validUserId = requireUserId(ctx.config.userId);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${ctx.config.apiKey}`,
    "X-User-ID": validUserId,
    Accept: "text/event-stream",
  };
  if (ctx.config.llmKey) headers["X-LLM-Key"] = ctx.config.llmKey;
  if (ctx.config.llmProvider) headers["X-LLM-Provider"] = ctx.config.llmProvider;

  const res = await fetchWithRetry(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt,
      max_turns: options?.maxTurns ?? 8,
      timeout_seconds: options?.timeoutSeconds ?? 30.0,
      allowed_tools: options?.allowedTools,
    }),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    throw new Error(`ReAct stream failed (${res.status}): ${errText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body from ReAct stream");

  const decoder = new TextDecoder();
  let finalAnswer = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const dataStr = trimmed.replace(/^data:\s*/, "");
        if (dataStr === "[DONE]") break;

        try {
          const eventObj = JSON.parse(dataStr) as import("../rag-types").ReActStreamEvent;
          onEvent(eventObj);
          if (eventObj.event_type === "final_answer" && eventObj.data?.final_answer) {
            finalAnswer = eventObj.data.final_answer;
          }
        } catch {
          // ignore malformed frame
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return finalAnswer;
}


export async function resumeAgentWorkflow(ctx: RagRequestContext, 
  threadId: string,
  decision: import("../rag-types").HITLApprovalDecision
): Promise<import("../rag-types").AgentExecutionResult> {
  return ctx.request<import("../rag-types").AgentExecutionResult>(
    `/v1/tenants/${ctx.config.tenantId}/agentic/threads/${threadId}/resume`,
    {
      method: "POST",
      body: JSON.stringify(decision),
    }
  );
}


export async function getAgentThreadHistory(ctx: RagRequestContext, 
  threadId: string
): Promise<import("../rag-types").ThreadHistoryResponse> {
  return ctx.request<import("../rag-types").ThreadHistoryResponse>(
    `/v1/tenants/${ctx.config.tenantId}/agentic/threads/${threadId}/history`
  );
}


export async function rollbackAgentThread(ctx: RagRequestContext, 
  threadId: string,
  checkpointId: string,
  fork = false
): Promise<import("../rag-types").ThreadCheckpointItem> {
  return ctx.request<import("../rag-types").ThreadCheckpointItem>(
    `/v1/tenants/${ctx.config.tenantId}/agentic/threads/${threadId}/rollback`,
    {
      method: "POST",
      body: JSON.stringify({
        target_checkpoint_id: checkpointId,
        fork,
      }),
    }
  );
}


export async function getAgenticEconomicLedger(ctx: RagRequestContext, 
  signal?: AbortSignal
): Promise<import("../rag-types").EconomicLedgerSummary> {
  return ctx.request<import("../rag-types").EconomicLedgerSummary>(
    `/v1/tenants/${ctx.config.tenantId}/agentic/gateway/ledger`,
    { signal }
  );
}


export async function classifyAgenticComplexity(ctx: RagRequestContext, 
  query: string,
  allowedTools?: string[],
  signal?: AbortSignal
): Promise<import("../rag-types").TaskComplexity> {
  return ctx.request<import("../rag-types").TaskComplexity>(
    `/v1/tenants/${ctx.config.tenantId}/agentic/gateway/classify`,
    {
      method: "POST",
      body: JSON.stringify({
        query,
        allowed_tools: allowedTools,
      }),
      signal,
    }
  );
}

// ── Milestone 108: Cognitive Agent Memory Consolidation & Experience Distillation ────


export async function queryMultimodalGraph(ctx: RagRequestContext, 
  entityQuery: string,
  maxHops: number = 2
): Promise<import("../rag-types").MultimodalGraphResponse> {
  return ctx.request<import("../rag-types").MultimodalGraphResponse>(
    `/v1/tenants/${ctx.config.tenantId}/vision/graph/query`,
    {
      method: "POST",
      body: JSON.stringify({
        tenant_id: ctx.config.tenantId,
        entity_query: entityQuery,
        max_hops: maxHops,
        include_visual_boxes: true,
      }),
    }
  );
}


