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
  const classNames = [
    styles.bubble,
    styles[direction],
    variant === 'thought' ? styles.thought : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const style = color
    ? ({
        '--bubble-bg': color,
        backgroundColor: color,
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      className={classNames}
      style={style}
      role="note"
      aria-label="Speech bubble"
    >
      {children}
    </div>
  );
}
