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

// ── Milestone 97: Autonomous FDE Metaprogrammer & Capability Studio Types ──

export type SolutionPersona = "business" | "fde_engineer";
export type PluginCategory =
  | "connectors"
  | "retrieval"
  | "agentic_tool"
  | "workflow_step"
  | "safety_defense"
  | "computation"
  | "system_extensibility";

export interface IntegrationHooksDeclaration {
  api_router?: string;
  battery_service?: boolean;
  agentic_tool?: {
    name: string;
    description: string;
    method_name?: string;
  };
  workflow_step?: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  category: PluginCategory;
  persona: SolutionPersona;
  description: string;
  algorithm_foundation: string;
  latency_profile: string;
  integration_hooks: IntegrationHooksDeclaration;
  required_secrets: string[];
  tenant_isolation: string;
}

export interface UseCaseRequirement {
  prompt: string;
  target_domain?: string;
  tenant_id?: string;
  persona?: SolutionPersona;
  preferred_stack?: string;
}

export interface RecommendedBatteryConfig {
  battery_id: string;
  battery_name: string;
  category: string;
  match_confidence: number;
  rationale: string;
  suggested_hyperparameters?: Record<string, unknown>;
  health_check_endpoint?: string;
}

export interface ScaffoldedFile {
  rel_path: string;
  content: string;
  module_type: "abstractions" | "service" | "adapter" | "router" | "test" | "manifest";
}

export interface AstValidationResult {
  is_valid: boolean;
  violations: string[];
  forbidden_imports_found: string[];
  type_annotations_present: boolean;
  syntax_valid: boolean;
  summary: string;
}

export interface ScaffoldingPlan {
  plugin_id: string;
  display_name: string;
  description: string;
  persona: SolutionPersona;
  manifest: PluginManifest;
  recommended_batteries: RecommendedBatteryConfig[];
  needs_custom_scaffold: boolean;
  scaffolded_files: ScaffoldedFile[];
  ast_audit_passed: boolean;
  ast_validation?: AstValidationResult;
  git_branch_name: string;
  pull_request_markdown: string;
}

export interface CustomPluginSummary {
  plugin_id: string;
  display_name: string;
  version: string;
  category: string;
  persona: string;
  description: string;
  is_active: boolean;
  hooks?: IntegrationHooksDeclaration;
  created_at?: string;
  updated_at?: string;
}

export interface ScaffoldingAnalysisResponse {
  persona: string;
  recommendations: RecommendedBatteryConfig[];
  needs_custom_scaffold: boolean;
  total_matched: number;
}

export interface ScaffoldingApplyResponse {
  success: boolean;
  applied: boolean;
  dry_run: boolean;
  plugin_id: string;
  files_written: string[];
  mounted: boolean;
}

// ============================================================================
// Milestone 98: Sovereign Edge SQLite & Offline-First Node Sync
// ============================================================================

export type EdgeNodeStatus = "online" | "offline" | "syncing";
export type OfflineExecutionTier = "hybrid_cache" | "local_slm" | "grounded_extraction" | "speculative_queue";

export interface EdgeNodeMetadata {
  node_id: string;
  tenant_id: string;
  device_name: string;
  platform: string;
  tier: OfflineExecutionTier;
  last_synced_seq: number;
  last_heartbeat_at: string;
  status: EdgeNodeStatus;
  vector_dimension?: number;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
}

export interface ChunkSyncItem {
  chunk_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  token_count: number;
  meta_data?: Record<string, unknown>;
  sequence_num?: number;
}

export interface VectorSyncItem {
  chunk_id: string;
  embedding: number[];
  dimension: number;
}

export interface EdgeSyncDelta {
  tenant_id: string;
  checkpoint_sequence: number;
  previous_sequence: number;
  added_chunks: ChunkSyncItem[];
  added_vectors: VectorSyncItem[];
  deleted_chunk_ids: string[];
  checksum_sha256: string;
  generated_at: string;
}

export interface EdgeBundleManifest {
  bundle_id: string;
  tenant_id: string;
  database_engine: string;
  total_documents: number;
  total_chunks: number;
  total_vectors: number;
  vector_dimension: number;
  checkpoint_sequence: number;
  checksum_sha256: string;
  created_at: string;
  file_size_bytes: number;
  bundle_path?: string;
  sqlite_version?: string;
}

export interface EdgeMutation {
  mutation_id: string;
  tenant_id: string;
  node_id: string;
  entity_type: string;
  action: string;
  payload: Record<string, unknown>;
  lamport_timestamp: number;
  device_timestamp: string;
}

