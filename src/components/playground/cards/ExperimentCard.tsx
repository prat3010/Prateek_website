'use client';

import React from 'react';
import { Eye, Code2 } from 'lucide-react';
import type { ExperimentPlaygroundItem } from '@/data/playgroundItems';
import styles from '../PlaygroundGrid.module.css';

interface ExperimentCardProps {
  item: ExperimentPlaygroundItem;
}

export default function ExperimentCard({ item }: ExperimentCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.kindPill} style={{ background: 'rgba(234, 179, 8, 0.15)', color: '#facc15' }}>
          <Eye size={14} />
          <span>Experiment</span>
        </span>
        {item.metricsBadge && (
          <span className={styles.statusPill} style={{ borderColor: 'rgba(234, 179, 8, 0.3)', color: '#facc15' }}>
            {item.metricsBadge}
          </span>
        )}
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
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
