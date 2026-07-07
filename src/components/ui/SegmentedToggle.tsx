'use client';

import React from 'react';
import styles from './SegmentedToggle.module.css';

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedToggleProps {
  options: [SegmentedOption, SegmentedOption];
  activeValue: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export default function SegmentedToggle({
  options,
  activeValue,
  onChange,
  className,
  ariaLabel,
}: SegmentedToggleProps) {
  return (
    <div
      className={`${styles.container} ${className ?? ''}`}
      role="radiogroup"
      aria-label={ariaLabel}
    >
      {options.map((opt) => {
        const isActive = opt.value === activeValue;
        return (
          <button
            key={opt.value}
            role="radio"
            aria-checked={isActive}
            className={`${styles.segment} ${isActive ? styles.active : styles.inactive}`}
            onClick={() => {
              if (!isActive) onChange(opt.value);
            }}
            tabIndex={isActive ? -1 : 0}
          >
            {opt.icon && <span className={styles.icon}>{opt.icon}</span>}
            <span className={styles.labelText}>{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
