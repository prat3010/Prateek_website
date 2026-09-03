'use client';

import React from 'react';
import { Cpu, Layers } from 'lucide-react';
import type { SystemStats, WebVitalsMetrics } from './useSystemTelemetry';
import styles from './SiteInfoConsole.module.css';

export interface ConsoleTelemetryGridProps {
  stats: SystemStats;
  webVitals: WebVitalsMetrics;
}

export default function ConsoleTelemetryGrid({ stats, webVitals }: ConsoleTelemetryGridProps) {
  return (
    <div className={styles.consoleGrid} data-testid="console-telemetry-grid">
      {/* Stats Widget */}
      <div className={styles.consoleWidget}>
        <h3 className={styles.widgetTitle}>
          <Cpu size={14} className={styles.widgetIcon} />
          TELEMETRY MATRIX
        </h3>
        <ul className={styles.metricsList}>
          <li>
            <span className={styles.metricLabel}>RENDER FPS:</span>
            <span className={styles.metricValue}>{stats.fps} FPS</span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.min(100, (stats.fps / 60) * 100)}%` }}
              />
            </div>
          </li>
          <li>
            <span className={styles.metricLabel}>SCRIPT BUNDLE:</span>
            <span className={styles.metricValue}>{stats.bundleSize} KB</span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min(100, (stats.bundleSize / 500) * 100)}%`,
                  backgroundColor: 'var(--neon-cyan, var(--pop-blue))',
                }}
              />
            </div>
          </li>
          <li>
            <span className={styles.metricLabel}>DOM ELEMENTS:</span>
            <span className={styles.metricValue}>{stats.domNodes} nodes</span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min(100, (stats.domNodes / 2000) * 100)}%`,
                  backgroundColor: 'var(--neon-pink, var(--pop-red))',
                }}
              />
            </div>
          </li>
          <li>
            <span className={styles.metricLabel}>UPTIME:</span>
            <span className={styles.metricValue}>{stats.uptime}</span>
          </li>
        </ul>
      </div>

      {/* Performance Web Vitals Widget */}
      <div className={styles.consoleWidget}>
        <h3 className={styles.widgetTitle}>
          <Layers size={14} className={styles.widgetIcon} />
          PERFORMANCE VITALS
        </h3>
        <ul className={styles.metricsList}>
          <li>
            <span className={styles.metricLabel}>LCP (PAINT):</span>
            <span className={styles.metricValue}>
              {webVitals.lcp > 0 ? `${webVitals.lcp}s` : 'Measuring...'}
            </span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min(100, (webVitals.lcp / 2.5) * 100)}%`,
                  backgroundColor: 'var(--neon-cyan, var(--pop-blue))',
                }}
              />
            </div>
          </li>
          <li>
            <span className={styles.metricLabel}>FID (DELAY):</span>
            <span className={styles.metricValue}>
              {webVitals.hasInteraction ? `${webVitals.fid}ms` : 'Pending...'}
            </span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min(100, (webVitals.fid / 100) * 100)}%`,
                  backgroundColor: 'var(--neon-cyan, var(--pop-blue))',
                }}
              />
            </div>
          </li>
          <li>
            <span className={styles.metricLabel}>CLS (SHIFT):</span>
            <span className={styles.metricValue}>{webVitals.cls}</span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{
                  width: `${Math.min(100, (webVitals.cls / 0.1) * 100)}%`,
                  backgroundColor: 'var(--neon-cyan, var(--pop-blue))',
                }}
              />
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
