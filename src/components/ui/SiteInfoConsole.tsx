'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
import { useTerminalCommands, type ProjectSummary } from './useTerminalCommands';

const QUICK_SHORTCUTS = [
  'help',
  'playground',
  'twin',
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
  'storage',
  'sync',
  'analytics',
  'git-info',
  'qrcode',
  'clear',
];

const AI_TWIN_SHORTCUTS = [
  'exit',
  'is he good?',
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

  const terminalScreenRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  });

  // Auto-scroll terminal screen to bottom
  useEffect(() => {
    if (terminalScreenRef.current && typeof terminalScreenRef.current.scrollTo === 'function') {
      terminalScreenRef.current.scrollTo({
        top: terminalScreenRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [terminalHistory]);

  const focusTerminalInput = () => {
    if (inputRef.current) {
      inputRef.current.focus();
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
          <Link href="/playground" className={styles.backLink}>
            <span>The Playground</span>
          </Link>
          <Link href="/analytics" className={styles.backLink}>
            <span>Visitor Analytics</span>
          </Link>
        </div>

        <div className={styles.consoleContainer}>
          {/* Title Bar */}
          <div className={styles.consoleTitleBar}>
            <div className={styles.indicators}>
              <span className={`${styles.dot} ${styles.red}`} />
              <span className={`${styles.dot} ${styles.yellow}`} />
              <span className={`${styles.dot} ${styles.green} ${isAiChatActive ? styles.dotPulse : ''}`} />
            </div>
            <h2 className={styles.titleText}>
              {isAiChatActive
                ? 'PRATEEQ.AI TWIN CONSOLE // ACTIVE NEURAL LINK'
                : isNoir
                  ? 'SYSTEM DIAGNOSTICS & LOGS (v2.5)'
                  : 'COBALT TERMINAL CORE // SITE SCHEMATICS'}
            </h2>
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

          {/* Telemetry & Web Vitals Dashboard */}
          <ConsoleTelemetryGrid stats={stats} webVitals={webVitals} />

          {/* Terminal Console */}
          <div className={`${styles.terminalContainer} ${isAiChatActive ? styles.terminalAiActive : ''}`} onClick={focusTerminalInput}>
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
                  data-lenis-prevent
                  role="log"
                  aria-live="polite"
                  aria-label="Terminal output stream"
                >
                  {terminalHistory.map((line, index) => {
                    if (line.type === 'twin-card') {
                      return (
                        <div key={index} className={styles.twinCard}>
                          <div className={styles.twinCardHeader}>
                            <div className={styles.twinCardBadge}>
                              <span className={styles.twinLiveDot} />
                              <span>PRATEEQ.AI // DIGITAL TWIN v2.5</span>
                            </div>
                            <span className={styles.twinHostTag}>ORACLE VPS · 130.210.35.134</span>
                          </div>

                          <div className={styles.twinMatrixGrid}>
                            <div className={styles.twinMatrixItem}>
                              <span className={styles.twinMatrixKey}>[✓] SARCASM &amp; WIT</span>
                              <span className={styles.twinMatrixVal}>ACTIVE (8.5/10)</span>
                            </div>
                            <div className={styles.twinMatrixItem}>
                              <span className={styles.twinMatrixKey}>[✓] LANGCHAIN BLOAT</span>
                              <span className={styles.twinMatrixVal}>0% DETECTED</span>
                            </div>
                            <div className={styles.twinMatrixItem}>
                              <span className={styles.twinMatrixKey}>[✓] COGNITIVE MEMORY</span>
                              <span className={styles.twinMatrixVal}>24 ARCH DOSSIERS</span>
                            </div>
                            <div className={styles.twinMatrixItem}>
                              <span className={styles.twinMatrixKey}>[✓] VECTOR ENGINE</span>
                              <span className={styles.twinMatrixVal}>HNSW + BM25 HYBRID</span>
                            </div>
                          </div>

                          <div className={styles.twinGreeting}>
                            Hey! I am Prateek&apos;s digital clone. I know his code, architecture, philosophy, and his deep hatred of bloated AI wrappers. Ask me anything about his work, stack, or pricing—or type <code className={styles.exitCode}>exit</code> to leave.
                          </div>
                        </div>
                      );
                    }
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
                    onKeyDown={handleKeyDown}
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