export interface EdgeSyncConflictResolution {
  mutation_id: string;
  status: "applied" | "discarded" | "merged";
  cloud_sequence: number;
  resolution_strategy: string;
  message: string;
}

export interface EdgeSearchResultItem {
  chunk_id: string;
  document_id: string;
  content: string;
  score: number;
  vector_score: number;
  bm25_score: number;
  match_type: "vector" | "bm25" | "hybrid";
  meta_data?: Record<string, unknown>;
}

export interface EdgeSearchResponse {
  results: EdgeSearchResultItem[];
  total_hits: number;
  latency_ms: number;
  source: string;
  execution_tier: OfflineExecutionTier;
  synthesized_answer?: string | null;
}

// --- Milestone 99: Distributed Multi-Cloud Failover & Edge Turso LibSQL Replication ---

export type CloudRegion = "oci-bom" | "aws-iad" | "fly-fra" | "cf-global";
export type ClusterNodeRole = "primary_leader" | "standby_replica" | "edge_follower" | "degraded" | "offline";
export type QuorumState = "consensus_reached" | "quorum_lost" | "split_brain_avoided" | "election_in_progress";

export interface CloudRegionNode {
  node_id: string;
  cloud_provider: string;
  region: CloudRegion;
  endpoint_url: string;
  role: ClusterNodeRole;
  is_voting_member: boolean;
  priority_weight: number;
  latency_ms: number;
  consecutive_failures: number;
  last_heartbeat_at: string;
  metadata?: Record<string, unknown>;
}

export interface RegionHealthProbe {
  node_id: string;
  region: CloudRegion;
  probe_url: string;
  latency_ms: number;
  status_code: number;
  is_healthy: boolean;
  failure_reason?: string | null;
  probed_at: string;
  is_simulated: boolean;
}

export interface ClusterTopology {
  cluster_id: string;
  active_leader_region: CloudRegion;
  active_leader_node_id: string;
  generation_term: number;
  total_nodes: number;
  healthy_nodes: number;
  quorum_state: QuorumState;
  nodes: CloudRegionNode[];
  last_failover_at?: string | null;
  last_failover_reason?: string | null;
  environment_mode: string;
}

export interface FailoverRequest {
  target_region: CloudRegion;
  reason?: string;
  trigger_type?: string;
  force?: boolean;
  operator_id?: string;
}

export interface FailoverResult {
  success: boolean;
  old_leader: CloudRegion;
  new_leader: CloudRegion;
  generation_term: number;
  duration_ms: number;
  quorum_votes_acquired: number;
  total_voting_nodes: number;
  quorum_state: QuorumState;
  message: string;
  audit_event_id: string;
}

export interface LibsqlReplicaConfig {
  tenant_id: string;
  primary_url: string;
  replica_url: string;
  auth_token: string;
  sync_interval_seconds: number;
  read_local: boolean;
  write_proxy_to_primary: boolean;
  db_file_path: string;
  replication_engine: string;
}

export interface LibsqlReplicationStats {
  tenant_id: string;
  primary_wal_frame: number;
  local_wal_frame: number;
  replication_lag_frames: number;
  replication_lag_ms: number;
  sync_status: string;
  last_synced_at: string;
  is_embedded: boolean;
  writes_forwarded: number;
  reads_served_locally: number;
}

export interface MultiCloudClusterOverviewResponse {
  topology: ClusterTopology;
  active_battery: {
    id: string;
    name: string;
    status: string;
    algorithm_foundation: string;
    latency_profile: string;
    milestone: string;
    active_parameters?: Record<string, unknown>;
  };
  probes_summary: {
    total_nodes: number;
    healthy_count: number;
    voting_quorum_ratio: string;
    quorum_state: string;
    environment_mode: string;
  };
}

// ── Milestone 100: Sovereign Edge Voice & Local Whisper / WebRTC Speech Synthesis ──

export type VoiceAudioCodec = "pcm16" | "opus" | "wav" | "mp3";

export type VoiceSessionState =
  | "initializing"
  | "signaling"
  | "connected"
  | "listening"
  | "transcribing"
  | "thinking"
  | "speaking"
  | "disconnected";

export type VoiceTimbre =
  | "neural_natural"
  | "neural_fast"
  | "warm_conversational"
  | "crisp_authoritative";

export interface VoiceSessionConfig {
  tenant_id: string;
  user_id?: string;
  sample_rate_hz?: number;
  channels?: number;
  vad_sensitivity?: number;
  vad_silence_duration_ms?: number;
  selected_voice?: VoiceTimbre;
  audio_codec?: VoiceAudioCodec;
}

