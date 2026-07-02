'use client';

import React, { useMemo } from 'react';
import type { Skill } from '@/data/skills';
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
      moText: "I use AI tools like Cursor and Gemini to move fast — but I understand every layer of the stack. My energy goes into system architecture, product design, UX, and shipping real products.",
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
      moText: "Subject leverages AI-augmented development to accelerate delivery. Demonstrates full-stack comprehension across architecture, product design, and debugging. AI is the accelerant, not the substitute.",
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
      moText: "I partner directly with businesses to build high-performance products. No layers of communication, no agency overhead. I run custom design prototypes, develop responsive applications, and deploy automated backend structures.",
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
      moText: "Subject operates as an independent contractor, removing agency middlemen. Delivers functional design prototypes, fast frontend builds, and secure database setups directly to clients under clear, contracted deliverables.",
      tabs: {
        orchestration: "I. AI INTEGRATION",
        logic: "II. WEB APPLICATIONS",
        product: "III. DESIGN & UX",
        dynamic: "IV. DYNAMIC CONSULTING"
      }
    }
  }
};

function Skills({ skills }: SkillsProps) {
  const { isNoir, audience } = useTheme();
  const [activeTab, setActiveTab] = React.useState<'orchestration' | 'logic' | 'product' | 'dynamic'>('logic');

  const activeAudience = audience || 'developer';
  const activeTheme = isNoir ? 'noir' : 'light';

  const copy = useMemo(() => {
    return SKILLS_COPY[activeAudience][activeTheme];
  }, [activeAudience, activeTheme]);

  // Filter skills by dossier categories
  const orchestrationSkills = skills.filter(s => s.category === 'orchestration');
  const logicSkills = skills.filter(s => s.category === 'logic');
  const productSkills = skills.filter(s => s.category === 'product');
  const dynamicSkills = skills.filter(s => s.category === 'dynamic');

  const renderSkillRow = (skill: Skill) => {
    const Icon = iconMap[skill.icon] || Sparkles;
    
    // Choose appropriate description copy
    const description = (activeAudience === 'business' && skill.description_business)
      ? skill.description_business
      : skill.description;

    // Choose appropriate name copy
    const displayName = (activeAudience === 'business' && skill.name_business)
      ? skill.name_business
      : skill.name;

    const forgedLabel = activeAudience === 'business' ? 'APPLIED IN:' : 'FORGED IN:';

    return (
      <div key={skill.name} className={styles.dossierItem}>
        <div className={styles.dossierItemHeader}>
          <div className={styles.dossierNameContainer}>
            <Icon 
              className={styles.dossierItemIcon} 
              style={{ color: skill.color }} 
            />
            <h3 className={styles.dossierItemName}>{displayName}</h3>
          </div>
          <span 
            className={`${styles.dossierLevelBadge} ${styles['level_' + (skill.status || 'mastered')]}`}
          >
            {skill.level}
          </span>
        </div>
        
        <p className={styles.dossierItemDesc}>{description}</p>
        
        {skill.projects && skill.projects.length > 0 && (
          <div className={styles.dossierForged}>
            <span className={styles.dossierForgedLabel}>{forgedLabel}</span>
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
    <section id="capabilities" className={styles.skills} aria-label="Capabilities">
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          {copy.sectionTitle}
        </h2>

        <div className={styles.moBanner}>
          <div className={styles.moBadge}>
            {copy.moBadge}
          </div>
          <div className={styles.moHeader}>
            {copy.moHeader}
          </div>
          <p className={styles.moText}>
            {copy.moText}
          </p>
        </div>

        {/* Dossier Tabs */}
        <div className={styles.dossierTabs} role="tablist" aria-label="Profile Dossier Sections">
          <button 
            role="tab"
            aria-selected={activeTab === 'orchestration'}
            aria-controls="panel-orchestration"
            id="tab-orchestration"
            className={`${styles.dossierTab} ${activeTab === 'orchestration' ? styles.dossierTabActive : ''}`}
            onClick={() => setActiveTab('orchestration')}
            style={{ 
              '--tab-color': 'var(--pop-pink)',
              '--tab-neon': 'var(--neon-pink)'
            } as React.CSSProperties}
          >
            {copy.tabs.orchestration}
          </button>
          <button 
            role="tab"
            aria-selected={activeTab === 'logic'}
            aria-controls="panel-logic"
            id="tab-logic"
            className={`${styles.dossierTab} ${activeTab === 'logic' ? styles.dossierTabActive : ''}`}
            onClick={() => setActiveTab('logic')}
            style={{ 
              '--tab-color': 'var(--pop-blue)',
              '--tab-neon': 'var(--neon-cyan)'
            } as React.CSSProperties}
          >
            {copy.tabs.logic}
          </button>
          <button 
            role="tab"
            aria-selected={activeTab === 'product'}
            aria-controls="panel-product"
            id="tab-product"
            className={`${styles.dossierTab} ${activeTab === 'product' ? styles.dossierTabActive : ''}`}
            onClick={() => setActiveTab('product')}
            style={{ 
              '--tab-color': 'var(--pop-red)',
              '--tab-neon': 'var(--neon-yellow)'
            } as React.CSSProperties}
          >
            {copy.tabs.product}
          </button>
          <button 
            role="tab"
            aria-selected={activeTab === 'dynamic'}
            aria-controls="panel-dynamic"
            id="tab-dynamic"
            className={`${styles.dossierTab} ${activeTab === 'dynamic' ? styles.dossierTabActive : ''}`}
            onClick={() => setActiveTab('dynamic')}
            style={{ 
              '--tab-color': 'var(--pop-orange)',
              '--tab-neon': 'var(--neon-purple)'
            } as React.CSSProperties}
          >
            {copy.tabs.dynamic}
          </button>
        </div>

        {/* Dossier Folder Content */}
        <div 
          className={styles.dossierFolder}
          style={{
            '--folder-color': activeTab === 'orchestration' ? 'var(--pop-pink)' : activeTab === 'logic' ? 'var(--pop-blue)' : activeTab === 'product' ? 'var(--pop-red)' : 'var(--pop-orange)',
            '--folder-neon': activeTab === 'orchestration' ? 'var(--neon-pink)' : activeTab === 'logic' ? 'var(--neon-cyan)' : activeTab === 'product' ? 'var(--neon-yellow)' : 'var(--neon-purple)'
          } as React.CSSProperties}
        >
          <AnimatePresence mode="wait">
            <m.div
              key={activeTab}
              id={`panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className={styles.dossierFolderContent}
            >
              <div className={styles.dossierGridInner}>
                {activeTab === 'orchestration' && orchestrationSkills.map(renderSkillRow)}
                {activeTab === 'logic' && logicSkills.map(renderSkillRow)}
                {activeTab === 'product' && productSkills.map(renderSkillRow)}
                {activeTab === 'dynamic' && dynamicSkills.map(renderSkillRow)}
              </div>
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default React.memo(Skills);
