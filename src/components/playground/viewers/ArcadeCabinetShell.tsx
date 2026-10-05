'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Play, Maximize2, Minimize2, Volume2, VolumeX, Tv } from 'lucide-react';
import { toggleAudio } from '@/lib/terminalAudio';
import type { InteractiveToyPlaygroundItem } from '@/data/playgroundItems';
import styles from './ArcadeCabinetShell.module.css';

interface ArcadeCabinetShellProps {
  item: InteractiveToyPlaygroundItem;
  children: React.ReactNode;
}

export default function ArcadeCabinetShell({ item, children }: ArcadeCabinetShellProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCrtActive, setIsCrtActive] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleToggleAudio = () => {
    const next = toggleAudio();
    setIsAudioEnabled(next);
  };

  return (
    <div className={styles.cabinetWrapper}>
      <div className={styles.cabinetFrame} ref={containerRef}>
        <div className={styles.cabinetHeader}>
          <div className={styles.headerLeft}>
            <Link href="/playground" className={styles.backBtn}>
              <ArrowLeft size={16} />
              <span>Back to Playground</span>
            </Link>
            <div className={styles.titleArea}>
              <h2 className={styles.gameTitle}>{item.title}</h2>
            </div>
          </div>

          <div className={styles.headerRight}>
            <button
              type="button"
              className={`${styles.toolBtn} ${isCrtActive ? styles.active : ''}`}
              onClick={() => setIsCrtActive(!isCrtActive)}
              title="Toggle CRT Scanline Effect"
            >
              <Tv size={14} />
              <span>CRT</span>
            </button>

            {item.soundSupported && (
              <button
                type="button"
                className={`${styles.toolBtn} ${isAudioEnabled ? styles.active : ''}`}
                onClick={handleToggleAudio}
                title="Toggle 8-bit Audio Synthesizer"
              >
                {isAudioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                <span>{isAudioEnabled ? 'Audio ON' : 'Muted'}</span>
              </button>
            )}

            <button
              type="button"
              className={styles.toolBtn}
              onClick={handleToggleFullscreen}
              title="Toggle Fullscreen Mode"
            >
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>

        <div className={styles.screenStage} data-lenis-prevent>
          {isCrtActive && <div className={styles.crtScanlines} />}

          {!isPlaying ? (
            <div className={styles.gatePoster}>
              <span className={styles.toolBtn} style={{ marginBottom: '12px' }}>
                {item.difficulty || 'ARCADE LAB'}
              </span>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '8px' }}>
                {item.title}
              </h1>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', lineHeight: 1.6, maxWidth: '500px' }}>
                {item.description}
              </p>
              <button
                type="button"
                className={styles.launchBtn}
                onClick={() => setIsPlaying(true)}
              >
                <Play size={18} />
                <span>Launch Arcade Game</span>
              </button>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {children}
            </div>
          )}
        </div>

        {item.controlsGuide && item.controlsGuide.length > 0 && (
          <div className={styles.controlsHud}>
            <div className={styles.controlsList}>
              {item.controlsGuide.map((ctrl, i) => (
                <div key={i} className={styles.controlItem}>
                  <span className={styles.controlKey}>{ctrl.key}</span>
                  <span>{ctrl.label}</span>
                </div>
              ))}
            </div>
            <div style={{ fontFamily: 'var(--font-jetbrains-mono, monospace)', fontSize: '0.8rem', color: 'var(--color-primary)' }}>
              ESC to Pause / Exit
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
