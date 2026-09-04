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
