'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLenis } from 'lenis/react';
import { useTypewriter } from '@/hooks/useTypewriter';
import { NAVBAR_SCROLL_OFFSET } from '@/lib/constants';
import { useTheme } from '@/context/ThemeContext';
import ComicPanel from '@/components/ui/ComicPanel';
import styles from './Hero.module.css';

interface HeroClientProps {
  taglines: {
    standard: string[];
    noir: string[];
  };
}

export default function HeroClient({ taglines }: HeroClientProps) {
  const { isNoir } = useTheme();
  const [tagline, setTagline] = useState(isNoir ? taglines.noir[0] : taglines.standard[0]);
  const lenis = useLenis();

  useEffect(() => {
    const list = isNoir ? taglines.noir : taglines.standard;
    const randomIndex = Math.floor(Math.random() * list.length);
    setTagline(list[randomIndex]);
  }, [isNoir, taglines]);

  const { displayText, isDone } = useTypewriter({
    text: tagline,
    speed: 55,
    delay: 600,
  });

  const handleScrollToProjects = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo('#projects', { duration: 1.5, offset: NAVBAR_SCROLL_OFFSET });
    }
  };

  return (
    <div className={styles.content}>
      <div className={styles.textSide}>
        <h1 className={styles.headline}>
          {isNoir ? (
            <>
              SHADOWS &<br />
              <span className={styles.highlightText}>SYNTAX.</span>
            </>
          ) : (
            <>
              CRAFTING DIGITAL<br />
              <span className={styles.highlightText}>WORLDS.</span>
            </>
          )}
        </h1>

        <div className={styles.subtitleContainer}>
          <span className={styles.brandingName}>PRATEEQ</span>
          <div className={styles.taglineBadges}>
            <span className={styles.tagBadge}>Developer</span>
            <span className={styles.tagBadge}>Designer</span>
            <span className={styles.tagBadge}>Storyteller</span>
          </div>
        </div>

        <div className={styles.vibeBox} aria-live="polite">
          <span className={styles.vibeLabel}>
            {isNoir ? 'CONFESSIONAL:' : 'NARRATOR:'}
          </span>{' '}
          <span className={styles.typedText}>
            {/* Screen reader and SEO friendly hidden container holding the full tagline */}
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
            href="#projects"
            className={styles.ctaButton}
            onClick={handleScrollToProjects}
          >
            <span className={styles.ctaText}>View My Work →</span>
          </a>

          <Link
            href="/admin/analytics"
            className={styles.telemetryBadge}
            aria-label="View live edge telemetry analytics"
          >
            <span className={styles.pulseDot} />
            <span className={styles.ctaText}>📈 Live Telemetry</span>
          </Link>
        </div>
      </div>

      <div className={styles.imageSide}>
        <ComicPanel tilt={2} className={styles.heroPanel}>
          <div className={styles.imageWrapper}>
            <Image
              src={isNoir ? '/images/hero-noir.webp' : '/images/hero-illustration.webp'}
              alt="Prateeq Sharma hero illustration"
              fill
              priority
              sizes="(max-width: 768px) 280px, 420px"
              className={styles.heroImage}
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
        </ComicPanel>
      </div>
    </div>
  );
}
