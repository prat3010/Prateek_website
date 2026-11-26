import { type RagRequestContext } from "./http";

export async function search(ctx: RagRequestContext, query: string, options?: { limit?: number; enableQueryRewriting?: boolean; enableHybrid?: boolean; strategy?: string; hybridAlpha?: number; enableLoraAdapter?: boolean; rerankerEngine?: "cohere" | "colbert" | "none"; enableColbertRerank?: boolean }) {
  const limit = options?.limit ?? 5;
  return ctx.request<import("../rag-types").SearchResponse>(`/v1/tenants/${ctx.config.tenantId}/search`, {
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


export async function listDocuments(ctx: RagRequestContext) {
  return ctx.request<import("../rag-types").DocumentMeta[]>(`/v1/tenants/${ctx.config.tenantId}/documents`);
}


export async function uploadDocument(ctx: RagRequestContext, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return ctx.request<{ documentId: string; status: string }>(`/v1/tenants/${ctx.config.tenantId}/documents`, {
    method: "POST",
    body: formData,
  });
}

export async function extractDocument<T = Record<string, unknown>>(
  ctx: RagRequestContext,
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
  return ctx.request<{ data: T; provider?: string; model?: string; inputTokens?: number; outputTokens?: number }>(
    `/v1/tenants/${ctx.config.tenantId}/documents/${documentId}/extract`,
    {
      method: "POST",
      body: JSON.stringify({ json_schema: schemaObj, model }),
    }
  );
}



export async function deleteDocument(ctx: RagRequestContext, documentId: string) {
  return ctx.request(`/v1/tenants/${ctx.config.tenantId}/documents/${documentId}`, {
    method: "DELETE",
  });
}


export async function getDownloadUrl(ctx: RagRequestContext, documentId: string): Promise<{ downloadUrl: string }> {
  return ctx.request<{ downloadUrl: string }>(
    `/v1/tenants/${ctx.config.tenantId}/documents/${documentId}/download-url`
  );
}


export async function purgeCache(ctx: RagRequestContext): Promise<{ status: string; purged: boolean; deleted_count?: number }> {
  return ctx.request<{ status: string; purged: boolean; deleted_count?: number }>(
    `/v1/tenants/${ctx.config.tenantId}/cache/purge`,
    {
      method: "POST",
    }
  );
}


export async function getCacheStats(ctx: RagRequestContext): Promise<{ status: string; total_vectors: number }> {
  return ctx.request<{ status: string; total_vectors: number }>(
    `/v1/tenants/${ctx.config.tenantId}/cache/stats`,
    {
      method: "GET",
    }
  );
}


export async function compressContext(ctx: RagRequestContext, text: string, compressionRatio = 0.5): Promise<import("../rag-types").CompressionResponse> {
  return ctx.request<import("../rag-types").CompressionResponse>(
    `/v1/tenants/${ctx.config.tenantId}/context/compress`,
    {
      method: "POST",
      body: JSON.stringify({ text, target_ratio: compressionRatio }),
    }
  );
}


export async function projectEmbeddings(ctx: RagRequestContext, 
  options?: import("../rag-types").EmbeddingProjectionRequest
): Promise<import("../rag-types").EmbeddingProjectionResponse> {
  return ctx.request<import("../rag-types").EmbeddingProjectionResponse>(
    `/v1/tenants/${ctx.config.tenantId}/embeddings/project`,
    {
      method: "POST",
      body: JSON.stringify(options || {}),
    }
  );
}


export async function extractSchematicText(ctx: RagRequestContext, 
  content: string,
  filename: string = "architecture.svg",
  documentId?: string
): Promise<import("../rag-types").SchematicDiagram> {
  return ctx.request<import("../rag-types").SchematicDiagram>(
    `/v1/tenants/${ctx.config.tenantId}/vision/schematic/extract-text`,
    {
      method: "POST",
      body: JSON.stringify({ content, filename, document_id: documentId }),
    }
  );
}


export async function getDocumentSchematics(ctx: RagRequestContext, 
  documentId: string
): Promise<{ document_id: string; total_triples: number; triples: import("../rag-types").EntityTripleItem[] }> {
  return ctx.request<{ document_id: string; total_triples: number; triples: import("../rag-types").EntityTripleItem[] }>(
    `/v1/tenants/${ctx.config.tenantId}/vision/schematics/${encodeURIComponent(documentId)}`
  );
}


export async function getMultimodalVisionStatus(ctx: RagRequestContext): Promise<{
  battery_id: string;
  status: string;
  version: string;
  milestone: string;
}> {
  return ctx.request<{
    battery_id: string;
    status: string;
    version: string;
    milestone: string;
  }>("/v1/graph/multimodal/status");
}

// ── Decentralized Vector Sharding & Distributed Raft Consensus (Battery #32 / M117) ──


