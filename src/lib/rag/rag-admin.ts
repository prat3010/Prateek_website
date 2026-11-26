import type {
  AttestationHealthResponse,
  ChunkMerkleProof,
  DocumentMerkleRoot,
  GroundingCertificate,
  GroundingVerificationResult,
  IssueCertificatePayload,
  VerifyCertificatePayload,
} from "../rag-types";
import { type RagRequestContext } from "./http";

export async function listTenants(ctx: RagRequestContext): Promise<{ tenantId: string; name: string; status: string }[]> {
  const res = await ctx.request<unknown>("/v1/admin/tenants");
  if (Array.isArray(res)) return res as { tenantId: string; name: string; status: string }[];
  if (res && typeof res === "object" && "items" in res && Array.isArray((res as { items: unknown[] }).items)) {
    return (res as { items: { tenantId: string; name: string; status: string }[] }).items;
  }
  return [];
}


export async function getOnlineEvaluationSummary(ctx: RagRequestContext): Promise<import("../rag-types").OnlineEvaluationSummaryResponse> {
  return ctx.request<import("../rag-types").OnlineEvaluationSummaryResponse>(
    `/v1/tenants/${ctx.config.tenantId}/evaluations/summary`
  );
}


export async function computeGroundingDiff(ctx: RagRequestContext, 
  answer: string,
  contexts: string[] = []
): Promise<import("../rag-types").GroundingDiffResponse> {
  return ctx.request<import("../rag-types").GroundingDiffResponse>(
    `/v1/tenants/${ctx.config.tenantId}/evaluations/grounding-diff`,
    {
      method: "POST",
      body: JSON.stringify({ answer, contexts }),
    }
  );
}



export async function listLoraAdapters(ctx: RagRequestContext): Promise<import("../rag-types").LoraAdapterInfo[]> {
  return ctx.request<import("../rag-types").LoraAdapterInfo[]>(
    `/v1/admin/tenants/${ctx.config.tenantId}/lora/adapters`
  );
}


export async function trainLoraAdapter(ctx: RagRequestContext, payload: {
  name?: string;
  domain_tag?: string;
  rank?: number;
  epochs?: number;
  learning_rate?: number;
}): Promise<import("../rag-types").LoraTrainResponse> {
  return ctx.request<import("../rag-types").LoraTrainResponse>(
    `/v1/admin/tenants/${ctx.config.tenantId}/lora/train`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}


export async function getGatewayModels(ctx: RagRequestContext): Promise<import("../rag-types").GatewayModelInfo[]> {
  return ctx.request<import("../rag-types").GatewayModelInfo[]>("/v1/gateway/models");
}


export async function probeGateway(ctx: RagRequestContext): Promise<import("../rag-types").GatewayProbeResult[]> {
  return ctx.request<import("../rag-types").GatewayProbeResult[]>("/v1/gateway/probe", {
    method: "POST",
    body: JSON.stringify({}),
  });
}


export async function getTenantGatewayRoutes(ctx: RagRequestContext, 
  tenantId?: string
): Promise<import("../rag-types").TenantGatewayRoutesResponse> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").TenantGatewayRoutesResponse>(
    `/v1/tenants/${tid}/gateway/routes`
  );
}


export async function updateTenantGatewayRoutes(ctx: RagRequestContext, 
  payload: import("../rag-types").UpdateGatewayRoutesPayload,
  tenantId?: string
): Promise<{ status: string; tenant_id: string; gateway_settings: Record<string, unknown>; budget_settings: Record<string, unknown> }> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<{ status: string; tenant_id: string; gateway_settings: Record<string, unknown>; budget_settings: Record<string, unknown> }>(
    `/v1/tenants/${tid}/gateway/routes`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}


export async function getTenantGatewayBudget(ctx: RagRequestContext, 
  tenantId?: string
): Promise<import("../rag-types").VirtualTenantBudget> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").VirtualTenantBudget>(
    `/v1/tenants/${tid}/gateway/budget`
  );
}

// ── Milestone 94: NeMo Guardrails & Safety API Methods ─────────────────────


export async function getGuardrailTemplates(ctx: RagRequestContext): Promise<Record<string, import("../rag-types").ColangTemplate>> {
  return ctx.request<Record<string, import("../rag-types").ColangTemplate>>("/v1/guardrails/templates");
}


export async function getGuardrailConfig(ctx: RagRequestContext, tenantId?: string): Promise<import("../rag-types").TenantGuardrailsConfig> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").TenantGuardrailsConfig>(`/v1/tenants/${tid}/guardrails/config`);
}


