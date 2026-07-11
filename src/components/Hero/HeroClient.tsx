'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLenis } from 'lenis/react';
import { useReducedMotion } from 'framer-motion';
import { useTypewriter } from '@/hooks/useTypewriter';
import { NAVBAR_SCROLL_OFFSET } from '@/lib/constants';
import { useTheme } from '@/context/ThemeContext';
import ComicPanel from '@/components/ui/ComicPanel';
import Scrambler from '@/components/ui/Scrambler';
import type { ScramblerProps } from '@/components/ui/Scrambler';
import { businessStandardTaglines, businessNoirTaglines } from '@/data/taglines';
import styles from './Hero.module.css';

interface HeroClientProps {
  taglines: {
    standard: string[];
    noir: string[];
  };
}

/** Shorthand for Scrambler texts where light and noir are identical */
const bothThemes = (s: string) => ({ light: s, noir: s });

const HEADLINE_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'CRAFT & CLARITY.',          noir: 'SHADOWS & SYNTAX.' },
  business:  { light: 'BUILDING DIGITAL PRODUCTS.', noir: 'THE BRIEF. THE BUILD.' },
};

/** [top line, highlighted bottom line] per audience/theme — drives the styled headline render */
const HEADLINE_PARTS = {
  developer: { light: ['CRAFT &', 'CLARITY.'], noir: ['SHADOWS &', 'SYNTAX.'] },
  business:  { light: ['BUILDING DIGITAL', 'PRODUCTS.'], noir: ['THE BRIEF.', 'THE BUILD.'] },
} as const;

const CTA_LINKS = { developer: '#projects', business: '#capabilities' } as const;

const BADGE_TEXTS: ScramblerProps['texts'][] = [
  { developer: bothThemes('Developer'),      business: bothThemes('Tech Partner') },
  { developer: bothThemes('Designer'),       business: bothThemes('Product Builder') },
  { developer: bothThemes('Engineer'),       business: bothThemes('Consultant') },
];

const VIBE_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'METHOD:',    noir: 'CONFESSIONAL:' },
  business:  { light: 'APPROACH:',  noir: 'OBJECTIVE:' },
};

const CTA_TEXTS: ScramblerProps['texts'] = {
  developer: bothThemes('View My Work →'),
  business:  bothThemes('View Services →'),
};

const TELEMETRY_TEXTS: ScramblerProps['texts'] = {
  developer: bothThemes('Live Telemetry'),
  business:  bothThemes('View Analytics'),
};

export default function HeroClient({ taglines }: HeroClientProps) {
  const { isNoir, audience } = useTheme();
  const lenis = useLenis();
  const prefersReducedMotion = useReducedMotion();

  const activeAudience = audience || 'developer';
  const activeTheme = isNoir ? 'noir' : 'light';
  const [headlineTop, headlineBottom] = HEADLINE_PARTS[activeAudience][activeTheme];
  const ctaLink = CTA_LINKS[activeAudience];

  // Resolve dynamic tagline list based on active audience and theme
  const list = useMemo(() => {
    if (activeAudience === 'business') {
      return isNoir ? businessNoirTaglines : businessStandardTaglines;
    }
    return isNoir ? taglines.noir : taglines.standard;
  }, [activeAudience, isNoir, taglines]);

  // Generate a stable default tagline for SSR / initial hydration
  const defaultTagline = useMemo(() => {
    const hash = list.reduce((acc, s) => acc * 31 + s.length, 0);
    return list[Math.abs(hash) % list.length];
  }, [list]);

  const [tagline, setTagline] = useState(defaultTagline);

  // Sync tagline changes when list swaps
  useEffect(() => {
    const timer = setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * list.length);
      setTagline(list[randomIndex]);
    }, 0);
    return () => clearTimeout(timer);
  }, [list]);

  const { displayText, isDone } = useTypewriter({
    text: tagline,
    speed: 55,
    delay: 600,
  });

  const handleScrollToCTA = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(ctaLink, { duration: prefersReducedMotion ? 0 : 1.5, offset: NAVBAR_SCROLL_OFFSET });
    }
  };

  return (
    <div className={styles.content}>
      <div className={styles.textSide}>
        <Scrambler
          texts={HEADLINE_TEXTS}
          variant="headline"
          as="h1"
          className={styles.headline}
        >
          {headlineTop}<br />
          <span className={styles.highlightText}>{headlineBottom}</span>
        </Scrambler>

        <div className={styles.subtitleContainer}>
          <span className={styles.brandingName}>PRATEEQ</span>
          <div className={styles.taglineBadges}>
            {BADGE_TEXTS.map((texts, i) => (
              <Scrambler
                key={i}
                texts={texts}
                variant="badge"
                as="span"
                className={styles.tagBadge}
              />
            ))}
          </div>
        </div>

        <div className={styles.vibeBox} aria-live="polite">
          <Scrambler
            texts={VIBE_TEXTS}
            variant="badge"
            as="span"
            className={styles.vibeLabel}
          />{' '}
          <span className={styles.typedText}>
            <span className="sr-only">{tagline}</span>
            <span aria-hidden="true">
              {displayText}
              <span className={`${styles.cursor} ${isDone ? styles.cursorBlink : ''}`}>
                |
              </span>
            </span>
          </span>
        </div>

        <div className={styles.ctaContainer}>
          <a
            href={ctaLink}
            className={styles.ctaButton}
            onClick={handleScrollToCTA}
          >
            <Scrambler
              texts={CTA_TEXTS}
              variant="nav-label"
              as="span"
              className={styles.ctaText}
            />
          </a>

          <Link
            href="/admin/analytics"
            className={styles.telemetryBadge}
            aria-label="Live analytics dashboard"
          >
            <span className={styles.pulseDot} />
            <Scrambler
              texts={TELEMETRY_TEXTS}
              variant="nav-label"
              as="span"
              className={styles.ctaText}
            />
          </Link>
        </div>
      </div>

      <div className={styles.imageSide}>
        <ComicPanel tilt={2} className={styles.heroPanel} staticDots>
          <div className={styles.imageWrapper}>
            {isNoir ? (
              <Image
                src="/images/hero-noir.webp"
                alt="Prateeq Sharma hero illustration"
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 768px) 280px, 420px"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
            ) : (
              <Image
                src="/images/hero-illustration-wavy.webp"
                alt="Prateeq Sharma hero illustration"
                fill
                priority
                fetchPriority="high"
                sizes="(max-width: 768px) 280px, 420px"
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
            )}
          </div>
        </ComicPanel>
      </div>
    </div>
  );
}
