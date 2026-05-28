'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import styles from './ThemeTransition.module.css';

export default function ThemeTransition() {
  const { isTransitioning, transitionCoords, pendingTheme } = useTheme();

  if (!isTransitioning || !pendingTheme) return null;

  const bgStyle = pendingTheme === 'noir' ? '#08080a' : '#FFF8E1';

  return (
    <div
      className={styles.overlay}
      style={
        {
          '--x': `${transitionCoords.x}%`,
          '--y': `${transitionCoords.y}%`,
          backgroundColor: bgStyle,
        } as React.CSSProperties
      }
      aria-hidden="true"
    />
  );
}
