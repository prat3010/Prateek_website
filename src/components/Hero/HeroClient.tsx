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

interface HeroCopy {
  headline: React.ReactNode;
  taglineBadges: string[];
  ctaText: string;
  ctaLink: string;
  vibeLabel: string;
}

const HEADLINE_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'CRAFT & CLARITY.',          noir: 'SHADOWS & SYNTAX.' },
  business:  { light: 'BUILDING DIGITAL PRODUCTS.', noir: 'THE BRIEF. THE BUILD.' },
};

const BADGE_TEXTS: ScramblerProps['texts'][] = [
  {
    developer: { light: 'Developer', noir: 'Developer' },
    business:  { light: 'Tech Partner',   noir: 'Tech Partner' },
  },
  {
    developer: { light: 'Designer', noir: 'Designer' },
    business:  { light: 'Product Builder', noir: 'Product Builder' },
  },
  {
    developer: { light: 'Engineer',   noir: 'Engineer' },
    business:  { light: 'Consultant', noir: 'Consultant' },
  },
];

const VIBE_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'METHOD:',    noir: 'CONFESSIONAL:' },
  business:  { light: 'APPROACH:',  noir: 'OBJECTIVE:' },
};

const CTA_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'View My Work →',  noir: 'View My Work →' },
  business:  { light: 'View Services →', noir: 'View Services →' },
};

const TELEMETRY_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'Live Telemetry', noir: 'Live Telemetry' },
  business:  { light: 'View Analytics', noir: 'View Analytics' },
};

const HERO_COPY: Record<'developer' | 'business', Record<'light' | 'noir', HeroCopy>> = {
  developer: {
    light: {
      headline: (
        <>
          CRAFT &<br />
          <span className={styles.highlightText}>CLARITY.</span>
        </>
      ),
      taglineBadges: ["Developer", "Designer", "Engineer"],
      ctaText: "View My Work →",
      ctaLink: "#projects",
      vibeLabel: "METHOD:"
    },
    noir: {
      headline: (
        <>
          SHADOWS &<br />
          <span className={styles.highlightText}>SYNTAX.</span>
        </>
      ),
      taglineBadges: ["Developer", "Designer", "Engineer"],
      ctaText: "View My Work →",
      ctaLink: "#projects",
      vibeLabel: "CONFESSIONAL:"
    }
  },
  business: {
    light: {
      headline: (
        <>
          BUILDING DIGITAL<br />
          <span className={styles.highlightText}>PRODUCTS.</span>
        </>
      ),
      taglineBadges: ["Tech Partner", "Product Builder", "Consultant"],
      ctaText: "View Services →",
      ctaLink: "#capabilities",
      vibeLabel: "SUMMARY:"
    },
    noir: {
      headline: (
        <>
          THE BRIEF.<br />
          <span className={styles.highlightText}>THE BUILD.</span>
        </>
      ),
      taglineBadges: ["Tech Partner", "Product Builder", "Consultant"],
      ctaText: "View Services →",
      ctaLink: "#capabilities",
      vibeLabel: "OBJECTIVE:"
    }
  }
};

function HeroClientContent({ taglines }: HeroClientProps) {
  const { isNoir, audience } = useTheme();
  const lenis = useLenis();
  const prefersReducedMotion = useReducedMotion();

  // Resolve dynamic tags list based on active audience and theme
  const list = useMemo(() => {
    const activeAudience = audience || 'developer';
    if (activeAudience === 'business') {
      return isNoir ? businessNoirTaglines : businessStandardTaglines;
    }
    return isNoir ? taglines.noir : taglines.standard;
  }, [audience, isNoir, taglines]);

  // Resolve structural UI copy mapping
  const copy = useMemo(() => {
    const activeAudience = audience || 'developer';
    const activeTheme = isNoir ? 'noir' : 'light';
    return HERO_COPY[activeAudience][activeTheme];
  }, [audience, isNoir]);

  // Generate a stable default tagline for SSR / initial hydration
  const defaultTagline = useMemo(() => {
    const hash = list.reduce((acc, t) => acc * 31 + t.length, 0);
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
      lenis.scrollTo(copy.ctaLink, { duration: prefersReducedMotion ? 0 : 1.5, offset: NAVBAR_SCROLL_OFFSET });
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
          {copy.headline}
        </Scrambler>

        <div className={styles.subtitleContainer}>
          <span className={styles.brandingName}>PRATEEQ</span>
          <div className={styles.taglineBadges}>
            {copy.taglineBadges.map((badge, i) => (
              <Scrambler
                key={badge}
                texts={BADGE_TEXTS[i]}
                variant="badge"
                as="span"
                className={styles.tagBadge}
              >
                {badge}
              </Scrambler>
            ))}
          </div>
        </div>

        <div className={styles.vibeBox} aria-live="polite">
          <Scrambler
            texts={VIBE_TEXTS}
            variant="badge"
            as="span"
            className={styles.vibeLabel}
          >
            {copy.vibeLabel}
          </Scrambler>{' '}
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
            href={copy.ctaLink}
            className={styles.ctaButton}
            onClick={handleScrollToCTA}
          >
            <Scrambler
              texts={CTA_TEXTS}
              variant="nav-label"
              as="span"
              className={styles.ctaText}
            >
              {copy.ctaText}
            </Scrambler>
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
            >
              {audience === 'business' ? 'View Analytics' : 'Live Telemetry'}
            </Scrambler>
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
                className={styles.heroImage}
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
                className={styles.heroImage}
                style={{ objectFit: 'cover', objectPosition: 'center' }}
              />
            )}
          </div>
        </ComicPanel>
      </div>
    </div>
  );
}

export default function HeroClient({ taglines }: HeroClientProps) {
  return <HeroClientContent taglines={taglines} />;
}
