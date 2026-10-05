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
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.kindPill} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
          <Brain size={14} />
          <span>Cognitive AI</span>
        </span>
        <span className={styles.statusPill} style={{ borderColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }}>
          {item.metricsBadge || 'ORACLE VPS'}
        </span>
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardTagline}>{item.tagline}</p>

        {item.capabilities && (
          <div style={{ marginBottom: '14px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Cpu size={12} /> Pipeline Features:
            </div>
            {item.capabilities.slice(0, 2).map((cap, i) => (
              <div key={i} style={{ paddingLeft: '8px', borderLeft: '2px solid rgba(56, 189, 248, 0.3)', marginBottom: '3px' }}>
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
