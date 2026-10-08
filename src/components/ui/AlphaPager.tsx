'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { m } from 'framer-motion';
import { useLenis } from 'lenis/react';
import Portal from '@/components/ui/Portal';
import { useSystemTelemetry } from '@/components/ui/useSystemTelemetry';
import { useTheme } from '@/context/ThemeContext';
import { NAVBAR_SCROLL_OFFSET } from '@/lib/constants';
import { playPagerChirp } from '@/lib/terminalAudio';
import styles from './AlphaPager.module.css';

export interface PagerMessage {
  id: string;
  sectionId?: string;
  freq?: string;
  sender: string;
  senderBiz?: string;
  text: string;
  textBiz?: string;
}

const DEFAULT_MESSAGES: PagerMessage[] = [
  {
    id: 'ch_home',
    sectionId: 'home',
    freq: '900.1MHz',
    sender: 'RADAR // DEV-CORE',
    senderBiz: 'RADAR // BIZ-EXEC',
    text: "DEV CORE: Zero synthetic toys. Zero bloated LangChain wrappers. Hexagonal FastAPI & pgvector running live code. Scroll down to inspect stack.",
    textBiz: "EXECUTIVE WIRE: Direct technical partnership with zero agency overhead. 1 to 3 week sprints, fixed milestones & 30-day warranty. Let's build.",
  },
  {
    id: 'ch_about',
    sectionId: 'about',
    freq: '908.4MHz',
    sender: 'RADAR // DOSSIER',
    senderBiz: 'RADAR // VALUE-PROP',
    text: "Prateek's dossier: Forward deployed AI engineering & production architectures. Zero corporate fluff, strictly battle-tested systems.",
    textBiz: "Strategic Partner: Turning complex business roadmaps into reliable web apps & AI tools. Fast execution, direct communication.",
  },
  {
    id: 'ch_capabilities',
    sectionId: 'capabilities',
    freq: '916.2MHz',
    sender: 'RADAR // TOPOLOGY',
    senderBiz: 'RADAR // CAPABILITIES',
    text: "Dual Persona Engine: Toggle AZURE (editorial print) / NOIR (cyberpunk terminal) up top. Both maintain 100% design system contrast parity.",
    textBiz: "Core Capabilities: Custom web applications, multimodal AI pipelines, and internal ops automation designed for measurable business ROI.",
  },
  {
    id: 'ch_deployments',
    sectionId: 'deployments',
    freq: '924.0MHz',
    sender: 'RADAR // PROJECTS',
    senderBiz: 'RADAR // CASE-STUDIES',
    text: "Spotlight: Retriever. Replaced LangChain + Pinecone with hexagonal FastAPI & PostgreSQL pgvector on bare-metal Oracle VPS. Zero token leak.",
    textBiz: "Production Case Studies: Real revenue-generating platforms & AI engines delivered on-time. Click any card to inspect deployment metrics.",
  },
  {
    id: 'ch_resume',
    sectionId: 'resume',
    freq: '931.8MHz',
    sender: 'RADAR // DOSSIER-CV',
    senderBiz: 'RADAR // GUARANTEES',
    text: "Engineering Dossier: Full CV & system design certifications. Instant PDF download available in the section header.",
    textBiz: "Commercials & Guarantees: Fixed-price milestone pricing, transparent deliverables, and 30-day post-launch warranty included.",
  },
  {
    id: 'ch_playground',
    sectionId: 'playground',
    freq: '942.5MHz',
    sender: 'RADAR // PLAYGROUND',
    senderBiz: 'RADAR // INNOVATION',
    text: "Interactive Sandbox: Micro-SaaS prototypes, retro arcade games, and pathfinding algorithms. 100% playable in-browser.",
    textBiz: "Innovation Showcase: Interactive prototypes and working proof-of-concepts demonstrating rapid feature delivery.",
  },
  {
    id: 'ch_blog',
    sectionId: 'blog',
    freq: '948.3MHz',
    sender: 'RADAR // DEV-LOGS',
    senderBiz: 'RADAR // INSIGHTS',
    text: "Deep-dive engineering post-mortems and architecture essays. Production lessons learned the hard way in high-stakes environments.",
    textBiz: "Executive Insights: Practical essays on deploying AI tools that actually save money, prevent lock-in, and scale cleanly.",
  },
  {
    id: 'ch_contact',
    sectionId: 'contact',
    freq: '955.0MHz',
    sender: 'RADAR // COMMS WIRE',
    senderBiz: 'RADAR // ADVISORY',
    text: "Terminal Comms: Ping prateeqsharma@gmail.com directly or launch /terminal to inspect system diagnostics. Response time: < 4 hours.",
    textBiz: "Direct Wire: Have an upcoming project or product sprint? Email prateeqsharma@gmail.com for instant scoping & quote consultation.",
  },
];

