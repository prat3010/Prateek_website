'use client';

import React from 'react';
import { type Skill } from '@/data/skills';
import { useTheme } from '@/context/ThemeContext';
import SkillTree from './SkillTree';
import styles from './Skills.module.css';

const MO_TEXT_STANDARD =
  'I don\u2019t write syntax line-by-line by hand\u2014I command powerful AI systems (like Cursor, Gemini, and v0) to manifest my ideas. I focus 100% of my energy on high-level system architecture, product design, UX, and orchestration.';

const MO_TEXT_NOIR =
  'Subject operates through AI orchestration. Directs autonomous agents and advanced models to synthesize code. Zero manual syntax writing; absolute focus on system architecture, product design, and debugging.';

interface SkillsProps {
  skills: Skill[];
}

export default function Skills({ skills }: SkillsProps) {
  const { isNoir } = useTheme();

  return (
    <section id="skills" className={styles.skills} aria-label="Skills">
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          SUPER POWERS
        </h2>

        <div className={styles.moBanner}>
          <div className={styles.moBadge}>
            {isNoir ? 'CASE FILE' : 'MY M.O.'}
          </div>
          <div className={styles.moHeader}>
            {isNoir ? 'DEVELOPMENT METHODOLOGY' : 'METHOD OF OPERATION'}
          </div>
          <p className={styles.moText}>
            {isNoir ? MO_TEXT_NOIR : MO_TEXT_STANDARD}
          </p>
        </div>

        <SkillTree />
      </div>
    </section>
  );
}
