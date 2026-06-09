'use client';

import React, { useState, useMemo } from 'react';
import { useLenis } from 'lenis/react';
import { categoryLabels, type SkillCategory, type Skill } from '@/data/skills';
import { useTheme } from '@/context/ThemeContext';
import SkillCard from './SkillCard';
import styles from './Skills.module.css';

const categories: Array<'all' | SkillCategory> = [
  'all',
  'frontend',
  'backend',
  'tools',
  'creative',
];

const tabLabels: Record<string, string> = {
  all: 'All Powers',
  ...categoryLabels,
};

const MO_TEXT_STANDARD =
  'I don\u2019t write syntax line-by-line by hand\u2014I command powerful AI systems (like Cursor, Gemini, and v0) to manifest my ideas. I focus 100% of my energy on high-level system architecture, product design, UX, and orchestration.';

const MO_TEXT_NOIR =
  'Subject operates through AI orchestration. Directs autonomous agents and advanced models to synthesize code. Zero manual syntax writing; absolute focus on system architecture, product design, and debugging.';

interface SkillsProps {
  skills: Skill[];
}

export default function Skills({ skills }: SkillsProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | SkillCategory>('all');
  const { isNoir } = useTheme();
  const lenis = useLenis();

  const filteredSkills = useMemo(
    () =>
      activeCategory === 'all'
        ? skills
        : skills.filter((s) => s.category === activeCategory),
    [activeCategory, skills]
  );

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

        <div className={styles.tabs} role="tablist" aria-label="Filter skills by category">
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeCategory === cat}
              className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ''}`}
              onClick={() => {
                setActiveCategory(cat);
                lenis?.scrollTo('#skills', { duration: 0.8, offset: -70 });
              }}
            >
              {tabLabels[cat]}
            </button>
          ))}
        </div>

        <div className={styles.grid} role="tabpanel">
          {filteredSkills.map((skill, index) => (
            <SkillCard key={skill.name} skill={skill} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
