'use client';

import React, { useMemo } from 'react';
import type { Skill } from '@/data/skills';
import { useTheme } from '@/context/ThemeContext';
import Scrambler from '@/components/ui/Scrambler';
import type { ScramblerProps } from '@/components/ui/Scrambler';
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
  Target,
  type LucideIcon
} from 'lucide-react';
import styles from './Skills.module.css';
import { m, AnimatePresence } from 'framer-motion';

const iconMap: Record<string, LucideIcon> = {
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

interface SkillsProps {
  skills: Skill[];
}

interface SkillsCopy {
  sectionTitle: string;
  moBadge: string;
  moHeader: string;
  moText: string;
  tabs: {
    orchestration: string;
    logic: string;
    product: string;
    dynamic: string;
  };
}

const SKILLS_COPY: Record<'developer' | 'business', Record<'light' | 'noir', SkillsCopy>> = {
  developer: {
    light: {
      sectionTitle: "CAPABILITIES",
      moBadge: "MY M.O.",
      moHeader: "METHOD OF OPERATION",
      moText: "I use AI tools to move faster, but I keep the stack understandable. The focus stays on architecture, product design, UX, and shipping work that can be maintained.",
      tabs: {
        orchestration: "I. AI ORCHESTRATION",
        logic: "II. SYSTEMS & LOGIC",
        product: "III. PRODUCT & UX",
        dynamic: "IV. DYNAMIC COMMAND"
      }
    },
    noir: {
      sectionTitle: "CAPABILITIES",
      moBadge: "CASE FILE",
      moHeader: "DEVELOPMENT METHODOLOGY",
      moText: "AI helps accelerate delivery, but the stack still needs to be clear. The work stays centered on architecture, product design, debugging, and maintenance.",
      tabs: {
        orchestration: "I. AI ORCHESTRATION",
        logic: "II. SYSTEMS & LOGIC",
        product: "III. PRODUCT & UX",
        dynamic: "IV. DYNAMIC COMMAND"
      }
    }
  },
  business: {
    light: {
      sectionTitle: "SERVICES & CAPABILITIES",
      moBadge: "ENGAGEMENT",
      moHeader: "HOW WE WORK",
      moText: "I work directly with businesses on websites, custom tools, and practical workflows. The process stays simple, with clear communication and maintainable delivery.",
      tabs: {
        orchestration: "I. AI INTEGRATION",
        logic: "II. WEB APPLICATIONS",
        product: "III. DESIGN & UX",
        dynamic: "IV. DYNAMIC CONSULTING"
      }
    },
    noir: {
      sectionTitle: "SERVICES & CAPABILITIES",
      moBadge: "PROTOCOL",
      moHeader: "ENGAGEMENT MODEL",
      moText: "Independent delivery keeps communication direct and the scope clear. The work covers prototypes, frontend builds, and data setup without extra layers.",
      tabs: {
        orchestration: "I. AI INTEGRATION",
        logic: "II. WEB APPLICATIONS",
        product: "III. DESIGN & UX",
        dynamic: "IV. DYNAMIC CONSULTING"
      }
    }
  }
};

const SKILL_SECTION_TITLE_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'CAPABILITIES',              noir: 'CAPABILITIES' },
  business:  { light: 'SERVICES & CAPABILITIES',    noir: 'SERVICES & CAPABILITIES' },
};

const SKILL_MO_BADGE_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'MY M.O.',     noir: 'CASE FILE' },
  business:  { light: 'ENGAGEMENT',  noir: 'PROTOCOL' },
};

const SKILL_MO_HEADER_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'METHOD OF OPERATION',      noir: 'DEVELOPMENT METHODOLOGY' },
  business:  { light: 'HOW WE WORK',               noir: 'ENGAGEMENT MODEL' },
};

const SKILL_TAB_TEXTS: ScramblerProps['texts'][] = [
  {
    developer: { light: 'I. AI ORCHESTRATION',  noir: 'I. AI ORCHESTRATION' },
    business:  { light: 'I. AI INTEGRATION',     noir: 'I. AI INTEGRATION' },
  },
  {
    developer: { light: 'II. SYSTEMS & LOGIC',  noir: 'II. SYSTEMS & LOGIC' },
    business:  { light: 'II. WEB APPLICATIONS',  noir: 'II. WEB APPLICATIONS' },
  },
  {
    developer: { light: 'III. PRODUCT & UX',    noir: 'III. PRODUCT & UX' },
    business:  { light: 'III. DESIGN & UX',      noir: 'III. DESIGN & UX' },
  },
  {
    developer: { light: 'IV. DYNAMIC COMMAND',  noir: 'IV. DYNAMIC COMMAND' },
    business:  { light: 'IV. DYNAMIC CONSULTING', noir: 'IV. DYNAMIC CONSULTING' },
  },
];

const SKILL_FORGED_LABEL_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'FORGED IN:',  noir: 'FORGED IN:' },
  business:  { light: 'APPLIED IN:', noir: 'APPLIED IN:' },
};

