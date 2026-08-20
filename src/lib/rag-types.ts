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
