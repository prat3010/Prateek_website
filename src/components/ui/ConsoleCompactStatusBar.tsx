'use client';

import React from 'react';
import { Maximize2 } from 'lucide-react';
import type { SystemStats, WebVitalsMetrics } from './useSystemTelemetry';
import styles from './SiteInfoConsole.module.css';

export interface ConsoleCompactStatusBarProps {
  stats: SystemStats;
  webVitals: WebVitalsMetrics;
  onExpand: () => void;
}

export default function ConsoleCompactStatusBar({
  stats,
  webVitals,
  onExpand,
}: ConsoleCompactStatusBarProps) {
  const lcpText = webVitals.lcp > 0 ? `${webVitals.lcp}s` : 'measuring...';
  const accessibleLabel = `Telemetry Focus Mode: FPS ${stats.fps}, Uptime ${stats.uptime}, DOM ${stats.domNodes}, LCP ${lcpText}. Press Enter to expand full telemetry matrix.`;

  return (
    <div
      className={styles.compactStatusBar}
      data-testid="console-compact-status-bar"
      onClick={onExpand}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onExpand();
        }
      }}
      title="Focus Mode active — click to expand full Telemetry Matrix & Web Vitals"
      aria-label={accessibleLabel}
    >
      <div className={styles.compactMetricsGroup}>
        <div className={styles.compactMetricItem}>
          <span className={styles.compactPulseDot} aria-hidden="true" />
          <span className={styles.compactLabel}>FPS:</span>
          <span className={styles.compactValue}>{stats.fps}</span>
        </div>

        <span className={styles.compactDivider} aria-hidden="true">|</span>

        <div className={styles.compactMetricItem}>
          <span className={styles.compactLabel}>UPTIME:</span>
          <span className={styles.compactValue}>{stats.uptime}</span>
        </div>

        <span className={styles.compactDivider} aria-hidden="true">|</span>

        <div className={styles.compactMetricItem}>
          <span className={styles.compactLabel}>DOM:</span>
          <span className={styles.compactValue}>{stats.domNodes}</span>
        </div>

        <span className={styles.compactDivider} aria-hidden="true">|</span>

        <div className={styles.compactMetricItem}>
          <span className={styles.compactLabel}>LCP:</span>
          <span className={styles.compactValue}>{lcpText}</span>
        </div>

        <span className={styles.compactDivider} aria-hidden="true">|</span>

        <div className={`${styles.compactMetricItem} ${styles.compactHideMobile}`}>
          <span className={styles.compactLabel}>BUNDLE:</span>
          <span className={styles.compactValue}>{stats.bundleSize} KB</span>
        </div>
      </div>

      <div className={styles.compactExpandAction}>
        <span className={styles.compactBadge}>FOCUS MODE</span>
        <span className={styles.compactExpandBtn}>
          <Maximize2 size={11} aria-hidden="true" />
          <span>EXPAND</span>
        </span>
      </div>
    </div>
  );
}
