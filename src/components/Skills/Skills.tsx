'use client';

import React from 'react';
import { type Skill, skills } from '@/data/skills';
import { useTheme } from '@/context/ThemeContext';
import { 
  Zap, 
  Sparkles, 
  Brain, 
  Bot, 
  Server, 
  Database, 
  Terminal, 
  BarChart, 
  Layout, 
  Paintbrush, 
  Shield,
  Target
} from 'lucide-react';
import styles from './Skills.module.css';

// Map icon strings to Lucide components
const iconMap: Record<string, React.ComponentType<any>> = {
  zap: Zap,
  sparkles: Sparkles,
  brain: Brain,
  bot: Bot,
  server: Server,
  database: Database,
  terminal: Terminal,
  'bar-chart': BarChart,
  layout: Layout,
  paintbrush: Paintbrush,
  shield: Shield
};

export default function Skills() {
  const { isNoir } = useTheme();

  // Filter skills by dossier categories
  const orchestrationSkills = skills.filter(s => s.category === 'orchestration');
  const logicSkills = skills.filter(s => s.category === 'logic');
  const productSkills = skills.filter(s => s.category === 'product');
  const dynamicSkills = skills.filter(s => s.category === 'dynamic');

  const renderSkillRow = (skill: Skill) => {
    const Icon = iconMap[skill.icon] || Sparkles;
    return (
      <div key={skill.name} className={styles.dossierItem}>
        <div className={styles.dossierItemHeader}>
          <div className={styles.dossierNameContainer}>
            <Icon 
              className={styles.dossierItemIcon} 
              style={{ color: skill.color }} 
            />
            <h4 className={styles.dossierItemName}>{skill.name}</h4>
          </div>
          <span 
            className={`${styles.dossierLevelBadge} ${styles['level_' + (skill.status || 'mastered')]}`}
          >
            {skill.level}
          </span>
        </div>
        
        <p className={styles.dossierItemDesc}>{skill.description}</p>
        
        {skill.projects && skill.projects.length > 0 && (
          <div className={styles.dossierForged}>
            <span className={styles.dossierForgedLabel}>FORGED IN:</span>
            <div className={styles.dossierTags}>
              {skill.projects.map(proj => (
                <a 
                  key={proj.id}
                  href={`/#projects`}
                  className={styles.dossierTagLink}
                  onClick={(e) => {
                    const el = document.getElementById(proj.id);
                    if (el) {
                      e.preventDefault();
                      el.scrollIntoView({ behavior: 'smooth' });
                      el.classList.add('flash-highlight');
                      setTimeout(() => {
                        el.classList.remove('flash-highlight');
                      }, 2000);
                    }
                  }}
                >
                  {proj.title}
                </a>
              ))}
            </div>
          </div>
        )}

        {skill.status === 'quest' && (
          <div className={styles.dossierQuestAlert}>
            <Target size={12} className={styles.dossierQuestIcon} />
            <span>Active Quest: Deploying analytical data science pipelines.</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <section id="skills" className={styles.skills} aria-label="Skills">
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          PROFILE DOSSIER
        </h2>

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

        {/* Dossier Columns */}
        <div className={styles.dossierGrid}>
          {/* Column 1: AI Orchestration */}
          <div className={`${styles.dossierColumn} ${styles.colOrchestration}`}>
            <div className={styles.dossierColHeader}>
              <span 
                className={styles.dossierColBadge} 
                style={{ 
                  backgroundColor: 'var(--pop-pink)',
                  ['--neon-accent' as any]: 'var(--neon-pink)'
                }}
              >
                I. AI ORCHESTRATION
              </span>
            </div>
            <div className={styles.dossierColContent}>
              {orchestrationSkills.map(renderSkillRow)}
            </div>
          </div>

          {/* Column 2: Systems Logic */}
          <div className={`${styles.dossierColumn} ${styles.colLogic}`}>
            <div className={styles.dossierColHeader}>
              <span 
                className={styles.dossierColBadge} 
                style={{ 
                  backgroundColor: 'var(--pop-blue)',
                  ['--neon-accent' as any]: 'var(--neon-cyan)'
                }}
              >
                II. SYSTEMS & LOGIC
              </span>
            </div>
            <div className={styles.dossierColContent}>
              {logicSkills.map(renderSkillRow)}
            </div>
          </div>

          {/* Column 3: Product UX & Legendary Ability */}
          <div className={`${styles.dossierColumn} ${styles.colProduct}`}>
            {/* Subsection 3a: Product & UX */}
            <div className={styles.dossierColHeader}>
              <span 
                className={styles.dossierColBadge} 
                style={{ 
                  backgroundColor: 'var(--pop-red)',
                  ['--neon-accent' as any]: 'var(--neon-yellow)'
                }}
              >
                III. PRODUCT & UX
              </span>
            </div>
            <div className={styles.dossierColContent} style={{ marginBottom: '2rem' }}>
              {productSkills.map(renderSkillRow)}
            </div>

            {/* Subsection 3b: Legendary Command */}
            <div className={styles.dossierColHeader}>
              <span 
                className={styles.dossierColBadge} 
                style={{ 
                  backgroundColor: 'var(--pop-orange)',
                  ['--neon-accent' as any]: 'var(--neon-purple)'
                }}
              >
                IV. DYNAMIC COMMAND
              </span>
            </div>
            <div className={styles.dossierColContent}>
              {dynamicSkills.map(renderSkillRow)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
