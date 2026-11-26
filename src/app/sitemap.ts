import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/markdown';
import { getAllPlaygroundSlugs } from '@/data/playgroundItems';

function safeDate(value?: string): Date {
  if (!value) return new Date();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? new Date() : new Date(parsed);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  const playgroundSlugs = getAllPlaygroundSlugs();

  const postEntries = posts.map((post) => ({
    url: `https://prateeq.in/blog/${post.slug}`,
    lastModified: safeDate(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const playgroundEntries = playgroundSlugs.map((slug) => ({
    url: `https://prateeq.in/playground/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: 'https://prateeq.in',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: 'https://prateeq.in/services',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.95,
    },
    {
      url: 'https://prateeq.in/scoping',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://prateeq.in/rag',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://prateeq.in/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://prateeq.in/rag/benchmarks',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://prateeq.in/playground',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://prateeq.in/terminal',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://prateeq.in/privacy',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    ...postEntries,
    ...playgroundEntries,
  ];
}
