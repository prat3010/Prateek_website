import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { getPostBySlug, getAllPosts } from '@/lib/markdown';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import styles from './BlogPost.module.css';

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    return {};
  }

  const imageUrl = post.coverImage ? `https://prateeq.in${post.coverImage}` : 'https://prateeq.in/opengraph-image.png';

  return {
    title: `${post.title} | Prateeq Sharma`,
    description: post.excerpt,
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
      images: [
        {
          url: imageUrl,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [imageUrl],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "datePublished": post.date,
    "author": {
      "@type": "Person",
      "name": "Prateeq Sharma",
      "url": "https://prateeq.in"
    },
    "url": `https://prateeq.in/blog/${post.slug}`,
    "image": post.coverImage ? `https://prateeq.in${post.coverImage}` : "https://prateeq.in/opengraph-image.png",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://prateeq.in/blog/${post.slug}`
    }
  };

  return (
    <article className={styles.postPage}>
      <script
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
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </div>
    </article>
  );
}
