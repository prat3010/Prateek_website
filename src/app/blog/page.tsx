import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { getAllPosts } from '@/lib/markdown';
import ComicPanel from '@/components/ui/ComicPanel';
import styles from './BlogList.module.css';

export const metadata: Metadata = {
  title: 'Log Entries | Prateeq Sharma',
  description: 'Engineering notes, design diaries, and tutorials by Prateeq Sharma.',
  alternates: {
    canonical: '/blog',
  },
  openGraph: {
    title: 'Log Entries | Prateeq Sharma',
    description: 'Engineering notes, design diaries, and tutorials by Prateeq Sharma.',
    type: 'website',
    url: 'https://prateeq.in/blog',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Log Entries | Prateeq Sharma',
    description: 'Engineering notes, design diaries, and tutorials by Prateeq Sharma.',
  },
};

export default function BlogListing() {
  const posts = getAllPosts();

  return (
    <div className={styles.blogPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>LOG ENTRIES</h1>
          <p className={styles.subtitle}>Engineering notes, design diaries, and tutorials</p>
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
                  <h3 className={styles.postTitle}>{post.title}</h3>
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