export async function updateGuardrailConfig(ctx: RagRequestContext, 
  payload: Partial<import("../rag-types").TenantGuardrailsConfig>,
  tenantId?: string
): Promise<import("../rag-types").TenantGuardrailsConfig> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").TenantGuardrailsConfig>(`/v1/tenants/${tid}/guardrails/config`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}


export async function validateGuardrailInput(ctx: RagRequestContext, 
  query: string,
  history?: Array<{ role: string; content: string }>,
  tenantId?: string
): Promise<import("../rag-types").GuardrailCheckResult> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").GuardrailCheckResult>(`/v1/tenants/${tid}/guardrails/validate-input`, {
    method: "POST",
    body: JSON.stringify({ query, conversation_history: history }),
  });
}


export async function validateGuardrailOutput(ctx: RagRequestContext, 
  query: string,
  generatedResponse: string,
  retrievedContexts: string[] = [],
  tenantId?: string
): Promise<import("../rag-types").GuardrailCheckResult> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").GuardrailCheckResult>(`/v1/tenants/${tid}/guardrails/validate-output`, {
    method: "POST",
    body: JSON.stringify({
      query,
      generated_response: generatedResponse,
      retrieved_contexts: retrievedContexts,
    }),
  });
}


export async function testGuardrailFlow(ctx: RagRequestContext, 
  query: string,
  customColang?: string,
  tenantId?: string
): Promise<import("../rag-types").GuardrailCheckResult> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").GuardrailCheckResult>(`/v1/tenants/${tid}/guardrails/test-flow`, {
    method: "POST",
    body: JSON.stringify({ query, custom_colang: customColang }),
  });
}


export async function getGuardrailTelemetry(ctx: RagRequestContext, tenantId?: string): Promise<import("../rag-types").GuardrailTelemetry> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").GuardrailTelemetry>(`/v1/tenants/${tid}/guardrails/telemetry`);
}

// ── Milestone 96: Serverless GPU Serving & Custom vLLM / LoRA ────


export async function getServerlessStatus(ctx: RagRequestContext): Promise<import("../rag-types").ServerlessDeploymentStatus> {
  return ctx.request<import("../rag-types").ServerlessDeploymentStatus>("/v1/admin/serverless/status");
}


export async function probeServerlessGpu(ctx: RagRequestContext): Promise<import("../rag-types").WarmBootMetrics> {
  return ctx.request<import("../rag-types").WarmBootMetrics>("/v1/admin/serverless/probe", {
    method: "POST",
  });
}


export async function getServerlessCostSavings(ctx: RagRequestContext, 
  activeComputeHours: number = 15.0,
  gpuTier: import("../rag-types").ServerlessGpuTier = "A10G"
): Promise<import("../rag-types").ServerlessCostComparison> {
  const qs = new URLSearchParams({
    active_compute_hours: String(activeComputeHours),
    gpu_tier: gpuTier,
  }).toString();
  return ctx.request<import("../rag-types").ServerlessCostComparison>(
    `/v1/admin/serverless/cost-savings?${qs}`
  );
}


export async function getTenantLoraAdapters(ctx: RagRequestContext, tenantId?: string): Promise<import("../rag-types").LoraAdapterMetadata[]> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").LoraAdapterMetadata[]>(
    `/v1/tenants/${tid}/lora-adapters`
  );
}


export async function getActiveTenantLoraAdapter(ctx: RagRequestContext, tenantId?: string): Promise<import("../rag-types").LoraAdapterMetadata | null> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").LoraAdapterMetadata | null>(
    `/v1/tenants/${tid}/lora-adapters/active`
  );
}


export async function registerTenantLoraAdapter(ctx: RagRequestContext, 
  payload: {
    name: string;
    base_model: string;
    artifact_uri: string;
    rank?: number;
    alpha?: number;
    target_modules?: string[];
    adapter_type?: string;
    description?: string;
    activate_immediately?: boolean;
  },
  tenantId?: string
): Promise<import("../rag-types").LoraAdapterMetadata> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").LoraAdapterMetadata>(
    `/v1/tenants/${tid}/lora-adapters`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}


export async function activateTenantLoraAdapter(ctx: RagRequestContext, 
  adapterId: string,
  tenantId?: string
): Promise<import("../rag-types").LoraAdapterMetadata> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").LoraAdapterMetadata>(
    `/v1/tenants/${tid}/lora-adapters/${adapterId}/activate`,
    { method: "POST" }
  );
}


