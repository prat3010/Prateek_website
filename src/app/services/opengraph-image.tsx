import { createBrandOgImage } from '@/lib/ogCard';

export const runtime = 'nodejs';
export const alt = 'AI Engineering & Next.js SaaS Development Services | Prateeq Sharma';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return createBrandOgImage({
    badge: 'ENGINEERING SERVICES // DIRECT PARTNERSHIP',
    title: 'Custom RAG Systems, Next.js SaaS MVPs & AI Agents',
    subtitle:
      'Fixed-scope builds, 2–7 day quick sprints, transparent INR/USD pricing, and zero agency overhead.',
    pills: ['SAAS MVPS', 'PRIVATE RAG', 'VOICE AI BOTS', 'TECHNICAL SEO'],
    pathLabel: 'prateeq.in/services',
  });
}