function getRetroTimeString(): string {
  if (typeof window === 'undefined') return '10:00 P';
  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'P' : 'A';
  const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
  return `${displayHours}:${mins} ${ampm}`;
}

export default function AlphaPager() {
  const { audience } = useTheme();
  const isBiz = audience === 'business';

  const [messages, setMessages] = useState<PagerMessage[]>(DEFAULT_MESSAGES);
  const [activeMsgIndex, setActiveMsgIndex] = useState(0);
  const [mode, setMode] = useState<'standby' | 'alert'>('standby');
  const [beaconText, setBeaconText] = useState<'RADAR LOCKED' | 'PAGE INCOMING'>('RADAR LOCKED');
  const [radarFlash, setRadarFlash] = useState(false);
  const [timeStr, setTimeStr] = useState<string>(getRetroTimeString);
  const [backlightActive, setBacklightActive] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const activeSectionRef = useRef<string>('home');
  const lenis = useLenis();

  // Play subtle chirp and trigger flash when toggling DEV vs BIZ mode
  const prevAudienceRef = useRef<string | null>(audience);
  useEffect(() => {
    if (prevAudienceRef.current !== audience && prevAudienceRef.current !== null) {
      playPagerChirp();
      setRadarFlash(true);
      setTimeout(() => setRadarFlash(false), 900);
    }
    prevAudienceRef.current = audience;
  }, [audience]);

  // Fetch live pager messages from API / Supabase
  useEffect(() => {
    fetch('/api/pager')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.messages && Array.isArray(data.messages) && data.messages.length > 0) {
          const merged = data.messages.map((msg: PagerMessage, i: number) => ({
            ...DEFAULT_MESSAGES[i % DEFAULT_MESSAGES.length],
            ...msg,
          }));
          setMessages(merged);
        }
      })
      .catch(() => {});
  }, []);

  // Update clock every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeStr(getRetroTimeString());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Initial 2.5-second standby transition into active radar alert mode
  useEffect(() => {
    const timer = setTimeout(() => {
      setMode((current) => (current === 'standby' ? 'alert' : current));
      setTimeStr(getRetroTimeString());
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Reactive Section Radar: IntersectionObserver tracking portfolio sections
  useEffect(() => {
    const sectionIds = ['home', 'about', 'capabilities', 'deployments', 'resume', 'playground', 'blog', 'contact'];

    const observerOptions = {
      root: null,
      rootMargin: '-25% 0px -25% 0px',
      threshold: 0.15,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const secId = entry.target.id;
          if (secId && secId !== activeSectionRef.current) {
            activeSectionRef.current = secId;
            const targetIdx = messages.findIndex(
              (m) => m.sectionId === secId || m.id.endsWith(secId)
            );
            if (targetIdx !== -1) {
              setActiveMsgIndex(targetIdx);
              setMode('alert');
              setBeaconText('RADAR LOCKED');
              playPagerChirp();
              setRadarFlash(true);
              setTimeout(() => setRadarFlash(false), 900);
            }
          }
        }
      });
    }, observerOptions);

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [messages]);

  // Clean up any stray selection restrictions on unmount
  useEffect(() => {
    return () => {
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, []);

  // Prevent background text selection during pager drag gestures
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.closest('button') || target?.closest(`.${styles.alertScreen}`)) {
      return;
    }

    const preventSelection = (event: Event) => {
      event.preventDefault();
    };

    window.addEventListener('selectstart', preventSelection);

    const handlePointerRelease = () => {
      window.removeEventListener('selectstart', preventSelection);
      window.removeEventListener('pointerup', handlePointerRelease);
      window.removeEventListener('pointercancel', handlePointerRelease);
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };

    window.addEventListener('pointerup', handlePointerRelease);
    window.addEventListener('pointercancel', handlePointerRelease);
  };

  const handleDragStart = () => {
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    window.getSelection()?.removeAllRanges();
  };

  const handleDragEnd = () => {
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    window.getSelection()?.removeAllRanges();
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPagerChirp();
    if (mode === 'standby') setMode('alert');
    setActiveMsgIndex((prev) => (prev > 0 ? prev - 1 : messages.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPagerChirp();
    if (mode === 'standby') setMode('alert');
    setActiveMsgIndex((prev) => (prev < messages.length - 1 ? prev + 1 : 0));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPagerChirp();
    // CLR silences alerts and returns to passive standby monitoring
    setMode('standby');
  };

  const handleToggleLight = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBacklightActive((prev) => !prev);
  };

  const { stats } = useSystemTelemetry();
  const currentMsg = messages[activeMsgIndex] || DEFAULT_MESSAGES[0];
  const queueLength = messages.length;

  const activeSender = isBiz && currentMsg.senderBiz ? currentMsg.senderBiz : currentMsg.sender;
  const activeText = isBiz && currentMsg.textBiz ? currentMsg.textBiz : currentMsg.text;

  const handleLcdClick = useCallback(() => {
    const targetSecId = currentMsg.sectionId || (currentMsg.id.startsWith('ch_') ? currentMsg.id.replace('ch_', '') : null);
    if (!targetSecId) return;

    if (lenis) {
      lenis.scrollTo(`#${targetSecId}`, { duration: 1.2, offset: NAVBAR_SCROLL_OFFSET });
    } else {
      const el = document.getElementById(targetSecId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMsg, lenis]);

  return (
    <Portal>
      <div className={styles.viewportBounds} ref={constraintsRef}>
        <div className={styles.bannerWrapper}>
          {/* ── Draggable Vintage Alphanumeric Pager ── */}
          <m.div
            key="pager-device"
            className={styles.pagerDevice}
            drag
            dragConstraints={constraintsRef}
            dragMomentum={true}
            dragElastic={0.08}
            dragTransition={{ bounceStiffness: 400, bounceDamping: 28 }}
            onPointerDown={handlePointerDown}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            whileDrag={{ scale: 1.02, cursor: 'grabbing' }}
            initial={{ opacity: 0, y: 35, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            role="region"
            aria-label="Vintage Alphanumeric Pager & Section Radar"
          >
            {/* Top Belt-Clip Hinge & Casing Branding */}
            <div className={styles.clipBar}>
              <div className={styles.brandDeboss}>
                <span className={styles.brandName}>PRATEEQ</span>
                <span className={styles.brandModel}>ALPHAPAGE-90</span>
              </div>

              {mode === 'alert' ? (
                <div className={`${styles.alertBeacon} ${radarFlash ? styles.radarFlash : ''}`}>
                  <span className={styles.ledPulse} />
                  <span className={styles.alertText}>{beaconText}</span>
                </div>
              ) : (
                <div className={styles.standbyBeacon}>
                  <span className={styles.standbyDot} />
                  <span className={styles.standbyText}>STANDBY</span>
                </div>
              )}

              <div className={styles.topActions}>
                <button
                  type="button"
                  className={`${styles.topActionBtn} ${backlightActive ? styles.lightBtnActive : ''}`}
                  onClick={handleToggleLight}
                  title={backlightActive ? "Turn off LCD backlight" : "Turn on LCD backlight"}
                  aria-label="Toggle LCD backlight"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    className={styles.lightIconSvg}
                  >
                    <circle cx="12" cy="12" r="4" />
                    <line x1="12" y1="2" x2="12" y2="5" />
                    <line x1="12" y1="19" x2="12" y2="22" />
                    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
                    <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
                    <line x1="2" y1="12" x2="5" y2="12" />
                    <line x1="19" y1="12" x2="22" y2="12" />
                    <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" />
                    <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" />
                  </svg>
                  <span className={styles.lightBtnLabel}>LIGHT</span>
                </button>
              </div>
            </div>

            {/* Main Body with Molded Grips & Sunken LCD */}
            <div className={styles.pagerBody}>
              {/* Left Side Grip Ribs (Grab Handle) */}
              <div className={styles.sideGrip} aria-hidden="true" title="Drag Handle">
                <span className={styles.gripRib} />
                <span className={styles.gripRib} />
                <span className={styles.gripRib} />
              </div>

              {/* Sunken LCD Screen Bezel */}
              <div className={styles.lcdBezel}>
                <div
                  className={`${styles.lcdScreen} ${backlightActive ? styles.lcdBacklightOn : ''}`}
                >
                  {/* LCD Status Header */}
                  <div className={styles.lcdStatusRow}>
                    <span className={styles.lcdSignal}>
                      📶 {mode === 'alert' ? (currentMsg.freq || '900.1MHz') : '900-960MHz'}
                    </span>
                    <span className={styles.lcdMsgCount}>
                      CH 0{activeMsgIndex + 1}/0{queueLength}
                    </span>
                    <span className={styles.lcdBuzzer}>((•))</span>
                    <span className={styles.lcdClock}>{timeStr}</span>
                  </div>

                  {/* LCD Divider */}
                  <div className={styles.lcdDivider} />

                  {/* LCD Message Area */}
                  <div className={styles.lcdContent}>
                    {mode === 'standby' ? (
                      <div className={styles.standbyScreen}>
                        <div className={styles.lcdCategory}>
                          <span className={styles.lcdCursor}>►</span>
                          <span>[RADAR SCANNER: 900-960MHz]</span>
                        </div>
                        <p className={styles.lcdMessage}>
                          {isBiz
                            ? `“Tracking client milestones & ROI models across vault... (Uptime: ${stats.uptime})”`
                            : `“Tracking viewport navigation across systems vault... (Uptime: ${stats.uptime} | ${stats.fps} FPS)”`}
                        </p>
                      </div>
                    ) : (
                      <div
                        className={`${styles.alertScreen} ${styles.clickableScreen}`}
                        onClick={handleLcdClick}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleLcdClick();
                          }
                        }}
                        title={`Jump to #${currentMsg.sectionId || 'section'}`}
                        aria-label={`Jump to ${activeSender}`}
                      >
                        <div className={styles.lcdCategory}>
                          <span className={styles.lcdCursor}>►</span>
                          <span>[{activeSender.toUpperCase()}]</span>
                          <span className={styles.navHint} title="Jump to section">↗</span>
                        </div>
                        <p className={styles.lcdMessage}>
                          &ldquo;{activeText}&rdquo;
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Physical Bottom Controls & Speaker Grille */}
            <div className={styles.pagerControls}>
              <div className={styles.buttonCluster}>
                <button
                  type="button"
                  className={styles.pagerKey}
                  onClick={handlePrev}
                  title="Previous section channel"
                  aria-label="Previous channel"
                >
                  <span>◄ PREV</span>
                </button>

                <button
                  type="button"
                  className={styles.pagerKey}
                  onClick={handleNext}
                  title="Next section channel"
                  aria-label="Next channel"
                >
                  <span>NEXT ►</span>
                </button>

                <button
                  type="button"
                  className={`${styles.pagerKey} ${styles.keyClear}`}
                  onClick={handleClear}
                  title="Silence alert / enter scanner standby"
                  aria-label="Silence alert"
                >
                  <span>CLR</span>
                </button>
              </div>

              {/* Piezo Buzzer Slits */}
              <div className={styles.speakerGrille} aria-hidden="true" title="Piezo Buzzer">
                <span className={styles.speakerSlit} />
                <span className={styles.speakerSlit} />
                <span className={styles.speakerSlit} />
              </div>
            </div>
          </m.div>
        </div>
      </div>
    </Portal>
  );
}
