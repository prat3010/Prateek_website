'use client';

import React from 'react';
import Link from 'next/link';
import { Brain, Cpu, ArrowRight } from 'lucide-react';
import type { CognitiveToolPlaygroundItem } from '@/data/playgroundItems';
import styles from '../PlaygroundGrid.module.css';

interface CognitiveCardProps {
  item: CognitiveToolPlaygroundItem;
}

export default function CognitiveCard({ item }: CognitiveCardProps) {
  return (
    <article className={`${styles.card} ${styles.cardCognitive}`}>
      <div className={styles.cardHeader}>
        <span className={`${styles.kindPill} ${styles.kindPillCognitive}`}>
          <Brain size={14} />
          <span>Cognitive AI</span>
        </span>
        <span className={`${styles.statusPill} ${styles.statusPillCognitive}`}>
          {item.metricsBadge || 'ORACLE VPS'}
        </span>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardTagline}>{item.tagline}</p>

        {item.capabilities && (
          <div className={styles.cardFeatureSection}>
            <div className={styles.cardFeatureTitle}>
              <Cpu size={12} /> Pipeline Features:
            </div>
            {item.capabilities.slice(0, 2).map((cap, i) => (
              <div key={i} className={styles.cardFeatureItem}>
                {cap}
              </div>
            ))}
          </div>
        )}

        <div className={styles.tagsRow}>
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className={styles.tagPill}>{tag}</span>
          ))}
        </div>

        <div className={styles.cardFooter}>
          <Link href={`/playground/${item.slug}`} className={styles.actionBtn}>
            <span>Open Intelligence Lab</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </article>
  );
}