export async function deactivateTenantLoraAdapter(ctx: RagRequestContext, 
  adapterId: string,
  tenantId?: string
): Promise<{ status: string; adapter_id: string }> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<{ status: string; adapter_id: string }>(
    `/v1/tenants/${tid}/lora-adapters/${adapterId}/deactivate`,
    { method: "POST" }
  );
}


export async function deleteTenantLoraAdapter(ctx: RagRequestContext, 
  adapterId: string,
  tenantId?: string
): Promise<{ deleted: boolean; adapter_id: string }> {
  const tid = tenantId || ctx.config.tenantId;
  return ctx.request<{ deleted: boolean; adapter_id: string }>(
    `/v1/tenants/${tid}/lora-adapters/${adapterId}`,
    { method: "DELETE" }
  );
}

// ── Milestone 97: Autonomous FDE Metaprogrammer & Capability Studio Methods ──


export async function analyzeScaffoldingRequirement(ctx: RagRequestContext, 
  req: import("../rag-types").UseCaseRequirement
): Promise<import("../rag-types").ScaffoldingAnalysisResponse> {
  return ctx.request<import("../rag-types").ScaffoldingAnalysisResponse>("/v1/scaffold/analyze", {
    method: "POST",
    body: JSON.stringify(req),
  });
}


export async function generateScaffoldingPlan(ctx: RagRequestContext, 
  req: import("../rag-types").UseCaseRequirement
): Promise<import("../rag-types").ScaffoldingPlan> {
  return ctx.request<import("../rag-types").ScaffoldingPlan>("/v1/scaffold/generate", {
    method: "POST",
    body: JSON.stringify(req),
  });
}


export async function verifyScaffoldingCode(ctx: RagRequestContext, 
  files: import("../rag-types").ScaffoldedFile[]
): Promise<import("../rag-types").AstValidationResult> {
  return ctx.request<import("../rag-types").AstValidationResult>("/v1/scaffold/verify", {
    method: "POST",
    body: JSON.stringify(files),
  });
}


export async function applyScaffoldingPlan(ctx: RagRequestContext, 
  plan: import("../rag-types").ScaffoldingPlan,
  dryRun = false
): Promise<import("../rag-types").ScaffoldingApplyResponse> {
  return ctx.request<import("../rag-types").ScaffoldingApplyResponse>(
    `/v1/scaffold/apply?dry_run=${dryRun}`,
    {
      method: "POST",
      body: JSON.stringify(plan),
    }
  );
}


export async function reloadCustomPlugins(ctx: RagRequestContext): Promise<{ success: boolean; mounted_count: number; mounted_plugins: string[] }> {
  return ctx.request<{ success: boolean; mounted_count: number; mounted_plugins: string[] }>(
    "/v1/scaffold/reload",
    { method: "POST" }
  );
}


export async function listCustomPlugins(ctx: RagRequestContext): Promise<import("../rag-types").CustomPluginSummary[]> {
  return ctx.request<import("../rag-types").CustomPluginSummary[]>("/v1/scaffold/plugins", {
    method: "GET",
  });
}


export async function deleteCustomPlugin(ctx: RagRequestContext, 
  pluginId: string
): Promise<{ success: boolean; deleted: boolean; plugin_id: string }> {
  return ctx.request<{ success: boolean; deleted: boolean; plugin_id: string }>(
    `/v1/scaffold/plugins/${pluginId}`,
    { method: "DELETE" }
  );
}


export async function getScaffoldingStatus(ctx: RagRequestContext): Promise<{
  battery_id: string;
  name: string;
  status: string;
  version: string;
  milestone: string;
}> {
  return ctx.request<{
    battery_id: string;
    name: string;
    status: string;
    version: string;
    milestone: string;
  }>("/v1/scaffold/status", { method: "GET" });
}

// --- Milestone 98: Sovereign Edge SQLite & Vector Sync Engine ---


export async function getEdgeNodes(ctx: RagRequestContext): Promise<import("../rag-types").EdgeNodeMetadata[]> {
  return ctx.request<import("../rag-types").EdgeNodeMetadata[]>(
    `/v1/tenants/${ctx.config.tenantId}/edge/nodes`,
    { method: "GET" }
  );
}


