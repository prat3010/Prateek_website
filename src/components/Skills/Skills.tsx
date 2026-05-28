'use client';

import React, { useState, useMemo } from 'react';
import { skills, categoryLabels, type SkillCategory } from '@/data/skills';
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

export default function Skills() {
  const [activeCategory, setActiveCategory] = useState<'all' | SkillCategory>('all');
  const { isNoir } = useTheme();

  const filteredSkills = useMemo(
    () =>
      activeCategory === 'all'
        ? skills
        : skills.filter((s) => s.category === activeCategory),
    [activeCategory]
  );

  return (
    <section id="skills" className={styles.skills} aria-label="Skills">
      {/* Background speed lines */}
      <div className={styles.speedLinesBg} aria-hidden="true" />

      <div className={styles.container}>
        <ScrollReveal>
          <h2 className={styles.sectionTitle}>
            SUPER POWERS
            <span className={styles.titleAction}>
              <ActionWord
                word="ZAP!"
                color={isNoir ? '#000000' : 'var(--pop-yellow)'}
                starburstColor={isNoir ? '#FFFFFF' : undefined}
                size="lg"
              />
            </span>
          </h2>
        </ScrollReveal>

        {/* Category filter tabs */}
        <ScrollReveal delay={100}>
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
