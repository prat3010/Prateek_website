import React from 'react';
import Link from 'next/link';
import { getAllPosts } from '@/lib/markdown';
import ComicPanel from '@/components/ui/ComicPanel';
import styles from './BlogList.module.css';

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
            {posts.map((post) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.cardLink}>
                <ComicPanel tilt={Math.random() > 0.5 ? 1 : -1} className={styles.postCard}>
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
