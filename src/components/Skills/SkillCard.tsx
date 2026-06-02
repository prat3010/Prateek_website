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
      data-category={skill.category}
      data-index={String(index + 1).padStart(2, '0')}
      style={{
        transform: `rotate(${rotation}deg)`,
        '--card-bg': categoryColors[skill.category],
        '--skill-color': skill.color,
      } as React.CSSProperties}
    >
      {/* Hover KAPOW */}
      <span className={styles.kapow} aria-hidden="true">
        <span className={styles.kapowPop}>KAPOW!</span>
        <span className={styles.kapowNoir}>SILENCE...</span>
      </span>

      <div className={styles.cardHeader}>
        <span
          className={styles.skillDot}
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
