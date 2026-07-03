'use client';

import {
  useRef,
  useEffect,
  useCallback,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { useTheme } from '@/context/ThemeContext';

const POP_COLORS = ['#FF1744', '#2979FF', '#FFEA00', '#FF4081', '#00E676', '#FF9100'];
const NOIR_COLORS = ['#FAFAFA', '#E0E0E3', '#C0C0C4', '#8A8A93', '#4A4A50', '#27272A'];
const PARTICLE_COUNT = 60;
const GRAVITY = 0.35;
const DURATION_MS = 2200;

type ParticleShape = 'star' | 'circle' | 'exclamation';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  shape: ParticleShape;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  life: number;
  maxLife: number;
}

export interface ConfettiBurstHandle {
  triggerConfetti: (originX?: number, originY?: number) => void;
}

export interface ConfettiBurstProps {
  autoTrigger?: boolean;
}

const ConfettiBurst = forwardRef<ConfettiBurstHandle, ConfettiBurstProps>(function ConfettiBurst({ autoTrigger = false }, ref) {
  const { isNoir } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const isActiveRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);
  }, []);

  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    rotation: number
  ) => {
    const spikes = 5;
    const outerRadius = size;
    const innerRadius = size * 0.4;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / spikes) * i + rotation;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };

  const drawExclamation = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    size: number,
    rotation: number
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    // Body of "!"
    ctx.fillRect(-size * 0.2, -size, size * 0.4, size * 1.3);
    ctx.strokeRect(-size * 0.2, -size, size * 0.4, size * 1.3);
    // Dot of "!"
    ctx.beginPath();
    ctx.arc(0, size * 0.7, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    let aliveCount = 0;

    for (const p of particles) {
      p.life++;
      if (p.life >= p.maxLife) continue;

      aliveCount++;

      // Physics
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      // Fade out in the last 30% of life
      const lifeProgress = p.life / p.maxLife;
      p.opacity = lifeProgress > 0.7 ? 1 - (lifeProgress - 0.7) / 0.3 : 1;

      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = isNoir ? '#000000' : '#1A1A2E';
      ctx.lineWidth = 1;

      switch (p.shape) {
        case 'star':
          drawStar(ctx, p.x, p.y, p.size, p.rotation);
          break;
        case 'circle':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          break;
        case 'exclamation':
          drawExclamation(ctx, p.x, p.y, p.size, p.rotation);
          break;
      }
    }

    ctx.globalAlpha = 1;

    if (aliveCount > 0) {
      frameRef.current = requestAnimationFrame(draw);
    } else {
      isActiveRef.current = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [isNoir]);

  const triggerConfetti = useCallback(
    (originX?: number, originY?: number) => {
      const cx = originX ?? window.innerWidth / 2;
      const cy = originY ?? window.innerHeight / 2;

      resizeCanvas();

      const colors = isNoir ? NOIR_COLORS : POP_COLORS;
      const shapes: ParticleShape[] = ['star', 'circle', 'exclamation'];
      const particles: Particle[] = [];

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.5;
        const speed = 4 + Math.random() * 8;

        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4 - Math.random() * 4, // bias upward
          size: 4 + Math.random() * 8,
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.15,
          opacity: 1,
          life: 0,
          maxLife: 60 + Math.floor(Math.random() * 60), // 1-2 seconds at 60fps
        });
      }

      particlesRef.current = particles;

      if (!isActiveRef.current) {
        isActiveRef.current = true;
        frameRef.current = requestAnimationFrame(draw);
      }

      // Safety cleanup after duration
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        isActiveRef.current = false;
        cancelAnimationFrame(frameRef.current);
        particlesRef.current = [];
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }, DURATION_MS);
    },
    [isNoir, draw, resizeCanvas]
  );

  useImperativeHandle(ref, () => ({ triggerConfetti }), [triggerConfetti]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    if (autoTrigger) {
      triggerConfetti(window.innerWidth / 2, window.innerHeight * 0.7);
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false;
        cancelAnimationFrame(frameRef.current);
        particlesRef.current = [];
        if (timerRef.current) clearTimeout(timerRef.current);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(frameRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resizeCanvas, autoTrigger, triggerConfetti]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    />
  );
});

export default ConfettiBurst;
