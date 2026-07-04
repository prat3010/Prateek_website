'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import type { ResumeData } from '@/data/resume';
import ComicPanel from '@/components/ui/ComicPanel';
import SpeechBubble from '@/components/ui/SpeechBubble';
import CaptionBox from '@/components/ui/CaptionBox';
import styles from './About.module.css';

interface AboutProps {
  resumeData: ResumeData | null;
}

function About({ resumeData }: AboutProps) {
  const { isNoir, audience } = useTheme();

  const activeAudience = audience || 'developer';
  const bioContent = resumeData?.about?.[activeAudience];

  // Resolve dynamic biography narrative based on audience and theme
  const bioText = useMemo(() => {
    if (bioContent) {
      return isNoir ? bioContent.noir : bioContent.light;
    }
    if (activeAudience === 'business') {
      return isNoir
        ? "I'm Prateeq Sharma, a freelance developer focused on practical websites, clear handoff, and maintainable client work."
        : "I'm Prateeq Sharma, a freelance developer who builds practical websites, custom tools, and straightforward client workflows.";
    }
    return isNoir
      ? "I'm Prateeq Sharma, a developer focused on clear structure, practical AI-assisted workflows, and dependable delivery."
      : "I'm Prateeq Sharma, a developer focused on web applications, interface quality, and practical AI-assisted workflows.";
  }, [bioContent, isNoir, activeAudience]);

  // Format biography text to bold the name dynamically
  const parsedBio = useMemo(() => {
    const nameStr = 'Prateeq Sharma';
    const idx = bioText.indexOf(nameStr);
    if (idx !== -1) {
      const before = bioText.substring(0, idx);
      const after = bioText.substring(idx + nameStr.length);
      return (
        <>
          {before}
          <strong>{nameStr}</strong>
          {after}
        </>
      );
    }
    return bioText;
  }, [bioText]);

  // Resolve dynamic facts list based on audience and theme
  const factsList = useMemo(() => {
    if (bioContent) {
      return isNoir ? bioContent.factsNoir : bioContent.facts;
    }
    if (activeAudience === 'business') {
      return isNoir
        ? [
            "Custom websites built for clear delivery and easy handoff.",
            "Fast interfaces with practical structure behind them.",
            "Maintainable systems that stay usable after launch.",
            "Working directly with clients from brief to deployment."
          ]
        : [
            "SERVICE // Direct freelance partnership",
            "SPEED // Focused feature delivery",
            "VALUE // Practical, maintainable web work",
            "LOCATION // Based in India, working remotely"
          ];
    }
    return isNoir
      ? [
          'Building web systems with a clean technical footprint.',
          'Turning ideas into working interfaces with minimal friction.',
          'Keeping structure, speed, and maintenance in view.',
          'Based in India and working remotely.'
        ]
      : [
          'SYSTEM // Web applications with clear structure',
          'VELOCITY // Fast prototyping and practical delivery',
          'ENGINE // AI-assisted development workflows',
          'LOCATION // Based in India, building remotely',
        ];
  }, [bioContent, isNoir, activeAudience]);

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
              <AnimatePresence mode="wait">
                <motion.p
                  key={activeAudience + '-' + (isNoir ? 'noir' : 'light')}
                  className={styles.bioText}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {parsedBio}
                </motion.p>
              </AnimatePresence>
            </SpeechBubble>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeAudience + '-' + (isNoir ? 'noir' : 'light')}
                className={styles.funFacts}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {factsList.map((fact) => (
                  <CaptionBox key={fact} className={styles.factBox}>
                    {fact}
                  </CaptionBox>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};

export default React.memo(About);
