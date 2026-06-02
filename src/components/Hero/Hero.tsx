'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTypewriter } from '@/hooks/useTypewriter';
import { useTheme } from '@/context/ThemeContext';
import ActionWord from '@/components/ui/ActionWord';
import ComicPanel from '@/components/ui/ComicPanel';
import styles from './Hero.module.css';

interface HeroProps {
  taglines: {
    standard: string[];
    noir: string[];
  };
}

export default function Hero({ taglines }: HeroProps) {
  const { isNoir } = useTheme();
  const [tagline, setTagline] = useState(isNoir ? taglines.noir[0] : taglines.standard[0]);

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
    const el = document.getElementById('projects');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className={styles.hero} aria-label="Hero">
      <div className={styles.content}>
        <div className={styles.textSide}>
          {/* Floating POW action word */}
          <div className={styles.powWrapper}>
            <ActionWord
              word={isNoir ? 'GRIT!' : 'POW!'}
              color={isNoir ? '#000000' : 'var(--pop-yellow)'}
              starburstColor={isNoir ? '#FFFFFF' : undefined}
              size="xl"
            />
          </div>

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
              <div 
                className={styles.heroImage}
                role="img"
                aria-label="Prateeq Sharma hero illustration"
              />
            </div>
          </ComicPanel>
          {/* Small floating action words */}
          <div className={styles.floatingZap}>
            <ActionWord
              word={isNoir ? 'SHADOW!' : 'ZAP!'}
              color={isNoir ? '#FFFFFF' : 'var(--pop-blue)'}
              starburstColor={isNoir ? '#000000' : undefined}
              size="md"
            />
          </div>
        </div>
      </div>

      {/* Decorative bottom wave */}
      <div className={styles.bottomEdge} aria-hidden="true" />
    </section>
  );
}