export interface VoiceSession {
  session_id: string;
  tenant_id: string;
  user_id: string;
  state: VoiceSessionState;
  config: VoiceSessionConfig;
  created_at: string;
  connected_at?: string | null;
  total_turns: number;
  last_ping_at: string;
  meta_data?: Record<string, unknown>;
}

export interface WebRtcSignalingMessage {
  session_id: string;
  message_type: string;
  sdp?: string | null;
  candidate?: string | null;
  sdp_mid?: string | null;
  sdp_mline_index?: number | null;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  duration_ms: number;
  is_final: boolean;
  words_count: number;
}

export interface SynthesizedAudioChunk {
  audio_bytes?: string;
  sample_rate_hz: number;
  chunk_index: number;
  duration_ms: number;
  is_last: boolean;
  format: VoiceAudioCodec;
}

export interface VoiceTurn {
  turn_id: string;
  session_id: string;
  tenant_id: string;
  user_transcript: string;
  agent_response_text: string;
  time_to_transcribe_ms: number;
  time_to_first_audio_byte_ms: number;
  total_turn_duration_ms: number;
  created_at: string;
}

export interface VoiceTurnResponse {
  turn: VoiceTurn;
  audio_base64: string;
  chunks_count: number;
}

export interface VoiceSessionTelemetry {
  active_sessions_count: number;
  average_turn_latency_ms: number;
  audio_frames_processed: number;
  vad_speech_events_count: number;
  whisper_engine: string;
  synthesis_engine: string;
}

// ── Milestone 114: Real-Time Audio Streaming & Full-Duplex Voice Agent ───────

export type VoiceStreamEventType =
  | "session_ready"
  | "vad_state"
  | "transcript_partial"
  | "transcript_final"
  | "agent_thinking"
  | "agent_text_delta"
  | "interrupted"
  | "turn_complete"
  | "error"
  | "ping"
  | "pong";

export interface VoiceStreamControlMessage {
  event_type: VoiceStreamEventType;
  session_id: string;
  payload: Record<string, unknown>;
}

export interface VoiceStreamCallbacks {
  onSessionReady?: (payload: { codec: string; sample_rate_hz: number; channels: number }) => void;
  onVadState?: (state: "speech_detected" | "endpoint_detected", payload: Record<string, unknown>) => void;
  onTranscript?: (transcript: { text: string; confidence: number; is_final: boolean; latency_ms?: number }) => void;
  onAgentThinking?: (payload: Record<string, unknown>) => void;
  onAgentTextDelta?: (delta: string) => void;
  onAgentAudioChunk?: (audioChunk: Uint8Array) => void;
  onInterrupted?: (event: { reason: string; cancelled_turn_id?: string; speech_frames?: number }) => void;
  onTurnComplete?: (turn: VoiceTurn) => void;
  onError?: (error: Error | string) => void;
  onClose?: () => void;
}

export interface VoiceStreamSession {
  sendAudioFrame: (frameBytes: Uint8Array | ArrayBuffer) => void;
  sendTextInput: (text: string) => void;
  interrupt: (reason?: string) => void;
  ping: () => void;
  close: () => void;
}


// ==========================================
// Model Context Protocol (MCP) Types
// ==========================================

export interface McpToolInputSchema {
  type: string;
  properties?: Record<string, unknown>;
  required?: string[];
}

export interface McpToolSummary {
  name: string;
  description: string;
  category: string;
  risk_level: string;
  requires_approval?: boolean;
  battery_id?: string | null;
  inputSchema?: McpToolInputSchema;
}

export interface McpClientSnippet {
  name: string;
  filename: string;
  language: string;
  code: string;
  description: string;
}

export interface McpConfigResponse {
  tenant_id: string;
  sse_endpoint: string;
  message_endpoint: string;
  total_tools: number;
  active_batteries: number;
  cursor_config: Record<string, unknown>;
  claude_desktop_config: Record<string, unknown>;
  cline_config: Record<string, unknown>;
  snippets: McpClientSnippet[];
}

export interface McpToolContentItem {
  type: string;
  text: string;
}

export interface McpToolExecutionResult {
  content: McpToolContentItem[];
  is_error: boolean;
  meta?: Record<string, unknown>;
}

// ── Milestone 104: Autonomous ReAct Tool Loop & Streaming Traces ──────────

export type ReActEventType =
  | "thought"
  | "tool_start"
  | "tool_done"
  | "self_healing"
  | "circuit_breaker"
  | "model_escalation"
  | "final_answer"
  | "error";

