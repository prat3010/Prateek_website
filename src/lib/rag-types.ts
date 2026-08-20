export interface SearchResult {
  chunkId: string;
  documentId?: string;
  content: string;
  score: number;
  normalizedScore?: number;
  metadata?: Record<string, any>;
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
  output: string;
  steps_executed: number;
  execution_time_ms: number;
  status: string;
}

export interface OnlineEvaluationSummaryResponse {
  tenant_id: string;
  total_evaluations: number;
  avg_faithfulness: number;
  avg_context_relevance: number;
  hallucination_count: number;
}

