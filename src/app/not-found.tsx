import React from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Compass, Home, Layers, Terminal, Sparkles } from 'lucide-react';
import styles from './not-found.module.css';

export const metadata: Metadata = {
  title: '404 - Coordinates Unknown | Prateeq Sharma',
  description: 'The requested telemetry coordinates or document could not be located.',
};

export default function NotFound() {
  return (
    <div className={styles.notFoundContainer}>
      <div className={styles.notFoundCard}>
        <div className={styles.badge}>
          <Compass size={14} />
          <span>SIGNAL LOST // SECTOR UNCHARTED</span>
        </div>

        <div className={styles.glitchNumber}>404</div>

        <h1 className={styles.title}>Coordinates Unknown</h1>

        <p className={styles.description}>
          The requested URL does not match any deployed system, scoping brief, or telemetry log.
          Please verify the path or navigate to one of the active control hubs below.
        </p>

        <div className={styles.quickNavGrid}>
          <Link href="/scoping" className={styles.quickNavCard}>
            <Layers size={20} color="var(--pop-blue, #2563eb)" />
            <span className={styles.quickNavLabel}>Scoping Lab</span>
            <span className={styles.quickNavSub}>Interactive Quotes</span>
          </Link>

          <Link href="/terminal" className={styles.quickNavCard}>
            <Terminal size={20} color="var(--pop-yellow, #d97706)" />
            <span className={styles.quickNavLabel}>Systems Terminal</span>
            <span className={styles.quickNavSub}>Diagnostics & CLI</span>
          </Link>

          <Link href="/playground" className={styles.quickNavCard}>
            <Sparkles size={20} color="var(--pop-red, #ef4444)" />
            <span className={styles.quickNavLabel}>Playground</span>
            <span className={styles.quickNavSub}>Prototypes & Games</span>
          </Link>
        </div>

        <div>
          <Link href="/" className={styles.primaryHomeBtn}>
            <Home size={16} />
            <span>Return to Base Station</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
