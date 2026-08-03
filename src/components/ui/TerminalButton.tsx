'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Terminal, Rocket } from 'lucide-react';
import styles from './TerminalButton.module.css';

export default function TerminalButton() {
  const pathname = usePathname();
  const { isDetailsHidden, audience } = useTheme();

  // Don't show the floating button on the terminal or scoping pages themselves
  if (pathname === '/terminal' || pathname === '/scoping') return null;

  const isBusiness = audience === 'business';

  return (
    <div className={`${styles.container} ${isDetailsHidden ? styles.hidden : ''}`}>
      {isBusiness ? (
        <Link
          href="/scoping"
          className={styles.terminalButton}
          aria-label="Open project scoping brief and instant quote wizard"
          title="Project Scoping Lab & Instant Quote"
        >
          <span className={styles.iconWrapper}>
            <Rocket className={styles.icon} size={18} strokeWidth={2.5} />
          </span>
          <span className={styles.buttonText}>GET INSTANT QUOTE</span>
        </Link>
      ) : (
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
      )}
    </div>
  );
}
