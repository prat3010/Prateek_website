'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import styles from './ActionWord.module.css';

export interface ActionWordProps {
  /** The action word text, e.g. "POW!", "BAM!" */
  word: string;
  /** Color of the text */
  color?: string;
  /** Background color of the starburst */
  starburstColor?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to animate */
  animated?: boolean;
  /** Rotation angle in degrees */
  rotation?: number;
  /** Additional CSS class */
  className?: string;
}

export default function ActionWord({
  word,
  color,
  starburstColor,
  size = 'md',
  rotation = 0,
  className,
}: ActionWordProps) {
  const { isNoir } = useTheme();
  const textColor = color ?? 'var(--pop-red)';
  const burstColor = starburstColor ?? 'var(--pop-yellow)';

  return (
    <span
      className={`${styles.wrapper} ${styles[size]} ${className ?? ''}`}
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden="true"
    >
      {!isNoir && (
        <span
          className={styles.starburst}
          style={{ backgroundColor: burstColor }}
        />
      )}
      <span
        className={styles.word}
        style={{ '--action-color': textColor } as React.CSSProperties}
      >
        {word}
      </span>
    </span>
  );
}
