'use client';

import React from 'react';
import Link from 'next/link';
import ComicPanel from '@/components/ui/ComicPanel';
import { useTheme } from '@/context/ThemeContext';
import { BookOpen, ArrowRight } from 'lucide-react';
import styles from './BlogSection.module.css';

interface SimpleBlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

export default function BlogSection({ posts }: { posts: SimpleBlogPost[] }) {
  const { isNoir } = useTheme();

  return (
    <section id="blog" className={styles.blogSection} aria-label="Writings">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.sectionTitle}>
            {isNoir ? 'LOG_ENTRIES' : 'LATEST WRITINGS'}
          </h2>
          <Link href="/blog" className={styles.viewAllBtn}>
            <span>{isNoir ? 'ALL_LOGS' : 'VIEW ALL'}</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className={styles.empty}>
            <p>No writings published yet. Streamlit Sync Agent online.</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {posts.slice(0, 3).map((post, index) => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className={styles.cardLink}>
                <ComicPanel tilt={index % 2 === 0 ? 0.5 : -0.5} className={styles.postCard}>
                  <div className={styles.cardMeta}>
                    <BookOpen size={14} />
                    <span>{post.date}</span>
                  </div>
                  <h3 className={styles.cardTitle}>{post.title}</h3>
                  <p className={styles.excerpt}>{post.excerpt}</p>
                </ComicPanel>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
