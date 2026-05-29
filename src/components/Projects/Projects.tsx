'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { projects } from '@/data/projects';
import { useTheme } from '@/context/ThemeContext';
import ActionWord from '@/components/ui/ActionWord';
import ScrollReveal from '@/components/effects/ScrollReveal';
import styles from './Projects.module.css';

const getActionWord = (word: string, isNoir: boolean) => {
  if (!isNoir) return word;
  switch (word) {
    case 'BOOM!':
      return 'DOOM!';
    case 'SPLAT!':
      return 'DRIP...';
    case 'WHOOSH!':
      return 'ESCAPE!';
    case 'ZAP!':
      return 'SHADOW!';
    default:
      return word;
  }
};

export default function Projects() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const selected = projects.find((p) => p.id === selectedProject);
  const { isNoir } = useTheme();

  return (
    <section id="projects" className={styles.projects} aria-label="Projects">
      <div className={styles.container}>
        <ScrollReveal>
          <h2 className={styles.sectionTitle}>
            EPIC ADVENTURES
            <span className={styles.titleAction}>
              <ActionWord
                word={isNoir ? 'CASE!' : 'BAM!'}
                color={isNoir ? '#FFFFFF' : 'var(--pop-red)'}
                starburstColor={isNoir ? '#000000' : undefined}
                size="lg"
              />
            </span>
          </h2>
        </ScrollReveal>

        <div className={styles.grid}>
          {projects.map((project, index) => (
            <ScrollReveal key={project.id} delay={100 + index * 80}>
              <button
                className={`${styles.panel} ${styles[`area${index}`]}`}
                style={{
                  '--panel-color': project.color,
                } as React.CSSProperties}
                onClick={() => setSelectedProject(project.id)}
                aria-label={`View ${project.title} project details`}
              >
                <div className={styles.panelImageWrapper}>
                  <Image
                    src={isNoir ? project.image.replace(/\.png$/, '-noir.png') : project.image}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className={styles.panelImage}
                  />
                </div>
                <div className={styles.panelOverlay}>
                  <span className={styles.panelAction}>
                    <ActionWord
                      word={getActionWord(project.actionWord, isNoir)}
                      color={isNoir ? '#000000' : project.color}
                      starburstColor={isNoir ? '#FFFFFF' : undefined}
                      size="md"
                    />
                  </span>
                  <h3 className={styles.panelTitle}>{project.title}</h3>
                  <p className={styles.panelDesc}>{project.description}</p>
                  <div className={styles.panelTags}>
                    {project.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Project Detail Modal */}
      {selected && (
        <div
          className={styles.modal}
          onClick={() => setSelectedProject(null)}
          role="dialog"
          aria-label={`${selected.title} details`}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
            style={{ '--panel-color': selected.color } as React.CSSProperties}
          >
            <button
              className={styles.modalClose}
              onClick={() => setSelectedProject(null)}
              aria-label="Close project details"
            >
              ✕
            </button>

            <div className={styles.modalHeader}>
              <ActionWord
                word={getActionWord(selected.actionWord, isNoir)}
                color={isNoir ? '#FFFFFF' : selected.color}
                starburstColor={isNoir ? '#000000' : undefined}
                size="lg"
              />
              <h3 className={styles.modalTitle}>{selected.title}</h3>
            </div>

            <div className={styles.modalImageWrapper}>
              <Image
                src={isNoir ? selected.image.replace(/\.png$/, '-noir.png') : selected.image}
                alt={selected.title}
                width={600}
                height={400}
                className={styles.modalImage}
              />
            </div>

            <p className={styles.modalDescription}>{selected.longDescription}</p>

            <div className={styles.modalTags}>
              {selected.tags.map((tag) => (
                <span key={tag} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>


          </div>
        </div>
      )}
    </section>
  );
}
