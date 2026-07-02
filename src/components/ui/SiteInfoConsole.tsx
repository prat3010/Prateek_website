'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  Cpu,
  ArrowLeft,
  Layers
} from 'lucide-react';
import styles from './SiteInfoConsole.module.css';

// Command responses for Noir Interactive Console
interface ConsoleLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'link' | 'image';
  command?: string;
  imageUrl?: string;
}

const BOOT_LOGS = [
  'SYSTEM // Initializing cyber diagnostics console...',
  'SYSTEM // Loading dynamic route bundles...',
  'SYSTEM // Listening for performance and frame rate metrics...',
  'SYSTEM // Diagnostics core online. Welcome.'
];

interface ProjectSummary {
  title: string;
  tags: string[];
}

export default function SiteInfoConsole() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => setProjects(data || []))
      .catch(() => {});
  }, []);
  const { isNoir } = useTheme();
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<ConsoleLine[]>(
    BOOT_LOGS.map(log => ({ text: log, type: 'success' }))
  );
  
  // Real telemetry state
  const [stats, setStats] = useState({
    fps: 60,
    bundleSize: 184,
    domNodes: 0,
    uptime: '00:00:00'
  });

  // Real Web Vitals state
  const [webVitals, setWebVitals] = useState({
    lcp: 0,
    fid: 0,
    cls: 0,
    hasInteraction: false
  });

  const terminalScreenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isVisibleRef = useRef(true);

  // Auto-scroll terminal screen to bottom
  useEffect(() => {
    if (terminalScreenRef.current) {
      terminalScreenRef.current.scrollTo({
        top: terminalScreenRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [terminalHistory]);

  // Focus input on click of terminal area
  const focusTerminalInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Pause intervals/RAF loops when tab is hidden
  useEffect(() => {
    const handler = () => { isVisibleRef.current = !document.hidden; };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, []);

  // FPS requestAnimationFrame counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const countFrames = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (now - lastTime));
        setStats(prev => ({ ...prev, fps: currentFps }));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(countFrames);
    };

    animId = requestAnimationFrame(countFrames);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Hardware sync: script sizes, DOM nodes, and uptime
  useEffect(() => {
    // 1. Calculate actual loaded javascript bundle sizes in KB
    const calculateBundleSize = () => {
      if (typeof performance === 'undefined') return 184;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.initiatorType === 'script' || r.name.endsWith('.js'));
      const totalBytes = jsResources.reduce((acc, r) => acc + (r.transferSize || r.encodedBodySize || r.decodedBodySize || 0), 0);
      return Math.round(totalBytes / 1024) || 245; // fallback to 245 if zero
    };

    // Calculate static metrics once on mount to avoid CPU overhead in setInterval loop
    const initialDomNodes = typeof document !== 'undefined' ? document.getElementsByTagName('*').length : 0;
    const initialBundle = calculateBundleSize();

    requestAnimationFrame(() => {
      setStats(prev => ({
        ...prev,
        domNodes: initialDomNodes,
        bundleSize: initialBundle
      }));
    });

    // Uptime tick loop - tracks performance.now() (session lifetime since first tab load)
    const timer = setInterval(() => {
      if (!isVisibleRef.current) return;
      const diff = typeof performance !== 'undefined' ? performance.now() : 0;
      const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      const uptimeStr = `${hours}:${mins}:${secs}`;

      setStats(prev => {
        if (prev.uptime === uptimeStr) return prev;
        return {
          ...prev,
          uptime: uptimeStr
        };
      });
    }, 200);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Native Web Vitals Performance Observers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let lcpObserver: PerformanceObserver | null = null;
    let fidObserver: PerformanceObserver | null = null;
    let clsObserver: PerformanceObserver | null = null;

    try {
      // 1. Largest Contentful Paint (LCP)
      lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const lastEntry = entries[entries.length - 1];
          const lcpVal = Number((lastEntry.startTime / 1000).toFixed(2));
          setWebVitals(prev => ({ ...prev, lcp: lcpVal }));
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {}

    try {
      // 2. First Input Delay (FID)
      fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          const firstInput = entries[0] as PerformanceEventTiming;
          const fidVal = Math.round(firstInput.processingStart - firstInput.startTime);
          setWebVitals(prev => ({ ...prev, fid: fidVal, hasInteraction: true }));
        }
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
    } catch {}

    try {
      // 3. Cumulative Layout Shift (CLS)
      let accumulatedCls = 0;
      clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as unknown as { hadRecentInput: boolean; value: number };
          if (!layoutShift.hadRecentInput) {
            accumulatedCls += layoutShift.value;
            setWebVitals(prev => ({ ...prev, cls: Number(accumulatedCls.toFixed(3)) }));
          }
        }
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {}

    return () => {
      lcpObserver?.disconnect();
      fidObserver?.disconnect();
      clsObserver?.disconnect();
    };
  }, []);

  const executeCommand = useCallback((cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    if (!trimmedCmd) return;

    // Add input command to history
    setTerminalHistory(prev => [...prev, { text: `> ${cmd}`, type: 'input' }]);

    let response: ConsoleLine[] = [];

    if (trimmedCmd.startsWith('git-info')) {
      const parts = trimmedCmd.split(/\s+/);
      const subCommand = parts[1]?.toLowerCase() || '';
      
      if (subCommand === 'show') {
        const commitHash = parts[2] || '';
        
        fetch(`/api/git-log?commit=${encodeURIComponent(commitHash)}`)
          .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
          })
          .then(data => {
            const lines: ConsoleLine[] = [];
            lines.push({ text: `GIT INSPECTOR // COMMIT SPECIFICATIONS:`, type: 'success' });
            lines.push({ text: ' ', type: 'output' });
            
            const detailLines = data.content.split('\n');
            detailLines.forEach((l: string) => {
              lines.push({ text: l, type: 'output' });
            });
            lines.push({ text: ' ', type: 'output' });
            lines.push({
              text: 'Click here to return to Commit Journal',
              type: 'link',
              command: 'git-info'
            });
            setTerminalHistory(prev => [...prev, ...lines]);
          })
          .catch(() => {
            setTerminalHistory(prev => [
              ...prev,
              { text: `Commit details not found or failed to load for hash: '${commitHash}'`, type: 'error' },
              { text: 'Click here to return to Commit Journal', type: 'link', command: 'git-info' }
            ]);
          });
      } else {
        // Default: fetch list of commits
        fetch('/api/git-log')
          .then(res => {
            if (!res.ok) throw new Error();
            return res.json();
          })
          .then(data => {
            const lines: ConsoleLine[] = [];
            lines.push({ text: 'PORTFOLIO DEVELOPMENT GIT COMMIT JOURNAL:', type: 'success' });
            lines.push({ text: '  Click on any commit line to inspect code modifications and files changed.', type: 'output' });
            lines.push({ text: ' ', type: 'output' });
            
            data.commits.forEach((c: { hash: string; subject: string; date: string; author: string }) => {
              lines.push({
                text: `  [${c.hash}] ${c.subject} (${c.date})`,
                type: 'link',
                command: `git-info show ${c.hash}`
              });
            });
            lines.push({ text: ' ', type: 'output' });
            lines.push({ text: 'Tip: You can also inspect manually by typing "git-info show <commit_hash>"', type: 'success' });
            setTerminalHistory(prev => [...prev, ...lines]);
          })
          .catch(() => {
            setTerminalHistory(prev => [
              ...prev,
              { text: 'Failed to retrieve git logs.', type: 'error' }
            ]);
          });
      }
      
      setTerminalInput('');
      return;
    }

    if (trimmedCmd.startsWith('storage')) {
      const parts = trimmedCmd.split(/\s+/);
      const sub = parts[1]?.toLowerCase() || '';
      if (sub === 'clear' || sub === 'wipe') {
        if (typeof localStorage !== 'undefined') localStorage.clear();
        if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
        setTerminalHistory(prev => [
          ...prev,
          { text: 'STORAGE INVENTORY WIPED:', type: 'success' },
          { text: '  - Cleared all LocalStorage key-value pairs.', type: 'output' },
          { text: '  - Cleared all SessionStorage contexts.', type: 'output' }
        ]);
        setTerminalInput('');
        return;
      }
    }

    if (trimmedCmd === 'analytics') {
      fetch('/api/analytics-summary')
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          const lines: ConsoleLine[] = [
            { text: 'DATABASE TRAFFIC ANALYTICS SUMMARY:', type: 'success' },
            { text: `  - Operational Mode: ${data.isDemoMode ? 'DEMO (MOCK DATA)' : 'LIVE DATABASE'}`, type: 'output' },
            { text: `  - Total Page Views: ${data.totalViews} views`, type: 'output' },
            { text: `  - Unique IP Visitors: ${data.uniqueVisitors} users`, type: 'output' },
            { text: `  - Top Visited Path: ${data.popularPath}`, type: 'output' },
            { text: `  - Top Traffic Referral: ${data.topReferrer}`, type: 'output' },
            { text: `  - Top Visitor Country: ${data.topCountry}`, type: 'output' },
            { text: ' ', type: 'output' },
            { text: 'Click here to open full visitor analytics dashboard', type: 'link', command: 'go-analytics' }
          ];
          setTerminalHistory(prev => [...prev, ...lines]);
        })
        .catch(() => {
          setTerminalHistory(prev => [
            ...prev,
            { text: 'Failed to retrieve database analytics.', type: 'error' }
          ]);
        });
      setTerminalInput('');
      return;
    }

    if (trimmedCmd === 'go-analytics') {
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/analytics';
      }
      setTerminalInput('');
      return;
    }

    switch (trimmedCmd) {
      case 'help':
        response = [
          { text: 'Available commands:', type: 'success' },
          { text: '  projects   - Index developer project indices & tags', type: 'output' },
          { text: '  system     - Print logical CPU cores, memory & display metrics', type: 'output' },
          { text: '  storage    - Audit client cookies, local & session storage', type: 'output' },
          { text: '  stack      - List all the technologies used to make this website', type: 'output' },
          { text: '  sync       - Inspect the local database synchronization engine info', type: 'output' },
          { text: '  analytics  - Print dynamic database traffic visitor statistics summary', type: 'output' },
          { text: '  cheatcode  - Run retro developer override (3D WebGL parade)', type: 'output' },
          { text: '  git-info   - Open the interactive portfolio Git commit inspector', type: 'output' },
          { text: '  qrcode     - Scan PhonePe QR code to pay or donate directly', type: 'output' },
          { text: '  clear      - Clear the command interface screen', type: 'output' }
        ];
        break;
      case 'qrcode':
        response = [
          { text: 'PHONEPE UPI PAYMENT PORTAL:', type: 'success' },
          { text: '  Scan the QR code below using any UPI app (PhonePe, GPay, Paytm, BHIM) to pay or donate.', type: 'output' },
          { text: '', type: 'image', imageUrl: '/phonepe_qr.svg' }
        ];
        break;
      case 'projects':
        response = [
          { text: 'PORTFOLIO PROJECTS RECORD:', type: 'success' },
          { text: `  - Total Active Projects: ${projects.length}`, type: 'output' },
          ...projects.map(p => ({ text: `  • ${p.title} (${p.tags.join(', ')})`, type: 'output' as const })),
          { text: '  - Repository source: github.com/prat3010', type: 'output' }
        ];
        break;
      case 'system': {
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
        let os = 'Unknown OS';
        if (userAgent.includes('Macintosh')) os = 'macOS';
        else if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
        else if (userAgent.includes('Android')) os = 'Android';

        const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 'Unavailable' : 'Unavailable';
        const nav = typeof navigator !== 'undefined' ? navigator as Navigator & { deviceMemory?: number } : null;
        const ram = nav && nav.deviceMemory ? `${nav.deviceMemory} GB` : 'Protected/Unavailable';
        const width = typeof window !== 'undefined' ? window.screen.width : 0;
        const height = typeof window !== 'undefined' ? window.screen.height : 0;
        const dpr = typeof window !== 'undefined' ? window.devicePixelRatio : 1;

        response = [
          { text: 'SYSTEM HARDWARE METRICS:', type: 'success' },
          { text: `  - Operating System: ${os}`, type: 'output' },
          { text: `  - Logical CPU Cores: ${cores} threads`, type: 'output' },
          { text: `  - Estimated Device RAM: ${ram}`, type: 'output' },
          { text: `  - Display Resolution: ${width}x${height} (@${dpr}x DPR)`, type: 'output' }
        ];
        break;
      }
      case 'storage': {
        const localKeys = typeof localStorage !== 'undefined' ? Object.keys(localStorage) : [];
        const sessionKeys = typeof sessionStorage !== 'undefined' ? Object.keys(sessionStorage) : [];
        const cookieCount = typeof document !== 'undefined' ? (document.cookie ? document.cookie.split(';').length : 0) : 0;

        let totalLocalBytes = 0;
        if (typeof localStorage !== 'undefined') {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key) {
              totalLocalBytes += (localStorage.getItem(key) || '').length;
            }
          }
        }

        response = [
          { text: 'CLIENT-SIDE STORAGE AUDIT:', type: 'success' },
          { text: `  - LocalStorage footprint: ${localKeys.length} keys (${totalLocalBytes} characters)`, type: 'output' },
          ...localKeys.map(k => ({ text: `    • [Local] ${k}`, type: 'output' as const })),
          { text: `  - SessionStorage footprint: ${sessionKeys.length} keys`, type: 'output' },
          ...sessionKeys.map(k => ({ text: `    • [Session] ${k}`, type: 'output' as const })),
          { text: `  - Cookies count: ${cookieCount} active`, type: 'output' },
          { text: 'Tip: Type "storage clear" to wipe all localStorage and sessionStorage caches.', type: 'success' }
        ];
        break;
      }
      case 'stack':
        response = [
          { text: 'WEBSITE TECHNOLOGY STACK:', type: 'success' },
          { text: '  - Core Framework: Next.js 16.2.6 (React 19.2.4)', type: 'output' },
          { text: '  - Language: TypeScript 5.x', type: 'output' },
          { text: '  - Database & Backend: Supabase JS SDK 2.106.2', type: 'output' },
          { text: '  - Styling & Layout: Vanilla CSS / CSS Modules', type: 'output' },
          { text: '  - Animations: Framer Motion 12.40.0', type: 'output' },
          { text: '  - 3D Graphics: Three.js 0.184.0', type: 'output' },
          { text: '  - Smooth Scrolling: Lenis Scroll 1.3.23', type: 'output' },
          { text: '  - Document/PDF Engine: jsPDF 4.2.1', type: 'output' },
          { text: '  - UI Icons: Lucide React 1.16.0', type: 'output' },
          { text: '  - Markdown Parser: React Markdown 10.1.0', type: 'output' },
          { text: '  - Email Delivery: Resend SDK 6.12.4', type: 'output' },
          { text: '  - Performance Audits: Vercel Speed Insights 2.0.0', type: 'output' }
        ];
        break;
      case 'sync':
      case 'synchronizer':
        response = [
          { text: 'PORTFOLIO DATABASE SYNCHRONIZER:', type: 'success' },
          { text: '  An AI-powered local manager dashboard that scans codebase folders or GitHub repos, extracts project metadata via Gemini, and synchronizes skills, certificates, resumes, and projects directly into the website code.', type: 'output' },
          { text: ' ', type: 'output' },
          { text: '  - Core Script: scripts/synchronizer.py (Python 3)', type: 'output' },
          { text: '  - Interface: Streamlit Local Dashboard', type: 'output' },
          { text: '  - AI Parsing Integration: Gemini 2.5 Flash API (Structured JSON Mode)', type: 'output' },
          { text: '  - Database Sync: Supabase Live Database', type: 'output' },
          { text: '  - Codebase Fallbacks: JSON records (projects, skills, certs, resume)', type: 'output' },
          { text: '  - Blog Output: Markdown files in src/content/posts/', type: 'output' },
          { text: '  - Local Command: streamlit run scripts/synchronizer.py', type: 'output' }
        ];
        break;
      case 'cheatcode':
        if (typeof window !== 'undefined') {
          const isActive = document.documentElement.classList.toggle('konami-active');
          response = [
            { text: 'KONAMI CODE DECRYPTED:', type: 'success' },
            { text: '  - Keyboard Sequence: [↑, ↑, ↓, ↓, ←, →, ←, →, B, A]', type: 'success' },
            { text: `  - Cheat Override Mode: ${isActive ? 'ACTIVE' : 'INACTIVE'}`, type: 'output' },
            { text: isActive 
              ? '  - Engage: 3D WebGL Gremlin Parade (Float & Bouncing Physics Activated)!' 
              : '  - Disengage: Unmounting WebGL Canvas and releasing GPU memory.', type: 'output' }
          ];
        }
        break;
      case 'clear':
        setTerminalHistory([]);
        setTerminalInput('');
        return;
      default:
        response = [
          { text: `Command not found: '${trimmedCmd}'. Type 'help' for options.`, type: 'error' }
        ];
    }

    setTerminalHistory(prev => [...prev, ...response]);
    setTerminalInput('');
  }, [projects]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(terminalInput);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* ---- Go Back Header ---- */}
        <div className={styles.header} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={18} />
            <span>Return to Base</span>
          </Link>
          <Link href="/admin/analytics" className={styles.backLink}>
            <span>Visitor Analytics</span>
          </Link>
        </div>

        <div className={styles.consoleContainer}>
          {/* Title Bar */}
          <div className={styles.consoleTitleBar}>
            <div className={styles.indicators}>
              <span className={`${styles.dot} ${styles.red}`} />
              <span className={`${styles.dot} ${styles.yellow}`} />
              <span className={`${styles.dot} ${styles.green}`} />
            </div>
            <h2 className={styles.titleText}>
              {isNoir ? 'SYSTEM DIAGNOSTICS & LOGS (v2.5)' : 'COBALT TERMINAL CORE // SITE SCHEMATICS'}
            </h2>
          </div>

          {/* Dashboard widgets Grid */}
          <div className={styles.consoleGrid}>
            
            {/* Stats Widget */}
            <div className={styles.consoleWidget}>
              <h3 className={styles.widgetTitle}>
                <Cpu size={14} className={styles.widgetIcon} />
                TELEMETRY MATRIX
              </h3>
              <ul className={styles.metricsList}>
                <li>
                  <span className={styles.metricLabel}>RENDER FPS:</span>
                  <span className={styles.metricValue}>{stats.fps} FPS</span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(100, (stats.fps / 60) * 100)}%` }} />
                  </div>
                </li>
                <li>
                  <span className={styles.metricLabel}>SCRIPT BUNDLE:</span>
                  <span className={styles.metricValue}>{stats.bundleSize} KB</span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(100, (stats.bundleSize / 500) * 100)}%`, backgroundColor: 'var(--neon-cyan, var(--pop-blue))' }} />
                  </div>
                </li>
                <li>
                  <span className={styles.metricLabel}>DOM ELEMENTS:</span>
                  <span className={styles.metricValue}>{stats.domNodes} nodes</span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(100, (stats.domNodes / 2000) * 100)}%`, backgroundColor: 'var(--neon-pink, var(--pop-red))' }} />
                  </div>
                </li>
                <li>
                  <span className={styles.metricLabel}>UPTIME:</span>
                  <span className={styles.metricValue}>{stats.uptime}</span>
                </li>
              </ul>
            </div>

            {/* Performance Web Vitals Widget */}
            <div className={styles.consoleWidget}>
              <h3 className={styles.widgetTitle}>
                <Layers size={14} className={styles.widgetIcon} />
                PERFORMANCE VITALS
              </h3>
              <ul className={styles.metricsList}>
                <li>
                  <span className={styles.metricLabel}>LCP (PAINT):</span>
                  <span className={styles.metricValue}>
                    {webVitals.lcp > 0 ? `${webVitals.lcp}s` : 'Measuring...'}
                  </span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(100, (webVitals.lcp / 2.5) * 100)}%`, backgroundColor: 'var(--neon-cyan, var(--pop-blue))' }} />
                  </div>
                </li>
                <li>
                  <span className={styles.metricLabel}>FID (DELAY):</span>
                  <span className={styles.metricValue}>
                    {webVitals.hasInteraction ? `${webVitals.fid}ms` : 'Pending...'}
                  </span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(100, (webVitals.fid / 100) * 100)}%`, backgroundColor: 'var(--neon-cyan, var(--pop-blue))' }} />
                  </div>
                </li>
                <li>
                  <span className={styles.metricLabel}>CLS (SHIFT):</span>
                  <span className={styles.metricValue}>
                    {webVitals.cls}
                  </span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${Math.min(100, (webVitals.cls / 0.1) * 100)}%`, backgroundColor: 'var(--neon-cyan, var(--pop-blue))' }} />
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Terminal Console */}
          <div className={styles.terminalContainer} onClick={focusTerminalInput}>
            <div className={styles.terminalScreen} ref={terminalScreenRef} data-lenis-prevent>
              {terminalHistory.map((line, index) => {
                if (line.type === 'image' && line.imageUrl) {
                  return (
                    <div key={index} className={styles.terminalImageContainer}>
                      <img src={line.imageUrl} alt="PhonePe QR Code" className={styles.terminalImage} />
                    </div>
                  );
                }
                return (
                  <div
                    key={index}
                    className={`${styles.terminalLine} ${styles[line.type]} ${line.command ? styles.clickableLine : ''}`}
                    onClick={line.command ? (e) => {
                      e.stopPropagation();
                      executeCommand(line.command!);
                    } : undefined}
                  >
                    {line.text}
                  </div>
                );
              })}
            </div>
            <div className={styles.terminalPromptLine}>
              <span className={styles.promptSymbol}>&gt;</span>
              <input
                ref={inputRef}
                type="text"
                className={styles.terminalInput}
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command..."
                aria-label="Terminal prompt"
                autoFocus
              />
            </div>
          </div>

          {/* Command Shortcuts list for easy mobile use */}
          <div className={styles.shortcutsContainer}>
            <span className={styles.shortcutsLabel}>QUICK SHORTCUTS:</span>
            <div className={styles.shortcutsGrid}>
              {['help', 'projects', 'system', 'storage', 'stack', 'sync', 'analytics', 'cheatcode', 'git-info', 'qrcode', 'clear'].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => executeCommand(cmd)}
                  className={styles.shortcutBtn}
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
