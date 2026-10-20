'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { m, useDragControls, useReducedMotion } from 'framer-motion';
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

function StandbyScreen({ isBiz }: { isBiz: boolean }) {
  const { stats } = useSystemTelemetry();
  return (
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
  );
}

export interface AlphaPagerProps {
  defaultExpanded?: boolean;
}

export default function AlphaPager({ defaultExpanded }: AlphaPagerProps = {}) {
  const { audience, isDetailsHidden } = useTheme();
  const isBiz = audience === 'business';

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
  });
  const [isExpanded, setIsExpanded] = useState(() => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    if (typeof window === 'undefined') return true;
    return !(window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches);
  });

  const [messages, setMessages] = useState<PagerMessage[]>(DEFAULT_MESSAGES);
  const [activeMsgIndex, setActiveMsgIndex] = useState(0);
  const [mode, setMode] = useState<'standby' | 'alert'>('standby');
  const [beaconText, setBeaconText] = useState<'RADAR LOCKED' | 'PAGE INCOMING'>('RADAR LOCKED');
  const [radarFlash, setRadarFlash] = useState(false);
  const [timeStr, setTimeStr] = useState<string>(getRetroTimeString);
  const [backlightActive, setBacklightActive] = useState(false);
  const activeSectionRef = useRef<string>('home');
  const lastChirpRef = useRef<number>(0);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pagerRef = useRef<HTMLDivElement>(null);

  // Dynamic numeric drag constraints to eliminate DOM bounding box measuring & layout thrashing on scroll
  const [dragBounds, setDragBounds] = useState<{ top: number; bottom: number; left: number; right: number }>(() => {
    if (typeof window === 'undefined') return { top: -600, bottom: 12, left: -800, right: 12 };
    return {
      top: -Math.max(0, window.innerHeight - 240 - 24 - 12),
      bottom: 12,
      left: -Math.max(0, window.innerWidth - 380 - 24 - 12),
      right: 12,
    };
  });

  const updateDragBounds = useCallback(() => {
    if (typeof window === 'undefined') return;
    const pagerEl = pagerRef.current;
    const width = pagerEl?.offsetWidth || 380;
    const height = pagerEl?.offsetHeight || 240;
    const margin = 12;
    const insetRight = 24;
    const insetBottom = 24;

    setDragBounds({
      top: -Math.max(0, window.innerHeight - height - insetBottom - margin),
      bottom: Math.max(0, insetBottom - margin),
      left: -Math.max(0, window.innerWidth - width - insetRight - margin),
      right: Math.max(0, insetRight - margin),
    });
  }, []);

  // Track viewport resize for responsive mobile layout adjustments and drag boundaries
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(mobile);
      updateDragBounds();
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDragBounds]);

  useEffect(() => {
    if (isExpanded) {
      updateDragBounds();
    }
  }, [isExpanded, updateDragBounds]);

  // Dismiss expanded device on mobile when user taps outside the pager
  useEffect(() => {
    if (!isMobile || !isExpanded) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest(`.${styles.pagerDevice}`)) return;
      setIsExpanded(false);
    };

    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside, { passive: true });
    }, 120);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isMobile, isExpanded]);

  // Sync document class when pager is expanded on mobile to coordinate UI docks and prevent overlap
  useEffect(() => {
    if (isMobile && isExpanded) {
      document.documentElement.classList.add('pager-expanded');
      return () => {
        document.documentElement.classList.remove('pager-expanded');
      };
    } else {
      document.documentElement.classList.remove('pager-expanded');
    }
  }, [isMobile, isExpanded]);

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

  const prefersReducedMotion = useReducedMotion();

  // Section Radar: Velocity-aware tracking synchronized with Lenis smooth scroll
  const sectionBoundsRef = useRef<{ id: string; top: number; bottom: number }[]>([]);
  const pendingAudioLockRef = useRef<boolean>(false);

  const measureSections = useCallback(() => {
    if (typeof window === 'undefined') return;
    const sectionIds = ['home', 'about', 'capabilities', 'deployments', 'resume', 'playground', 'blog', 'contact'];
    const bounds: { id: string; top: number; bottom: number }[] = [];
    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) {
        let top = 0;
        let curr: HTMLElement | null = el;
        while (curr && curr.offsetParent) {
          top += curr.offsetTop;
          curr = curr.offsetParent as HTMLElement | null;
        }
        if (top === 0 && el.offsetTop) {
          top = el.offsetTop;
        }
        if (top === 0) {
          const rect = el.getBoundingClientRect ? el.getBoundingClientRect() : { top: 0, height: 0 };
          top = rect.top + (typeof window !== 'undefined' ? window.scrollY : 0);
        }
        const height = el.offsetHeight || (el.getBoundingClientRect ? el.getBoundingClientRect().height : 0);
        bounds.push({
          id,
          top,
          bottom: top + height,
        });
      }
    }
    sectionBoundsRef.current = bounds;
  }, []);

  const handleScrollUpdate = useCallback(
    (currentScroll: number, scrollVelocity: number) => {
      const sectionIds = ['home', 'about', 'capabilities', 'deployments', 'resume', 'playground', 'blog', 'contact'];
      if (sectionBoundsRef.current.length < sectionIds.length) {
        measureSections();
      }

      const focusY = currentScroll + (typeof window !== 'undefined' ? window.innerHeight * 0.35 : 300);

      const matched = sectionBoundsRef.current.find(
        (sec) => focusY >= sec.top && focusY < sec.bottom
      );

      const isAtBottom = typeof window !== 'undefined' && 
        document.documentElement.scrollHeight > window.innerHeight &&
        currentScroll + window.innerHeight >= document.documentElement.scrollHeight - 60;
      const isAtTop = currentScroll < 120;

      const secId = isAtBottom ? 'contact' : matched ? matched.id : isAtTop ? 'home' : null;

      if (secId && secId !== activeSectionRef.current) {
        activeSectionRef.current = secId;
        const targetIdx = messages.findIndex(
          (m) => m.sectionId === secId || m.id.endsWith(secId)
        );
        if (targetIdx !== -1) {
          setActiveMsgIndex(targetIdx);
          setMode('alert');
          setBeaconText('RADAR LOCKED');
          pendingAudioLockRef.current = true;
        }
      }

      // Velocity-aware audio: trigger once velocity settles or immediately during calm scroll
      if (pendingAudioLockRef.current && Math.abs(scrollVelocity) < 6) {
        const now = Date.now();
        if (now - lastChirpRef.current > 1000) {
          lastChirpRef.current = now;
          playPagerChirp();
          setRadarFlash(true);
          if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
          flashTimeoutRef.current = setTimeout(() => setRadarFlash(false), 900);
        }
        pendingAudioLockRef.current = false;
      }
    },
    [messages, measureSections]
  );

  const handleScrollUpdateRef = useRef(handleScrollUpdate);
  useEffect(() => {
    handleScrollUpdateRef.current = handleScrollUpdate;
  }, [handleScrollUpdate]);

  // Memoized Lenis callback to prevent unregister/re-register loops on every render
  const onLenisScroll = useCallback((lenisInstance: { scroll: number; velocity: number }) => {
    handleScrollUpdateRef.current(lenisInstance.scroll, lenisInstance.velocity);
  }, []);

  // Subscribe directly to Lenis scroll frames
  const lenis = useLenis(onLenisScroll);

  // Measurement and native fallback listener (when Lenis is not active or during initialization)
  useEffect(() => {
    measureSections();
    window.addEventListener('resize', measureSections, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && document.body) {
      ro = new ResizeObserver(() => {
        measureSections();
      });
      ro.observe(document.body);
    }

    const handleNativeScroll = () => {
      if (lenis) return;
      handleScrollUpdateRef.current(window.scrollY, 0);
    };

    if (!lenis) {
      window.addEventListener('scroll', handleNativeScroll, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', measureSections);
      window.removeEventListener('scroll', handleNativeScroll);
      if (ro) ro.disconnect();
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      lenis?.start?.();
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [lenis, measureSections]);

  // Start drag gesture from anywhere on the pager casing, excluding interactive buttons and LCD link
  const handlePointerDown = (e: React.PointerEvent) => {
    if (isMobile) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest('button') || target?.closest(`.${styles.alertScreen}`)) {
      return;
    }
    updateDragBounds();
    dragControls.start(e);
  };

  const handleDragStart = () => {
    if (isMobile) return;
    lenis?.stop?.();
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    window.getSelection()?.removeAllRanges();
  };

  const handleDragEnd = () => {
    if (isMobile) return;
    lenis?.start?.();
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    window.getSelection()?.removeAllRanges();
  };

  // Rotary mouse-wheel channel scrolling
  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastChirpRef.current < 200) return;

    if (e.deltaY > 15) {
      playPagerChirp();
      if (mode === 'standby') setMode('alert');
      setActiveMsgIndex((prev) => (prev < messages.length - 1 ? prev + 1 : 0));
      lastChirpRef.current = now;
    } else if (e.deltaY < -15) {
      playPagerChirp();
      if (mode === 'standby') setMode('alert');
      setActiveMsgIndex((prev) => (prev > 0 ? prev - 1 : messages.length - 1));
      lastChirpRef.current = now;
    }
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
    // CLR silences alerts and returns to passive standby monitoring; if already in standby on mobile, docks the device
    if (mode === 'standby' && isMobile) {
      setIsExpanded(false);
    } else {
      setMode('standby');
    }
  };

  const handleToggleLight = (e: React.MouseEvent) => {
    e.stopPropagation();
    setBacklightActive((prev) => !prev);
  };

  const handleToggleDock = (e: React.MouseEvent) => {
    e.stopPropagation();
    playPagerChirp();
    setIsExpanded((prev) => !prev);
  };

  const dragControls = useDragControls();
  const currentMsg = messages[activeMsgIndex] || DEFAULT_MESSAGES[0];
  const queueLength = messages.length;

  const activeSender = isBiz && currentMsg.senderBiz ? currentMsg.senderBiz : currentMsg.sender;
  const activeText = isBiz && currentMsg.textBiz ? currentMsg.textBiz : currentMsg.text;

  const handleLcdClick = useCallback(() => {
    const targetSecId = currentMsg.sectionId || (currentMsg.id.startsWith('ch_') ? currentMsg.id.replace('ch_', '') : null);
    if (!targetSecId) return;

    if (lenis) {
      lenis.start?.();
      lenis.scrollTo(`#${targetSecId}`, { 
        duration: prefersReducedMotion ? 0 : 1.2, 
        offset: NAVBAR_SCROLL_OFFSET 
      });
    } else {
      const el = document.getElementById(targetSecId);
      if (el) el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }

    // On mobile, docking after navigating gives user full viewport view
    if (isMobile) {
      setIsExpanded(false);
    }
  }, [currentMsg, lenis, isMobile, prefersReducedMotion]);

  return (
    <Portal>
      <div className={styles.viewportBounds}>
        <div
          className={`${styles.bannerWrapper} ${isExpanded ? styles.bannerWrapperExpanded : ''} ${isDetailsHidden ? styles.hidden : ''}`}
          data-lenis-prevent
        >
          {!isExpanded ? (
            /* ── Compact Belt-Clip Mode (Mobile & Minimized Dock) ── */
            <m.div
              key="pager-compact"
              className={`${styles.pagerDevice} ${styles.compactClip}`}
              data-lenis-prevent
              onClick={handleToggleDock}
              initial={{ opacity: 0, scale: 0.92, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 15 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              role="region"
              aria-label="Vintage Pager Pocket Clip"
            >
              <div className={styles.compactContent}>
                {mode === 'alert' ? (
                  <span className={`${styles.compactLed} ${radarFlash ? styles.radarFlash : ''}`} />
                ) : (
                  <span className={styles.compactLedStandby} />
                )}

                <div className={styles.compactInfo}>
                  <span className={styles.compactBrand}>PRATEEQ</span>
                  <span className={`${styles.compactDivider} ${styles.brandDivider}`}>/</span>
                  <span className={styles.compactFreq}>
                    {mode === 'alert' ? (currentMsg.freq || '900.1M') : '900M'}
                  </span>
                  <span className={`${styles.compactDivider} ${styles.freqDivider}`}>/</span>
                  <span className={styles.compactChannel}>
                    CH 0{activeMsgIndex + 1}
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.compactExpandBtn}
                  onClick={handleToggleDock}
                  aria-label="Expand Alphanumeric Pager"
                  title="Expand pager readout"
                >
                  <span className={styles.compactExpandIcon}>▲</span>
                  <span className={styles.compactExpandLabel}>RADAR</span>
                </button>
              </div>
            </m.div>
          ) : (
            /* ── Full Vintage Alphanumeric Pager ── */
            <m.div
              ref={pagerRef}
              key="pager-device"
              className={styles.pagerDevice}
              data-lenis-prevent
              drag={!isMobile}
              dragListener={false}
              dragControls={dragControls}
              dragConstraints={dragBounds}
              dragMomentum={true}
              dragElastic={0.06}
              dragTransition={{ bounceStiffness: 400, bounceDamping: 30 }}
              onPointerDown={handlePointerDown}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onWheel={handleWheel}
              whileDrag={!isMobile ? { scale: 1.02, cursor: 'grabbing' } : undefined}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              role="region"
              aria-label="Vintage Alphanumeric Pager & Section Radar"
            >
              {/* Top Belt-Clip Hinge & Casing Branding */}
              <div className={styles.clipBar} title="Drag Handle">
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

                  <button
                    type="button"
                    className={`${styles.topActionBtn} ${styles.dockBtn}`}
                    onClick={handleToggleDock}
                    title="Dock pager to pocket clip"
                    aria-label="Dock pager"
                  >
                    <span className={styles.dockIcon}>▼</span>
                    <span className={styles.dockBtnLabel}>DOCK</span>
                  </button>
                </div>
              </div>

              {/* Main Body with Molded Grips & Sunken LCD */}
              <div className={styles.pagerBody}>
                {/* Left Side Grip Ribs (Grab Handle) */}
                <div
                  className={styles.sideGrip}
                  aria-hidden="true"
                  title="Drag Handle"
                >
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
                        <StandbyScreen isBiz={isBiz} />
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
                    title={mode === 'standby' && isMobile ? "Clear alert and dock pager" : "Silence alert / enter scanner standby"}
                    aria-label={mode === 'standby' && isMobile ? "Clear and dock pager" : "Silence alert"}
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
          )}
        </div>
      </div>
    </Portal>
  );
}
