'use client';

import React from 'react';
import { useDetailsVisibility } from '@/context/ThemeContext';
import { Eye, EyeOff } from 'lucide-react';
import styles from './ZenToggle.module.css';

export default function ZenToggle() {
  const { isDetailsHidden, toggleDetailsHidden } = useDetailsVisibility();

  return (
    <div className={styles.container}>
      <button
        onClick={toggleDetailsHidden}
        className={`${styles.toggleButton} ${isDetailsHidden ? styles.active : ''}`}
        aria-label={isDetailsHidden ? 'Show site details' : 'Hide site details (Zen Mode)'}
        title={isDetailsHidden ? 'Show Details' : 'Zen Mode / Hide Details'}
      >
        <span className={styles.iconWrapper}>
          {isDetailsHidden ? (
            <EyeOff className={styles.icon} size={20} strokeWidth={2.5} />
          ) : (
            <Eye className={styles.icon} size={20} strokeWidth={2.5} />
          )}
        </span>
        <span className={styles.buttonText}>
          {isDetailsHidden ? 'SHOW UI' : 'ZEN MODE'}
        </span>
      </button>
    </div>
  );
}
