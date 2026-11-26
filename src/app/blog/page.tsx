import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/markdown';
import ComicPanel from '@/components/ui/ComicPanel';
import styles from './BlogList.module.css';

export const metadata: Metadata = {
  title: 'Engineering Blog & Architecture Case Studies | Prateeq Sharma',
  description: 'Technical deep dives on production RAG systems, Next.js SaaS MVP architecture, cost breakdowns, and AI infrastructure by Prateeq Sharma.',
  keywords: [
    'RAG Architecture Blog',
    'Next.js SaaS Cost Breakdown',
    'pgvector vs Pinecone',
    'AI Engineering Case Studies',
    'Prateeq Sharma Blog',
  ],
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Engineering Blog & Architecture Case Studies | Prateeq Sharma',
    description: 'Technical deep dives on production RAG systems, Next.js SaaS MVP architecture, and AI infrastructure.',
    type: 'website',
    url: 'https://prateeq.in/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Engineering Blog & Architecture Case Studies | Prateeq Sharma',
    description: 'Technical deep dives on production RAG systems, Next.js SaaS MVP architecture, and AI infrastructure.',
  },
};

export default async function BlogListing() {
  const posts = await getAllPosts();

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Blog',
        '@id': 'https://prateeq.in/blog#blog',
        name: 'Engineering Blog & Architecture Case Studies | Prateeq Sharma',
        description:
          'Technical deep dives on production RAG systems, Next.js SaaS MVP architecture, cost breakdowns, and AI infrastructure.',
        url: 'https://prateeq.in/blog',
        author: {
          '@type': 'Person',
          name: 'Prateeq Sharma',
          url: 'https://prateeq.in',
        },
        blogPost: posts.slice(0, 10).map((post) => ({
          '@type': 'BlogPosting',
          headline: post.title,
          datePublished: post.date,
          url: `https://prateeq.in/blog/${post.slug}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://prateeq.in' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://prateeq.in/blog' },
        ],
      },
    ],
  };

  return (
    <div className={styles.blogPage}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>LOG ENTRIES</h1>
          <p className={styles.subtitle}>
            Engineering notes, RAG infrastructure benchmarks, and fixed-scope SaaS architecture breakdowns
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem' }}>
            <Link href="/services" className="comic-btn comic-btn-outline">
              Services &amp; Pricing
            </Link>
            <Link href="/scoping" className="comic-btn comic-btn-blue">
              Launch Instant Scoping Lab
            </Link>
            <Link href="/rag" className="comic-btn comic-btn-outline">
              Retriever AI Engine
            </Link>
          </div>
        </div>

        {posts.length === 0 ? (
          <div className={styles.empty}>
            <p>No log entries published yet. Stay tuned!</p>
            <Link href="/" className={styles.homeLink}>Back to Base</Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {posts.map((post, index) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.cardLink}>
                <ComicPanel tilt={index % 2 === 0 ? 1 : -1} className={styles.postCard}>
                  <div className={styles.postMeta}>
                    <span className={styles.date}>{post.date}</span>
                  </div>
                  <h2 className={styles.postTitle}>{post.title}</h2>
                  <p className={styles.excerpt}>{post.excerpt}</p>
                  <div className={styles.tags}>
                    {post.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>#{tag}</span>
                    ))}
                  </div>
                </ComicPanel>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