export interface ReActStreamEvent {
  event_id: string;
  event_type: ReActEventType;
  step_index: number;
  state: string;
  data: {
    thought?: string;
    call_id?: string;
    tool_name?: string;
    arguments?: Record<string, unknown>;
    output?: string;
    is_error?: boolean;
    latency_ms?: number;
    error?: string;
    recovery_action?: string;
    repeated_count?: number;
    warning?: string;
    final_answer?: string;
    total_steps?: number;
    execution_time_ms?: number;
    circuit_breaker_triggered?: boolean;
    status?: string;
    step?: number;
    max_turns?: number;
    from_model?: string;
    to_model?: string;
    reason?: string;
    details?: string;
    tier?: string;
  };
  timestamp: string;
}

export interface ReActTraceStep {
  stepIndex: number;
  thought?: string;
  toolCall?: {
    toolName: string;
    arguments: Record<string, unknown>;
  };
  toolResult?: {
    toolName: string;
    output: string;
    isError: boolean;
    latencyMs?: number;
    selfHealingApplied?: boolean;
  };
  selfHealing?: {
    toolName: string;
    error: string;
    recoveryAction: string;
  };
  circuitBreaker?: {
    toolName: string;
    warning: string;
  };
  modelEscalation?: {
    fromModel: string;
    toModel: string;
    reason: string;
    details?: string;
  };
}

// ── Milestone 105: Smart Tool Gateway & Multi-Model Economic Orchestrator ──

export type ModelTier = "mid_tier" | "frontier";

export type EscalationReason =
  | "step_count_threshold"
  | "unrecovered_tool_exception"
  | "self_healing_failed"
  | "circuit_breaker_warning"
  | "ambiguous_output"
  | "direct_override";

export interface TaskComplexity {
  score: number;
  tier_assigned: ModelTier;
  estimated_steps: number;
  rationale: string;
  requires_code_execution: boolean;
  requires_multi_hop: boolean;
  requires_mathematical_synthesis: boolean;
}

export interface EconomicLedgerRecord {
  tenant_id: string;
  thread_id: string;
  query_preview: string;
  mid_tier_tokens: number;
  frontier_tokens: number;
  total_tokens: number;
  actual_cost_usd: number;
  counterfactual_frontier_cost_usd: number;
  net_savings_usd: number;
  savings_percentage: number;
  escalated: boolean;
  escalation_reason?: EscalationReason | null;
  timestamp: string;
}

export interface EconomicLedgerSummary {
  tenant_id: string;
  total_queries: number;
  total_tokens: number;
  mid_tier_query_count: number;
  frontier_query_count: number;
  escalated_query_count: number;
  mid_tier_share_percentage: number;
  escalation_rate_percentage: number;
  total_actual_cost_usd: number;
  total_counterfactual_cost_usd: number;
  total_savings_usd: number;
  average_savings_percentage: number;
  records: EconomicLedgerRecord[];
}

// ============================================================================
// Milestone 108: Cognitive Agent Memory & Experience Distillation Types
// ============================================================================

export type MemoryType = "episodic" | "semantic" | "procedural";

export interface MemoryNode {
  id: string;
  tenant_id: string;
  memory_type: MemoryType;
  query: string;
  distilled_insight: string;
  tool_chain: string[];
  success: boolean;
  turns_count: number;
  importance_score: number;
  stability_score: number;
  retention_score?: number;
  last_accessed_at: number;
  access_count: number;
  created_at: number;
  metadata?: Record<string, unknown>;
}

export interface MemorySearchResult {
  node: MemoryNode;
  similarity_score: number;
  retention_score: number;
}

export interface DistilledGuidance {
  relevant_nodes: MemorySearchResult[];
  guidance_prompt: string;
  matched_tool_chains: string[][];
}

export interface MemoryStats {
  total_memories: number;
  episodic_count: number;
  semantic_count: number;
  procedural_count: number;
  avg_stability: number;
  total_access_count: number;
}

export interface ConsolidationRequestPayload {
  tenant_id: string;
  session_id?: string;
  query: string;
  turns: Array<{
    step_index?: number;
    thought?: string;
    tools_called?: string[];
    observation?: string;
  }>;
  final_answer?: string;
  success?: boolean;
}

export interface ConsolidationResponse {
  node_id: string;
  distilled_insight: string;
  importance_score: number;
  tool_chain: string[];
  memory_type: MemoryType;
  status: string;
}

