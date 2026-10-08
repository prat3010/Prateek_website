'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Sparkles, Gamepad2, Rocket, Brain, ArrowRight, Layers, Terminal as TerminalIcon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import Scrambler from '@/components/ui/Scrambler';
import type { ScramblerProps } from '@/components/ui/Scrambler';
import { 
  PLAYGROUND_ITEMS, 
  type PlaygroundItem,
  type GenerativeMediaPlaygroundItem 
} from '@/data/playgroundItems';
import SaasCard from './cards/SaasCard';
import ToyCard from './cards/ToyCard';
import MediaCard from './cards/MediaCard';
import CognitiveCard from './cards/CognitiveCard';
import ExperimentCard from './cards/ExperimentCard';
import MediaPromptLightbox from './viewers/MediaPromptLightbox';
import styles from './PlaygroundSection.module.css';

const PLAYGROUND_TITLE_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'THE PLAYGROUND', noir: 'PLAYGROUND // LAB' },
  business:  { light: 'INNOVATION LAB & PROTOTYPES', noir: 'INNOVATION LAB // PROTOTYPES' },
};

const PLAYGROUND_CTA_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'EXPLORE FULL PLAYGROUND ARCHIVE', noir: 'ENTER_ALL_CREATIONS' },
  business:  { light: 'EXPLORE ALL WORKING PROTOTYPES', noir: 'VIEW_ALL_INNOVATIONS' },
};

type SectionCategory = 'featured' | 'games' | 'saas' | 'media' | 'cognitive';

interface TabConfig {
  id: SectionCategory;
  label: string;
  icon: React.ReactNode;
}

const SECTION_TABS: TabConfig[] = [
  { id: 'featured', label: 'Top Highlights', icon: <Sparkles size={14} /> },
  { id: 'games', label: 'Arcade & Labs', icon: <Gamepad2 size={14} /> },
  { id: 'saas', label: 'SaaS Prototypes', icon: <Rocket size={14} /> },
  { id: 'media', label: 'AI Art & Prompts', icon: <Layers size={14} /> },
  { id: 'cognitive', label: 'Cognitive AI', icon: <Brain size={14} /> },
];

export default function PlaygroundSection() {
  const { isNoir, audience } = useTheme();
  const [activeTab, setActiveTab] = useState<SectionCategory>('featured');
  const [activeLightboxItem, setActiveLightboxItem] = useState<GenerativeMediaPlaygroundItem | null>(null);

  const displayedItems = useMemo<PlaygroundItem[]>(() => {
    switch (activeTab) {
      case 'featured':
        return PLAYGROUND_ITEMS.filter((item) => item.featured).slice(0, 6);
      case 'games':
        return PLAYGROUND_ITEMS.filter((item) => item.kind === 'interactive-toy').slice(0, 6);
      case 'saas':
        return PLAYGROUND_ITEMS.filter((item) => item.kind === 'saas').slice(0, 6);
      case 'media':
        return PLAYGROUND_ITEMS.filter((item) => item.kind === 'generative-media').slice(0, 6);
      case 'cognitive':
        return PLAYGROUND_ITEMS.filter((item) => item.kind === 'cognitive-tool').slice(0, 6);
      default:
        return PLAYGROUND_ITEMS.slice(0, 6);
    }
  }, [activeTab]);

  const activeAudience = audience || 'developer';
  const subtitle = activeAudience === 'business'
    ? 'Interactive prototypes, custom micro-SaaS tools, and experimental cognitive systems engineered for rapid technical validation and direct proof-of-concept testing.'
    : 'An interactive creative laboratory for vibe-coded SaaS prototypes, retro arcade engines, 13-heuristic graph algorithm labs, and generative AI prompt engineering.';

  return (
    <section id="playground" className={styles.playgroundSection} aria-label="Playground and Innovation Lab">
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.badge}>
            <Sparkles size={13} className={styles.badgeIcon} />
            <span>Interactive Innovation Sandbox</span>
          </div>

          <Scrambler
            texts={PLAYGROUND_TITLE_TEXTS}
            variant="section-title"
            as="h2"
            className={styles.sectionTitle}
          >
            {isNoir ? 'PLAYGROUND // LAB' : 'THE PLAYGROUND'}
          </Scrambler>

          <p className={styles.sectionSubtitle}>
            {subtitle}
          </p>

          {/* Category Filter Tabs */}
          <div className={styles.categoryTabs} role="tablist" aria-label="Playground categories">
            {SECTION_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.categoryBtn} ${isActive ? styles.active : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* Responsive Cards Grid */}
        <div className={styles.cardsGrid}>
          {displayedItems.map((item) => {
            switch (item.kind) {
              case 'saas':
                return <SaasCard key={item.id} item={item} />;
              case 'interactive-toy':
                return <ToyCard key={item.id} item={item} />;
              case 'generative-media':
                return (
                  <MediaCard
                    key={item.id}
                    item={item}
                    onOpenLightbox={(mediaItem) => setActiveLightboxItem(mediaItem)}
                  />
                );
              case 'cognitive-tool':
                return <CognitiveCard key={item.id} item={item} />;
              case 'experiment':
                return <ExperimentCard key={item.id} item={item} />;
              default:
                return null;
            }
          })}
        </div>

        {/* Quick Launcher Bar */}
        <div className={styles.quickLauncherBar}>
          <div className={styles.quickLauncherLabel}>
            <TerminalIcon size={15} />
            <span>Instant Quick Launchers</span>
          </div>
          <div className={styles.quickLauncherPills}>
            <Link href="/playground/snake" className={styles.quickPill}>
              <span>🐍 Play Snake 2088</span>
            </Link>
            <Link href="/playground/pathfinder" className={styles.quickPill}>
              <span>🗺️ 2D Pathfinder Lab</span>
            </Link>
            <Link href="/rag" className={styles.quickPill}>
              <span>🤖 Retriever AI Studio</span>
            </Link>
            <Link href="/scoping" className={styles.quickPill}>
              <span>⚡ Scoping Studio</span>
            </Link>
          </div>
        </div>

        {/* Full Playground Navigation CTA */}
        <div className={styles.footerArea}>
          <Link href="/playground" className={styles.viewAllCta}>
            <Scrambler
              texts={PLAYGROUND_CTA_TEXTS}
              variant="nav-label"
              as="span"
            >
              {isNoir ? 'ENTER_ALL_CREATIONS' : 'EXPLORE FULL PLAYGROUND ARCHIVE'}
            </Scrambler>
            <ArrowRight size={18} />
          </Link>
          <span className={styles.countSubtitle}>
            Showing {displayedItems.length} of {PLAYGROUND_ITEMS.length} creations across SaaS, arcade games & generative media
          </span>
        </div>
      </div>

      {/* Lightbox for AI Prompt Inspection */}
      <MediaPromptLightbox
        item={activeLightboxItem}
        onClose={() => setActiveLightboxItem(null)}
      />
    </section>
  );
}
