'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Info } from 'lucide-react';
import styles from './InfoButton.module.css';

export default function InfoButton() {
  const pathname = usePathname();
  const { isDetailsHidden } = useTheme();

  // Don't show the info button on the info page itself
  if (pathname === '/info') return null;

  return (
    <div className={`${styles.container} ${isDetailsHidden ? styles.hidden : ''}`}>
      <Link
        href="/info"
        className={styles.infoButton}
        aria-label="View technical and fun details about the website"
        title="Website Details & Diagnostics"
      >
        <span className={styles.iconWrapper}>
          <Info className={styles.icon} size={20} strokeWidth={2.5} />
        </span>
        <span className={styles.buttonText}>INFO</span>
      </Link>
    </div>
  );
}
