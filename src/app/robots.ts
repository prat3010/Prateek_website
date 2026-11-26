import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/dashboard/', '/login', '/rag/app', '/rag/login', '/analytics'],
    },
    sitemap: 'https://prateeq.in/sitemap.xml',
  };
}
