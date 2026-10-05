'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink, Rocket, CheckCircle2 } from 'lucide-react';
import type { SaasPlaygroundItem } from '@/data/playgroundItems';
import styles from '../PlaygroundGrid.module.css';

const GitHubIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface SaasCardProps {
  item: SaasPlaygroundItem;
}

export default function SaasCard({ item }: SaasCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.kindPill}>
          <Rocket size={13} />
          <span>SaaS Prototype</span>
        </span>
        {item.metricsBadge && (
          <span className={styles.statusPill}>{item.metricsBadge}</span>
        )}
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardTagline}>{item.tagline}</p>

        {item.highlights && item.highlights.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            {item.highlights.slice(0, 2).map((h, i) => (
              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <CheckCircle2 size={13} style={{ color: 'var(--color-primary)' }} />
                <span>{h}</span>
              </li>
            ))}
          </ul>
        )}

        <div className={styles.tagsRow}>
          {item.techStack.map((tech) => (
            <span key={tech} className={styles.tagPill}>{tech}</span>
          ))}
        </div>

        <div className={styles.cardFooter}>
          <Link href={item.appUrl} className={styles.actionBtn}>
            <span>Launch App</span>
            <ExternalLink size={14} />
          </Link>
          {item.githubUrl && (
            <a
              href={item.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionBtnSecondary}
              aria-label={`Source code for ${item.title}`}
            >
              <GitHubIcon size={14} />
              <span>Source</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
