import { createBrandOgImage } from '@/lib/ogCard';
import { getPlaygroundItemBySlug } from '@/data/playgroundItems';

export const runtime = 'nodejs';
export const alt = 'The Playground | Prateeq Sharma';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = getPlaygroundItemBySlug(slug);

  if (!item) {
    return createBrandOgImage({
      badge: 'THE PLAYGROUND // PRATEEQ',
      title: 'Interactive SaaS & AI Engineering Lab',
      subtitle: 'Live micro-SaaS products, cognitive RAG tools, and canvas experiments by Prateeq Sharma.',
      pathLabel: 'prateeq.in/playground',
    });
  }

  return createBrandOgImage({
    badge: `THE PLAYGROUND // ${item.kind.toUpperCase()}`,
    title: item.title,
    subtitle: item.tagline,
    pills: (item.tags || []).slice(0, 4).map((t) => `#${t.toUpperCase()}`),
    pathLabel: `prateeq.in/playground/${item.slug}`,
  });
}
