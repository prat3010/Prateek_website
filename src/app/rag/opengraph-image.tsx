import { createBrandOgImage } from '@/lib/ogCard';

export const runtime = 'nodejs';
export const alt = 'Retriever AI — Enterprise Hybrid RAG Engine & 1-Line Embed Chatbot';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return createBrandOgImage({
    badge: 'RETRIEVER AI // ENTERPRISE RAG',
    title: 'Production AI Knowledge Engine in 60 Seconds',
    subtitle:
      'PostgreSQL + pgvector HNSW, hybrid BM25 search, $0 local Ollama embeddings, verifiable citations, and a 1-line script embed.',
    pills: ['PGVECTOR RLS', '$0 LOCAL EMBEDDINGS', '~272MS EDGE P50', '1-LINE EMBED'],
    pathLabel: 'prateeq.in/rag',
  });
}
