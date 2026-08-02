'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { Terminal, Rocket } from 'lucide-react';
import ScopingBriefModal from '@/components/Intake/ScopingBriefModal';
import styles from './TerminalButton.module.css';

export default function TerminalButton() {
  const pathname = usePathname();
  const { isDetailsHidden, audience } = useTheme();
  const [isScopingModalOpen, setIsScopingModalOpen] = useState(false);

  // Don't show the floating button on the terminal page itself
  if (pathname === '/terminal') return null;

  const isBusiness = audience === 'business';

  return (
    <>
      <div className={`${styles.container} ${isDetailsHidden ? styles.hidden : ''}`}>
        {isBusiness ? (
          <button
            type="button"
            onClick={() => setIsScopingModalOpen(true)}
            className={styles.terminalButton}
            aria-label="Open project scoping brief and instant quote wizard"
            title="Project Scoping Lab & Instant Quote"
          >
            <span className={styles.iconWrapper}>
              <Rocket className={styles.icon} size={18} strokeWidth={2.5} />
            </span>
            <span className={styles.buttonText}>GET INSTANT QUOTE</span>
          </button>
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

      {isBusiness && (
        <ScopingBriefModal
          isOpen={isScopingModalOpen}
          onClose={() => setIsScopingModalOpen(false)}
        />
      )}
    </>
  );
}
