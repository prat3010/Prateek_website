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
    <article className={`${styles.card} ${styles.cardToy}`}>
      <div className={styles.cardHeader}>
        <span className={`${styles.kindPill} ${styles.kindPillToy}`}>
          <Gamepad2 size={14} />
          <span>Interactive Toy</span>
        </span>
        {item.difficulty && (
          <span className={`${styles.statusPill} ${styles.statusPillToy}`}>
            {item.difficulty}
          </span>
        )}
      </div>

      <div className={styles.cardBody}>
        <h3 className={styles.cardTitle}>{item.title}</h3>
        <p className={styles.cardTagline}>{item.tagline}</p>

        <div className={styles.tagsRow}>
          {item.hasLeaderboard && (
            <span className={`${styles.tagPill} ${styles.tagPillSpecial}`}>
              <Trophy size={11} />
              <span>Leaderboard</span>
            </span>
          )}
          {item.soundSupported && (
            <span className={`${styles.tagPill} ${styles.tagPillIcon}`}>
              <Volume2 size={11} />
              <span>8-Bit Audio</span>
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
          <span className={styles.footerMetaText}>
            v.{item.vibeCodedDate.slice(0, 7)}
          </span>
        </div>
      </div>
    </article>
  );
}
