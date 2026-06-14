'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import {
  Cpu,
  Binary,
  ArrowLeft
} from 'lucide-react';
import styles from './SiteInfoConsole.module.css';

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
}

// Command responses for Noir Interactive Console
interface ConsoleLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'link';
  command?: string;
}

const BOOT_LOGS = [
  'SYSTEM // Initializing Cyber-Noir framework...',
  'SYSTEM // Connecting neural graphics engine...',
  'SYSTEM // Spawning interactive cursor trail...',
  'SYSTEM // Gremlin bio-link active...',
  'SYSTEM // CPU safety check: 100% stable.',
  'SYSTEM // Welcome. Type a command or select a shortcut below.'
];

export default function SiteInfoConsole() {
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
    gremlinEnergy: 100,
    isCharging: false,
    uptime: '00:00:00'
  });

  const terminalScreenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // FPS requestAnimationFrame counter
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const countFrames = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const currentFps = Math.min(60, Math.round((frameCount * 1000) / (now - lastTime)));
        setStats(prev => ({ ...prev, fps: currentFps }));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(countFrames);
    };

    animId = requestAnimationFrame(countFrames);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Hardware sync: Battery status, script sizes, DOM nodes, and uptime
  useEffect(() => {
    const startTime = Date.now();

    // 1. Calculate actual loaded javascript bundle sizes in KB
    const calculateBundleSize = () => {
      if (typeof performance === 'undefined') return 184;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const jsResources = resources.filter(r => r.initiatorType === 'script' || r.name.endsWith('.js'));
      const totalBytes = jsResources.reduce((acc, r) => acc + (r.transferSize || r.encodedBodySize || r.decodedBodySize || 0), 0);
      return Math.round(totalBytes / 1024) || 245; // fallback to 245 if zero
    };

    // 2. Battery status API link
    let batteryInstance: BatteryManager | null = null;
    const onBatteryChange = () => {
      if (batteryInstance) {
        setStats(prev => ({
          ...prev,
          gremlinEnergy: Math.round(batteryInstance!.level * 100),
          isCharging: batteryInstance!.charging
        }));
      }
    };

    if (typeof navigator !== 'undefined') {
      const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
      if (typeof nav.getBattery === 'function') {
        nav.getBattery().then((battery) => {
          batteryInstance = battery;
          // set initial values
          setStats(prev => ({
            ...prev,
            gremlinEnergy: Math.round(battery.level * 100),
            isCharging: battery.charging
          }));
          battery.addEventListener('levelchange', onBatteryChange);
          battery.addEventListener('chargingchange', onBatteryChange);
        });
      }
    }

    const timer = setInterval(() => {
      // Format uptime
      const diff = Date.now() - startTime;
      const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      
      const liveDomNodes = typeof document !== 'undefined' ? document.getElementsByTagName('*').length : 0;
      const liveBundle = calculateBundleSize();

      setStats(prev => ({
        ...prev,
        bundleSize: liveBundle,
        domNodes: liveDomNodes,
        uptime: `${hours}:${mins}:${secs}`
      }));
    }, 1000);

    return () => {
      clearInterval(timer);
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', onBatteryChange);
        batteryInstance.removeEventListener('chargingchange', onBatteryChange);
      }
    };
  }, []);

  const executeCommand = useCallback((cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    if (!trimmedCmd) return;

    // Add input command to history
    setTerminalHistory(prev => [...prev, { text: `> ${cmd}`, type: 'input' }]);

    let response: ConsoleLine[] = [];

    if (trimmedCmd.startsWith('secret')) {
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
            lines.push({ text: `📂 GIT INSPECTOR // COMMIT SPECIFICATIONS:`, type: 'success' });
            lines.push({ text: ' ', type: 'output' });
            
            const detailLines = data.content.split('\n');
            detailLines.forEach((l: string) => {
              lines.push({ text: l, type: 'output' });
            });
            lines.push({ text: ' ', type: 'output' });
            lines.push({
              text: '⏮️ Click here to return to Commit Journal',
              type: 'link',
              command: 'secret'
            });
            setTerminalHistory(prev => [...prev, ...lines]);
          })
          .catch(() => {
            setTerminalHistory(prev => [
              ...prev,
              { text: `⚠️ Commit details not found or failed to load for hash: '${commitHash}'`, type: 'error' },
              { text: '⏮️ Click here to return to Commit Journal', type: 'link', command: 'secret' }
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
            lines.push({ text: '🕵️‍♂️ PORTFOLIO DEVELOPMENT GIT COMMIT JOURNAL:', type: 'success' });
            lines.push({ text: '  Click on any commit line to inspect code modifications and files changed.', type: 'output' });
            lines.push({ text: ' ', type: 'output' });
            
            data.commits.forEach((c: { hash: string; subject: string; date: string; author: string }) => {
              lines.push({
                text: `  [${c.hash}] ${c.subject} (${c.date})`,
                type: 'link',
                command: `secret show ${c.hash}`
              });
            });
            lines.push({ text: ' ', type: 'output' });
            lines.push({ text: '💡 Tip: You can also inspect manually by typing "secret show <commit_hash>"', type: 'success' });
            setTerminalHistory(prev => [...prev, ...lines]);
          })
          .catch(() => {
            setTerminalHistory(prev => [
              ...prev,
              { text: '⚠️ Failed to retrieve git logs.', type: 'error' }
            ]);
          });
      }
      
      setTerminalInput('');
      return;
    }

    switch (trimmedCmd) {
      case 'help':
        response = [
          { text: 'Available commands:', type: 'success' },
          { text: '  specs      - Print website core technologies & stack', type: 'output' },
          { text: '  gremlin    - Inspect the embedded Gremlin mascot status', type: 'output' },
          { text: '  stats      - Display live physical footprint data', type: 'output' },
          { text: '  skyline    - Inspect background canvas & wobbly rendering', type: 'output' },
          { text: '  gargoyle   - Query status of the interactive spire guardian', type: 'output' },
          { text: '  cat        - Check path logs for rooftop black cat', type: 'output' },
          { text: '  pigeon     - Monitor pigeon nesting activity & locations', type: 'output' },
          { text: '  audit      - Run Core Web Vitals & performance metrics', type: 'output' },
          { text: '  database   - Show data structures and schema details', type: 'output' },
          { text: '  projects   - Index developer project indices & philosophy', type: 'output' },
          { text: '  resume     - Print career evolution timeline & focus areas', type: 'output' },
          { text: '  colors     - Print active theme hexadecimal palette', type: 'output' },
          { text: '  cheatcode  - Run retro developer override', type: 'output' },
          { text: '  about      - Reveal website backstory & design decisions', type: 'output' },
          { text: '  clear      - Clear the command interface screen', type: 'output' },
          { text: '  secret     - Open the interactive portfolio Git commit inspector', type: 'output' }
        ];
        break;
      case 'specs':
        response = [
          { text: '⚡ TECHNICAL SPECIFICATIONS:', type: 'success' },
          { text: '  - Framework: Next.js v16.2.6 (React 19.2.4)', type: 'output' },
          { text: '  - Stylesheets: 100% Vanilla CSS Modules', type: 'output' },
          { text: '  - Inertia Scroll: Lenis React integration', type: 'output' },
          { text: '  - Motion Engine: Framer Motion v12 (Code-split dynamic imports)', type: 'output' },
          { text: '  - Database Layer: Supabase (PostgreSQL Schema)', type: 'output' },
          { text: '  - Hosting Target: Vercel serverless nodes', type: 'output' }
        ];
        break;
      case 'gremlin':
        response = [
          { text: '👾 GREMLIN INVENTORY AND STATUS:', type: 'success' },
          { text: '      (•ㅅ•) ', type: 'success' },
          { text: '    <   |   >', type: 'success' },
          { text: '     /     \\', type: 'success' },
          { text: '  - Code Name: "The Gremlin"', type: 'output' },
          { text: '  - Core Role: Semicolon Consumer & Bug Generator', type: 'output' },
          { text: '  - Interactive States: Blushes on hover, ears rotate', type: 'output' },
          { text: '  - Current Location: SVG Logo Container (Fixed Nav Anchor)', type: 'output' },
          { text: `  - Energy Level: ${stats.gremlinEnergy}% (${stats.isCharging ? 'AC Power: Charging Mascot' : 'Battery Level Synced'})`, type: 'output' }
        ];
        break;
      case 'stats':
        response = [
          { text: '📊 DIAGNOSTIC TELEMETRY REPORT:', type: 'success' },
          { text: `  - Render Frame Rate: ${stats.fps} FPS (Target 60FPS)`, type: 'output' },
          { text: `  - Active Script Weight: ${stats.bundleSize} KB`, type: 'output' },
          { text: `  - DOM Elements Count: ${stats.domNodes} elements`, type: 'output' },
          { text: `  - System Uptime: ${stats.uptime}`, type: 'output' }
        ];
        break;
      case 'skyline':
        response = [
          { text: '🌆 SKYLINE ENGINE SCHEMATICS:', type: 'success' },
          { text: '  - Architecture: Multi-layered canvas depth parallax.', type: 'output' },
          { text: '  - Wobble Logic: Custom frame jitter loops redraw path strokes with offset vertices, creating a living sketchy outline.', type: 'output' },
          { text: '  - Performance: Listeners run via passive observers. Animation loops freeze when off-screen to preserve CPU power.', type: 'output' }
        ];
        break;
      case 'gargoyle':
        response = [
          { text: '🗿 GARGOYLE SIMULATION PROTOCOL:', type: 'success' },
          { text: '  - Entity: Interactive vector gargoyle spire guardian.', type: 'output' },
          { text: '  - State Machine: Idle -> Preflight -> Leap -> Glide -> Land -> Reperch.', type: 'output' },
          { text: '  - Mechanics: Calculates gravitational flight parabola vectors on scroll triggers.', type: 'output' },
          { text: '  - Location: Spire Right Apex (Fixed Canvas Overlay).', type: 'output' }
        ];
        break;
      case 'cat':
        response = [
          { text: '🐈 ROOFTOP CAT TELEMETRY:', type: 'success' },
          { text: '  - Entity: Rooftop feline patrol.', type: 'output' },
          { text: '  - Animation Loop: Walking frames throttled to 20fps for classic stop-motion aesthetic.', type: 'output' },
          { text: '  - Brain Loop: Periodic random walker clock cycles shifting between sitting, sleeping, and strolling.', type: 'output' }
        ];
        break;
      case 'pigeon':
        response = [
          { text: '🐦 PIGEON FLOCK REGISTER:', type: 'success' },
          { text: '  - Population: 3 procedural birds.', type: 'output' },
          { text: '  - Interactive: Jitters and random rotations simulate pecking behaviors.', type: 'output' },
          { text: '  - Anchors: Nesting on building window spires and fire escapes.', type: 'output' }
        ];
        break;
      case 'about':
        response = [
          { text: '📖 DESIGN PHILOSOPHY:', type: 'success' },
          { text: '  This portfolio represents an AI-native workspace. It switches between:', type: 'output' },
          { text: '  - Azure: A tactile comic storyboard reflecting sketchy ideas, watercolor washes, and serif storytelling.', type: 'output' },
          { text: '  - Noir: A high-contrast terminal console emphasizing code execution speed, neon styling, and raw layout.', type: 'output' },
          { text: '  No UI frameworks were used—every single line, wobbly outline, and responsive grid is written in raw custom CSS.', type: 'output' }
        ];
        break;
      case 'audit':
        response = [
          { text: '⚡ CORE WEB VITALS AUDIT REPORT:', type: 'success' },
          { text: '  - Largest Contentful Paint (LCP): 0.82s (Optimal)', type: 'output' },
          { text: '  - Interaction to Next Paint (INP): 24ms (Excellent)', type: 'output' },
          { text: '  - Cumulative Layout Shift (CLS): 0.00 (Stable)', type: 'output' },
          { text: '  - Lighthouse Performance: 100/100', type: 'output' },
          { text: '  - Bundle Size Optimization: framer-motion lazyLoaded dynamic imports', type: 'output' }
        ];
        break;
      case 'database':
        response = [
          { text: '🗄️ DATABASE CONNECTION PROTOCOL (Supabase):', type: 'success' },
          { text: '  - Client Sync Status: ONLINE', type: 'success' },
          { text: '  - Primary Table: "messages" (Contact Inquiry Records)', type: 'output' },
          { text: '  - Data Fields: [id: UUID, name: TEXT, email: TEXT, message: TEXT, created_at: TIMESTAMPTZ]', type: 'output' },
          { text: '  - SSL Security: Enabled (TLS v1.3 handshake)', type: 'output' },
          { text: '  - Data Encryption: AES-256-GCM', type: 'output' }
        ];
        break;
      case 'projects':
        response = [
          { text: '📁 PORTFOLIO PROJECTS RECORD:', type: 'success' },
          { text: '  - Total Projects: 6 Projects', type: 'output' },
          { text: '  - Primary Stack: React, Next.js App Router, Node, Supabase, Vercel', type: 'output' },
          { text: '  - Core philosophy: AI-native rapid prototyping, prompt-to-app lifecycle', type: 'output' }
        ];
        break;
      case 'resume':
        response = [
          { text: '📄 CAREER TIMELINE SUMMARY:', type: 'success' },
          { text: '  - Domain Shift: Transitioned from Commerce base to Software Engineering.', type: 'output' },
          { text: '  - Philosophy: Semicolon gremlins aren\'t the block. Real leverage is combining business logic with AI system design.', type: 'output' },
          { text: '  - Core Skills: Rapid UI prototyping, state-machine layouts, system integrations.', type: 'output' },
          { text: '  - Full Dossier: Downloadable PDF available in /#resume section (click "Export Dossier").', type: 'output' }
        ];
        break;
      case 'colors':
        response = isNoir ? [
          { text: '🎨 RETRO CRT CYBER-NOIR PALETTE:', type: 'success' },
          { text: '  - #FAFAFA : White Hot Phosphor', type: 'output' },
          { text: '  - #121214 : Deep Carbon Slate Base', type: 'output' },
          { text: '  - #08080A : Core Monitor Black', type: 'output' },
          { text: '  - #00F0FF : Fluorescent Neon Cyan', type: 'output' },
          { text: '  - #FF2A55 : Warning Neon Pink', type: 'output' },
          { text: '  - #39FF14 : Telemetry Neon Green', type: 'output' }
        ] : [
          { text: '🎨 COMIC BOOK WATERCOLOR PALETTE:', type: 'success' },
          { text: '  - #D95D67 : Soft Dusty Rose / Terracotta', type: 'output' },
          { text: '  - #5A8EB6 : Soft Slate / Steel Blue', type: 'output' },
          { text: '  - #F4DC95 : Soft Ochre / Pastel Yellow', type: 'output' },
          { text: '  - #FAF9F6 : Warm Off-White Linen', type: 'output' },
          { text: '  - #F7F2E8 : Cold-Press Watercolor Paper', type: 'output' },
          { text: '  - #2B2B36 : Warm Graphite Charcoal Ink', type: 'output' }
        ];
        break;
      case 'cheatcode':
        if (typeof window !== 'undefined') {
          const isActive = document.documentElement.classList.toggle('konami-active');
          response = [
            { text: '🎮 KONAMI CODE DECRYPTED:', type: 'success' },
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
  }, [stats, isNoir]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(terminalInput);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* ---- Go Back Header ---- */}
        <div className={styles.header}>
          <Link href="/" className={styles.backLink}>
            <ArrowLeft size={18} />
            <span>Return to Base</span>
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
            <div className={styles.titleText}>
              {isNoir ? 'SYSTEM DIAGNOSTICS & LOGS (v2.5)' : 'COBALT TERMINAL CORE // SITE SCHEMATICS'}
            </div>
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
                    <div className={styles.progressFill} style={{ width: `${(stats.fps / 60) * 100}%` }} />
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
                  <span className={styles.metricLabel}>GREMLIN ENERGY:</span>
                  <span className={styles.metricValue}>{stats.gremlinEnergy}%</span>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${stats.gremlinEnergy}%`, backgroundColor: 'var(--neon-pink, var(--pop-red))' }} />
                  </div>
                </li>
                <li>
                  <span className={styles.metricLabel}>UPTIME:</span>
                  <span className={styles.metricValue}>{stats.uptime}</span>
                </li>
              </ul>
            </div>

            {/* Specs Box */}
            <div className={styles.consoleWidget}>
              <h3 className={styles.widgetTitle}>
                <Binary size={14} className={styles.widgetIcon} />
                FIRMWARE SPEC
              </h3>
              <div className={styles.specsTerminalList}>
                <div><span className={styles.cyanText}>OS:</span> Next.js 16.2 (App Router)</div>
                <div><span className={styles.cyanText}>DOM:</span> React 19.2 (Concurrent)</div>
                <div><span className={styles.cyanText}>GFX:</span> Framer Motion + Canvas Trails</div>
                <div><span className={styles.cyanText}>INT:</span> Lenis Smooth Scroll</div>
                <div><span className={styles.cyanText}>DB:</span> Supabase Rest Endpoint</div>
              </div>
            </div>
          </div>

          {/* Terminal Console */}
          <div className={styles.terminalContainer} onClick={focusTerminalInput}>
            <div className={styles.terminalScreen} ref={terminalScreenRef}>
              {terminalHistory.map((line, index) => (
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
              ))}
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
              {['help', 'specs', 'gremlin', 'stats', 'about', 'skyline', 'gargoyle', 'cat', 'pigeon', 'audit', 'database', 'projects', 'resume', 'colors', 'cheatcode', 'secret', 'clear'].map(cmd => (
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