export async function registerEdgeNode(ctx: RagRequestContext, payload: {
  node_id: string;
  device_name: string;
  platform?: string;
  tier?: import("../rag-types").OfflineExecutionTier;
  client_version?: string;
  hardware_specs?: Record<string, unknown>;
}): Promise<import("../rag-types").EdgeNodeMetadata> {
  return ctx.request<import("../rag-types").EdgeNodeMetadata>(
    `/v1/tenants/${ctx.config.tenantId}/edge/nodes/register`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}


export async function getEdgeDelta(ctx: RagRequestContext, sinceSeq: number = 0, limit: number = 1000, nodeId?: string): Promise<import("../rag-types").EdgeSyncDelta> {
  const params = new URLSearchParams({
    since_seq: sinceSeq.toString(),
    limit: limit.toString(),
  });
  if (nodeId) params.append("node_id", nodeId);
  return ctx.request<import("../rag-types").EdgeSyncDelta>(
    `/v1/tenants/${ctx.config.tenantId}/edge/delta?${params.toString()}`,
    { method: "GET" }
  );
}


export async function generateEdgeBundleManifest(ctx: RagRequestContext): Promise<import("../rag-types").EdgeBundleManifest> {
  return ctx.request<import("../rag-types").EdgeBundleManifest>(
    `/v1/tenants/${ctx.config.tenantId}/edge/bundle`,
    { method: "POST" }
  );
}


export async function downloadEdgeBundle(ctx: RagRequestContext): Promise<Blob> {
  const res = await fetch(`${ctx.config.apiUrl}/v1/tenants/${ctx.config.tenantId}/edge/bundle?download=true`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${ctx.config.apiKey}`,
      "X-Tenant-ID": ctx.config.tenantId,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to download sovereign edge bundle: HTTP ${res.status}`);
  }
  return res.blob();
}


export async function searchEdgeSimulated(ctx: RagRequestContext, request: {
  query: string;
  top_k?: number;
  use_hybrid?: boolean;
  alpha?: number;
}): Promise<import("../rag-types").EdgeSearchResponse> {
  return ctx.request<import("../rag-types").EdgeSearchResponse>(
    `/v1/tenants/${ctx.config.tenantId}/edge/search`,
    {
      method: "POST",
      body: JSON.stringify(request),
    }
  );
}


export async function reconcileEdgeMutations(ctx: RagRequestContext, 
  mutations: import("../rag-types").EdgeMutation[]
): Promise<import("../rag-types").EdgeSyncConflictResolution[]> {
  return ctx.request<import("../rag-types").EdgeSyncConflictResolution[]>(
    `/v1/tenants/${ctx.config.tenantId}/edge/mutations`,
    {
      method: "POST",
      body: JSON.stringify(mutations),
    }
  );
}

// ── Milestone 99: Distributed Multi-Cloud Failover & Edge Turso LibSQL ────


export async function getMultiCloudClusters(ctx: RagRequestContext): Promise<import("../rag-types").MultiCloudClusterOverviewResponse> {
  return ctx.request<import("../rag-types").MultiCloudClusterOverviewResponse>(
    "/v1/admin/multicloud/clusters"
  );
}


export async function probeMultiCloudRegions(ctx: RagRequestContext): Promise<import("../rag-types").RegionHealthProbe[]> {
  return ctx.request<import("../rag-types").RegionHealthProbe[]>(
    "/v1/admin/multicloud/probe",
    {
      method: "POST",
      body: JSON.stringify({}),
    }
  );
}


export async function triggerMultiCloudFailover(ctx: RagRequestContext, 
  request: import("../rag-types").FailoverRequest
): Promise<import("../rag-types").FailoverResult> {
  return ctx.request<import("../rag-types").FailoverResult>(
    "/v1/admin/multicloud/failover",
    {
      method: "POST",
      body: JSON.stringify(request),
    }
  );
}


export async function getLibsqlReplicationStatus(ctx: RagRequestContext): Promise<Record<string, unknown>> {
  return ctx.request<Record<string, unknown>>(
    "/v1/admin/multicloud/replication-status"
  );
}


export async function getTenantLibsqlConfig(ctx: RagRequestContext): Promise<import("../rag-types").LibsqlReplicaConfig> {
  return ctx.request<import("../rag-types").LibsqlReplicaConfig>(
    `/v1/tenants/${ctx.config.tenantId}/multicloud/replica-config`
  );
}


export async function syncTenantLibsqlReplica(ctx: RagRequestContext): Promise<import("../rag-types").LibsqlReplicationStats> {
  return ctx.request<import("../rag-types").LibsqlReplicationStats>(
    `/v1/tenants/${ctx.config.tenantId}/multicloud/sync`,
    {
      method: "POST",
    }
  );
}

