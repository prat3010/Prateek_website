'use client';

import React from 'react';
import type { Skill } from '@/data/skills';
import { categoryColors } from '@/data/skills';
import { useTheme } from '@/context/ThemeContext';
import styles from './Skills.module.css';

interface SkillCardProps {
  skill: Skill;
  index: number;
}

export default function SkillCard({ skill, index }: SkillCardProps) {
  const { isNoir } = useTheme();
  // Deterministic "random" rotation based on index
  const rotation = ((index * 7 + 3) % 5) - 2; // Values between -2 and 2

  return (
    <div
      className={styles.card}
      style={{
        transform: `rotate(${rotation}deg)`,
        '--card-bg': isNoir ? '#121214' : categoryColors[skill.category],
        '--skill-color': isNoir ? '#FAFAFA' : skill.color,
      } as React.CSSProperties}
    >
      {/* Hover KAPOW */}
      <span className={styles.kapow} aria-hidden="true">
        KAPOW!
      </span>

      <div className={styles.cardHeader}>
        <span
          className={styles.skillDot}
          style={{ background: isNoir ? '#FAFAFA' : skill.color }}
          aria-hidden="true"
        />
        <h3 className={styles.skillName}>{skill.name}</h3>
      </div>

      <p className={styles.skillDescription}>{skill.description}</p>

      <span className={styles.categoryBadge}>
        {skill.category.toUpperCase()}
      </span>
    </div>
  );
}
