'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Audience, Theme } from '@/context/ThemeContext';
import { useTheme } from '@/context/ThemeContext';
import { useScrambledText, type ScrambledCharData } from '@/hooks/useScrambledText';
import styles from './Scrambler.module.css';

export type ScramblerVariant = 'headline' | 'section-title' | 'badge' | 'nav-label';

interface VariantConfig {
  duration: number;
  stagger: number;
}

const VARIANT_CONFIG: Record<ScramblerVariant, VariantConfig> = {
  headline: { duration: 1000, stagger: 35 },
  'section-title': { duration: 700, stagger: 30 },
  badge: { duration: 600, stagger: 25 },
  'nav-label': { duration: 400, stagger: 15 },
};

type TextMap = Record<Audience, Record<Theme, string>>;

export interface ScramblerProps {
  texts: TextMap;
  variant: ScramblerVariant;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div' | 'p';
  className?: string;
  'aria-label'?: string;
  id?: string;
  children?: React.ReactNode;
}

export default function Scrambler({
  texts,
  variant,
  as: Tag = 'span',
  className,
  'aria-label': ariaLabel,
  id,
  children,
}: ScramblerProps) {
  const { audience, prevAudience, isNoir, modeTransitionSeed } = useTheme();

  const activeAudience: Audience = audience ?? 'developer';
  const previousAudience: Audience = prevAudience ?? 'developer';

  const sourceText = texts[previousAudience][isNoir ? 'noir' : 'light'];
  const targetText = texts[activeAudience][isNoir ? 'noir' : 'light'];

  const [showScramble, setShowScramble] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const id = requestAnimationFrame(() => setReducedMotion(mq.matches));
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => {
      cancelAnimationFrame(id);
      mq.removeEventListener('change', handler);
    };
  }, []);

  const { chars } = useScrambledText({
    sourceText,
    targetText,
    duration: VARIANT_CONFIG[variant].duration,
    staggerPerChar: VARIANT_CONFIG[variant].stagger,
    triggerSeed: modeTransitionSeed,
    onDone: () => setShowScramble(false),
  });

  const prevSeed = useRef(modeTransitionSeed);

  useEffect(() => {
    if (modeTransitionSeed > 0 && modeTransitionSeed !== prevSeed.current) {
      prevSeed.current = modeTransitionSeed;
      if (reducedMotion) return;
      const id = requestAnimationFrame(() => setShowScramble(true));
      return () => cancelAnimationFrame(id);
    }
  }, [modeTransitionSeed, reducedMotion]);

  if (!reducedMotion && showScramble) {
    return (
      <Tag
        id={id}
        className={`${className ?? ''} ${styles.scrambler}`}
        aria-label={ariaLabel ?? targetText}
        aria-live="polite"
      >
        {chars.map((c: ScrambledCharData) => (
          <span
            key={c.key}
            className={styles.char}
            style={{ opacity: c.opacity }}
            aria-hidden="true"
          >
            {c.char === ' ' ? '\u00A0' : c.char}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag id={id} className={className} aria-label={ariaLabel} aria-live="polite">
      {children ?? targetText}
    </Tag>
  );
}
