'use client';

import React, { useState, useMemo } from 'react';
import { categoryLabels, type SkillCategory, type Skill } from '@/data/skills';
import { useTheme } from '@/context/ThemeContext';
import ActionWord from '@/components/ui/ActionWord';
import ScrollReveal from '@/components/effects/ScrollReveal';
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

interface SkillsProps {
  skills: Skill[];
}

export default function Skills({ skills }: SkillsProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | SkillCategory>('all');
  const { isNoir } = useTheme();

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
        <ScrollReveal>
          <h2 className={styles.sectionTitle}>
            SUPER POWERS
            <span className={styles.titleAction}>
              <ActionWord
                word={isNoir ? 'SHADOW!' : 'ZAP!'}
                color={isNoir ? '#000000' : 'var(--pop-yellow)'}
                starburstColor={isNoir ? '#FFFFFF' : undefined}
                size="lg"
              />
            </span>
          </h2>
        </ScrollReveal>

        {/* Method of Operation (M.O.) Banner */}
        <ScrollReveal delay={80}>
          <div className={styles.moBanner}>
            <div className={styles.moBadge}>
              {isNoir ? 'CASE FILE' : 'MY M.O.'}
            </div>
            <div className={styles.moHeader}>
              {isNoir ? 'DEVELOPMENT METHODOLOGY' : 'METHOD OF OPERATION'}
            </div>
            <p className={styles.moText}>
              {isNoir
                ? 'Subject operates through AI orchestration. Directs autonomous agents and advanced models to synthesize code. Zero manual syntax writing; absolute focus on system architecture, product design, and debugging.'
                : 'I don’t write syntax line-by-line by hand—I command powerful AI systems (like Cursor, Gemini, and v0) to manifest my ideas. I focus 100% of my energy on high-level system architecture, product design, UX, and orchestration.'}
            </p>
          </div>
        </ScrollReveal>

        {/* Category filter tabs */}
        <ScrollReveal delay={120}>
          <div className={styles.tabs} role="tablist" aria-label="Filter skills by category">
            {categories.map((cat) => (
              <button
                key={cat}
                role="tab"
                aria-selected={activeCategory === cat}
                className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {tabLabels[cat]}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Skills grid */}
        <div className={styles.grid} role="tabpanel">
          {filteredSkills.map((skill, index) => (
            <ScrollReveal key={skill.name} delay={150 + index * 60}>
              <SkillCard skill={skill} index={index} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
