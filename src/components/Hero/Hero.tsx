'use client';

import React from 'react';
import Image from 'next/image';
import { useTypewriter } from '@/hooks/useTypewriter';
import ActionWord from '@/components/ui/ActionWord';
import ComicPanel from '@/components/ui/ComicPanel';
import styles from './Hero.module.css';

export default function Hero() {
  const { displayText, isDone } = useTypewriter({
    text: 'Crafting Digital Worlds, One Panel at a Time',
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
    <section className={styles.hero} aria-label="Hero">
      {/* Speed lines background */}
      <div className={styles.speedLines} aria-hidden="true" />
      <div className={styles.benDayDots} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.textSide}>
          {/* Floating POW action word */}
          <div className={styles.powWrapper}>
            <ActionWord word="POW!" color="var(--pop-yellow)" size="xl" />
          </div>

          <h1 className={styles.headline}>
            <span className={styles.typedText}>
              {displayText}
              <span className={`${styles.cursor} ${isDone ? styles.cursorBlink : ''}`}>
                |
              </span>
            </span>
          </h1>

          <p className={styles.subtitle}>
            Prateek Sharma — Developer • Designer • Storyteller
          </p>

          <a
            href="#projects"
            className={styles.ctaButton}
            onClick={handleScrollToProjects}
          >
            <span className={styles.ctaText}>View My Work →</span>
          </a>
        </div>

        <div className={styles.imageSide}>
          <ComicPanel tilt={2} className={styles.heroPanel}>
            <Image
              src="/images/hero-illustration.png"
              alt="Prateek Sharma hero illustration"
              width={500}
              height={500}
              priority
              className={styles.heroImage}
            />
          </ComicPanel>
          {/* Small floating action words */}
          <div className={styles.floatingZap}>
            <ActionWord word="ZAP!" color="var(--pop-blue)" size="md" />
          </div>
        </div>
      </div>

      {/* Decorative bottom wave */}
      <div className={styles.bottomEdge} aria-hidden="true" />
    </section>
  );
}
