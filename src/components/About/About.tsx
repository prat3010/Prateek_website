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
    // Hardcoded static fallbacks
    if (activeAudience === 'business') {
      return isNoir 
        ? "They talk about design and code like separate puzzles. I don't. My name is Prateeq Sharma. I'm a technology partner who turns business concepts into high-end, responsive web platforms. With a background in Commerce and expert software engineering skills, I design custom admin portals, optimize performance, and integrate secure payment setups to maximize your bottom line. We build with precision and zero overhead, delivering results that actually matter."
        : "Hey there! I'm Prateeq Sharma — a freelance developer and technology partner who builds clean, high-performance websites and custom tools. Coming from a Commerce background, I don't just write code; I design systems that solve actual business problems, optimize load speeds for better search rankings, and integrate AI automations to save your team hours of manual work. Let's collaborate to build something your customers will love.";
    }
    return isNoir
      ? "They stare at screens, praying to a god of syntax and semicolons. I don't. My name is Prateeq Sharma. I transitioned from a background in Commerce to software engineering when I realized that code + AI is the ultimate leverage to solve complex business and technical problems. Now, I bring ideas out of the dark and into reality at warp speed. While traditional coders get lost in legacy frameworks, I combine solid system logic with AI orchestration to build fast, polished applications. In this city, the real superpower isn't memorizing boilerplate code. It's having the vision to design, the skill to build, and the tools to make it happen before the rain stops."
      : "Hey there! I'm Prateeq Sharma — a product-minded developer and builder who crafts high-performance web applications and digital experiences. Transitioning from a Commerce background, I realized that combining business logic with software and modern AI orchestration is the fastest way to turn complex requirements into shipped products. I focus on delivering velocity, architectural precision, and high-impact results.";
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
