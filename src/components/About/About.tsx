'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import ComicPanel from '@/components/ui/ComicPanel';
import SpeechBubble from '@/components/ui/SpeechBubble';
import CaptionBox from '@/components/ui/CaptionBox';
import ScrollReveal from '@/components/effects/ScrollReveal';
import ActionWord from '@/components/ui/ActionWord';
import styles from './About.module.css';

const funFacts = [
  '🤖 Co-piloted by state-of-the-art AI systems',
  '⚡ Prompt-to-app builder at supersonic speed',
  '🧠 Master of AI orchestration & prototyping',
  '🌍 Based in India, building future-proof experiences',
];

export default function About() {
  const { isNoir } = useTheme();

  return (
    <section id="about" className={styles.about} aria-label="About me">
      <div className={styles.container}>
        <ScrollReveal>
          <h2 className={styles.sectionTitle}>
            ORIGIN STORY
            <span className={styles.titleDecoration}>
              <ActionWord
                word="WOW!"
                color={isNoir ? '#000000' : 'var(--pop-pink)'}
                starburstColor={isNoir ? '#FFFFFF' : undefined}
                size="md"
                animated={false}
              />
            </span>
          </h2>
        </ScrollReveal>

        <div className={styles.grid}>
          {/* Left: Profile image */}
          <ScrollReveal delay={100} className={styles.imageColumn}>
            <ComicPanel tilt={-2} className={styles.profilePanel}>
              <div className={styles.imageWrapper}>
                <Image
                  src={isNoir ? '/images/profile-noir.jpg' : '/images/profile-comic-v2.png'}
                  alt="Prateek Sharma portrait"
                  width={400}
                  height={480}
                  className={styles.profileImage}
                />
                <div className={styles.halftoneOverlay} aria-hidden="true" />
              </div>
            </ComicPanel>
          </ScrollReveal>

          {/* Right: Bio + Fun facts */}
          <div className={styles.textColumn}>
            <ScrollReveal delay={200}>
              <SpeechBubble direction="left" className={styles.bioBubble}>
                <p className={styles.bioText}>
                  Hey there! I&apos;m <strong>Prateek Sharma</strong> — an AI-augmented
                  builder who turns ideas into reality at warp speed. By blending creative
                  vision with the power of artificial intelligence, I craft digital experiences
                  and functional apps without getting bogged down by traditional coding limits.
                  For me, the real superpower isn&apos;t memorizing syntax—it&apos;s having the
                  vision, the prompt, and the AI sidekick to build anything.
                </p>
              </SpeechBubble>
            </ScrollReveal>

            <div className={styles.funFacts}>
              {funFacts.map((fact, index) => {
                const displayFact = isNoir ? fact.replace(/^\S+\s+/, '') : fact;
                return (
                  <ScrollReveal key={fact} delay={300 + index * 120}>
                    <CaptionBox className={styles.factBox}>
                      {displayFact}
                    </CaptionBox>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
