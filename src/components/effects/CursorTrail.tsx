'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import styles from './CursorTrail.module.css';

const POP_COLORS = ['#FF1744', '#2979FF', '#FFEA00', '#FF4081', '#00E676', '#FF9100'];
const NOIR_COLORS = ['#FAFAFA', '#E0E0E3', '#C0C0C4', '#8A8A93', '#4A4A50', '#27272A'];
const TRAIL_LENGTH = 18;
const BASE_DOT_RADIUS = 8;

interface TrailDot {
  x: number;
  y: number;
  age: number;
  colorIndex: number;
  shape: 'circle' | 'star' | 'crosshair';
  angle: number;
  angleSpeed: number;
}

export default function CursorTrail() {
  const { isNoir } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<TrailDot[]>([]);
  const mouseRef = useRef({ x: -100, y: -100 });
  const frameRef = useRef<number>(0);
  const colorIndexRef = useRef(0);
  const isTouchDevice = useRef(false);

  const colors = isNoir ? NOIR_COLORS : POP_COLORS;

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
        shape: isNoir ? 'crosshair' : 'circle',
        angle: Math.random() * Math.PI * 2,
        angleSpeed: (Math.random() - 0.5) * 0.05,
      });
      colorIndexRef.current = (colorIndexRef.current + 1) % colors.length;
    }

    // Trim trail to max length
    while (trail.length > TRAIL_LENGTH) {
      trail.pop();
    }

    // Age and draw each dot
    for (let i = trail.length - 1; i >= 0; i--) {
      const dot = trail[i];
      dot.age++;
      dot.angle += dot.angleSpeed;

      const progress = i / TRAIL_LENGTH; // 0 = newest, 1 = oldest
      const radius = BASE_DOT_RADIUS * (1 - progress * 0.7);
      const opacity = 1 - progress * 0.85;

      if (opacity <= 0 || radius <= 0) continue;

      if (dot.shape === 'star') {
        ctx.save();
        ctx.translate(dot.x, dot.y);
        ctx.rotate(dot.angle);

        ctx.beginPath();
        const spikes = 4;
        const outerRadius = radius * 1.35;
        const innerRadius = radius * 0.45;
        let rot = (Math.PI / 2) * 3;
        let step = Math.PI / spikes;

        ctx.moveTo(0, -outerRadius);
        for (let j = 0; j < spikes; j++) {
          let sx = Math.cos(rot) * outerRadius;
          let sy = Math.sin(rot) * outerRadius;
          ctx.lineTo(sx, sy);
          rot += step;

          sx = Math.cos(rot) * innerRadius;
          sy = Math.sin(rot) * innerRadius;
          ctx.lineTo(sx, sy);
          rot += step;
        }
        ctx.lineTo(0, -outerRadius);
        ctx.closePath();

        ctx.fillStyle = colors[dot.colorIndex % colors.length];
        ctx.globalAlpha = opacity;
        ctx.fill();

        ctx.strokeStyle = '#1A1A2E';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = opacity * 0.8;
        ctx.stroke();

        ctx.restore();
      } else if (dot.shape === 'crosshair') {
        ctx.save();
        ctx.translate(dot.x, dot.y);
        ctx.rotate(dot.angle);

        ctx.beginPath();
        // Inner reticle circle
        ctx.arc(0, 0, radius * 0.45, 0, Math.PI * 2);
        // Horizontal scope reticle
        ctx.moveTo(-radius * 1.2, 0);
        ctx.lineTo(radius * 1.2, 0);
        // Vertical scope reticle
        ctx.moveTo(0, -radius * 1.2);
        ctx.lineTo(0, radius * 1.2);

        ctx.strokeStyle = colors[dot.colorIndex % colors.length];
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = opacity;
        ctx.stroke();

        ctx.restore();
      } else {
        // Circle
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = colors[dot.colorIndex % colors.length];
        ctx.globalAlpha = opacity;
        ctx.fill();

        // Add a small black outline for the comic-book feel
        ctx.strokeStyle = '#1A1A2E';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = opacity * 0.8;
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1;

    frameRef.current = requestAnimationFrame(draw);
  }, [isNoir, colors]);

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
