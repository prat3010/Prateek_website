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
  answer: string;
  generator_model: string;
  critic_model: string;
  iterations: number;
  consensus_score: number;
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
  tenant_id: string;
  total_evaluations: number;
  avg_faithfulness: number;
  avg_context_relevance: number;
  hallucination_count: number;
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



