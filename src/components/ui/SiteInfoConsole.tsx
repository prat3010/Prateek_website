'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Gamepad2, BarChart3, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import TerminalSnakeGame from './TerminalSnakeGame';
import TerminalPathfinder from './TerminalPathfinder';
import Portal from '@/components/ui/Portal';
import MatrixRainOverlay from '@/components/effects/MatrixRainOverlay';
import styles from './SiteInfoConsole.module.css';
import type { ResumeData } from '@/data/resume';
import resumeFallback from '@/data/resume.json';
import { useSystemTelemetry } from './useSystemTelemetry';
import ConsoleTelemetryGrid from './ConsoleTelemetryGrid';
import ConsoleCompactStatusBar from './ConsoleCompactStatusBar';
import { useTerminalCommands, type ProjectSummary } from './useTerminalCommands';

const STORAGE_KEY_TELEMETRY_COLLAPSED = 'terminal_telemetry_collapsed';

const QUICK_SHORTCUTS = [
  'help',
  'pitch',
  'architecture',
  'tests',
  'war-stories',
  'interview',
  'twin',
  'playground',
  'scope help',
  'cart',
  'inspect',
  'stack',
  'pathfinder',
  'snake',
  'matrix',
  'sfx',
  'pizzarat',
  'projects',
  'partner',
  'system',
  'telemetry',
  'storage',
  'sync',
  'analytics',
  'git-info',
  'history',
  'whoami',
  'ls',
  'qrcode',
  'clear',
];

const AI_TWIN_SHORTCUTS = [
  'exit',
  'who are you?',
  'architecture',
  'tech stack',
  'rag engine',
  'pricing tiers',
  'clear',
];

