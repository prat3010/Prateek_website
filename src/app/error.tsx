'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import styles from './error.module.css';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to telemetry/console
    console.error('Unhandled Root Error caught by error.tsx boundary:', error);
  }, [error]);

  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorCard} role="alert" aria-live="assertive">
        <div className={styles.badge}>
          <AlertTriangle size={14} />
          <span>RUNTIME ANOMALY // 500</span>
        </div>

        <h1 className={styles.title}>System Interruption Detected</h1>

        <p className={styles.description}>
          An unexpected error occurred while rendering this interface. The telemetry subsystem has
          isolated the fault to prevent session corruption.
        </p>

        {error?.digest && (
          <div className={styles.digestBox}>
            <strong>Digest Code:</strong> {error.digest}
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => reset()}
            className={styles.retryBtn}
            aria-label="Retry loading this view"
          >
            <RefreshCw size={16} />
            <span>Retry Operation</span>
          </button>

          <Link href="/" className={styles.homeLink}>
            <Home size={16} />
            <span>Return to Base</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
