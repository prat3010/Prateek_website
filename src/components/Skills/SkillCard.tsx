'use client';

import React from 'react';
import type { Skill } from '@/data/skills';
import { categoryColors } from '@/data/skills';
import styles from './Skills.module.css';

interface SkillCardProps {
  skill: Skill;
  index: number;
}

export default function SkillCard({ skill, index }: SkillCardProps) {
  // Deterministic "random" rotation based on index
  const rotation = ((index * 7 + 3) % 5) - 2; // Values between -2 and 2

  return (
    <div
      className={styles.card}
      style={{
        transform: `rotate(${rotation}deg)`,
        '--card-bg': categoryColors[skill.category],
        '--skill-color': skill.color,
      } as React.CSSProperties}
    >
      {/* Hover KAPOW */}
      <span className={styles.kapow} aria-hidden="true">
        KAPOW!
      </span>

      <div className={styles.cardHeader}>
        <span
          className={styles.skillDot}
          style={{ background: skill.color }}
          aria-hidden="true"
        />
        <h3 className={styles.skillName}>{skill.name}</h3>
      </div>

      <div className={styles.powerBar}>
        <div className={styles.powerBarTrack}>
          <div
            className={styles.powerBarFill}
            style={{
              width: `${skill.level}%`,
              background: skill.color,
            }}
          />
        </div>
        <span className={styles.powerLevel}>{skill.level}%</span>
      </div>

      <span className={styles.categoryBadge}>
        {skill.category.toUpperCase()}
      </span>
    </div>
  );
}
