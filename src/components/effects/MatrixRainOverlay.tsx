'use client';

import React, { useEffect, useRef } from 'react';
import styles from './MatrixRainOverlay.module.css';

interface MatrixRainOverlayProps {
  onClose?: () => void;
}

const CHARS = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789@#$%&*<>';

export default function MatrixRainOverlay({ onClose }: MatrixRainOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const fontSize = 16;
    let columns = Math.floor(width / fontSize);
    let drops: number[] = Array(columns).fill(1).map(() => Math.floor(Math.random() * -50));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const newColumns = Math.floor(width / fontSize);
      const newDrops: number[] = [];
      for (let i = 0; i < newColumns; i++) {
        newDrops[i] = drops[i] !== undefined ? drops[i] : Math.floor(Math.random() * -50);
      }
      columns = newColumns;
      drops = newDrops;
    };

    window.addEventListener('resize', handleResize);

    const draw = () => {
      // Fading background for matrix trailing effect
      ctx.fillStyle = 'rgba(2, 10, 4, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Glowing white/cyan head character, green trail
        if (Math.random() > 0.85) {
          ctx.fillStyle = '#ccffdd';
          ctx.shadowColor = '#00ff66';
          ctx.shadowBlur = 8;
        } else {
          ctx.fillStyle = '#00ff66';
          ctx.shadowBlur = 0;
        }

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className={styles.matrixContainer}>
      <canvas ref={canvasRef} className={styles.matrixCanvas} />
      {onClose && (
        <button
          className={styles.closeBadge}
          onClick={onClose}
          aria-label="Disengage Matrix Rain Overlay"
        >
          [ DISENGAGE MATRIX RAIN ]
        </button>
      )}
    </div>
  );
}
