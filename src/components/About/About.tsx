'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { useTheme, type Audience, type Theme } from '@/context/ThemeContext';
import type { ResumeData } from '@/data/resume';
import ComicPanel from '@/components/ui/ComicPanel';
import SpeechBubble from '@/components/ui/SpeechBubble';
import CaptionBox from '@/components/ui/CaptionBox';
import Scrambler from '@/components/ui/Scrambler';
import type { ScramblerProps } from '@/components/ui/Scrambler';
import styles from './About.module.css';

const ABOUT_SECTION_TITLE_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'ORIGIN STORY', noir: 'ORIGIN STORY' },
  business: { light: 'ORIGIN STORY', noir: 'ORIGIN STORY' },
};

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

  // Build the TextMap array for the biography text
  const bioTexts = useMemo<ScramblerProps['texts']>(() => {
    const devLight = resumeData?.about?.developer?.light || "I'm Prateeq Sharma, a developer focused on web applications, interface quality, and practical AI-assisted workflows.";
    const devNoir = resumeData?.about?.developer?.noir || "I'm Prateeq Sharma, a developer focused on clear structure, practical AI-assisted workflows, and dependable delivery.";
    const bizLight = resumeData?.about?.business?.light || "I'm Prateeq Sharma, a freelance developer who builds practical websites, custom tools, and straightforward client workflows.";
    const bizNoir = resumeData?.about?.business?.noir || "I'm Prateeq Sharma, a freelance developer focused on practical websites, clear handoff, and maintainable client work.";

    return {
      developer: {
        light: devLight,
        noir: devNoir,
      },
      business: {
        light: bizLight,
        noir: bizNoir,
      },
    };
  }, [resumeData]);

  // Build the TextMap array for the fun facts cards
  const factsTextsList = useMemo<ScramblerProps['texts'][]>(() => {
    const devFactsLight = resumeData?.about?.developer?.facts || [
      'SYSTEM // Web applications with clear structure',
      'VELOCITY // Fast prototyping and practical delivery',
      'ENGINE // AI-assisted development workflows',
      'LOCATION // Based in India, building remotely',
    ];
    const devFactsNoir = resumeData?.about?.developer?.factsNoir || [
      'Building web systems with a clean technical footprint.',
      'Turning ideas into working interfaces with minimal friction.',
      'Keeping structure, speed, and maintenance in view.',
      'Based in India and working remotely.',
    ];
    const bizFactsLight = resumeData?.about?.business?.facts || [
      "SERVICE // Direct freelance partnership",
      "SPEED // Focused feature delivery",
      "VALUE // Practical, maintainable web work",
      "LOCATION // Based in India, working remotely"
    ];
    const bizFactsNoir = resumeData?.about?.business?.factsNoir || [
      "Custom websites built for clear delivery and easy handoff.",
      "Fast interfaces with practical structure behind them.",
      "Maintainable systems that stay usable after launch.",
      "Working directly with clients from brief to deployment."
    ];

    const maxLen = Math.max(
      devFactsLight.length,
      devFactsNoir.length,
      bizFactsLight.length,
      bizFactsNoir.length
    );

    const list: ScramblerProps['texts'][] = [];
    for (let i = 0; i < maxLen; i++) {
      list.push({
        developer: {
          light: devFactsLight[i] || '',
          noir: devFactsNoir[i] || '',
        },
        business: {
          light: bizFactsLight[i] || '',
          noir: bizFactsNoir[i] || '',
        },
      });
    }
    return list;
  }, [resumeData]);

  return (
    <section id="about" className={styles.about} aria-label="About me">
      <div className={styles.container}>
        <Scrambler
          texts={ABOUT_SECTION_TITLE_TEXTS}
          variant="section-title"
          as="h2"
          className={styles.sectionTitle}
        />

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
              <Scrambler
                texts={bioTexts}
                variant="headline"
                as="p"
                className={styles.bioText}
                duration={800}
                staggerPerChar={5}
              >
                {parsedBio}
              </Scrambler>
            </SpeechBubble>

            <div className={styles.funFacts}>
              {factsTextsList.map((factTexts, index) => (
                <CaptionBox key={index} className={styles.factBox}>
                  <Scrambler
                    texts={factTexts}
                    variant="badge"
                    as="span"
                  >
                    {factsList[index] || ''}
                  </Scrambler>
                </CaptionBox>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default React.memo(About);
