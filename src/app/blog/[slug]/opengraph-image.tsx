import { createBrandOgImage } from '@/lib/ogCard';
import { getPostBySlug } from '@/lib/markdown';

export const runtime = 'nodejs';
export const alt = 'Engineering Log | Prateeq Sharma';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return createBrandOgImage({
      badge: 'ENGINEERING LOG // PRATEEQ',
      title: 'Technical Architecture & AI Engineering',
      subtitle: 'Deep dives on RAG infrastructure, Next.js SaaS architecture, and production systems.',
      pathLabel: 'prateeq.in/blog',
    });
  }

  return createBrandOgImage({
    badge: `ENGINEERING LOG${post.date ? ` // ${post.date}` : ''}`,
    title: post.title,
    subtitle: post.excerpt || 'Architecture notes and production engineering deep dives by Prateeq Sharma.',
    pills: post.tags.slice(0, 4).map((t) => `#${t.toUpperCase()}`),
    pathLabel: `prateeq.in/blog/${post.slug}`,
  });
}
