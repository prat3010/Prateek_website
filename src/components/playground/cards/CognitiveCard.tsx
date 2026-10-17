'use client';

import React from 'react';
import Link from 'next/link';
import { Cpu, ArrowRight } from 'lucide-react';
import type { CognitiveToolPlaygroundItem } from '@/data/playgroundItems';
import styles from '../PlaygroundGrid.module.css';

interface CognitiveCardProps {
  item: CognitiveToolPlaygroundItem;
  index?: number;
}

export default function CognitiveCard({ item, index }: CognitiveCardProps) {
  const indexStr = index !== undefined ? String(index + 1).padStart(2, '0') : '01';

  return (
    <article className={`${styles.card} ${styles.cardCognitive}`}>
      {/* Comic Storyboard Header with Narrative Caption Box & Comic Rarity/Status Stamp */}
      <div className={styles.comicHeader} aria-hidden="true">
        <div className={styles.narrativeBox}>
          <span className={styles.narrativePrefix}>EXP. {indexStr}</span>
          <span className={styles.narrativeDivider}>{'//'}</span>
          <span className={styles.narrativeLabel}>COGNITIVE AI</span>
        </div>
        <div className={styles.comicBadgeStamp}>
          <span className={styles.comicRarityPip}>★</span>
          <span className={styles.comicBadgeText}>{item.metricsBadge || 'ORACLE VPS'}</span>
        </div>
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
