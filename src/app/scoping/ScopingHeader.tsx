'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Rocket } from 'lucide-react';
import MagneticButton from '@/components/ui/MagneticButton';
import Scrambler from '@/components/ui/Scrambler';
import type { ScramblerProps } from '@/components/ui/Scrambler';
import styles from './scoping.module.css';

const SCOPING_TITLE_TEXTS: ScramblerProps['texts'] = {
  developer: {
    light: 'PROJECT SCOPING LAB // INSTANT QUOTE',
    noir: 'PROJECT SCOPING LAB // ARCHITECTURE LAB',
  },
  business: {
    light: 'PROJECT SCOPING LAB // INSTANT QUOTE',
    noir: 'PROJECT SCOPING LAB // ARCHITECTURE LAB',
  },
};

export default function ScopingHeader() {
  return (
    <header className={styles.headerSection}>
      <div className={styles.navRow}>
        <MagneticButton strength={0.25}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={16} />
            <span>Return to Base</span>
          </Link>
        </MagneticButton>
        <div className={styles.brandBadge}>
          <Rocket size={13} />
          <span>VOL. 26 • SPEC-DRIVEN ARCHITECTURE LAB</span>
        </div>
      </div>

      <div className={styles.titleArea}>
        <Scrambler
          texts={SCOPING_TITLE_TEXTS}
          variant="headline"
          as="h1"
          className={styles.title}
        />
        <p className={styles.subtitle}>
          Transparent Fixed-Scope CPQ • Instant PDF Export • Zero Sales Calls
        </p>
      </div>
    </header>
  );
}
