'use client';

import React from 'react';
import { useThemeTransition } from '@/context/ThemeContext';
import styles from './ThemeTransition.module.css';

export default function ThemeTransition() {
  const { isTransitioning, pendingTheme } = useThemeTransition();

  if (!isTransitioning || !pendingTheme) return null;

  const bgStyle = pendingTheme === 'noir' ? '#08080a' : '#FFF8E1';
  const borderStyle = pendingTheme === 'noir' ? '#FAFAFA' : '#1A1A2E';

  return (
    <div
      className={styles.container}
      style={
        {
          '--panel-bg': bgStyle,
          '--panel-border': borderStyle,
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <div className={styles.panel} />
      <div className={styles.panel} />
      <div className={styles.panel} />
    </div>
  );
}
