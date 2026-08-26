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
import TiltCard from '@/components/ui/TiltCard';
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
  fallbackSrc?: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  style?: React.CSSProperties;
}

function ProjectImage({ src, fallbackSrc, alt, fill, width, height, sizes, className, style }: ProjectImageProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [prevPropSrc, setPrevPropSrc] = useState(src);
  const [error, setError] = useState(false);

  if (src !== prevPropSrc) {
    setPrevPropSrc(src);
    setCurrentSrc(src);
    setError(false);
  }

  const handleError = () => {
    const fallback = fallbackSrc || (currentSrc.includes('-noir.webp') ? currentSrc.replace('-noir.webp', '.webp') : null);
    if (fallback && currentSrc !== fallback) {
      setCurrentSrc(fallback);
    } else {
      setError(true);
    }
  };

  if (error || !currentSrc) {
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
      src={currentSrc}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
      className={className}
      style={style}
      onError={handleError}
    />
  );
}

const CTA_LABELS: Record<string, string> = { 'rag-lab': 'OPEN APP' };

function Projects({ projects }: ProjectsProps) {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeModalTab, setActiveModalTab] = useState<'overview' | 'architecture' | 'challenges'>('overview');
  const selected = projects.find((p) => p.id === selectedProject);
  const { isNoir, audience } = useTheme();
  const activeAudience = audience || 'developer';
  const lenis = useLenis();

  const getProjectStatus = (proj: Project) => {
    if (proj.status) return proj.status;
    return proj.isLive ? 'live' : 'soon';
  };

  const getProjectCategory = (proj: Project): string => {
    if (proj.category) return proj.category;
    const tags = proj.tags.map((t) => t.toLowerCase());
    if (tags.some((t) => t.includes('rag') || t.includes('ai') || t.includes('ollama') || t.includes('gemini'))) return 'ai';
    if (tags.some((t) => t.includes('flutter') || t.includes('dart') || t.includes('mobile'))) return 'mobile';
    if (tags.some((t) => t.includes('flask') || t.includes('game') || t.includes('simulation'))) return 'simulation';
    return 'fullstack';
  };

  const filteredProjects = projects.filter((p) => {
    if (activeCategory === 'all') return true;
    return getProjectCategory(p) === activeCategory;
  });

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: projects.length, ai: 0, fullstack: 0, mobile: 0, simulation: 0 };
    projects.forEach((p) => {
      const cat = getProjectCategory(p);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [projects]);

  const handleOpenModal = (projectId: string) => {
    setSelectedProject(projectId);
    setActiveModalTab('overview');
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

        {/* Category Filter Bar */}
        <div className={styles.filterBar} role="tablist" aria-label="Filter projects by category">
          {[
            { id: 'all', label: 'ALL' },
            { id: 'ai', label: 'AI & RAG' },
            { id: 'fullstack', label: 'FULLSTACK' },
            { id: 'mobile', label: 'MOBILE' },
            { id: 'simulation', label: 'SIMULATION & TELEMETRY' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat.id}
              className={`${styles.filterPill} ${activeCategory === cat.id ? styles.filterPillActive : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span>{cat.label}</span>
              <span className={styles.filterCount}>{categoryCounts[cat.id] || 0}</span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeAudience}-${activeCategory}`}
            className={styles.grid}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {filteredProjects.map((project, index) => (
              <TiltCard
                key={project.id}
                maxAngle={3.5}
                className={styles[`area${index}`]}
                style={{ width: '100%', height: '100%' }}
              >
                <button
                  id={project.id}
                  className={styles.panel}
                  style={{
                    '--panel-color': project.color,
                  } as React.CSSProperties}
                  onClick={() => handleOpenModal(project.id)}
                >
                  {/* Retro Browser Window Header */}
                  <div className={styles.browserHeader} aria-hidden="true">
                    <div className={styles.browserDots}>
                      <span className={styles.browserDot} />
                      <span className={styles.browserDot} />
                      <span className={styles.browserDot} />
                    </div>
                    <span className={styles.browserAddress}>projects.prateeq.in/{project.id}</span>
                  </div>

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

                  {/* Floating Case Study Hover Tag */}
                  <div className={styles.caseStudyTag} aria-hidden="true">
                    <span>CASE STUDY</span>
                    <ExternalLink size={10} />
                  </div>

                  <div className={styles.panelImageWrapper}>
                    <ProjectImage
                      src={isNoir ? project.image.replace(/\.webp$/, '-noir.webp') : project.image}
                      fallbackSrc={project.image}
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
              </TiltCard>
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

              {/* Case Study Tab Switcher */}
              <div className={styles.modalTabList} role="tablist" aria-label="Case study view mode">
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeModalTab === 'overview'}
                  className={`${styles.modalTab} ${activeModalTab === 'overview' ? styles.modalTabActive : ''}`}
                  onClick={() => setActiveModalTab('overview')}
                >
                  Overview & Links
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeModalTab === 'architecture'}
                  className={`${styles.modalTab} ${activeModalTab === 'architecture' ? styles.modalTabActive : ''}`}
                  onClick={() => setActiveModalTab('architecture')}
                >
                  Architecture & Tech
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeModalTab === 'challenges'}
                  className={`${styles.modalTab} ${activeModalTab === 'challenges' ? styles.modalTabActive : ''}`}
                  onClick={() => setActiveModalTab('challenges')}
                >
                  Challenges & Solutions
                </button>
              </div>

              {activeModalTab === 'overview' && (
                <>
                  <div className={styles.modalImageWrapper}>
                    <ProjectImage
                      src={isNoir ? selected.image.replace(/\.webp$/, '-noir.webp') : selected.image}
                      fallbackSrc={selected.image}
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
                </>
              )}

              {activeModalTab === 'architecture' && (
                <div className={styles.architectureTabContent}>
                  <h4 className={styles.subHeading}>Key Technical Architecture</h4>
                  {selected.architectureHighlights && selected.architectureHighlights.length > 0 ? (
                    <ul className={styles.architectureList}>
                      {selected.architectureHighlights.map((point, idx) => (
                        <li key={idx} className={styles.architectureItem}>
                          <Code2 size={16} className={styles.bulletIcon} />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className={styles.modalDescription}>
                      {selected.longDescription}
                    </p>
                  )}

                  <h4 className={styles.subHeading} style={{ marginTop: '1.25rem' }}>Technologies & Stack</h4>
                  <div className={styles.modalTags}>
                    {selected.tags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {activeModalTab === 'challenges' && (
                <div className={styles.challengesTabContent}>
                  <h4 className={styles.subHeading}>Engineering Challenges & Solutions</h4>
                  {selected.challenges && selected.challenges.length > 0 ? (
                    <div className={styles.challengesList}>
                      {selected.challenges.map((item, idx) => (
                        <div key={idx} className={styles.challengeCard}>
                          <div className={styles.challengeHeader}>
                            <strong>Challenge:</strong> {item.challenge}
                          </div>
                          <div className={styles.solutionBody}>
                            <strong>Solution:</strong> {item.solution}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.modalDescription}>
                      The architecture was engineered for modularity, low query latency, and high system reliability.
                    </p>
                  )}

                  {selected.keyDeliverables && selected.keyDeliverables.length > 0 && (
                    <>
                      <h4 className={styles.subHeading} style={{ marginTop: '1.25rem' }}>Core Deliverables</h4>
                      <ul className={styles.deliverablesList}>
                        {selected.keyDeliverables.map((deliv, idx) => (
                          <li key={idx} className={styles.deliverableItem}>✓ {deliv}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}

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
