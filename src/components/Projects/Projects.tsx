'use client';

import React, { useEffect, useState, useRef } from 'react';
import Portal from '@/components/ui/Portal';
import { useLenis } from 'lenis/react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { ExternalLink, Code2 } from 'lucide-react';
import Link from 'next/link';
import { type Project } from '@/data/projects';
import { useTheme } from '@/context/ThemeContext';
import Scrambler from '@/components/ui/Scrambler';
import type { ScramblerProps } from '@/components/ui/Scrambler';
import styles from './Projects.module.css';

const PROJECT_SECTION_TITLE_TEXTS: ScramblerProps['texts'] = {
  developer: { light: 'EPIC ADVENTURES', noir: 'EPIC ADVENTURES' },
  business:  { light: 'SELECTED WORK',   noir: 'SELECTED WORK' },
};

interface ProjectsProps {
  projects: Project[];
}

interface ProjectImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
}

function ProjectImage({ src, alt, fill, width, height, sizes, className, style }: ProjectImageProps) {
  const [prevSrc, setPrevSrc] = useState(src);
  const [error, setError] = useState(false);

  if (src !== prevSrc) {
    setPrevSrc(src);
    setError(false);
  }

  if (error || !src) {
    return (
      <div
        style={{
          background: 'var(--pop-black)',
          color: 'var(--pop-white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: fill ? '100%' : (height ? `${height}px` : '300px'),
          position: fill ? 'absolute' : 'relative',
          inset: fill ? 0 : undefined,
          border: '2px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: '4px',
        }}
      >
        <Code2 size={48} strokeWidth={1.5} style={{ opacity: 0.7 }} />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      style={style}
      onError={() => setError(true)}
    />
  );
}

const CTA_LABELS: Record<string, string> = { 'rag-lab': 'OPEN APP' };

function Projects({ projects }: ProjectsProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const selected = projects.find((p) => p.id === selectedProject);
  const { isNoir, audience } = useTheme();
  const activeAudience = audience || 'developer';
  const lenis = useLenis();

  const getProjectStatus = (proj: Project) => {
    if (proj.status) return proj.status;
    return proj.isLive ? 'live' : 'soon';
  };

  const previousFocusRef = useRef<HTMLElement | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Lock background scroll while the modal is open
  useEffect(() => {
    if (!selectedProject) return;

    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    lenis?.stop();

    return () => {
      document.body.style.overflow = '';
      lenis?.start();
      window.scrollTo({ top: scrollY, behavior: 'instant' });
    };
  }, [selectedProject, lenis]);

  // Focus management
  useEffect(() => {
    if (selectedProject) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      setTimeout(() => {
        if (modalRef.current) {
          const focusable = modalRef.current.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), [tabindex="0"]'
          );
          if (focusable.length > 0) {
            focusable[0].focus();
          }
        }
      }, 50);
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [selectedProject]);

  // Trap focus and handle Escape key to close the modal
  useEffect(() => {
    if (!selectedProject) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setSelectedProject(null);
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex="0"]'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: loop focus to last element
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          // Tab: loop focus to first element
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProject]);

  return (
    <section id="projects" className={styles.projects} aria-label="Projects">
      <div className={styles.container}>
        <Scrambler
          texts={PROJECT_SECTION_TITLE_TEXTS}
          variant="section-title"
          as="h2"
          className={styles.sectionTitle}
        >
          {activeAudience === 'business' ? 'SELECTED WORK' : 'EPIC ADVENTURES'}
        </Scrambler>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeAudience}
            className={styles.grid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {projects.map((project, index) => (
                <button
                  key={project.id}
                  id={project.id}
                  className={`${styles.panel} ${styles[`area${index}`]}`}
                  style={{
                    '--panel-color': project.color,
                  } as React.CSSProperties}
                  onClick={() => setSelectedProject(project.id)}
                >
                  {/* Status Badge */}
                  <div
                    className={`${styles.statusBadge} ${
                      getProjectStatus(project) === 'live'
                        ? styles.statusLive
                        : getProjectStatus(project) === 'personal'
                        ? styles.statusPersonal
                        : styles.statusSoon
                    }`}
                  >
                    {getProjectStatus(project) === 'live'
                      ? 'LIVE NOW'
                      : getProjectStatus(project) === 'personal'
                      ? 'PERSONAL'
                      : 'COMING SOON'}
                  </div>

                  <div className={styles.panelImageWrapper}>
                    <ProjectImage
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
                    <p className={styles.panelDesc}>
                      {activeAudience === 'business' && project.description_business
                        ? project.description_business
                        : project.description}
                    </p>
                    <div className={styles.panelTags}>
                      {project.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="sr-only"> - View project details</span>
                </button>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Project Detail Modal */}
      {selected && (
        <Portal>
          <div
            className={styles.modal}
            onClick={() => setSelectedProject(null)}
            role="dialog"
            aria-modal="true"
            aria-label={`${selected.title} details`}
            data-lenis-prevent
          >
            <div
              ref={modalRef}
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
                <ProjectImage
                  src={isNoir ? selected.image.replace(/\.webp$/, '-noir.webp') : selected.image}
                  alt={selected.title}
                  width={600}
                  height={400}
                  className={styles.modalImage}
                />
              </div>

              <p className={styles.modalDescription}>
                {activeAudience === 'business' && selected.longDescription_business
                  ? selected.longDescription_business
                  : selected.longDescription}
              </p>

              <div className={styles.modalTags}>
                {selected.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>

              <div className={styles.modalActions}>
                 {getProjectStatus(selected) === 'live' ? (
                  <>
                    {selected.liveUrl && selected.liveUrl.startsWith('/') ? (
                      <Link
                        href={selected.liveUrl}
                        className="comic-btn comic-btn-blue"
                        style={{ gap: '0.5rem', fontSize: '1rem', padding: '0.5rem 1rem' }}
                      >
                        {CTA_LABELS[selected.id] || selected.ctaLabel || 'PLAY GAME'} <ExternalLink size={16} />
                      </Link>
                    ) : selected.liveUrl ? (
                      <a
                        href={selected.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="comic-btn comic-btn-blue"
                        style={{ gap: '0.5rem', fontSize: '1rem', padding: '0.5rem 1rem' }}
                      >
                        {CTA_LABELS[selected.id] || selected.ctaLabel || 'PLAY GAME'} <ExternalLink size={16} />
                      </a>
                    ) : null}
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
                ) : getProjectStatus(selected) === 'personal' ? (
                  <>
                    {selected.liveUrl && selected.liveUrl.startsWith('/') ? (
                      <Link
                        href={selected.liveUrl}
                        className="comic-btn comic-btn-blue"
                        style={{ gap: '0.5rem', fontSize: '1rem', padding: '0.5rem 1rem' }}
                      >
                        {CTA_LABELS[selected.id] || selected.ctaLabel || 'LIVE DEMO'} <ExternalLink size={16} />
                      </Link>
                    ) : selected.liveUrl ? (
                      <a
                        href={selected.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="comic-btn comic-btn-blue"
                        style={{ gap: '0.5rem', fontSize: '1rem', padding: '0.5rem 1rem' }}
                      >
                        {CTA_LABELS[selected.id] || selected.ctaLabel || 'LIVE DEMO'} <ExternalLink size={16} />
                      </a>
                    ) : null}
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
                      {CTA_LABELS[selected.id] || selected.ctaLabel || 'COMING SOON'} <ExternalLink size={16} />
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
        </Portal>
      )}
    </section>
  );
};

export default React.memo(Projects);