// ── Milestone 109: Multi-Agent Swarm Quorum & Dynamic Debate Consensus ────

export type SwarmAgentRole = "planner" | "forensic_auditor" | "code_synthesizer" | "skeptic_critic";
export type DebateStance = "proposal" | "critique" | "rebuttal" | "synthesis";

export interface SwarmAgentProfile {
  role: SwarmAgentRole;
  display_name: string;
  avatar_icon: string;
  mandate: string;
  base_weight: number;
  domain_tags: string[];
  model_tier: string;
}

export interface CandidateClaim {
  claim_id: string;
  agent_role: SwarmAgentRole;
  statement: string;
  evidence_basis: string[];
  is_audited: boolean;
  is_verified: boolean;
  rejection_reason?: string | null;
  confidence_score: number;
}

export interface DebateTurn {
  turn_index: number;
  round_index: number;
  agent_role: SwarmAgentRole;
  stance: DebateStance;
  content: string;
  claims_proposed: CandidateClaim[];
  target_role?: SwarmAgentRole | null;
  confidence_score: number;
  timestamp: number;
}

export interface DebateRound {
  round_index: number;
  stage_name: string;
  turns: DebateTurn[];
  round_summary: string;
  active_disagreements: string[];
}

export interface AgentBallot {
  agent_role: SwarmAgentRole;
  candidate_id: string;
  confidence: number;
  rationale: string;
  weight: number;
}

export interface CandidateResolution {
  resolution_id: string;
  title: string;
  detailed_solution: string;
  supporting_roles: SwarmAgentRole[];
  weighted_score: number;
  quorum_met: boolean;
}

export interface QuorumConsensusResult {
  debate_id: string;
  tenant_id: string;
  prompt: string;
  active_roles: SwarmAgentRole[];
  rounds_completed: number;
  rounds: DebateRound[];
  candidate_resolutions: CandidateResolution[];
  winning_consensus: string;
  winning_resolution_id: string;
  consensus_confidence: number;
  quorum_reached: boolean;
  quorum_threshold: number;
  hallucinations_pruned: CandidateClaim[];
  execution_time_ms: number;
  created_at: number;
}

export interface SwarmDebateRequest {
  tenant_id: string;
  prompt: string;
  active_roles?: SwarmAgentRole[];
  max_rounds?: number;
  quorum_threshold?: number;
  domain_context?: string;
}

export interface SwarmStats {
  total_debates: number;
  quorum_success_rate: number;
  avg_debate_rounds: number;
  total_hallucinations_pruned: number;
  active_agent_count: number;
}

export interface SwarmDebateEvent {
  event_type: string;
  debate_id: string;
  round_index?: number;
  agent_role?: SwarmAgentRole;
  data: Record<string, unknown>;
  timestamp: number;
}

// ── Milestone 113: Multimodal Vision GraphRAG & Schematic Ingestion (Battery #29) ──

export interface VisionBoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  confidence?: number;
}

export interface VisualElement {
  element_id: string;
  label: string;
  element_type: string;
  bounding_box: VisionBoundingBox;
  confidence: number;
  properties?: Record<string, unknown>;
}

export interface VisualConnector {
  connector_id: string;
  source_element_id: string;
  target_element_id: string;
  label: string;
  directionality: string;
  protocol?: string;
  confidence: number;
}

