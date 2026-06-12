import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { getPostBySlug } from '@/lib/markdown';
import { ArrowLeft, Calendar, Tag } from 'lucide-react';
import styles from './BlogPost.module.css';

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className={styles.postPage}>
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