export default function SiteInfoConsole() {
  const { isNoir } = useTheme();
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [profileData, setProfileData] = useState<ResumeData>(resumeFallback as unknown as ResumeData);
  const [activeGame, setActiveGame] = useState<'none' | 'snake' | 'pathfinder'>('none');
  const [isMatrixActive, setIsMatrixActive] = useState<boolean>(false);
  const [isTelemetryCollapsed, setIsTelemetryCollapsed] = useState<boolean>(false);

  const terminalScreenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isAtBottomRef = useRef<boolean>(true);

  // Monitor user scrolling to pause auto-scroll only if user explicitly scrolls up
  const handleScroll = useCallback(() => {
    const screen = terminalScreenRef.current;
    if (!screen) return;
    const distanceFromBottom = screen.scrollHeight - screen.scrollTop - screen.clientHeight;
    // Considered pinned to bottom if within 60px of the bottom edge
    isAtBottomRef.current = distanceFromBottom <= 60;
  }, []);

  // Restore persisted Focus Mode / Collapsed preference safely after mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TELEMETRY_COLLAPSED);
      if (saved === 'true') {
        const frameId = requestAnimationFrame(() => {
          setIsTelemetryCollapsed(true);
        });
        return () => cancelAnimationFrame(frameId);
      }
    } catch {}
  }, []);

  const toggleTelemetry = useCallback((forceState?: boolean) => {
    setIsTelemetryCollapsed((prev) => {
      const next = typeof forceState === 'boolean' ? forceState : !prev;
      try {
        localStorage.setItem(STORAGE_KEY_TELEMETRY_COLLAPSED, String(next));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => setProjects(data || []))
      .catch(() => {});

    fetch('/api/profile')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.intake) setProfileData(data);
      })
      .catch(() => {});
  }, []);

  const { stats, webVitals } = useSystemTelemetry(projects.length);

  const handleCommandExecuted = useCallback(() => {
    isAtBottomRef.current = true;
  }, []);

  const {
    terminalInput,
    setTerminalInput,
    terminalHistory,
    executeCommand,
    handleKeyDown,
    unlockAchievement,
    isAiChatActive,
  } = useTerminalCommands({
    projects,
    profileData,
    isNoir,
    stats,
    setActiveGame,
    isMatrixActive,
    setIsMatrixActive,
    isTelemetryCollapsed,
    toggleTelemetry,
    onCommandExecuted: handleCommandExecuted,
  });

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        isAtBottomRef.current = true;
      }
      handleKeyDown(e);
    },
    [handleKeyDown]
  );

  // Auto-scroll terminal screen to bottom whenever output updates and user is pinned to bottom
  useEffect(() => {
    const screen = terminalScreenRef.current;
    if (!screen) return;
    if (isAtBottomRef.current) {
      screen.scrollTop = screen.scrollHeight;
      const frameId = requestAnimationFrame(() => {
        if (screen && isAtBottomRef.current) {
          screen.scrollTop = screen.scrollHeight;
        }
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, [terminalHistory]);

  // Ensure prompt view stays in frame when expanding or collapsing focus mode
  useEffect(() => {
    const screen = terminalScreenRef.current;
    if (!screen) return;
    isAtBottomRef.current = true;
    screen.scrollTop = screen.scrollHeight;
    const timer = setTimeout(() => {
      if (screen) {
        screen.scrollTop = screen.scrollHeight;
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [isTelemetryCollapsed]);

  const focusTerminalInput = () => {
    if (typeof window !== 'undefined') {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) return;
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* ---- Go Back Header ---- */}
        <div className={styles.header}>
          <Link href="/" className={styles.backLink} prefetch={false}>
            <ArrowLeft size={16} />
            <span>Return to Base</span>
          </Link>
          <Link href="/playground" className={styles.backLink} prefetch={false}>
            <Gamepad2 size={16} />
            <span>The Playground</span>
          </Link>
          <Link href="/analytics" className={styles.backLink} prefetch={false}>
            <BarChart3 size={16} />
            <span>Visitor Analytics</span>
          </Link>
        </div>

        <div className={styles.consoleContainer}>
          {/* Title Bar */}
          <div className={styles.consoleTitleBar}>
            <div className={styles.titleBarLeft}>
              <div className={styles.indicators}>
                <button
                  type="button"
                  className={`${styles.dot} ${styles.red}`}
                  onClick={() => executeCommand('clear')}
                  title="Clear terminal (clear)"
                  aria-label="Clear terminal output"
                />
                <button
                  type="button"
                  className={`${styles.dot} ${styles.yellow}`}
                  onClick={() => executeCommand('help')}
                  title="Print command manual (help)"
                  aria-label="Print command manual"
                />
                <button
                  type="button"
                  className={`${styles.dot} ${styles.green} ${isAiChatActive ? styles.dotPulse : ''}`}
                  onClick={() => executeCommand(isAiChatActive ? 'exit' : 'twin')}
                  title={isAiChatActive ? 'Disconnect AI Twin (exit)' : 'Connect to Live AI Twin (twin)'}
                  aria-label={isAiChatActive ? 'Disconnect AI Twin' : 'Connect to Live AI Twin'}
                />
              </div>
              <h2 className={styles.titleText}>
                {isAiChatActive
                  ? 'PRATEEQ.AI TWIN CONSOLE // ACTIVE NEURAL LINK'
                  : isNoir
                    ? 'SYSTEM DIAGNOSTICS & LOGS (v2.5)'
                    : 'COBALT TERMINAL CORE // SITE SCHEMATICS'}
              </h2>
            </div>
            <div className={styles.titleBarActions}>
              <button
                type="button"
                className={`${styles.telemetryToggleBtn} ${isTelemetryCollapsed ? styles.telemetryToggleActive : ''}`}
                onClick={() => toggleTelemetry()}
                title={
                  isTelemetryCollapsed
                    ? 'Expand Telemetry Matrix (telemetry on)'
                    : 'Collapse Telemetry into Focus Mode (telemetry off)'
                }
                aria-label={
                  isTelemetryCollapsed
                    ? 'Expand Telemetry Matrix'
                    : 'Collapse Telemetry into Focus Mode'
                }
                aria-expanded={!isTelemetryCollapsed}
              >
                {isTelemetryCollapsed ? (
                  <>
                    <Maximize2 size={12} className={styles.toggleBtnIcon} aria-hidden="true" />
                    <span>SHOW TELEMETRY</span>
                  </>
                ) : (
                  <>
                    <Minimize2 size={12} className={styles.toggleBtnIcon} aria-hidden="true" />
                    <span>FOCUS MODE</span>
                  </>
                )}
              </button>
              {isAiChatActive && (
                <button
                  type="button"
                  className={styles.twinExitBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    executeCommand('exit');
                  }}
                  title="Disconnect AI Twin and return to standard shell"
                >
                  DISCONNECT [EXIT]
                </button>
              )}
            </div>
          </div>

          {/* Telemetry & Web Vitals Dashboard */}
          {isTelemetryCollapsed ? (
            <ConsoleCompactStatusBar
              stats={stats}
              webVitals={webVitals}
              onExpand={() => toggleTelemetry(false)}
            />
          ) : (
            <ConsoleTelemetryGrid stats={stats} webVitals={webVitals} />
          )}

          {/* Terminal Console */}
          <div
            className={`${styles.terminalContainer} ${isAiChatActive ? styles.terminalAiActive : ''} ${isTelemetryCollapsed ? styles.terminalFocusMode : ''}`}
            onClick={focusTerminalInput}
          >
            {activeGame === 'snake' ? (
              <TerminalSnakeGame
                onClose={() => setActiveGame('none')}
                onAchievementUnlocked={unlockAchievement}
              />
            ) : activeGame === 'pathfinder' ? (
              <TerminalPathfinder
                onClose={() => setActiveGame('none')}
                onAchievementUnlocked={unlockAchievement}
              />
            ) : (
              <>
                <div
                  className={styles.terminalScreen}
                  ref={terminalScreenRef}
                  onScroll={handleScroll}
                  data-lenis-prevent
                  role="log"
                  aria-live="polite"
                  aria-label="Terminal output stream"
                >
                  {terminalHistory.map((line, index) => {
                    if (line.type === 'image' && line.imageUrl) {
                      return (
                        <div key={index} className={styles.terminalImageContainer}>
                          <Image
                            src={line.imageUrl}
                            alt="Payment QR Code"
                            className={styles.terminalImage}
                            width={200}
                            height={200}
                            unoptimized
                          />
                        </div>
                      );
                    }
                    if (line.href) {
                      return (
                        <div key={index} className={`${styles.terminalLine} ${styles.link}`}>
                          <a
                            href={line.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.link}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {line.text}
                          </a>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={index}
                        className={`${styles.terminalLine} ${styles[line.type]} ${line.command ? styles.clickableLine : ''}`}
                        onClick={
                          line.command
                            ? (e) => {
                                e.stopPropagation();
                                executeCommand(line.command!);
                              }
                            : undefined
                        }
                      >
                        {line.text}
                      </div>
                    );
                  })}
                </div>
                <div className={styles.terminalPromptLine}>
                  <span
                    className={styles.promptSymbol}
                    style={isAiChatActive ? { color: 'var(--neon-cyan, #38bdf8)' } : undefined}
                    aria-hidden="true"
                  >
                    {isAiChatActive ? 'prateeq.ai:~$' : '>'}
                  </span>
                  <input
                    ref={inputRef}
                    type="text"
                    className={styles.terminalInput}
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={handleInputKeyDown}
                    placeholder={
                      isAiChatActive
                        ? "Ask Prateek's AI Twin anything... (or 'exit')"
                        : 'Type a command...'
                    }
                    aria-label={isAiChatActive ? 'AI Twin chat prompt' : 'Terminal command prompt'}
                    autoFocus
                  />
                </div>
              </>
            )}
          </div>

          {/* Command Shortcuts list for easy mobile use */}
          <div className={styles.shortcutsContainer}>
            <span className={styles.shortcutsLabel}>
              {isAiChatActive ? 'AI TWIN SHORTCUTS:' : 'QUICK SHORTCUTS:'}
            </span>
            <div className={styles.shortcutsGrid}>
              {(isAiChatActive ? AI_TWIN_SHORTCUTS : QUICK_SHORTCUTS).map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => executeCommand(cmd)}
                  className={`${styles.shortcutBtn} ${isAiChatActive && cmd === 'exit' ? styles.shortcutBtnExit : ''}`}
                  type="button"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      {isMatrixActive && (
        <Portal>
          <MatrixRainOverlay onClose={() => setIsMatrixActive(false)} />
        </Portal>
      )}
    </div>
  );
}