export interface SchematicDiagram {
  diagram_id: string;
  filename: string;
  document_id?: string;
  page_number: number;
  width: number;
  height: number;
  elements: VisualElement[];
  connectors: VisualConnector[];
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface MultimodalGraphNode {
  id: string;
  label: string;
  node_type: string;
  element_type?: string;
  bounding_box?: VisionBoundingBox;
  diagram_id?: string;
  document_id?: string;
  metadata?: Record<string, unknown>;
}

export interface MultimodalGraphEdge {
  source: string;
  target: string;
  relation: string;
  protocol?: string;
  is_cross_modal: boolean;
  confidence: number;
}

export interface MultimodalGraphResponse {
  root_entity: string;
  nodes: MultimodalGraphNode[];
  edges: MultimodalGraphEdge[];
  cross_modal_links_count: number;
  triples_count: number;
  metadata?: Record<string, unknown>;
}

// ── Milestone 115: Distributed Model Context Protocol (MCP) Mesh & Agent Federation (Battery #30) ────

export type MeshNodeRole = "seed_gateway" | "sovereign_node" | "edge_enclave" | "remote_peer";
export type MeshNodeStatus = "online" | "degraded" | "standby" | "unreachable";
export type MeshRoutingPolicy = "local_first" | "lowest_latency" | "round_robin" | "failover" | "load_balanced_ewma";
export type FederatedTaskStatus = "pending" | "executing" | "completed" | "failed" | "rejected";

export interface MeshPeerNode {
  node_id: string;
  cluster_id: string;
  endpoint_url: string;
  role: MeshNodeRole;
  status: MeshNodeStatus;
  advertised_tools: McpToolSummary[];
  latency_ms: number;
  last_heartbeat: number;
  public_key_fingerprint?: string;
  metadata?: Record<string, unknown>;
  capacity?: NodeCapacityMetrics;
}

export interface MeshStatusSummary {
  battery_id: string;
  status: string;
  total_nodes: number;
  active_nodes: number;
  total_mesh_tools: number;
  routing_policy: MeshRoutingPolicy;
  nodes: MeshPeerNode[];
}

export interface FederatedDelegationResponse {
  delegation_id: string;
  status: FederatedTaskStatus;
  source_cluster_id: string;
  target_cluster_id: string;
  tenant_id: string;
  synthesis: string;
  tool_trace_summary: Record<string, unknown>[];
  execution_latency_ms: number;
  signature: string;
  error_message?: string | null;
}

// ── Milestone 116: Autonomous Mesh Dynamic Load-Balancing & Ephemeral Enclave Auto-Scaling (Battery #31) ────

export type AutoscalingAction = "scale_up" | "scale_down" | "shed_load" | "rebalance";

export interface NodeCapacityMetrics {
  cpu_utilization_pct: number;
  memory_utilization_pct: number;
  active_execution_slots: number;
  max_execution_slots: number;
  queue_depth: number;
  ewma_latency_ms: number;
  is_ephemeral: boolean;
  ephemeral_idle_seconds: number;
}

export interface AutoscalingPolicy {
  scale_up_utilization_pct: number;
  scale_up_queue_depth: number;
  scale_up_latency_ms: number;
  scale_down_idle_seconds: number;
  min_enclaves: number;
  max_ephemeral_enclaves: number;
  load_shedding_threshold_pct: number;
}

export interface AutoscalingEvent {
  event_id: string;
  timestamp: number;
  cluster_id: string;
  action: AutoscalingAction;
  reason: string;
  node_id?: string | null;
  trigger_metric: string;
  metric_value: number;
  details?: Record<string, unknown>;
}

export interface NodeLoadDetail {
  node_id: string;
  role: string;
  status: string;
  is_ephemeral: boolean;
  active_slots: number;
  max_slots: number;
  cpu_pct: number;
  ewma_latency_ms: number;
  queue_depth: number;
  idle_seconds: number;
}

export interface ClusterLoadMetrics {
  total_nodes: number;
  online_nodes: number;
  ephemeral_nodes: number;
  active_execution_slots: number;
  max_execution_slots: number;
  utilization_pct: number;
  avg_ewma_latency_ms: number;
  queue_depth: number;
  nodes: NodeLoadDetail[];
}

export interface ClusterLoadSummary {
  total_nodes: number;
  online_nodes: number;
  ephemeral_nodes: number;
  clusters: Record<string, ClusterLoadMetrics>;
}

// ── Milestone 117: Decentralized Multi-Tenant Vector Sharding & Raft Consensus Types ──

export type ShardStatus = "healthy" | "rebalancing" | "snapshot_sync" | "degraded" | "offline";
export type RaftRole = "leader" | "follower" | "candidate";
export type ReadQuorum = "local" | "one" | "quorum" | "all";
export type WriteQuorum = "one" | "quorum" | "all";

export interface ShardPartition {
  shard_id: string;
  tenant_id?: string | null;
  hash_range_start: number;
  hash_range_end: number;
  leader_node_id: string;
  replica_node_ids: string[];
  status: ShardStatus;
  vector_count: number;
  index_size_bytes: number;
  created_at: number;
  updated_at: number;
}

export interface ShardTopologyResponse {
  cluster_id: string;
  total_shards: number;
  replication_factor: number;
  shards: ShardPartition[];
  skew_metrics: {
    cluster_id?: string;
    node_distribution?: Record<string, number>;
    mean_vectors_per_node?: number;
    skew_std_dev?: number;
    is_skewed?: boolean;
    [key: string]: unknown;
  };
}

export interface RaftLogEntry {
  index: number;
  term: number;
  command_type: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

export interface RaftNodeState {
  node_id: string;
  current_term: number;
  voted_for?: string | null;
  role: RaftRole;
  commit_index: number;
  last_applied: number;
  leader_id?: string | null;
  log_length: number;
  heartbeat_timestamp: number;
}

export interface RaftConsensusStatus {
  cluster_id: string;
  current_term: number;
  active_leader_id?: string | null;
  total_nodes: number;
  leader_elected: boolean;
  quorum_healthy: boolean;
  nodes: RaftNodeState[];
  recent_log_entries: RaftLogEntry[];
}

export interface ScatterGatherQuery {
  tenant_id: string;
  query_vector: number[];
  top_k?: number;
  read_quorum?: ReadQuorum;
  filter_metadata?: Record<string, unknown>;
}

export interface ShardCandidate {
  chunk_id: string;
  score: number;
  text: string;
  metadata: Record<string, unknown>;
  shard_id: string;
  node_id: string;
}

export interface ShardQueryBreakdown {
  shard_id: string;
  node_id: string;
  latency_ms: number;
  candidates_count: number;
  status: string;
}

export interface ScatterGatherResponse {
  query_id: string;
  tenant_id: string;
  total_shards_queried: number;
  successful_shards: number;
  quorum_achieved: boolean;
  total_latency_ms: number;
  shard_breakdown: ShardQueryBreakdown[];
  results: ShardCandidate[];
}

export interface ShardMutationRequest {
  tenant_id: string;
  document_id: string;
  vectors: {
    chunk_id?: string;
    vector: number[];
    text?: string;
    metadata?: Record<string, unknown>;
  }[];
  write_quorum?: WriteQuorum;
}

export interface ShardMutationResponse {
  shard_id: string;
  committed_log_index: number;
  term: number;
  vectors_written: number;
  quorum_achieved: boolean;
  elapsed_ms: number;
}

export interface ShardRebalancePlan {
  plan_id: string;
  source_node_id: string;
  target_node_id: string;
  shard_id: string;
  status: string;
  vectors_transferred: number;
  total_vectors: number;
  start_time: number;
  completion_time?: number | null;
  error_message?: string | null;
}

// --- Zero-Knowledge Proof (ZKP) Vector Attestation Types (M118) ---

export interface ZkpHealthResponse {
  battery_id: string;
  status: string;
  authority_public_key: string;
  hash_algorithm: string;
  signature_algorithm: string;
  merkle_tree_padding: string;
  zero_knowledge_commitments: boolean;
  public_verification_endpoint: string;
}

export interface MerkleProofStep {
  sibling_hash: string;
  direction: "left" | "right";
}

export interface ChunkMerkleProof {
  chunk_id: string;
  chunk_index: number;
  leaf_hash: string;
  merkle_path: MerkleProofStep[];
  document_root: string;
}

export interface ChunkCommitment {
  chunk_id: string;
  chunk_index: number;
  leaf_hash: string;
  merkle_proof: MerkleProofStep[];
  similarity_score?: number;
}

export interface DocumentMerkleRoot {
  document_id: string;
  tenant_id: string;
  root_hash: string;
  chunk_count: number;
  tree_depth: number;
  computed_at: number;
}

export interface ZkpGroundingCertificate {
  certificate_id: string;
  tenant_id: string;
  document_id: string;
  document_merkle_root: string;
  query_hash: string;
  response_hash: string;
  similarity_bound: number;
  chunk_commitments: ChunkCommitment[];
  issued_at: number;
  expires_at?: number | null;
  authority_public_key: string;
  attestation_signature: string;
}

export interface GroundingVerificationResult {
  status:
    | "verified"
    | "root_mismatch"
    | "proof_invalid"
    | "query_mismatch"
    | "response_mismatch"
    | "signature_invalid"
    | "certificate_expired";
  is_valid: boolean;
  details: string;
  verified_at: number;
  checked_leaf_count: number;
  merkle_root_matched: boolean;
  signature_valid: boolean;
  query_match: boolean;
  response_match: boolean;
  execution_time_ms: number;
}

export interface IssueCertificatePayload {
  document_id: string;
  query: string;
  response: string;
  cited_chunks: Record<string, unknown>[];
  all_document_chunks: Record<string, unknown>[];
  similarity_bound?: number;
  ttl_seconds?: number;
}

export interface VerifyCertificatePayload {
  certificate: ZkpGroundingCertificate;
  query?: string;
  response?: string;
  expected_document_root?: string;
}

// --- Enterprise Identity Federation & RB-VAC (M119, Battery #34) ---

export interface SamlIdpConfig {
  tenant_id: string;
  idp_entity_id: string;
  sso_url: string;
  idp_x509_cert: string;
  sp_entity_id?: string;
  acs_url?: string;
  attribute_mapping?: Record<string, string>;
  default_groups?: string[];
  enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SamlAssertionPayload {
  tenant_id: string;
  name_id: string;
  session_index: string;
  attributes: Record<string, unknown>;
  security_groups: string[];
  issuer: string;
  issue_instant: string;
  valid_until: string;
  is_verified: boolean;
}

export interface ScimMeta {
  resourceType: string;
  created: string;
  lastModified: string;
  location?: string;
  version?: string;
}

export interface ScimEmail {
  value: string;
  primary?: boolean;
  type?: string;
}

export interface ScimUser {
  schemas?: string[];
  id: string;
  externalId?: string | null;
  userName: string;
  displayName?: string | null;
  active: boolean;
  emails?: ScimEmail[];
  groups?: Array<Record<string, string>>;
  meta?: ScimMeta;
}

export interface ScimGroupMember {
  value: string;
  display?: string | null;
  ref?: string | null;
}

export interface ScimGroup {
  schemas?: string[];
  id: string;
  displayName: string;
  members: ScimGroupMember[];
  meta?: ScimMeta;
}

export interface ScimListResponse<T> {
  schemas: string[];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: T[];
}

export interface RbVacCandidateChunk {
  chunk_id: string;
  document_id: string;
  content: string;
  score: number;
  acl_groups: string[];
  classification: string;
}

export interface RbVacPrunedTelemetry {
  chunk_id: string;
  document_id: string;
  required_acl_groups: string[];
  user_groups: string[];
  similarity_score: number;
  reason: string;
}

export interface RbVacSimulationResult {
  tenant_id: string;
  user_id: string;
  user_groups: string[];
  total_candidates: number;
  allowed_candidates: RbVacCandidateChunk[];
  pruned_telemetry: RbVacPrunedTelemetry[];
  execution_time_ms: number;
}

// --- Continuous DPO / ORPO Preference Fine-Tuning Types (M120 / Battery #35) ---

export type TuningObjective = "dpo" | "orpo" | "kto";
export type TuningJobStatus =
  | "collecting"
  | "queued"
  | "training"
  | "evaluating"
  | "completed"
  | "failed"
  | "rolled_back";

export interface PreferencePair {
  pair_id: string;
  tenant_id: string;
  prompt: string;
  winning_response: string;
  losing_response: string;
  source_message_id?: string | null;
  feedback_rating: number;
  tags: string[];
  is_verified: boolean;
  created_at: string;
}

export interface PreferenceListResponse {
  items: PreferencePair[];
  total: number;
  limit: number;
  offset: number;
}

export interface TuningHyperparameters {
  learning_rate: number;
  beta: number;
  lambda_orpo: number;
  lora_r: number;
  lora_alpha: number;
  batch_size: number;
  epochs: number;
  auto_trigger_threshold: number;
  eval_split_ratio: number;
}

export interface TuningLossStep {
  step: number;
  epoch: number;
  train_loss: number;
  reward_margin: number;
  accuracy: number;
  odds_ratio: number;
}

export interface EvaluationGateResult {
  passed: boolean;
  validation_accuracy: number;
  avg_reward_margin: number;
  validation_loss: number;
  total_eval_pairs: number;
  recommendation: string;
}

export interface ContinuousTuningConfig {
  tenant_id: string;
  objective: TuningObjective;
  base_model: string;
  active_adapter_id?: string | null;
  auto_train_enabled: boolean;
  hyperparameters: TuningHyperparameters;
  total_pairs_harvested: number;
  active_pairs_in_buffer: number;
}

export interface TuningJob {
  job_id: string;
  tenant_id: string;
  objective: TuningObjective;
  status: TuningJobStatus;
  base_model: string;
  output_adapter_id: string;
  dataset_size: number;
  hyperparameters: TuningHyperparameters;
  loss_history: TuningLossStep[];
  evaluation?: EvaluationGateResult | null;
  created_at: string;
  completed_at?: string | null;
  error_message?: string | null;
}

export interface TuningMathSimulationResult {
  prompt: string;
  beta: number;
  lambda_orpo: number;
  pi_theta_win_prob: number;
  pi_ref_win_prob: number;
  pi_theta_lose_prob: number;
  pi_ref_lose_prob: number;
  dpo_reward_w: number;
  dpo_reward_l: number;
  dpo_reward_margin: number;
  dpo_loss: number;
  orpo_odds_w: number;
  orpo_odds_l: number;
  orpo_odds_ratio: number;
  orpo_loss: number;
}