// ── Milestone 100: Sovereign Edge Voice & Local Whisper / WebRTC Speech Synthesis ──


export async function getMcpConfig(ctx: RagRequestContext, tenantId?: string): Promise<import("../rag-types").McpConfigResponse> {
  const targetTenant = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").McpConfigResponse>(
    `/v1/mcp/config?tenant_id=${encodeURIComponent(targetTenant)}`
  );
}


export async function getMcpTools(ctx: RagRequestContext, tenantId?: string): Promise<import("../rag-types").McpToolSummary[]> {
  const targetTenant = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").McpToolSummary[]>(
    `/v1/mcp/tools?tenant_id=${encodeURIComponent(targetTenant)}`
  );
}


export async function testMcpTool(ctx: RagRequestContext, 
  toolName: string,
  argumentsObj: Record<string, unknown> = {},
  tenantId?: string
): Promise<import("../rag-types").McpToolExecutionResult> {
  const targetTenant = tenantId || ctx.config.tenantId;
  return ctx.request<import("../rag-types").McpToolExecutionResult>(
    `/v1/mcp/test-tool?tenant_id=${encodeURIComponent(targetTenant)}`,
    {
      method: "POST",
      body: JSON.stringify({
        tool_name: toolName,
        arguments: argumentsObj,
      }),
    }
  );
}

// ── Distributed Model Context Protocol (MCP) Mesh & Agent Federation (Battery #30) ────


export async function getMeshStatus(ctx: RagRequestContext): Promise<import("../rag-types").MeshStatusSummary> {
  return ctx.request<import("../rag-types").MeshStatusSummary>("/v1/mesh/status");
}


export async function listMeshNodes(ctx: RagRequestContext, statusFilter?: import("../rag-types").MeshNodeStatus): Promise<import("../rag-types").MeshPeerNode[]> {
  const query = statusFilter ? `?status=${statusFilter}` : "";
  return ctx.request<import("../rag-types").MeshPeerNode[]>(`/v1/mesh/nodes${query}`);
}


export async function listMeshTools(ctx: RagRequestContext): Promise<import("../rag-types").McpToolSummary[]> {
  return ctx.request<import("../rag-types").McpToolSummary[]>("/v1/mesh/tools");
}


export async function executeMeshTool(ctx: RagRequestContext, 
  toolName: string,
  argumentsObj: Record<string, unknown> = {},
  targetClusterId: string = "cluster_local",
  policy: import("../rag-types").MeshRoutingPolicy = "local_first"
): Promise<import("../rag-types").McpToolExecutionResult> {
  return ctx.request<import("../rag-types").McpToolExecutionResult>(`/v1/mesh/tools/execute?policy=${policy}`, {
    method: "POST",
    body: JSON.stringify({
      call_id: `call_${Math.random().toString(36).slice(2, 10)}`,
      tool_name: toolName,
      arguments: argumentsObj,
      tenant_id: ctx.config.tenantId,
      source_cluster_id: "cluster_web_studio",
      target_cluster_id: targetClusterId,
    }),
  });
}


export async function delegateFederatedTask(ctx: RagRequestContext, params: {
  target_cluster_id: string;
  intent: string;
  target_agent_role?: string;
  context_scope?: Record<string, unknown>;
  max_depth?: number;
  visited_clusters?: string[];
}): Promise<import("../rag-types").FederatedDelegationResponse> {
  return ctx.request<import("../rag-types").FederatedDelegationResponse>("/v1/mesh/federation/delegate", {
    method: "POST",
    body: JSON.stringify({
      target_cluster_id: params.target_cluster_id,
      tenant_id: ctx.config.tenantId,
      intent: params.intent,
      target_agent_role: params.target_agent_role || "forensic_auditor",
      context_scope: params.context_scope || {},
      max_depth: params.max_depth || 2,
      visited_clusters: params.visited_clusters || [],
    }),
  });
}


export async function getFederatedTaskStatus(ctx: RagRequestContext, delegationId: string): Promise<import("../rag-types").FederatedDelegationResponse> {
  return ctx.request<import("../rag-types").FederatedDelegationResponse>(`/v1/mesh/federation/tasks/${delegationId}`);
}

// ── Autonomous Mesh Dynamic Load-Balancing & Autoscaling (Battery #31 / M116) ──


