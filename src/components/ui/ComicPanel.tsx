import React from 'react';
import styles from './ComicPanel.module.css';

export interface ComicPanelProps {
  /** Content rendered inside the panel */
  children: React.ReactNode;
  /** Border width in pixels (3–5) */
  borderWidth?: number;
  /** Panel background color */
  backgroundColor?: string;
  /** Slight tilt rotation angle in degrees */
  tilt?: number;
  /** CSS aspect-ratio value, e.g. "16/9" */
  aspectRatio?: string;
  /** Additional CSS class */
  className?: string;
  /** Whether the Ben-Day dots should be static (always visible) */
  staticDots?: boolean;
}

export default function ComicPanel({
  children,
  borderWidth = 3,
  backgroundColor = 'var(--pop-white)',
  tilt = 0,
  aspectRatio,
  className,
  staticDots = false,
}: ComicPanelProps) {
  return (
    <div
      className={`${styles.panel} ${staticDots ? styles.staticDots : ''} ${className ?? ''}`}
      style={{
        borderWidth: `${borderWidth}px`,
        backgroundColor,
        transform: tilt !== 0 ? `rotate(${tilt}deg)` : undefined,
        aspectRatio: aspectRatio ?? undefined,
      }}
    >
      <div className={styles.content}>{children}</div>
    </div>
  );
}
