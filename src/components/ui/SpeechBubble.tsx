import React from 'react';
import styles from './SpeechBubble.module.css';

export interface SpeechBubbleProps {
  /** Content rendered inside the bubble */
  children: React.ReactNode;
  /** Direction the tail points toward */
  direction?: 'left' | 'right' | 'top' | 'bottom';
  /** Background color of the bubble */
  color?: string;
  /** Use a "thought" cloud style instead of a pointed tail */
  variant?: 'speech' | 'thought';
  /** Additional CSS class */
  className?: string;
}

export default function SpeechBubble({
  children,
  direction = 'left',
  color,
  variant = 'speech',
  className,
}: SpeechBubbleProps) {
  const bgColor = color ?? 'var(--pop-yellow)';

  const classNames = [
    styles.bubble,
    styles[direction],
    variant === 'thought' ? styles.thought : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      style={
        {
          '--bubble-bg': bgColor,
          backgroundColor: bgColor,
        } as React.CSSProperties
      }
      role="note"
      aria-label="Speech bubble"
    >
      {children}
    </div>
  );
}