export async function getMeshLoadMetrics(ctx: RagRequestContext): Promise<import("../rag-types").ClusterLoadSummary> {
  return ctx.request<import("../rag-types").ClusterLoadSummary>("/v1/mesh/load/metrics");
}


export async function getAutoscalingEvents(ctx: RagRequestContext, limit: number = 50): Promise<import("../rag-types").AutoscalingEvent[]> {
  return ctx.request<import("../rag-types").AutoscalingEvent[]>(`/v1/mesh/load/autoscaling/events?limit=${limit}`);
}


export async function updateAutoscalingPolicy(ctx: RagRequestContext, 
  policy: import("../rag-types").AutoscalingPolicy
): Promise<import("../rag-types").AutoscalingPolicy> {
  return ctx.request<import("../rag-types").AutoscalingPolicy>("/v1/mesh/load/autoscaling/policy", {
    method: "POST",
    body: JSON.stringify(policy),
  });
}


export async function reapIdleEnclaves(ctx: RagRequestContext, 
  clusterId: string = "cluster-primary"
): Promise<import("../rag-types").AutoscalingEvent[]> {
  return ctx.request<import("../rag-types").AutoscalingEvent[]>(
    `/v1/mesh/load/scale-down/reap?cluster_id=${encodeURIComponent(clusterId)}`,
    {
      method: "POST",
    }
  );
}

// ── Multimodal Vision GraphRAG & Schematic Ingestion (Battery #29) ─────────


export async function getShardTopology(ctx: RagRequestContext): Promise<import("../rag-types").ShardTopologyResponse> {
  return ctx.request<import("../rag-types").ShardTopologyResponse>("/v1/shards/topology");
}


export async function queryShardedVectors(ctx: RagRequestContext, 
  query: import("../rag-types").ScatterGatherQuery
): Promise<import("../rag-types").ScatterGatherResponse> {
  return ctx.request<import("../rag-types").ScatterGatherResponse>("/v1/shards/query", {
    method: "POST",
    body: JSON.stringify(query),
  });
}


export async function mutateShardedVectors(ctx: RagRequestContext, 
  mutation: import("../rag-types").ShardMutationRequest
): Promise<import("../rag-types").ShardMutationResponse> {
  return ctx.request<import("../rag-types").ShardMutationResponse>("/v1/shards/mutate", {
    method: "POST",
    body: JSON.stringify(mutation),
  });
}


export async function getRaftConsensusStatus(ctx: RagRequestContext): Promise<import("../rag-types").RaftConsensusStatus> {
  return ctx.request<import("../rag-types").RaftConsensusStatus>("/v1/shards/raft/status");
}


export async function triggerRaftElection(ctx: RagRequestContext, 
  candidateNodeId: string
): Promise<{ success: boolean; current_term: number; active_leader_id: string }> {
  return ctx.request<{ success: boolean; current_term: number; active_leader_id: string }>("/v1/shards/election", {
    method: "POST",
    body: JSON.stringify({ candidate_node_id: candidateNodeId }),
  });
}


export async function rebalanceShards(ctx: RagRequestContext, 
  payload?: { source_node_id?: string; target_node_id?: string; shard_id?: string }
): Promise<import("../rag-types").ShardRebalancePlan> {
  return ctx.request<import("../rag-types").ShardRebalancePlan>("/v1/shards/rebalance", {
    method: "POST",
    body: payload ? JSON.stringify(payload) : undefined,
  });
}


export async function snapshotShard(ctx: RagRequestContext, shardId: string): Promise<Record<string, unknown>> {
  return ctx.request<Record<string, unknown>>(`/v1/shards/${encodeURIComponent(shardId)}/snapshot`, {
    method: "POST",
  });
}

// --- Signed Merkle Vector Attestation & Grounding (Battery #33 / M118) ---


export async function getAttestationHealth(ctx: RagRequestContext): Promise<AttestationHealthResponse> {
  return ctx.request<AttestationHealthResponse>("/v1/attestation/health");
}


export async function computeDocumentMerkleRoot(ctx: RagRequestContext, documentId: string, chunks: Record<string, unknown>[] = []): Promise<DocumentMerkleRoot> {
  return ctx.request<DocumentMerkleRoot>(`/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/attestation/merkle-root/${encodeURIComponent(documentId)}`, {
    method: "POST",
    body: JSON.stringify({ chunks }),
  });
}


