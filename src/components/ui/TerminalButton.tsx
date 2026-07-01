'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Terminal } from 'lucide-react';
import styles from './TerminalButton.module.css';

export default function TerminalButton() {
  const pathname = usePathname();
  const { isDetailsHidden } = useTheme();

  // Don't show the terminal button on the terminal page itself
  if (pathname === '/terminal') return null;

  return (
    <div className={`${styles.container} ${isDetailsHidden ? styles.hidden : ''}`}>
      <Link
        href="/terminal"
        className={styles.terminalButton}
        aria-label="View website diagnostics terminal console"
        title="Website Details & Diagnostics Terminal"
      >
        <span className={styles.iconWrapper}>
          <Terminal className={styles.icon} size={20} strokeWidth={2.5} />
        </span>
        <span className={styles.buttonText}>TERMINAL</span>
      </Link>
    </div>
  );
}
