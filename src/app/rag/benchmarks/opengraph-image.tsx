import { createBrandOgImage } from '@/lib/ogCard';

export const runtime = 'nodejs';
export const alt = 'Retriever AI — Empirical Load & Latency Benchmarks | Prateeq Sharma';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return createBrandOgImage({
    badge: 'GATE 10 ZERO-TOY TELEMETRY // ORACLE VPS',
    title: 'Retriever AI Production Load & Latency Benchmarks',
    subtitle:
      'Verified concurrent virtual user sweeps (5–20 VUs) against PostgreSQL 16 pgvector HNSW and FastAPI over public HTTPS.',
    pills: ['0.0% ERR @ 10 VU', '272MS EDGE P50', 'PGVECTOR HNSW', 'ORACLE CLOUD'],
    pathLabel: 'prateeq.in/rag/benchmarks',
  });
}