export async function getChunkInclusionProof(ctx: RagRequestContext, chunkId: string, documentId: string, chunks: Record<string, unknown>[] = []): Promise<ChunkMerkleProof> {
  return ctx.request<ChunkMerkleProof>(`/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/attestation/proof/chunk/${encodeURIComponent(chunkId)}`, {
    method: "POST",
    body: JSON.stringify({ document_id: documentId, chunks }),
  });
}


export async function issueGroundingCertificate(ctx: RagRequestContext, payload: IssueCertificatePayload): Promise<GroundingCertificate> {
  return ctx.request<GroundingCertificate>(`/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/attestation/attest`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function verifyGroundingCertificate(ctx: RagRequestContext, payload: VerifyCertificatePayload): Promise<GroundingVerificationResult> {
  return ctx.request<GroundingVerificationResult>("/v1/attestation/verify", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}


export async function listGroundingCertificates(ctx: RagRequestContext, limit = 50): Promise<GroundingCertificate[]> {
  return ctx.request<GroundingCertificate[]>(`/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/attestation/certificates?limit=${limit}`);
}

// --- Enterprise Identity Federation & RB-VAC (M119, Battery #34) ---


export async function getSamlConfig(ctx: RagRequestContext): Promise<import("../rag-types").SamlIdpConfig> {
  return ctx.request<import("../rag-types").SamlIdpConfig>(`/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/identity/saml/config`);
}


export async function configureSamlIdp(ctx: RagRequestContext, config: Partial<import("../rag-types").SamlIdpConfig>): Promise<import("../rag-types").SamlIdpConfig> {
  return ctx.request<import("../rag-types").SamlIdpConfig>(`/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/identity/saml/config`, {
    method: "POST",
    body: JSON.stringify(config),
  });
}


export async function getSpMetadataXml(ctx: RagRequestContext): Promise<string> {
  const res = await fetch(`${ctx.config.apiUrl}/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/identity/saml/metadata`, {
    headers: { "X-API-Key": ctx.config.apiKey },
  });
  return res.text();
}


export async function validateSamlAcs(ctx: RagRequestContext, samlResponseB64: string): Promise<import("../rag-types").SamlAssertionPayload> {
  return ctx.request<import("../rag-types").SamlAssertionPayload>(`/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/identity/saml/acs`, {
    method: "POST",
    body: JSON.stringify({ saml_response: samlResponseB64 }),
  });
}


export async function generateScimToken(ctx: RagRequestContext): Promise<{ tenant_id: string; token: string; token_type: string }> {
  return ctx.request<{ tenant_id: string; token: string; token_type: string }>(
    `/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/identity/scim/token`,
    { method: "POST" }
  );
}


export async function listScimUsers(ctx: RagRequestContext, startIndex = 1, count = 20, filter?: string): Promise<import("../rag-types").ScimListResponse<import("../rag-types").ScimUser>> {
  const params = new URLSearchParams({ startIndex: String(startIndex), count: String(count) });
  if (filter) params.set("filter", filter);
  return ctx.request<import("../rag-types").ScimListResponse<import("../rag-types").ScimUser>>(
    `/v1/scim/v2/tenants/${encodeURIComponent(ctx.config.tenantId)}/Users?${params.toString()}`
  );
}


export async function createScimUser(ctx: RagRequestContext, user: Record<string, unknown>): Promise<import("../rag-types").ScimUser> {
  return ctx.request<import("../rag-types").ScimUser>(`/v1/scim/v2/tenants/${encodeURIComponent(ctx.config.tenantId)}/Users`, {
    method: "POST",
    body: JSON.stringify(user),
  });
}


export async function patchScimUser(ctx: RagRequestContext, userId: string, operations: unknown[]): Promise<import("../rag-types").ScimUser> {
  return ctx.request<import("../rag-types").ScimUser>(`/v1/scim/v2/tenants/${encodeURIComponent(ctx.config.tenantId)}/Users/${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ Operations: operations }),
  });
}


export async function deleteScimUser(ctx: RagRequestContext, userId: string): Promise<void> {
  await ctx.request(`/v1/scim/v2/tenants/${encodeURIComponent(ctx.config.tenantId)}/Users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
  });
}


export async function listScimGroups(ctx: RagRequestContext, startIndex = 1, count = 20): Promise<import("../rag-types").ScimListResponse<import("../rag-types").ScimGroup>> {
  return ctx.request<import("../rag-types").ScimListResponse<import("../rag-types").ScimGroup>>(
    `/v1/scim/v2/tenants/${encodeURIComponent(ctx.config.tenantId)}/Groups?startIndex=${startIndex}&count=${count}`
  );
}


export async function createScimGroup(ctx: RagRequestContext, group: Record<string, unknown>): Promise<import("../rag-types").ScimGroup> {
  return ctx.request<import("../rag-types").ScimGroup>(`/v1/scim/v2/tenants/${encodeURIComponent(ctx.config.tenantId)}/Groups`, {
    method: "POST",
    body: JSON.stringify(group),
  });
}


export async function simulateRbVac(ctx: RagRequestContext, 
  userId: string,
  email: string,
  securityGroups: string[],
  candidates: import("../rag-types").RbVacCandidateChunk[] = []
): Promise<import("../rag-types").RbVacSimulationResult> {
  return ctx.request<import("../rag-types").RbVacSimulationResult>(`/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/identity/rbvac/simulate`, {
    method: "POST",
    body: JSON.stringify({ user_id: userId, email, security_groups: securityGroups, candidates }),
  });
}

// --- Confidential Multi-Party Vector Computation (MPC) Privacy Enclaves (M121 / Battery #36) ---


export async function createMpcSession(ctx: RagRequestContext, payload: {
  title: string;
  protocol?: import("../rag-types").MpcProtocolType;
  required_parties_count?: number;
  dimension?: number;
  privacy_threshold?: number;
  top_k?: number;
  epsilon_budget?: number;
}): Promise<import("../rag-types").MpcSession> {
  return ctx.request<import("../rag-types").MpcSession>(
    `/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/mpc/sessions`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}


export async function listMpcSessions(ctx: RagRequestContext): Promise<import("../rag-types").MpcSession[]> {
  return ctx.request<import("../rag-types").MpcSession[]>(
    `/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/mpc/sessions`
  );
}


export async function getMpcSession(ctx: RagRequestContext, sessionId: string): Promise<import("../rag-types").MpcSession> {
  return ctx.request<import("../rag-types").MpcSession>(
    `/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/mpc/sessions/${encodeURIComponent(sessionId)}`
  );
}


export async function joinMpcSession(ctx: RagRequestContext, 
  sessionId: string,
  party: {
    party_id: string;
    display_name: string;
    public_key: string;
    role?: import("../rag-types").EnclavePartyRole;
  }
): Promise<import("../rag-types").MpcSession> {
  return ctx.request<import("../rag-types").MpcSession>(
    `/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/mpc/sessions/${encodeURIComponent(sessionId)}/join`,
    {
      method: "POST",
      body: JSON.stringify(party),
    }
  );
}


export async function submitMpcVectorShares(ctx: RagRequestContext, 
  sessionId: string,
  payload: {
    party_id: string;
    shares: import("../rag-types").EncryptedVectorShare[];
  }
): Promise<import("../rag-types").MpcSession> {
  return ctx.request<import("../rag-types").MpcSession>(
    `/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/mpc/sessions/${encodeURIComponent(sessionId)}/shares`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}


export async function executeMpcCompute(ctx: RagRequestContext, sessionId: string): Promise<import("../rag-types").MpcResultsResponse> {
  return ctx.request<import("../rag-types").MpcResultsResponse>(
    `/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/mpc/sessions/${encodeURIComponent(sessionId)}/compute`,
    { method: "POST" }
  );
}


export async function getMpcResults(ctx: RagRequestContext, sessionId: string): Promise<import("../rag-types").MpcResultsResponse> {
  return ctx.request<import("../rag-types").MpcResultsResponse>(
    `/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/mpc/sessions/${encodeURIComponent(sessionId)}/results`
  );
}


export async function abortMpcSession(ctx: RagRequestContext, sessionId: string, reason = "User aborted"): Promise<import("../rag-types").MpcSession> {
  return ctx.request<import("../rag-types").MpcSession>(
    `/v1/tenants/${encodeURIComponent(ctx.config.tenantId)}/mpc/sessions/${encodeURIComponent(sessionId)}/abort`,
    {
      method: "POST",
      body: JSON.stringify({ reason }),
    }
  );
}


export async function simulateMpcMath(ctx: RagRequestContext, 
  request: import("../rag-types").MpcMathSimulationRequest
): Promise<import("../rag-types").MpcMathSimulationResponse> {
  return ctx.request<import("../rag-types").MpcMathSimulationResponse>("/v1/mpc/math/simulate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

// ── Master System Prompt & Governance Policy Lock ────────────────────────


