'use client';

import React, { useState, useEffect, useRef } from 'react';
import { type Skill, skills } from '@/data/skills';
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
  ExternalLink,
  ChevronRight,
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

interface Connection {
  from: string;
  to: string;
  type: 'mastered' | 'quest';
}

export default function SkillTree() {
  const [selectedSkill, setSelectedSkill] = useState<Skill>(skills[0]);
  const [connections, setConnections] = useState<{ d: string; type: 'mastered' | 'quest' }[]>([]);
  
  // Refs for tracking coordinates
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Define tree connections
  const treeConnections: Connection[] = [
    // Branch Core -> Branch Roots
    { from: 'Stack-on-Demand', to: 'AI Dev Workflows', type: 'mastered' },
    { from: 'Stack-on-Demand', to: 'API Architecture', type: 'mastered' },
    { from: 'Stack-on-Demand', to: 'Product Strategy & UX', type: 'mastered' },
    
    // Branch A (AI Orchestrator)
    { from: 'AI Dev Workflows', to: 'Structured Prompting', type: 'mastered' },
    { from: 'Structured Prompting', to: 'AI Agent Orchestration', type: 'mastered' },
    
    // Branch B (Systems Architect)
    { from: 'API Architecture', to: 'Database Engineering', type: 'mastered' },
    { from: 'Database Engineering', to: 'Algorithmic Translation', type: 'mastered' },
    { from: 'Database Engineering', to: 'Data Analysis', type: 'quest' },
    
    // Branch C (Shaper)
    { from: 'Product Strategy & UX', to: 'Design to Code', type: 'mastered' },
    { from: 'Product Strategy & UX', to: 'Privacy Sandboxing', type: 'mastered' }
  ];

  // Recalculate SVG connection coordinates
  const updateLines = () => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const newConnections = treeConnections.map(conn => {
      const fromEl = nodeRefs.current[conn.from];
      const toEl = nodeRefs.current[conn.to];
      
      if (!fromEl || !toEl) return null;
      
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      
      // Calculate center points relative to container
      const x1 = fromRect.left + fromRect.width / 2 - containerRect.left;
      const y1 = fromRect.top + fromRect.height / 2 - containerRect.top;
      const x2 = toRect.left + toRect.width / 2 - containerRect.left;
      const y2 = toRect.top + toRect.height / 2 - containerRect.top;
      
      // Return SVG cubic bezier or line path
      return {
        d: `M ${x1} ${y1} L ${x2} ${y2}`,
        type: conn.type
      };
    }).filter(Boolean) as { d: string; type: 'mastered' | 'quest' }[];
    
    setConnections(newConnections);
  };

  useEffect(() => {
    // Wait for components to mount and render
    const timer = setTimeout(() => {
      updateLines();
    }, 150);

    window.addEventListener('resize', updateLines);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateLines);
    };
  }, []);

  // Node helper
  const renderNode = (skillName: string) => {
    const skill = skills.find(s => s.name === skillName);
    if (!skill) return null;

    const isSelected = selectedSkill.name === skill.name;
    const Icon = iconMap[skill.icon] || Sparkles;

    return (
      <div 
        ref={el => { nodeRefs.current[skill.name] = el; }}
        className={`${styles.treeNode} ${styles[skill.status || 'mastered']} ${isSelected ? styles.selectedNode : ''}`}
        style={{ '--node-color': skill.color } as React.CSSProperties}
        onClick={() => setSelectedSkill(skill)}
        role="button"
        tabIndex={0}
        aria-label={`${skill.name} Skill Node`}
      >
        <div className={styles.nodeCircle}>
          <Icon className={styles.nodeIcon} />
        </div>
        <span className={styles.nodeLabel}>{skill.name}</span>
        {skill.status === 'quest' && (
          <span className={styles.questBadge}>QUEST</span>
        )}
      </div>
    );
  };

  return (
    <div className={styles.treeWrapper}>
      {/* 1. Skill Tree (Left Column on Desktop) */}
      <div ref={containerRef} className={styles.treeContainer}>
        {/* SVG Overlay for drawing connection paths */}
        <svg className={styles.svgOverlay} aria-hidden="true">
          <defs>
            <linearGradient id="masteredGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--pop-blue)" />
              <stop offset="100%" stopColor="var(--pop-pink)" />
            </linearGradient>
          </defs>
          {connections.map((conn, idx) => (
            <path
              key={idx}
              d={conn.d}
              className={`${styles.svgPath} ${conn.type === 'quest' ? styles.pathQuest : styles.pathMastered}`}
            />
          ))}
        </svg>

        {/* Tree Node Grid Rows */}
        {/* Row 1: Core Ultimate Node */}
        <div className={styles.treeRow} style={{ justifyContent: 'center' }}>
          {renderNode('Stack-on-Demand')}
        </div>

        {/* Row 2: Tier 1 Roots */}
        <div className={`${styles.treeRow} ${styles.rowSplit}`}>
          <div className={styles.columnLeft}>
            {renderNode('AI Dev Workflows')}
          </div>
          <div className={styles.columnCenter}>
            {renderNode('API Architecture')}
          </div>
          <div className={styles.columnRight}>
            {renderNode('Product Strategy & UX')}
          </div>
        </div>

        {/* Row 3: Tier 2 Mid-tier */}
        <div className={`${styles.treeRow} ${styles.rowSplit}`}>
          <div className={styles.columnLeft}>
            {renderNode('Structured Prompting')}
          </div>
          <div className={styles.columnCenter}>
            {renderNode('Database Engineering')}
          </div>
          <div className={`${styles.columnRight} ${styles.multiNodesHorizontal}`}>
            {renderNode('Design to Code')}
            {renderNode('Privacy Sandboxing')}
          </div>
        </div>

        {/* Row 4: Tier 3 Ultimate Nodes */}
        <div className={`${styles.treeRow} ${styles.rowSplit}`}>
          <div className={styles.columnLeft}>
            {renderNode('AI Agent Orchestration')}
          </div>
          <div className={`${styles.columnCenter} ${styles.multiNodesVertical}`}>
            {renderNode('Algorithmic Translation')}
            {renderNode('Data Analysis')}
          </div>
          <div className={styles.columnRight}>
            {/* Empty spacer spacer */}
          </div>
        </div>
      </div>

      {/* 2. Skill Codex Panel (Right Column on Desktop) */}
      <div className={styles.codexPanel}>
        <div className={styles.codexHeader}>
          <div className={styles.codexBadge}>SKILL CODEX</div>
          <h3 className={styles.codexTitle}>
            {selectedSkill.name}
          </h3>
          <span 
            className={`${styles.codexStatus} ${styles['status_' + (selectedSkill.status || 'mastered')]}`}
          >
            {selectedSkill.level?.toUpperCase()}
          </span>
        </div>

        <div className={styles.codexBody}>
          <p className={styles.codexDescription}>
            {selectedSkill.description}
          </p>

          {selectedSkill.prereq && (
            <div className={styles.codexPrereq}>
              <span className={styles.codexLabel}>PREREQUISITE UNLOCKED:</span>
              <div className={styles.prereqItem}>
                <ChevronRight className={styles.prereqArrow} />
                <span>{selectedSkill.prereq}</span>
              </div>
            </div>
          )}

          {selectedSkill.projects && selectedSkill.projects.length > 0 ? (
            <div className={styles.codexProjects}>
              <span className={styles.codexLabel}>FORGED IN PROJECTS:</span>
              <div className={styles.projectsList}>
                {selectedSkill.projects.map(proj => (
                  <a 
                    key={proj.id}
                    href={`/#projects`}
                    className={styles.projectLink}
                    onClick={(e) => {
                      // Custom smooth scroll and flash highlight if element exists
                      const element = document.getElementById(proj.id);
                      if (element) {
                        e.preventDefault();
                        element.scrollIntoView({ behavior: 'smooth' });
                        element.classList.add('flash-highlight');
                        setTimeout(() => {
                          element.classList.remove('flash-highlight');
                        }, 2000);
                      }
                    }}
                  >
                    <span>{proj.title}</span>
                    <ExternalLink size={12} className={styles.projectLinkIcon} />
                  </a>
                ))}
              </div>
            </div>
          ) : selectedSkill.status === 'quest' ? (
            <div className={styles.codexProjects}>
              <span className={styles.codexLabel}>QUEST ACTIVE:</span>
              <div className={styles.questAlert}>
                <Target size={16} className={styles.questAlertIcon} />
                <span>Deploying analytical data pipelines to active repository sandbox.</span>
              </div>
            </div>
          ) : (
            <div className={styles.codexProjects}>
              <span className={styles.codexLabel}>SYSTEM PARAMETERS:</span>
              <p className={styles.codexParams}>
                Core operational capability utilized consistently across all custom prompt tasks and code syntheses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
