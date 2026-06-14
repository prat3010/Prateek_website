'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import ComicPanel from '@/components/ui/ComicPanel';
import {
  Cpu,
  Layers,
  ShieldCheck,
  Binary,
  Sparkles,
  ArrowLeft,
  Settings,
  Flame,
  MousePointerClick
} from 'lucide-react';
import styles from './SiteInfoConsole.module.css';

// Command responses for Noir Interactive Console
interface ConsoleLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success';
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
  
  // Simulated stats state
  const [stats, setStats] = useState({
    cpuLoad: 1.2,
    memoryUsed: 142,
    gremlinEnergy: 98,
    uptime: '00:00:00'
  });

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll terminal to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory]);

  // Focus input on click of terminal area
  const focusTerminalInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Uptime and load simulation
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      // Format uptime
      const diff = Date.now() - startTime;
      const hours = String(Math.floor(diff / 3600000)).padStart(2, '0');
      const mins = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0');
      const secs = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
      
      // Muted load fluctuations
      setStats(prev => ({
        cpuLoad: Number((0.8 + Math.random() * 0.9).toFixed(1)),
        memoryUsed: prev.memoryUsed + (Math.random() > 0.85 ? (Math.random() > 0.5 ? 1 : -1) : 0),
        gremlinEnergy: Math.max(90, Math.min(100, prev.gremlinEnergy + (Math.random() > 0.9 ? (Math.random() > 0.5 ? 1 : -1) : 0))),
        uptime: `${hours}:${mins}:${secs}`
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const executeCommand = useCallback((cmd: string) => {
    const trimmedCmd = cmd.trim().toLowerCase();
    if (!trimmedCmd) return;

    // Add input command to history
    setTerminalHistory(prev => [...prev, { text: `> ${cmd}`, type: 'input' }]);

    let response: ConsoleLine[] = [];

    switch (trimmedCmd) {
      case 'help':
        response = [
          { text: 'Available commands:', type: 'success' },
          { text: '  specs      - Print website core technologies & stack', type: 'output' },
          { text: '  gremlin    - Inspect the embedded Gremlin mascot status', type: 'output' },
          { text: '  stats      - Display live physical footprint data', type: 'output' },
          { text: '  about      - Reveal website backstory & design decisions', type: 'output' },
          { text: '  clear      - Clear the command interface screen', type: 'output' },
          { text: '  secret     - Run system override key', type: 'output' }
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
          { text: `  - Energy Level: ${stats.gremlinEnergy}% (Thriving on console logs)`, type: 'output' }
        ];
        break;
      case 'stats':
        response = [
          { text: '📊 FOOTPRINT DIAGNOSTICS:', type: 'success' },
          { text: `  - CPU Usage: ${stats.cpuLoad}% (Optimized wobbly loops)`, type: 'output' },
          { text: `  - Client Bundle Size: ${stats.memoryUsed} KB`, type: 'output' },
          { text: `  - Active Listeners: Throttled mouse & scroll events`, type: 'output' },
          { text: `  - System Uptime: ${stats.uptime}`, type: 'output' }
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
      case 'secret':
        response = [
          { text: '🔑 NOIR OVERRIDE KEY TRIGGERED:', type: 'success' },
          { text: '  "We don\'t build code to show off. We build code because we can\'t stop creating." ', type: 'success' },
          { text: '  System status: Fully loaded. You have unlocked developer respects. 👾', type: 'success' }
        ];
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
  }, [stats]);

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

        {isNoir ? (
          /* ========================================================== */
          /* NOIR VIEW: Terminal Diagnostic Dashboard                    */
          /* ========================================================== */
          <div className={styles.noirConsole}>
            {/* Title Bar */}
            <div className={styles.consoleTitleBar}>
              <div className={styles.indicators}>
                <span className={`${styles.dot} ${styles.red}`} />
                <span className={`${styles.dot} ${styles.yellow}`} />
                <span className={`${styles.dot} ${styles.green}`} />
              </div>
              <div className={styles.titleText}>SYSTEM DIAGNOSTICS & LOGS (v2.5)</div>
            </div>

            {/* Dashboard widgets Grid */}
            <div className={styles.noirGrid}>
              
              {/* Stats Widget */}
              <div className={styles.noirWidget}>
                <h3 className={styles.widgetTitle}>
                  <Cpu size={14} className={styles.widgetIcon} />
                  TELEMETRY MATRIX
                </h3>
                <ul className={styles.metricsList}>
                  <li>
                    <span className={styles.metricLabel}>CPU THREAD:</span>
                    <span className={styles.metricValue}>{stats.cpuLoad}%</span>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${stats.cpuLoad * 10}%` }} />
                    </div>
                  </li>
                  <li>
                    <span className={styles.metricLabel}>BUNDLE WEIGHT:</span>
                    <span className={styles.metricValue}>{stats.memoryUsed} KB</span>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: '30%', backgroundColor: 'var(--neon-cyan)' }} />
                    </div>
                  </li>
                  <li>
                    <span className={styles.metricLabel}>GREMLIN ENERGY:</span>
                    <span className={styles.metricValue}>{stats.gremlinEnergy}%</span>
                    <div className={styles.progressBar}>
                      <div className={styles.progressFill} style={{ width: `${stats.gremlinEnergy}%`, backgroundColor: 'var(--neon-pink)' }} />
                    </div>
                  </li>
                  <li>
                    <span className={styles.metricLabel}>UPTIME:</span>
                    <span className={styles.metricValue}>{stats.uptime}</span>
                  </li>
                </ul>
              </div>

              {/* Specs Box */}
              <div className={styles.noirWidget}>
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
              <div className={styles.terminalScreen}>
                {terminalHistory.map((line, index) => (
                  <div key={index} className={`${styles.terminalLine} ${styles[line.type]}`}>
                    {line.text}
                  </div>
                ))}
                <div ref={terminalEndRef} />
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
                {['help', 'specs', 'gremlin', 'stats', 'about', 'secret', 'clear'].map(cmd => (
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
        ) : (
          /* ========================================================== */
          /* AZURE VIEW: Comic Blueprint Dossier                        */
          /* ========================================================== */
          <div className={styles.comicDossier}>
            <div className={styles.comicTitlePanel}>
              <h1 className={styles.comicTitle}>TECHNICAL SCHEMATICS</h1>
              <p className={styles.comicSubtitle}>Dossier No. 404 // Website Blueprints & Lore</p>
            </div>

            <div className={styles.comicGrid}>
              
              {/* Comic Panel 1: Tech Specs */}
              <ComicPanel className={styles.comicCard} tilt={-1}>
                <h3 className={styles.cardHeader}>
                  <Layers size={18} className={styles.headerIcon} />
                  SCHEMATIC A-1: THE SITE ENGINE
                </h3>
                <p className={styles.cardDesc}>
                  Every engine runs on fuel, but this website runs on pure modern frameworks combined with highly optimized assets:
                </p>
                <ul className={styles.techList}>
                  <li>
                    <strong>Next.js 16 (App Router):</strong> Leverages server-side renders, static routes, and streaming metadata.
                  </li>
                  <li>
                    <strong>React 19:</strong> Fully compatible with Next.js App Router for concurrent state rendering.
                  </li>
                  <li>
                    <strong>Vanilla CSS Modules:</strong> 100% bespoke CSS layout styles. Zero heavy Tailwind builds. Hand-sketched design tokens are stored as local variables.
                  </li>
                </ul>
              </ComicPanel>

              {/* Comic Panel 2: Interactive Features */}
              <ComicPanel className={styles.comicCard} tilt={1}>
                <h3 className={styles.cardHeader}>
                  <Settings size={18} className={styles.headerIcon} />
                  SCHEMATIC A-2: PHYSICS & KINETICS
                </h3>
                <p className={styles.cardDesc}>
                  Interactive, responsive motion is built natively to deliver maximum engagement:
                </p>
                <ul className={styles.techList}>
                  <li>
                    <strong>Lenis Scroll:</strong> Configured with optimized friction constants to achieve a lag-free smooth viewport experience.
                  </li>
                  <li>
                    <strong>Framer Motion:</strong> Implements lazy-loaded features (`LazyMotion`) to restrict dynamic animation bundles to only when sections trigger reveals.
                  </li>
                  <li>
                    <strong>Cursor Trails:</strong> Utilizes custom HTML5 Canvas rendering to calculate drag vectors, ensuring lightweight CPU performance.
                  </li>
                </ul>
              </ComicPanel>

              {/* Comic Panel 3: Gremlin Anatomy */}
              <ComicPanel className={styles.comicCard} tilt={-1}>
                <h3 className={styles.cardHeader}>
                  <Sparkles size={18} className={styles.headerIcon} />
                  SCHEMATIC A-3: ANATOMY OF THE GREMLIN
                </h3>
                <div className={styles.gremlinLayout}>
                  <div className={styles.gremlinDrawing}>
                    {/* Simplified SVG Gremlin Blueprint */}
                    <svg viewBox="0 0 100 100" width="80" height="80" className={styles.blueprintSvg}>
                      <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3,3" />
                      <circle cx="40" cy="45" r="5" fill="currentColor" />
                      <circle cx="60" cy="45" r="5" fill="currentColor" />
                      <path d="M 35,65 Q 50,75 65,65" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M 30,35 L 10,25 Q 22,40 34,42" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M 70,35 L 90,25 Q 78,40 66,42" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="50" cy="50" r="45" fill="none" stroke="var(--pop-red)" strokeWidth="1" />
                    </svg>
                    <span className={styles.blueprintLabel}>Masot: Semicolon Gremlin</span>
                  </div>
                  <div className={styles.gremlinDetails}>
                    <p>
                      The mascot nested in the logo is an interactive SVG gremlin representing the coder&apos;s alter-ego.
                    </p>
                    <p>
                      When you hover over the logo, the gremlin&apos;s cheeks blush, the terminal cursor updates, and the ears pivot dynamically.
                    </p>
                  </div>
                </div>
              </ComicPanel>

              {/* Comic Panel 4: Resource Efficiency */}
              <ComicPanel className={styles.comicCard} tilt={0.5}>
                <h3 className={styles.cardHeader}>
                  <ShieldCheck size={18} className={styles.headerIcon} />
                  SCHEMATIC A-4: LAPTOP DE-HEATING
                </h3>
                <p className={styles.cardDesc}>
                  Heavy websites can drain batteries and warm up laptops. This portfolio is engineered to keep systems cool:
                </p>
                <div className={styles.thermalStats}>
                  <div className={styles.thermalMetric}>
                    <Flame className={styles.fireIcon} />
                    <span>Throttled Canvas Frames</span>
                  </div>
                  <div className={styles.thermalMetric}>
                    <MousePointerClick className={styles.clickIcon} />
                    <span>Passive Event Observers</span>
                  </div>
                </div>
                <p className={styles.cardFooterText}>
                  Scroll tracking and wobbly line states operate using passive scroll listeners, ensuring recalculations occur only when redraws are requested. No laptops were harmed in the making of this site.
                </p>
              </ComicPanel>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
