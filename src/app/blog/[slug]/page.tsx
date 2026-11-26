import React from 'react';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { getPostBySlug, getAllPosts } from '@/lib/markdown';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import styles from './BlogPost.module.css';

function resolveValidCoverImage(coverImage?: string): string | null {
  if (!coverImage) return null;
  if (coverImage.startsWith('http://') || coverImage.startsWith('https://')) {
    return coverImage;
  }
  const cleanRel = coverImage.replace(/^\/+/, '');
  return existsSync(join(process.cwd(), 'public', cleanRel))
    ? `https://prateeq.in/${cleanRel}`
    : null;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {};
  }

  const validCover = resolveValidCoverImage(post.coverImage);

  return {
    title: `${post.title} | Prateeq Sharma`,
    description: post.excerpt,
    keywords: post.tags,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `https://prateeq.in/blog/${post.slug}`,
      publishedTime: post.date,
      authors: ['Prateeq Sharma'],
      tags: post.tags,
      ...(validCover ? { images: [{ url: validCover, alt: post.title }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      ...(validCover ? { images: [validCover] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const resolvedImage =
    resolveValidCoverImage(post.coverImage) ||
    `https://prateeq.in/blog/${post.slug}/opengraph-image`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "headline": post.title,
        "description": post.excerpt,
        "datePublished": post.date,
        "dateModified": post.date,
        "keywords": post.tags.join(', '),
        "author": {
          "@type": "Person",
          "name": "Prateeq Sharma",
          "url": "https://prateeq.in"
        },
        "publisher": {
          "@type": "Person",
          "name": "Prateeq Sharma",
          "url": "https://prateeq.in"
        },
        "url": `https://prateeq.in/blog/${post.slug}`,
        "image": resolvedImage,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `https://prateeq.in/blog/${post.slug}`
        }
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://prateeq.in" },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://prateeq.in/blog" },
          { "@type": "ListItem", "position": 3, "name": post.title, "item": `https://prateeq.in/blog/${post.slug}` }
        ]
      }
    ]
  };

  return (
    <article className={styles.postPage}>
      <script
        id="blog-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className={styles.container}>
        <Link href="/blog" className={styles.backLink}>
          <ArrowLeft size={16} />
          <span>Back to Logs</span>
        </Link>

        <header className={styles.header}>
          <div className={styles.meta}>
            <span className={styles.metaItem}>
              <Calendar size={14} />
              <span>{post.date}</span>
            </span>
          </div>
          <h1 className={styles.title}>{post.title}</h1>
          <div className={styles.tags}>
            {post.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                <Tag size={10} />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        </header>

        <div className={styles.content}>
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h2>{children}</h2>,
            }}
          >
            {(() => {
              const firstH1 = post.content.match(/^\s*#\s+([^\n]+)\n+/);
              if (firstH1 && firstH1[1].trim().toLowerCase() === post.title.trim().toLowerCase()) {
                return post.content.slice(firstH1[0].length);
              }
              return post.content;
            })()}
          </ReactMarkdown>
        </div>

        <aside className={styles.ctaPanel} aria-label="Engineering Services & Scoping">
          <div className={styles.ctaEyebrow}>Direct Engineering Partnership</div>
          <h2 className={styles.ctaTitle}>Need This Built for Your Business?</h2>
          <p className={styles.ctaDesc}>
            Explore fixed-scope engineering packages, calculate an instant project quote in INR or USD, or test the live Retriever Hybrid RAG engine.
          </p>
          <div className={styles.ctaActions}>
            <Link href="/scoping" className="comic-btn comic-btn-blue">
              Launch Instant Scoping Lab
            </Link>
            <Link href="/services" className="comic-btn comic-btn-outline">
              View Services &amp; Pricing
            </Link>
            <Link href="/rag" className="comic-btn comic-btn-outline">
              Explore Retriever AI
            </Link>
          </div>
        </aside>
      </div>
    </article>
  );
}
