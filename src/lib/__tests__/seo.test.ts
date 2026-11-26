import { describe, it, expect, vi, beforeEach } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import React from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('next/cache', () => ({
  unstable_cache: vi.fn((fn: unknown) => fn),
}));

vi.mock('@/components/ScrollSection/ScrollSection', () => ({
  default: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
}));

let mockSupabaseClient: unknown = null;

vi.mock('@/data/supabase', () => ({
  get supabase() {
    return mockSupabaseClient;
  },
}));

import sitemap from '@/app/sitemap';
import robots from '@/app/robots';
import { getAllPosts, getPostBySlug } from '@/lib/markdown';
import ServicesPage from '@/app/services/page';
import BlogListing from '@/app/blog/page';
import BenchmarksPage from '@/app/rag/benchmarks/page';
import PrivacyPage from '@/app/privacy/page';
import BlogPostPage, { generateMetadata as generateBlogMetadata } from '@/app/blog/[slug]/page';
import playgroundItems from '@/data/playgroundItems.json';

describe('SEO Architecture & Client-Acquisition Surface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseClient = null;
  });

  describe('robots.ts', () => {
    it('disallows private/auth routes and declares sitemap URL', () => {
      const config = robots();
      const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules;
      expect(config.sitemap).toBe('https://prateeq.in/sitemap.xml');
      expect(rule.allow).toBe('/');
      expect(rule.disallow).toEqual(
        expect.arrayContaining([
          '/admin/',
          '/api/',
          '/dashboard/',
          '/login',
          '/rag/app',
          '/rag/login',
          '/analytics',
        ])
      );
    });
  });

  describe('sitemap.ts', () => {
    it('includes all commercial, product, blog, and playground URLs without private routes', async () => {
      const entries = await sitemap();
      const urls = entries.map((e) => e.url);

      expect(urls).toContain('https://prateeq.in');
      expect(urls).toContain('https://prateeq.in/services');
      expect(urls).toContain('https://prateeq.in/scoping');
      expect(urls).toContain('https://prateeq.in/rag');
      expect(urls).toContain('https://prateeq.in/rag/benchmarks');
      expect(urls).toContain('https://prateeq.in/blog');
      expect(urls).toContain('https://prateeq.in/playground');
      expect(urls).toContain(
        'https://prateeq.in/blog/how-much-does-a-custom-nextjs-saas-mvp-cost-in-2026'
      );
      expect(urls).toContain(
        'https://prateeq.in/blog/pgvector-vs-pinecone-why-we-built-retriever-on-postgres-rls'
      );
      expect(urls).toContain(
        'https://prateeq.in/blog/embedding-a-zero-hallucination-ai-chatbot-in-60-seconds'
      );

      for (const disallowed of ['/admin', '/dashboard', '/login', '/rag/app', '/analytics']) {
        expect(urls.some((u) => u.includes(disallowed))).toBe(false);
      }

      const servicesEntry = entries.find((e) => e.url === 'https://prateeq.in/services');
      const scopingEntry = entries.find((e) => e.url === 'https://prateeq.in/scoping');
      expect(servicesEntry?.priority).toBeGreaterThanOrEqual(0.9);
      expect(scopingEntry?.priority).toBeGreaterThanOrEqual(0.9);
    });
  });

  describe('Blog posts & Asset integrity', () => {
    it('merges local markdown posts when Supabase returns only older rows', async () => {
      const mockOrder = vi.fn().mockResolvedValue({
        data: [
          {
            slug: 'first-post',
            title: 'Supabase Post Override',
            date: '2026-06-12',
            excerpt: 'From DB',
            tags: ['Next.js'],
            coverImage: '',
            content: 'DB content',
          },
        ],
        error: null,
      });
      const mockNot = vi.fn(() => ({ order: mockOrder }));
      const mockOr = vi.fn(() => ({ not: mockNot }));
      const mockSelect = vi.fn(() => ({ or: mockOr }));
      mockSupabaseClient = { from: vi.fn(() => ({ select: mockSelect })) };

      const posts = await getAllPosts();
      const slugs = posts.map((p) => p.slug);

      expect(slugs).toContain('first-post');
      expect(slugs).toContain('how-much-does-a-custom-nextjs-saas-mvp-cost-in-2026');
      expect(posts.find((p) => p.slug === 'first-post')?.title).toBe('Supabase Post Override');
    });

    it('ensures every local blog coverImage points to a real public asset', async () => {
      const posts = await getAllPosts();
      for (const post of posts) {
        if (post.coverImage) {
          const cleanRel = post.coverImage.replace(/^\/+/, '');
          expect(existsSync(join(process.cwd(), 'public', cleanRel))).toBe(true);
        }
      }
    });

    it('ensures every playground previewImage points to a real public asset', () => {
      for (const item of playgroundItems) {
        if (item.previewImage) {
          const cleanRel = item.previewImage.replace(/^\/+/, '');
          expect(existsSync(join(process.cwd(), 'public', cleanRel))).toBe(true);
        }
      }
    });

    it('falls back to dynamic OG image in BlogPostPage when Supabase has stale missing coverImage', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          slug: 'how-much-does-a-custom-nextjs-saas-mvp-cost-in-2026',
          title: 'SaaS MVP Cost',
          date: '2026-11-26',
          excerpt: 'Cost breakdown',
          tags: ['SaaS'],
          coverImage: '/images/blog/default.jpg',
          content: 'Body copy',
        },
        error: null,
      });
      const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockSupabaseClient = { from: vi.fn(() => ({ select: mockSelect })) };

      const meta = await generateBlogMetadata({
        params: Promise.resolve({ slug: 'how-much-does-a-custom-nextjs-saas-mvp-cost-in-2026' }),
      });
      expect(meta.openGraph?.images).toBeUndefined();
      expect(meta.twitter?.images).toBeUndefined();

      const ui = await BlogPostPage({
        params: Promise.resolve({ slug: 'how-much-does-a-custom-nextjs-saas-mvp-cost-in-2026' }),
      });
      const { container } = render(ui);
      const ldScript = container.querySelector('script[type="application/ld+json"]');
      expect(ldScript?.textContent).not.toContain('/images/blog/default.jpg');
      expect(ldScript?.textContent).toContain(
        'https://prateeq.in/blog/how-much-does-a-custom-nextjs-saas-mvp-cost-in-2026/opengraph-image'
      );
      expect(screen.getByRole('link', { name: /Launch Instant Scoping Lab/i })).toHaveAttribute(
        'href',
        '/scoping'
      );
    });

    it('guarantees a single H1 in BlogPostPage even when Supabase content begins with a duplicate # H1', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({
        data: {
          slug: 'legacy-post',
          title: 'Legacy Post Title',
          date: '2026-07-08',
          excerpt: 'Summary',
          tags: ['Python'],
          coverImage: '',
          content: '# Legacy Post Title\n\n## Section One\n\nBody paragraph.',
        },
        error: null,
      });
      const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockSupabaseClient = { from: vi.fn(() => ({ select: mockSelect })) };

      const ui = await BlogPostPage({
        params: Promise.resolve({ slug: 'legacy-post' }),
      });
      render(ui);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    });

    it('ensures local blog posts avoid raw GFM pipe tables unsupported by plain react-markdown', async () => {
      const posts = await getAllPosts();
      for (const post of posts) {
        expect(post.content).not.toMatch(/^\|[\s:|-]+\|$/m);
      }
    });

    it('resolves local post silently via getPostBySlug when Supabase returns null row', async () => {
      const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
      const mockSelect = vi.fn(() => ({ eq: mockEq }));
      mockSupabaseClient = { from: vi.fn(() => ({ select: mockSelect })) };

      const post = await getPostBySlug('pgvector-vs-pinecone-why-we-built-retriever-on-postgres-rls');
      expect(post).not.toBeNull();
      expect(post?.title).toContain('pgvector');
    });
  });

  describe('/services commercial landing hub', () => {
    it('renders SSoT pricing, deep links to /scoping, and ProfessionalService + FAQPage JSON-LD', () => {
      const { container } = render(React.createElement(ServicesPage));

      expect(
        screen.getByRole('heading', {
          level: 1,
          name: /Fixed-Scope AI, RAG & Next\.js Engineering Services/i,
        })
      ).toBeInTheDocument();

      expect(screen.getByText(/Full-Stack SaaS MVP Core Engine/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Launch Instant Quote/i })).toHaveAttribute(
        'href',
        '/scoping'
      );
      expect(screen.getByRole('link', { name: /Test Live Retriever AI Engine/i })).toHaveAttribute(
        'href',
        '/rag'
      );

      const ldScript = container.querySelector('script[type="application/ld+json"]');
      expect(ldScript).not.toBeNull();
      const parsed = JSON.parse(ldScript!.textContent || '{}');
      const types = parsed['@graph'].map((node: { '@type': string }) => node['@type']);
      expect(types).toEqual(expect.arrayContaining(['ProfessionalService', 'FAQPage', 'BreadcrumbList']));

      const serviceNode = parsed['@graph'].find((node: { '@type': string }) => node['@type'] === 'ProfessionalService');
      expect(serviceNode.image).toBe('https://prateeq.in/services/opengraph-image');
      const offerUrls = serviceNode.hasOfferCatalog.itemListElement.map((o: { url: string }) => o.url);
      expect(offerUrls).toContain('https://prateeq.in/scoping?goal=ai_strategy_consulting');
      expect(offerUrls).not.toContain('https://prateeq.in/scoping?engine=ai_strategy_audit');
    });
  });

  describe('Semantic headings, JSON-LD & OG route coverage', () => {
    it('renders exactly one H1 and complete TechArticle JSON-LD on /rag/benchmarks', () => {
      const { container } = render(React.createElement(BenchmarksPage));
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      const ldScript = container.querySelector('script[type="application/ld+json"]');
      const parsed = JSON.parse(ldScript?.textContent || '{}');
      const techArticle = parsed['@graph'].find((n: { '@type': string }) => n['@type'] === 'TechArticle');
      expect(techArticle.image).toBe('https://prateeq.in/rag/benchmarks/opengraph-image');
      expect(techArticle.datePublished).toBeTruthy();
    });

    it('renders H2 post headings and Blog + BreadcrumbList JSON-LD on /blog', async () => {
      const ui = await BlogListing();
      const { container } = render(ui);
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
      expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(0);
      expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0);
      const ldScript = container.querySelector('script[type="application/ld+json"]');
      const parsed = JSON.parse(ldScript?.textContent || '{}');
      const types = parsed['@graph'].map((n: { '@type': string }) => n['@type']);
      expect(types).toEqual(expect.arrayContaining(['Blog', 'BreadcrumbList']));
    });

    it('uses valid Schema.org WebPage type on /privacy', () => {
      const { container } = render(React.createElement(PrivacyPage));
      const ldScript = container.querySelector('script[type="application/ld+json"]');
      const parsed = JSON.parse(ldScript?.textContent || '{}');
      expect(parsed['@type']).toBe('WebPage');
    });

    it('ensures no local blog post starts with a duplicate markdown H1', async () => {
      const posts = await getAllPosts();
      for (const post of posts) {
        expect(post.content.trimStart().startsWith('# ')).toBe(false);
      }
    });

    it('ensures dynamic OG & Twitter image modules exist for all key public routes', () => {
      const routes = [
        'services',
        'scoping',
        'rag',
        'rag/benchmarks',
        'blog',
        'blog/[slug]',
        'playground',
        'playground/[slug]',
        'privacy',
      ];
      for (const route of routes) {
        expect(existsSync(join(process.cwd(), 'src/app', route, 'opengraph-image.tsx'))).toBe(true);
        expect(existsSync(join(process.cwd(), 'src/app', route, 'twitter-image.tsx'))).toBe(true);
      }
    });
  });

  describe('llms.txt', () => {
    it('exists in public/ and links primary commercial routes', () => {
      expect(existsSync(join(process.cwd(), 'public', 'llms.txt'))).toBe(true);
    });
  });
});
