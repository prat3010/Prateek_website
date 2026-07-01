'use client';

import React from 'react';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';
import ComicPanel from '@/components/ui/ComicPanel';
import SpeechBubble from '@/components/ui/SpeechBubble';
import CaptionBox from '@/components/ui/CaptionBox';
import styles from './About.module.css';

const funFacts = [
  'SYSTEM // Co-piloted by state-of-the-art AI systems',
  'VELOCITY // Prompt-to-app builder at supersonic speed',
  'ENGINE // Master of AI orchestration & prototyping',
  'LOCATION // Based in India, building future-proof experiences',
];

const funFactsNoir = [
  'Co-piloted by neural shadows and synthetic ghosts.',
  'Raising apps out of the ether before the ink dries.',
  'Orchestrating virtual puppets and raw prototype grids.',
  'Based in India, forging code to survive the digital decay.',
];

export default function About() {
  const { isNoir } = useTheme();

  return (
    <section id="about" className={styles.about} aria-label="About me">
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          ORIGIN STORY
        </h2>

        <div className={styles.grid}>
          <div className={styles.imageColumn}>
            <ComicPanel tilt={-2} className={styles.profilePanel} staticDots>
              <div className={styles.imageWrapper}>
                <Image
                  src={isNoir ? '/images/profile-noir.webp' : '/images/profile-comic.webp'}
                  alt="Prateeq Sharma portrait"
                  width={360}
                  height={432}
                  sizes="(max-width: 768px) 260px, 360px"
                  className={styles.profileImage}
                  priority={false}
                />
              </div>
            </ComicPanel>
          </div>

          <div className={styles.textColumn}>
            <SpeechBubble direction="left" className={styles.bioBubble}>
              {isNoir ? (
                <p className={styles.bioText}>
                  They stare at screens, praying to a god of syntax and semicolons. I don&apos;t.
                  <br /><br />
                  My name is <strong>Prateeq Sharma</strong>. I transitioned from a background in Commerce to software engineering when I realized that code + AI is the ultimate leverage to solve complex business and technical problems. Now, I bring ideas out of the dark and into reality at warp speed. While traditional coders get lost in legacy frameworks, I combine solid system logic with AI orchestration to build fast, polished applications.
                  <br /><br />
                  In this city, the real superpower isn&apos;t memorizing boilerplate code. It&apos;s having the vision to design, the skill to build, and the tools to make it happen before the rain stops.
                </p>
              ) : (
                <p className={styles.bioText}>
                  Hey there! I&apos;m <strong>Prateeq Sharma</strong> — a product-minded developer and builder who crafts high-performance web applications and digital experiences. Transitioning from a Commerce background, I realized that combining business logic with software and modern AI orchestration is the fastest way to turn complex requirements into shipped products. I focus on delivering velocity, architectural precision, and high-impact results.
                </p>
              )}
            </SpeechBubble>

            <div className={styles.funFacts}>
              {(isNoir ? funFactsNoir : funFacts).map((fact) => (
                <CaptionBox key={fact} className={styles.factBox}>
                  {fact}
                </CaptionBox>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
