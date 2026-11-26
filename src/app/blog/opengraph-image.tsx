import { createBrandOgImage } from '@/lib/ogCard';

export const runtime = 'nodejs';
export const alt = 'Engineering Blog & Architecture Case Studies | Prateeq Sharma';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return createBrandOgImage({
    badge: 'ENGINEERING BLOG // CASE STUDIES',
    title: 'RAG Infrastructure, Next.js SaaS & Cost Breakdowns',
    subtitle:
      'Production architecture deep dives on pgvector RLS, zero-hallucination AI chatbots, and fixed-scope MVP engineering.',
    pills: ['PGVECTOR RAG', 'SAAS PRICING', 'NEXT.JS 16', 'AI ARCHITECTURE'],
    pathLabel: 'prateeq.in/blog',
  });
}
