'use client';

import React from 'react';
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

// Map icon strings to Lucide components
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

export default function Skills({ skills }: SkillsProps) {
  const { isNoir } = useTheme();
  const [activeTab, setActiveTab] = React.useState<'orchestration' | 'logic' | 'product' | 'dynamic'>('logic');
  const [selectedSkill, setSelectedSkill] = React.useState<Skill | null>(() => {
    const defaultCategory = 'logic';
    const categorySkills = skills.filter(s => s.category === defaultCategory);
    return categorySkills.length > 0 ? categorySkills[0] : null;
  });

  // Filter skills by dossier categories
  const orchestrationSkills = skills.filter(s => s.category === 'orchestration');
  const logicSkills = skills.filter(s => s.category === 'logic');
  const productSkills = skills.filter(s => s.category === 'product');
  const dynamicSkills = skills.filter(s => s.category === 'dynamic');

  const handleTabChange = (tab: 'orchestration' | 'logic' | 'product' | 'dynamic') => {
    setActiveTab(tab);
    const categorySkills = skills.filter(s => s.category === tab);
    if (categorySkills.length > 0) {
      setSelectedSkill(categorySkills[0]);
    } else {
      setSelectedSkill(null);
    }
  };

  const renderSkillChip = (skill: Skill) => {
    const Icon = iconMap[skill.icon] || Sparkles;
    const isSelected = selectedSkill?.name === skill.name;
    return (
      <button
        key={skill.name}
        className={`${styles.skillChip} ${isSelected ? styles.skillChipActive : ''}`}
        style={{ '--chip-color': skill.color } as React.CSSProperties}
        onMouseEnter={() => setSelectedSkill(skill)}
        onClick={() => setSelectedSkill(skill)}
        role="tab"
        aria-selected={isSelected}
      >
        <Icon 
          className={styles.chipIcon} 
          style={{ color: skill.color }} 
        />
        <span className={styles.chipName}>{skill.name}</span>
      </button>
    );
  };

  const renderInspector = () => {
    if (!selectedSkill) return null;
    const Icon = iconMap[selectedSkill.icon] || Sparkles;
    return (
      <div className={styles.dossierInspector}>
        <AnimatePresence mode="wait">
          <m.div
            key={selectedSkill.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={styles.inspectorContent}
          >
            <div className={styles.inspectorHeader}>
              <div className={styles.inspectorTitleContainer}>
                <Icon 
                  className={styles.inspectorIcon} 
                  style={{ color: selectedSkill.color }} 
                />
                <h3 className={styles.inspectorName}>{selectedSkill.name}</h3>
              </div>
              <span 
                className={`${styles.dossierLevelBadge} ${styles['level_' + (selectedSkill.status || 'mastered')]}`}
              >
                {selectedSkill.level || 'Mastered'}
              </span>
            </div>
            
            <p className={styles.inspectorDesc}>{selectedSkill.description}</p>
            
            {selectedSkill.projects && selectedSkill.projects.length > 0 && (
              <div className={styles.dossierForged}>
                <span className={styles.dossierForgedLabel}>FORGED IN:</span>
                <div className={styles.dossierTags}>
                  {selectedSkill.projects.map(proj => (
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

            {selectedSkill.status === 'quest' && (
              <div className={styles.dossierQuestAlert}>
                <Target size={12} className={styles.dossierQuestIcon} />
                <span>Active Quest: Deploying analytical data science pipelines.</span>
              </div>
            )}
          </m.div>
        </AnimatePresence>
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
              ? 'Subject leverages AI-augmented development to accelerate delivery. Demonstrates full-stack comprehension across architecture, product design, and debugging. AI is the accelerant, not the substitute.' 
              : 'I use AI tools like Cursor and Gemini to move fast — but I understand every layer of the stack. My energy goes into system architecture, product design, UX, and shipping real products.'}
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
            onClick={() => handleTabChange('orchestration')}
            style={{ 
              '--tab-color': 'var(--pop-pink)',
              '--tab-neon': 'var(--neon-pink)'
            } as React.CSSProperties}
          >
            I. AI ORCHESTRATION
          </button>
          <button 
            role="tab"
            aria-selected={activeTab === 'logic'}
            aria-controls="panel-logic"
            id="tab-logic"
            className={`${styles.dossierTab} ${activeTab === 'logic' ? styles.dossierTabActive : ''}`}
            onClick={() => handleTabChange('logic')}
            style={{ 
              '--tab-color': 'var(--pop-blue)',
              '--tab-neon': 'var(--neon-cyan)'
            } as React.CSSProperties}
          >
            II. SYSTEMS & LOGIC
          </button>
          <button 
            role="tab"
            aria-selected={activeTab === 'product'}
            aria-controls="panel-product"
            id="tab-product"
            className={`${styles.dossierTab} ${activeTab === 'product' ? styles.dossierTabActive : ''}`}
            onClick={() => handleTabChange('product')}
            style={{ 
              '--tab-color': 'var(--pop-red)',
              '--tab-neon': 'var(--neon-yellow)'
            } as React.CSSProperties}
          >
            III. PRODUCT & UX
          </button>
          <button 
            role="tab"
            aria-selected={activeTab === 'dynamic'}
            aria-controls="panel-dynamic"
            id="tab-dynamic"
            className={`${styles.dossierTab} ${activeTab === 'dynamic' ? styles.dossierTabActive : ''}`}
            onClick={() => handleTabChange('dynamic')}
            style={{ 
              '--tab-color': 'var(--pop-orange)',
              '--tab-neon': 'var(--neon-purple)'
            } as React.CSSProperties}
          >
            IV. DYNAMIC COMMAND
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
              <div className={styles.dossierGridSplit}>
                <div className={`${styles.dossierGridChips} ${styles['chips_' + activeTab]}`}>
                  {activeTab === 'orchestration' && orchestrationSkills.map(renderSkillChip)}
                  {activeTab === 'logic' && logicSkills.map(renderSkillChip)}
                  {activeTab === 'product' && productSkills.map(renderSkillChip)}
                  {activeTab === 'dynamic' && dynamicSkills.map(renderSkillChip)}
                </div>
                {renderInspector()}
              </div>
            </m.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
