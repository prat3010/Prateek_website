'use client';

import React from 'react';
import { Code2 } from 'lucide-react';
import type { ExperimentPlaygroundItem } from '@/data/playgroundItems';
import styles from '../PlaygroundGrid.module.css';

interface ExperimentCardProps {
  item: ExperimentPlaygroundItem;
  index?: number;
}

export default function ExperimentCard({ item, index }: ExperimentCardProps) {
  const indexStr = index !== undefined ? String(index + 1).padStart(2, '0') : '01';

  return (
    <article className={`${styles.card} ${styles.cardExperiment}`}>
      {/* Comic Storyboard Header with Narrative Caption Box & Comic Rarity/Status Stamp */}
      <div className={styles.comicHeader} aria-hidden="true">
        <div className={styles.narrativeBox}>
          <span className={styles.narrativePrefix}>EXP. {indexStr}</span>
          <span className={styles.narrativeDivider}>{'//'}</span>
          <span className={styles.narrativeLabel}>LAB RECORD</span>
        </div>
        <div className={styles.comicBadgeStamp}>
          <span className={styles.comicRarityPip}>★</span>
          <span className={styles.comicBadgeText}>{item.metricsBadge || 'ACTIVE'}</span>
        </div>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardTagline}>{item.tagline}</p>

        <div className={styles.tagsRow}>
          {item.techStack.map((tech) => (
            <span key={tech} className={styles.tagPill}>{tech}</span>
          ))}
        </div>

        <div className={styles.cardFooter}>
          <div className={styles.footerMetaText}>
            <Code2 size={14} /> Active in Floating Dock
          </div>
          {item.githubUrl && (
            <a
              href={item.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionBtnSecondary}
            >
              Source
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
