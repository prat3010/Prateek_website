export interface SearchResult {
  chunkId: string;
  documentId?: string;
  content: string;
  score: number;
  normalizedScore?: number;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface DocumentMeta {
  documentId: string;
  filename: string;
  status: string;
  createdAt: string;
  chunksCount?: number;
}

export interface SearchResponse {
  query?: string;
  results: SearchResult[];
  searchMeta?: {
    strategy?: string;
    totalCandidates?: number;
    returnedResults?: number;
    durationMs?: number;
    expandedQueries?: string[];
  };
}

export interface SentenceAttribution {
  sentence: string;
  citedChunkIds: string[];
  isGrounded: boolean;
}

export interface CompressionResponse {
  compressed_text: string;
  original_tokens: number;
  compressed_tokens: number;
  compression_ratio: number;
}

export interface ConsensusResponse {
  answer?: string;
  final_response?: string;
  generator_model?: string;
  generator_used?: string;
  critic_model?: string;
  critic_used?: string;
  iterations?: number;
  approved_on_round?: number;
  consensus_score?: number;
  reflection_history?: Array<Record<string, unknown>>;
  execution_time_ms?: number;
  prompt?: string;
  tenant_id?: string;
}


export interface RlmExecutionResponse {
  tenant_id?: string;
  prompt?: string;
  analysis_summary?: string;
  code_executions?: Array<Record<string, unknown>>;
  subcalls_count?: number;
  output?: string;
  steps_executed?: number;
  execution_time_ms: number;
  status?: string;
}

export interface OnlineEvaluationSummaryResponse {
  tenant_id?: string;
  total_evaluations: number;
  avg_faithfulness: number;
  avg_context_precision?: number;
  avg_context_relevance?: number;
  avg_hallucination_index?: number;
  hallucination_count?: number;
  total_alerts?: number;
}

export interface EntityTripleItem {
  triple_id?: string;
  subject: string;
  predicate: string;
  object: string;
  chunk_id?: string;
  confidence?: number;
}


export interface GraphSummaryResponse {
  tenant_id: string;
  total_triples: number;
  unique_entities: number;
  storage_engine: string;
  neo4j_status?: string;
}

export interface GraphQueryResponse {
  root_entity: string;
  max_hops: number;
  triples: EntityTripleItem[];
  connected_entities: string[];
}


export interface ClaimClassification {
  claim: string;
  premise: string;
  status: "entailment" | "neutral" | "contradiction";
  entailment_prob: number;
  contradiction_prob: number;
  neutral_prob: number;
}

export interface GroundingDiffResponse {
  tenant_id: string;
  total_claims: number;
  entailed_claims: number;
  contradicted_claims: number;
  neutral_claims: number;
  faithfulness_score: number;
  hallucination_index: number;
  claims: ClaimClassification[];
}

export interface LoraAdapterInfo {
  adapter_id: string;
  tenant_id: string;
  name: string;
  domain_tag: string;
  rank: number;
  loss_score: number | null;
  created_at: string;
}

export interface LoraTrainResponse {
  adapter_id: string;
  tenant_id: string;
  name: string;
  rank: number;
  loss_score: number;
  message: string;
}

export interface ProjectedPoint {
  chunk_id: string;
  document_id: string;
  document_title: string;
  coordinates: number[];
  cluster_id: number;
  cluster_label: string;
  text_preview: string;
  metadata?: Record<string, unknown>;
}

export interface ProjectionCentroid {
  cluster_id: number;
  cluster_label: string;
  coordinates: number[];
  chunk_count: number;
}

export interface EmbeddingProjectionRequest {
  method?: "pca" | "tsne" | "umap";
  dimensions?: 2 | 3;
  perplexity?: number;
  n_neighbors?: number;
  min_dist?: number;
  normalize?: boolean;
  query_vector?: number[];
}

export interface EmbeddingProjectionResponse {
  tenant_id: string;
  total_points: number;
  dimensions: number;
  method_used: string;
  points: ProjectedPoint[];
  centroids: ProjectionCentroid[];
  variance_explained?: number[] | null;
  silhouette_score?: number | null;
  query_point?: ProjectedPoint | null;
}

export interface ScopingIntentData {
  archetype_id: string;
  base_engine_id: string;
  feature_ids: string[];
  brand_asset_id: string;
  maintenance_plan_id: string;
  suggested_timeline: string;
  confidence_score: number;
  summary_rationale: string;
  retriever_engine_recommended: boolean;
  unrecognized_requirements: string[];
}

export interface IntentClassificationResponse {
  success: boolean;
  data: ScopingIntentData;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

// ── Milestone 91: LangGraph Cyclic Agentic Workflows & HITL State Engine ────

export interface ToolDefinition {
  name: string;
  description: string;
  parameters_schema?: Record<string, unknown>;
  category?: string;
  requires_approval: boolean;
  risk_level: "low" | "medium" | "high" | "critical";
}

export interface ToolCallItem {
  call_id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResultItem {
  call_id: string;
  tool_name: string;
  output: unknown;
  is_error: boolean;
}

export interface AgentStepItem {
  step_index: number;
  thought: string;
  tool_calls: ToolCallItem[];
  tool_results: ToolResultItem[];
}

export interface HITLApprovalRequest {
  action_id: string;
  thread_id: string;
  tenant_id: string;
  tool_name: string;
  arguments: Record<string, unknown>;
  risk_level: "low" | "medium" | "high" | "critical";
  description: string;
  status: "pending" | "approved" | "rejected";
  created_at: number;
}

export interface HITLApprovalDecision {
  action_id: string;
  decision: "approve" | "reject";
  modified_arguments?: Record<string, unknown> | null;
  comment?: string | null;
}

export interface ThreadCheckpointItem {
  checkpoint_id: string;
  thread_id: string;
  tenant_id: string;
  node_name: string;
  step_index: number;
  state_snapshot: Record<string, unknown>;
  created_at: number;
}

export interface ThreadHistoryResponse {
  thread_id: string;
  tenant_id: string;
  total_checkpoints: number;
  checkpoints: ThreadCheckpointItem[];
}

export interface AgentExecutionResult {
  tenant_id: string;
  thread_id: string;
  prompt: string;
  final_answer: string;
  status: "completed" | "waiting_approval" | "rejected" | "error";
  steps: AgentStepItem[];
  pending_approval?: HITLApprovalRequest | null;
  checkpoint_id?: string | null;
  total_steps: number;
  execution_time_ms: number;
}

// ── Milestone 92: DSPy Declarative Prompt Compilation & Algorithmic Self-Optimization Pipeline ────

export interface FewShotDemonstration {
  question: string;
  context: string;
  thought?: string | null;
  answer: string;
  score?: number;
}

export interface CompiledPromptProgram {
  program_id: string;
  tenant_id: string;
  name: string;
  signature_name: string;
  optimizer: "BootstrapFewShot" | "MIPROv2" | "RandomSearch" | string;
  dataset_id?: string | null;
  baseline_score: number;
  compiled_score: number;
  improvement_pct: number;
  metric_name: string;
  compiled_instruction: string;
  few_shot_demos: FewShotDemonstration[];
  is_active: boolean;
  created_at: string;
}

export interface PromptCompilationRequest {
  name?: string;
  dataset_id?: string | null;
  optimizer?: "BootstrapFewShot" | "MIPROv2" | "RandomSearch";
  max_demos?: number;
  metric_target?: "faithfulness" | "context_relevance" | "composite";
  train_data?: Array<{
    question: string;
    context: string;
    ground_truth_answer: string;
  }>;
  val_data?: Array<{
    question: string;
    context: string;
    ground_truth_answer: string;
  }>;
}

export interface PromptCompilationResult {
  program_id: string;
  tenant_id: string;
  name: string;
  signature_name: string;
  optimizer: string;
  dataset_id?: string | null;
  baseline_score: number;
  compiled_score: number;
  improvement_pct: number;
  metric_name: string;
  compiled_instruction: string;
  few_shot_demos: FewShotDemonstration[];
  is_active: boolean;
  created_at: string;
}

// ── Milestone 93: Enterprise LLM Gateway & Multi-Model Smart Router ──────────

export interface GatewayModelInfo {
  model_id: string;
  provider: string;
  name: string;
  input_cost_per_1k: number;
  output_cost_per_1k: number;
  capabilities: string[];
  is_local: boolean;
  health_status: "healthy" | "degraded" | "unavailable";
  latency_ms?: number | null;
  description: string;
}

export interface GatewayProbeResult {
  provider: string;
  target_model: string;
  reachable: boolean;
  latency_ms: number;
  error_message?: string | null;
}

export interface GatewayRoutesConfig {
  primary_model: string;
  fallback_models: string[];
  latency_sla_ms: number;
  cooldown_seconds: number;
  retry_attempts?: number;
}

export interface BudgetSettingsConfig {
  daily_cost_budget: number | null;
  monthly_cost_budget: number | null;
  hard_limit_action: "warn_only" | "block" | "downgrade_free_model";
  free_fallback_model: string;
  currency: string;
}

export interface TenantGatewayRoutesResponse {
  tenant_id: string;
  gateway_settings: GatewayRoutesConfig;
  budget_settings: BudgetSettingsConfig;
}

export interface VirtualTenantBudget {
  daily_budget: number | null;
  monthly_budget: number | null;
  hard_limit_action: "warn_only" | "block" | "downgrade_free_model";
  free_fallback_model: string;
  currency: string;
  current_daily_spend: number;
  current_monthly_spend: number;
  is_budget_exceeded: boolean;
  cost_by_model: Record<string, number>;
}

export interface UpdateGatewayRoutesPayload {
  primary_model: string;
  fallback_models: string[];
  latency_sla_ms?: number;
  cooldown_seconds?: number;
  retry_attempts?: number;
  daily_cost_budget?: number | null;
  monthly_cost_budget?: number | null;
  hard_limit_action?: string;
  free_fallback_model?: string;
  currency?: string;
}

// ── Milestone 94: NVIDIA NeMo Guardrails & Conversational Safety Rails ──────

export type GuardrailExecutionMode =
  | "off"
  | "fast_input_only"
  | "full_conversational"
  | "strict_factual";

export type GuardrailAction = "allow" | "steer" | "block" | "mask";

export interface ColangFlowDefinition {
  flow_id: string;
  name: string;
  description?: string;
  user_intents: string[];
  bot_responses: string[];
  raw_colang?: string;
  is_active: boolean;
  priority?: number;
}

export interface GuardrailRule {
  rule_id: string;
  name: string;
  category: string;
  description?: string;
  action: GuardrailAction;
  enabled: boolean;
  parameters?: Record<string, unknown>;
}

export interface GuardrailViolation {
  violation_id: string;
  tenant_id: string;
  timestamp: string;
  category: string;
  matched_flow_or_rule: string;
  action_taken: GuardrailAction;
  query_excerpt: string;
  severity: "low" | "medium" | "high" | "critical";
  latency_ms: number;
}

export interface GuardrailCheckResult {
  allowed: boolean;
  action: GuardrailAction;
  reason: string;
  rewritten_query?: string | null;
  bot_response?: string | null;
  matched_flow?: string | null;
  violations: GuardrailViolation[];
  latency_ms: number;
  grounding_score?: number | null;
}

export interface TenantGuardrailsConfig {
  tenant_id: string;
  mode: GuardrailExecutionMode;
  colang_script: string;
  active_flows: ColangFlowDefinition[];
  rules: GuardrailRule[];
  pii_redaction_enabled: boolean;
  competitor_shield_enabled: boolean;
  competitor_names: string[];
  brand_tone: string;
  grounding_threshold: number;
  fallback_response: string;
  updated_at?: string;
}

export interface GuardrailTelemetry {
  tenant_id: string;
  total_violations: number;
  total_blocked: number;
  total_steered: number;
  recent_violations: GuardrailViolation[];
  average_rail_latency_ms: number;
}

export interface ColangTemplate {
  name: string;
  description: string;
  colang: string;
  rules: Array<{
    rule_id: string;
    name: string;
    category: string;
    enabled: boolean;
  }>;
}

// ── Milestone 95: Durable Asynchronous Workflows & Jobs Types ───────────────

export type WorkflowStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface WorkflowStepRecord {
  step_id: string;
  execution_id: string;
  step_name: string;
  step_index: number;
  status: StepStatus;
  attempts: number;
  max_attempts: number;
  memoized_output: Record<string, unknown>;
  error_details?: string | null;
  execution_time_ms: number;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface WorkflowExecution {
  execution_id: string;
  tenant_id: string;
  workflow_name: string;
  status: WorkflowStatus;
  trigger_event?: string | null;
  idempotency_key?: string | null;
  input_payload: Record<string, unknown>;
  output_payload: Record<string, unknown>;
  total_steps: number;
  completed_steps: number;
  current_step_name?: string | null;
  error_message?: string | null;
  step_history: WorkflowStepRecord[];
  webhook_url?: string | null;
  started_at: string;
  completed_at?: string | null;
}

export interface WorkflowStepDefinition {
  name: string;
  description?: string;
  max_attempts: number;
  timeout_seconds: number;
}

export interface WorkflowDefinition {
  name: string;
  title: string;
  description: string;
  trigger_event?: string | null;
  concurrency_limit: number;
  max_step_retries: number;
  backoff_factor: number;
  initial_interval_seconds: number;
  steps: WorkflowStepDefinition[];
}

export interface WorkflowRunRequest {
  workflow_name: string;
  input_payload?: Record<string, unknown>;
  idempotency_key?: string | null;
  webhook_url?: string | null;
}

export interface WorkflowListResponse {
  items: WorkflowExecution[];
  total: number;
  limit: number;
  offset: number;
}

export interface WorkflowOverviewResponse {
  total_blueprints: number;
  blueprints: WorkflowDefinition[];
  engine_status: string;
  checkpoint_backend: string;
}

// ── Milestone 96: Serverless GPU Serving & Custom vLLM / LoRA Types ─────────

export type ServerlessProviderType = "modal" | "bentoml";
export type ServerlessGpuTier = "T4" | "L4" | "A10G" | "A100_40GB" | "A100_80GB" | "H100";

export interface LoraAdapterMetadata {
  adapter_id: string;
  tenant_id: string;
  name: string;
  base_model: string;
  artifact_uri: string;
  rank: number;
  alpha: number;
  target_modules: string[];
  adapter_type: string;
  description?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface WarmBootMetrics {
  container_init_time_ms: number;
  model_weights_load_time_ms: number;
  first_token_latency_ms: number;
  total_cold_start_time_ms: number;
  is_cold_start: boolean;
  probed_at?: string;
}

export interface ServerlessDeploymentStatus {
  provider: ServerlessProviderType;
  gpu_tier: ServerlessGpuTier;
  active_containers: number;
  min_containers: number;
  max_containers: number;
  scaledown_window_seconds: number;
  is_warm: boolean;
  endpoint_url?: string;
  current_active_model?: string;
  active_lora_adapters: string[];
  last_metrics?: WarmBootMetrics;
}

export interface ServerlessCostComparison {
  active_hours: number;
  gpu_tier: ServerlessGpuTier;
  hourly_gpu_rate_usd: number;
  serverless_monthly_cost_usd: number;
  dedicated_monthly_cost_usd: number;
  monthly_savings_usd: number;
  savings_percentage: number;
}




