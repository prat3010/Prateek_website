'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme, useAudience } from '@/context/ThemeContext';
import type { ResumeData } from '@/data/resume';
import { ABOUT_FALLBACKS } from '@/data/about-fallbacks';
import ComicPanel from '@/components/ui/ComicPanel';
import SpeechBubble from '@/components/ui/SpeechBubble';
import CaptionBox from '@/components/ui/CaptionBox';
import styles from './About.module.css';

interface AboutProps {
  resumeData: ResumeData | null;
}

const NAME = 'Prateeq Sharma';
const PORTRAIT_NOIR = '/images/profile-noir.webp';
const PORTRAIT_COMIC = '/images/profile-comic.webp';
const SECTION_LABEL = 'About me';
const SECTION_TITLE = 'ORIGIN STORY';

function About({ resumeData }: AboutProps) {
  const { isNoir } = useTheme();
  const { audience } = useAudience();

  const activeAudience = audience || 'developer';
  const bioContent = resumeData?.about?.[activeAudience];

  const themeKey = isNoir ? 'noir' : 'light';

  const bioText = useMemo(() => {
    if (bioContent) {
      return isNoir ? bioContent.noir : bioContent.light;
    }
    const fallback = ABOUT_FALLBACKS[activeAudience]?.[themeKey];
    return fallback?.bio ?? '';
  }, [bioContent, isNoir, activeAudience, themeKey]);

  const parsedBio = useMemo(() => {
    const nameStr = NAME;
    const idx = bioText.indexOf(nameStr);
    if (idx !== -1) {
      const before = bioText.substring(0, idx);
      const after = bioText.substring(idx + nameStr.length);
      return (
        <>
          {before}
            <strong>{NAME}</strong>
          {after}
        </>
      );
    }
    return bioText;
  }, [bioText]);

  const factsList = useMemo(() => {
    if (bioContent) {
      return isNoir ? bioContent.factsNoir : bioContent.facts;
    }
    const fallback = ABOUT_FALLBACKS[activeAudience]?.[themeKey];
    return fallback?.facts ?? [];
  }, [bioContent, isNoir, activeAudience, themeKey]);

  return (
    <section id="about" className={styles.about} aria-label={SECTION_LABEL}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          {SECTION_TITLE}
        </h2>

        <div className={styles.grid}>
          <div className={styles.imageColumn}>
            <ComicPanel tilt={-2} className={styles.profilePanel} staticDots>
              <div className={styles.imageWrapper}>
                <Image
                  src={isNoir ? PORTRAIT_NOIR : PORTRAIT_COMIC}
                  alt={`${NAME} portrait`}
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
