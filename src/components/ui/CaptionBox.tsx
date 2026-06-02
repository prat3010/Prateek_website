import React from 'react';
import styles from './CaptionBox.module.css';

export type CaptionPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface CaptionBoxProps {
  /** Narration text or content */
  children: React.ReactNode;
  /** Where to position the caption box within the parent */
  position?: CaptionPosition;
  /** Additional CSS class */
  className?: string;
}

const positionMap: Record<CaptionPosition, string> = {
  'top-left': styles.topLeft,
  'top-right': styles.topRight,
  'bottom-left': styles.bottomLeft,
  'bottom-right': styles.bottomRight,
};

export default function CaptionBox({
  children,
  position = 'top-left',
  className,
}: CaptionBoxProps) {
  return (
    <div
      className={`${styles.caption} ${positionMap[position]} ${className ?? ''}`}
      role="note"
      aria-label="Caption"
    >
      {children}
    </div>
  );
}
