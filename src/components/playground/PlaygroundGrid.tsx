'use client';

import React, { useState, useMemo } from 'react';
import { Search, Sparkles, Rocket, Gamepad2, Brain, Eye, Layers } from 'lucide-react';
import { PLAYGROUND_ITEMS, type PlaygroundKind, type GenerativeMediaPlaygroundItem } from '@/data/playgroundItems';
import SaasCard from './cards/SaasCard';
import ToyCard from './cards/ToyCard';
import MediaCard from './cards/MediaCard';
import CognitiveCard from './cards/CognitiveCard';
import ExperimentCard from './cards/ExperimentCard';
import MediaPromptLightbox from './viewers/MediaPromptLightbox';
import styles from './PlaygroundGrid.module.css';

interface CategoryFilter {
  id: 'all' | PlaygroundKind;
  label: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryFilter[] = [
  { id: 'all', label: 'All Creations', icon: <Layers size={14} /> },
  { id: 'saas', label: 'SaaS & Apps', icon: <Rocket size={14} /> },
  { id: 'interactive-toy', label: 'Games & Labs', icon: <Gamepad2 size={14} /> },
  { id: 'generative-media', label: 'AI Art & Prompts', icon: <Sparkles size={14} /> },
  { id: 'cognitive-tool', label: 'Cognitive AI', icon: <Brain size={14} /> },
  { id: 'experiment', label: 'Experiments', icon: <Eye size={14} /> },
];

export default function PlaygroundGrid() {
  const [activeCategory, setActiveCategory] = useState<'all' | PlaygroundKind>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLightboxItem, setActiveLightboxItem] = useState<GenerativeMediaPlaygroundItem | null>(null);

  const filteredItems = useMemo(() => {
    return PLAYGROUND_ITEMS.filter((item) => {
      // 1. Category filter
      if (activeCategory !== 'all' && item.kind !== activeCategory) {
        return false;
      }
      // 2. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesTagline = item.tagline.toLowerCase().includes(query);
        const matchesTags = item.tags.some((t) => t.toLowerCase().includes(query));
        const matchesModel = item.kind === 'generative-media' ? item.model.toLowerCase().includes(query) : false;
        return matchesTitle || matchesTagline || matchesTags || matchesModel;
      }
      return true;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className={styles.gridContainer}>
      <header className={styles.headerSection}>
        <div className={styles.badge}>
          <Sparkles size={13} />
          <span>The Innovation Sandbox</span>
        </div>
        <h1 className={styles.title}>The Playground</h1>
        <p className={styles.subtitle}>
          A dynamic creative laboratory for vibe-coded SaaS prototypes, retro arcade engines, 
          AI prompt engineering showcases, and cognitive Retriever experiments.
        </p>

        <div className={styles.controlsBar}>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, technology, prompt or model..."
              className={styles.searchInput}
              aria-label="Search creations in the playground"
            />
          </div>

          <div className={styles.filterTabs} role="tablist" aria-label="Playground categories">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              const count = cat.id === 'all' 
                ? PLAYGROUND_ITEMS.length 
                : PLAYGROUND_ITEMS.filter((i) => i.kind === cat.id).length;

              return (
                <button
                  key={cat.id}
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.filterBtn} ${isActive ? styles.active : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                  type="button"
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                  <span style={{ opacity: 0.6, fontSize: '0.75rem' }}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className={styles.cardsGrid}>
        {filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            No creations found matching &ldquo;{searchQuery}&rdquo;. Try another filter or search term.
          </div>
        ) : (
          filteredItems.map((item) => {
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
          })
        )}
      </div>

      <MediaPromptLightbox
        item={activeLightboxItem}
        onClose={() => setActiveLightboxItem(null)}
      />
    </div>
  );
}
