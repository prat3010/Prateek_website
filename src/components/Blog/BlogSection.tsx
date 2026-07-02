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

interface BlogCopy {
  sectionTitle: string;
  viewAllText: string;
}

const BLOG_COPY: Record<'developer' | 'business', Record<'light' | 'noir', BlogCopy>> = {
  developer: {
    light: {
      sectionTitle: "LATEST WRITINGS",
      viewAllText: "VIEW ALL"
    },
    noir: {
      sectionTitle: "LOG_ENTRIES",
      viewAllText: "ALL_LOGS"
    }
  },
  business: {
    light: {
      sectionTitle: "INSIGHTS & CASE STUDIES",
      viewAllText: "READ ALL"
    },
    noir: {
      sectionTitle: "CASE STUDIES & METRICS",
      viewAllText: "ALL_INSIGHTS"
    }
  }
};

function BlogSection({ posts }: { posts: SimpleBlogPost[] }) {
  const { isNoir, audience } = useTheme();
  
  const activeAudience = audience || 'developer';
  const activeTheme = isNoir ? 'noir' : 'light';
  const copy = BLOG_COPY[activeAudience][activeTheme];

  return (
    <section id="blog" className={styles.blogSection} aria-label="Writings">
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.sectionTitle}>
            {copy.sectionTitle}
          </h2>
          <Link href="/blog" className={styles.viewAllBtn}>
            <span>{copy.viewAllText}</span>
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
};

export default React.memo(BlogSection);
