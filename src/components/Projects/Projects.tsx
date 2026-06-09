'use client';

import React, { useEffect, useState } from 'react';
import { useLenis } from 'lenis/react';
import Image from 'next/image';
import { ExternalLink, Code2 } from 'lucide-react';
import { type Project } from '@/data/projects';
import { useTheme } from '@/context/ThemeContext';
import styles from './Projects.module.css';

interface ProjectsProps {
  projects: Project[];
}

export default function Projects({ projects }: ProjectsProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const selected = projects.find((p) => p.id === selectedProject);
  const { isNoir } = useTheme();
  const lenis = useLenis();

  useEffect(() => {
    if (selectedProject) {
      lenis?.stop();
    } else {
      lenis?.start();
    }
  }, [selectedProject, lenis]);

  return (
    <section id="projects" className={styles.projects} aria-label="Projects">
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>
          EPIC ADVENTURES
        </h2>

        <div className={styles.grid}>
          {projects.map((project, index) => (
              <button
                key={project.id}
                className={`${styles.panel} ${styles[`area${index}`]}`}
                style={{
                  '--panel-color': project.color,
                } as React.CSSProperties}
                onClick={() => setSelectedProject(project.id)}
                aria-label={`View ${project.title} project details`}
              >
                {/* Status Badge */}
                <div
                  className={`${styles.statusBadge} ${
                    project.isLive ? styles.statusLive : styles.statusSoon
                  }`}
                >
                  {project.isLive ? 'LIVE NOW' : 'COMING SOON'}
                </div>

                <div className={styles.panelImageWrapper}>
                  <Image
                    src={isNoir ? project.image.replace(/\.webp$/, '-noir.webp') : project.image}
                    alt={project.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={styles.panelImage}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className={styles.panelOverlay}>
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
              <h3 className={styles.modalTitle}>{selected.title}</h3>
            </div>

            <div className={styles.modalImageWrapper}>
              <Image
                src={isNoir ? selected.image.replace(/\.webp$/, '-noir.webp') : selected.image}
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

            <div className={styles.modalActions}>
              {selected.isLive ? (
                <>
                  {selected.liveUrl && (
                    <a
                      href={selected.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="comic-btn comic-btn-blue"
                      style={{ gap: '0.5rem', fontSize: '1rem', padding: '0.5rem 1rem' }}
                    >
                      PLAY GAME <ExternalLink size={16} />
                    </a>
                  )}
                  {selected.githubUrl && (
                    <a
                      href={selected.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="comic-btn comic-btn-outline"
                      style={{ gap: '0.5rem', fontSize: '1rem', padding: '0.5rem 1rem' }}
                    >
                      GITHUB <Code2 size={16} />
                    </a>
                  )}
                </>
              ) : (
                <>
                  <button
                    disabled
                    className={`${styles.disabledBtn} comic-btn`}
                    style={{ gap: '0.5rem', fontSize: '1rem', padding: '0.5rem 1rem' }}
                  >
                    COMING SOON <ExternalLink size={16} />
                  </button>
                  <button
                    disabled
                    className={`${styles.disabledBtn} comic-btn comic-btn-outline`}
                    style={{ gap: '0.5rem', fontSize: '1rem', padding: '0.5rem 1rem' }}
                  >
                    CODE UNDER DEV <Code2 size={16} />
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
