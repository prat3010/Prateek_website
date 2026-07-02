'use client';

import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLenis } from 'lenis/react';
import { useTypewriter } from '@/hooks/useTypewriter';
import { NAVBAR_SCROLL_OFFSET } from '@/lib/constants';
import { useTheme } from '@/context/ThemeContext';
import ComicPanel from '@/components/ui/ComicPanel';
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

const HERO_COPY: Record<'developer' | 'business', Record<'light' | 'noir', HeroCopy>> = {
  developer: {
    light: {
      headline: (
        <>
          CRAFTING DIGITAL<br />
          <span className={styles.highlightText}>WORLDS.</span>
        </>
      ),
      taglineBadges: ["Developer", "Designer", "Storyteller"],
      ctaText: "View My Work →",
      ctaLink: "#projects",
      vibeLabel: "NARRATOR:"
    },
    noir: {
      headline: (
        <>
          SHADOWS &<br />
          <span className={styles.highlightText}>SYNTAX.</span>
        </>
      ),
      taglineBadges: ["Developer", "Designer", "Storyteller"],
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
          LOGIC &<br />
          <span className={styles.highlightText}>OUTCOMES.</span>
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
      lenis.scrollTo(copy.ctaLink, { duration: 1.5, offset: NAVBAR_SCROLL_OFFSET });
    }
  };

  return (
    <div className={styles.content}>
      <div className={styles.textSide}>
        <h1 className={styles.headline}>
          {copy.headline}
        </h1>

        <div className={styles.subtitleContainer}>
          <span className={styles.brandingName}>PRATEEQ</span>
          <div className={styles.taglineBadges}>
            {copy.taglineBadges.map((badge) => (
              <span key={badge} className={styles.tagBadge}>
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className={styles.vibeBox} aria-live="polite">
          <span className={styles.vibeLabel}>
            {copy.vibeLabel}
          </span>{' '}
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
            <span className={styles.ctaText}>{copy.ctaText}</span>
          </a>

          <Link
            href="/admin/analytics"
            className={styles.telemetryBadge}
            aria-label="Live Telemetry - View live edge analytics"
          >
            <span className={styles.pulseDot} />
            <span className={styles.ctaText}>Live Telemetry</span>
          </Link>
        </div>
      </div>

      <div className={styles.imageSide}>
        <ComicPanel tilt={2} className={styles.heroPanel} staticDots>
          <div className={styles.imageWrapper}>
            <Image
              src="/images/hero-noir.webp"
              alt="Prateeq Sharma hero illustration"
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 768px) 280px, 420px"
              className={`${styles.heroImage} ${styles.darkOnly}`}
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
            <Image
              src="/images/hero-illustration-wavy.webp"
              alt="Prateeq Sharma hero illustration"
              fill
              priority
              fetchPriority="high"
              sizes="(max-width: 768px) 280px, 420px"
              className={`${styles.heroImage} ${styles.lightOnly}`}
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
        </ComicPanel>
      </div>
    </div>
  );
}

export default function HeroClient({ taglines }: HeroClientProps) {
  return <HeroClientContent taglines={taglines} />;
}
