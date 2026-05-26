'use client';

import { useEffect, useRef, useCallback } from 'react';
import styles from './CursorTrail.module.css';

const POP_COLORS = ['#FF1744', '#2979FF', '#FFEA00', '#FF4081', '#00E676', '#FF9100'];
const TRAIL_LENGTH = 18;
const BASE_DOT_RADIUS = 8;

interface TrailDot {
  x: number;
  y: number;
  age: number;
  colorIndex: number;
}

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<TrailDot[]>([]);
  const mouseRef = useRef({ x: -100, y: -100 });
  const frameRef = useRef<number>(0);
  const colorIndexRef = useRef(0);
  const isTouchDevice = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const trail = trailRef.current;
    const { x, y } = mouseRef.current;

    // Add new dot at current mouse position
    if (x > 0 && y > 0) {
      trail.unshift({
        x,
        y,
        age: 0,
        colorIndex: colorIndexRef.current,
      });
      colorIndexRef.current = (colorIndexRef.current + 1) % POP_COLORS.length;
    }

    // Trim trail to max length
    while (trail.length > TRAIL_LENGTH) {
      trail.pop();
    }

    // Age and draw each dot
    for (let i = trail.length - 1; i >= 0; i--) {
      const dot = trail[i];
      dot.age++;

      const progress = i / TRAIL_LENGTH; // 0 = newest, 1 = oldest
      const radius = BASE_DOT_RADIUS * (1 - progress * 0.7);
      const opacity = 1 - progress * 0.85;

      if (opacity <= 0 || radius <= 0) continue;

      ctx.beginPath();
      ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = POP_COLORS[dot.colorIndex];
      ctx.globalAlpha = opacity;
      ctx.fill();

      // Add a small black outline for the comic-book feel
      ctx.strokeStyle = '#1A1A2E';
      ctx.lineWidth = 1;
      ctx.globalAlpha = opacity * 0.6;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    frameRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    // Don't enable on touch/coarse-pointer devices
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      isTouchDevice.current = true;
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -100, y: -100 };
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(frameRef.current);
    };
  }, [draw]);

  // Don't render canvas on touch devices
  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
