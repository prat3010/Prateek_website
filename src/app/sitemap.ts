import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/markdown';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  const postEntries = posts.map((post) => ({
    url: `https://prateeq.in/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [
    {
      url: 'https://prateeq.in',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1.0,
    },
    {
      url: 'https://prateeq.in/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://prateeq.in/terminal',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://prateeq.in/rag',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    ...postEntries,
  ];
}