function Skills({ skills }: SkillsProps) {
  const { isNoir, audience } = useTheme();
  const [activeTab, setActiveTab] = React.useState<'orchestration' | 'logic' | 'product' | 'dynamic' | null>(null);

  const activeAudience = audience || 'developer';
  const activeTheme = isNoir ? 'noir' : 'light';

  const copy = useMemo(() => {
    return SKILLS_COPY[activeAudience][activeTheme];
  }, [activeAudience, activeTheme]);

  const orchestrationSkills = skills.filter(s => s.category === 'orchestration');
  const logicSkills = skills.filter(s => s.category === 'logic');
  const productSkills = skills.filter(s => s.category === 'product');
  const dynamicSkills = skills.filter(s => s.category === 'dynamic');

  const renderSkillCard = (skill: Skill) => {
    const Icon = iconMap[skill.icon] || Sparkles;
    
    const description = (activeAudience === 'business' && skill.description_business)
      ? skill.description_business
      : skill.description;

    const displayName = (activeAudience === 'business' && skill.name_business)
      ? skill.name_business
      : skill.name;

    const forgedLabel = activeAudience === 'business' ? 'APPLIED IN:' : 'FORGED IN:';

    return (
      <div
        key={skill.name}
        className={styles.skillCard}
        style={{ '--card-accent': skill.color } as React.CSSProperties}
      >
        <div className={styles.skillCardTop}>
          <div className={styles.skillCardIconWrap}>
            <Icon className={styles.skillCardIcon} style={{ color: skill.color }} />
          </div>
          <div className={styles.skillCardMeta}>
            <div className={styles.skillCardNameRow}>
              <h3 className={styles.skillCardName}>{displayName}</h3>
              {skill.level && (
                <span
                  className={`${styles.skillCardBadge} ${styles['level_' + (skill.status || 'mastered')]}`}
                >
                  {skill.level}
                </span>
              )}
            </div>
            <p className={styles.skillCardDesc}>{description}</p>
          </div>
        </div>

        {skill.projects && skill.projects.length > 0 && (
          <div className={styles.skillCardFooter}>
            <Scrambler
              texts={SKILL_FORGED_LABEL_TEXTS}
              variant="nav-label"
              as="span"
              className={styles.skillCardForgedLabel}
            >
              {forgedLabel}
            </Scrambler>
            <div className={styles.skillCardTags}>
              {skill.projects.map(proj => (
                <a
                  key={proj.id}
                  href={`/#projects`}
                  className={styles.skillCardTag}
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
          <div className={styles.skillCardQuest}>
            <Target size={12} className={styles.skillCardQuestIcon} />
            <span>Active Quest: Deploying analytical data science pipelines.</span>
          </div>
        )}
      </div>
    );
  };

  const TAB_CONFIG = [
    { id: 'orchestration' as const, color: 'var(--pop-pink)', neon: 'var(--neon-pink)' },
    { id: 'logic' as const, color: 'var(--pop-blue)', neon: 'var(--neon-cyan)' },
    { id: 'product' as const, color: 'var(--pop-red)', neon: 'var(--neon-yellow)' },
    { id: 'dynamic' as const, color: 'var(--pop-orange)', neon: 'var(--neon-purple)' },
  ];

  return (
    <section id="capabilities" className={styles.skills} aria-label="Capabilities">
      <div className={styles.container}>
        <header className={styles.sectionHeader}>
          <Scrambler
            texts={SKILL_MO_BADGE_TEXTS}
            variant="badge"
            as="div"
            className={styles.sectionTag}
          >
            {copy.moBadge}
          </Scrambler>

          <Scrambler
            texts={SKILL_SECTION_TITLE_TEXTS}
            variant="section-title"
            as="h2"
            className={styles.sectionTitle}
          >
            {copy.sectionTitle}
          </Scrambler>

          <Scrambler
            texts={SKILL_MO_HEADER_TEXTS}
            variant="section-title"
            as="div"
            className={styles.sectionSubtitle}
          >
            {copy.moHeader}
          </Scrambler>

          <p className={styles.sectionLede}>
            {copy.moText}
          </p>
        </header>

        <div className={styles.tabs} role="tablist" aria-label="Profile Dossier Sections">
          {TAB_CONFIG.map((tab, i) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(prev => prev === tab.id ? null : tab.id)}
              style={{
                '--tab-color': tab.color,
                '--tab-neon': tab.neon,
              } as React.CSSProperties}
            >
              <Scrambler
                texts={SKILL_TAB_TEXTS[i]}
                variant="nav-label"
                as="span"
              >
                {copy.tabs[tab.id]}
              </Scrambler>
            </button>
          ))}
        </div>

        <m.div
          animate={{ height: activeTab ? 'auto' : 0 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          <AnimatePresence mode="wait">
            {activeTab && (
              <m.div
                key={activeTab}
                id={`panel-${activeTab}`}
                role="tabpanel"
                aria-labelledby={`tab-${activeTab}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className={styles.panel}
              >
                <div className={styles.cardsGrid}>
                  {activeTab === 'orchestration' && orchestrationSkills.map(renderSkillCard)}
                  {activeTab === 'logic' && logicSkills.map(renderSkillCard)}
                  {activeTab === 'product' && productSkills.map(renderSkillCard)}
                  {activeTab === 'dynamic' && dynamicSkills.map(renderSkillCard)}
                </div>
              </m.div>
            )}
          </AnimatePresence>
        </m.div>
      </div>
    </section>
  );
};

export default React.memo(Skills);
