'use client';

import React from 'react';
import { m } from 'framer-motion';
import styles from './SegmentedToggle.module.css';

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface SegmentedToggleProps {
  id?: string;
  options: [SegmentedOption, SegmentedOption];
  activeValue: string;
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export default function SegmentedToggle({
  id = 'segmented-toggle',
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
            {isActive && (
              <m.div
                layoutId={`${id}-active-pill`}
                className={styles.activePill}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className={styles.content}>
              {opt.icon && (
                <m.span
                  className={styles.icon}
                  animate={{
                    scale: isActive ? 1.12 : 1,
                    rotate: isActive && (opt.value === 'noir' || opt.value === 'business') ? 180 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 22 }}
                >
                  {opt.icon}
                </m.span>
              )}
              <span className={styles.labelText}>{opt.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

