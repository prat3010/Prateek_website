'use client';

import React from 'react';
import Link from 'next/link';
import { Gamepad2, Trophy, Volume2, ArrowRight } from 'lucide-react';
import type { InteractiveToyPlaygroundItem } from '@/data/playgroundItems';
import styles from '../PlaygroundGrid.module.css';

interface ToyCardProps {
  item: InteractiveToyPlaygroundItem;
}

export default function ToyCard({ item }: ToyCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <span className={styles.kindPill}>
          <Gamepad2 size={14} />
          <span>Interactive Toy</span>
        </span>
        {item.difficulty && (
          <span className={styles.statusPill}>
            {item.difficulty}
          </span>
        )}
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardTagline}>{item.tagline}</p>

        <div className={styles.tagsRow}>
          {item.hasLeaderboard && (
            <span className={styles.tagPill} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderColor: '#f59e0b', color: '#f59e0b' }}>
              <Trophy size={11} /> Leaderboard
            </span>
          )}
          {item.soundSupported && (
            <span className={styles.tagPill} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <Volume2 size={11} /> 8-Bit Audio
            </span>
          )}
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className={styles.tagPill}>{tag}</span>
          ))}
        </div>

        <div className={styles.cardFooter}>
          <Link href={`/playground/${item.slug}`} className={styles.actionBtn}>
            <span>Play Arcade</span>
            <ArrowRight size={14} />
          </Link>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-jetbrains-mono, monospace)', color: 'var(--color-text-muted)' }}>
            v.{item.vibeCodedDate.slice(0, 7)}
          </span>
        </div>
      </div>
    </article>
  );
}
