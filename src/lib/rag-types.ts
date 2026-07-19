export interface SearchResult {
  chunkId: string;
  content: string;
  score: number;
  metadata: Record<string, string>;
}

export interface DocumentMeta {
  documentId: string;
  filename: string;
  status: string;
  createdAt: string;
}

export interface SearchResponse {
  results: SearchResult[];
  searchMeta?: {
    durationMs: number;
  };
}
