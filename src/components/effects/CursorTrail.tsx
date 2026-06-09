'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useLenisScroll } from '@/context/LenisProvider';
import styles from './CursorTrail.module.css';

const POP_COLORS = ['#D95D67', '#5A8EB6', '#F4DC95', '#DF8B98', '#79B48B', '#E28E66'];
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

interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  maxSize: number;
  opacity: number;
  lifetime: number;
  maxLifetime: number;
}

const drawCigarette = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, fade: number = 1.0) => {
  const L = 35;
  const W = 6;
  
  const activeL = L * fade;
  if (activeL <= 0) return;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  // 1. Filter (orange/brown)
  const filterLength = L * 0.35;
  const drawFilterLength = Math.min(filterLength, activeL);
  ctx.fillStyle = '#C88A3B'; // Amber filter color
  ctx.fillRect(0, -W / 2, drawFilterLength, W);
  
  // Filter band (darker wrapping line)
  if (activeL >= filterLength) {
    ctx.fillStyle = '#9C611E';
    ctx.fillRect(filterLength - 1.5, -W / 2, 1.5, W);
  }
  
  // 2. White Paper Body
  if (activeL > filterLength) {
    ctx.fillStyle = '#F4F4F6';
    ctx.fillRect(filterLength, -W / 2, activeL - filterLength, W);
    
    // Paper texture lines (very subtle grey)
    ctx.strokeStyle = '#D1D1D6';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(filterLength, -W / 4);
    ctx.lineTo(activeL - 3, -W / 4);
    ctx.moveTo(filterLength, W / 4);
    ctx.lineTo(activeL - 3, W / 4);
    ctx.stroke();
  }

  // 3. Ash Tip (textured grey/black/white) at the active tip
  const ashLength = Math.min(3, activeL);
  const ashStart = activeL - ashLength;
  
  if (ashLength > 0) {
    // Dark grey base ash
    ctx.fillStyle = '#4A4A4F';
    ctx.fillRect(ashStart, -W / 2, ashLength, W);
    
    // Speckled light ash on the very tip
    ctx.fillStyle = '#C2C2C9';
    ctx.fillRect(activeL - Math.min(1.5, ashLength), -W / 3, Math.min(1.5, ashLength), W * 2 / 3);
  }
  
  // 4. Glowing Ember (lit tip) at the active tip
  if (ashLength > 0) {
    ctx.save();
    ctx.shadowColor = '#FF3C00';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#FF5500';
    ctx.beginPath();
    ctx.arc(ashStart, 0, W / 2, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    
    // Inner white-hot core
    ctx.shadowColor = '#FFFFCC';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#FFFFE0';
    ctx.beginPath();
    ctx.arc(ashStart, 0, W / 3, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.restore();
  }
  
  // 5. Outline of the remaining cigarette
  ctx.strokeStyle = '#18181B';
  ctx.lineWidth = 1.0;
  ctx.strokeRect(0, -W / 2, activeL, W);
  
  ctx.restore();
};

export default function CursorTrail() {
  const { isNoir } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trailRef = useRef<TrailDot[]>([]);
  const smokeRef = useRef<SmokeParticle[]>([]);
  const { velocity: scrollVelocity } = useLenisScroll();
  const velocityRef = useRef(0);
  useEffect(() => {
    const unsub = scrollVelocity.on('change', (v) => {
      velocityRef.current = v;
    });
    return unsub;
  }, [scrollVelocity]);

  const cigStateRef = useRef({
    x: -100,
    y: -100,
    angle: Math.PI / 4,
    initialized: false,
  });
  const mouseRef = useRef({ x: -100, y: -100 });
  const lastMouseMoveTimeRef = useRef<number>(Date.now());
  const frameRef = useRef<number>(0);
  const colorIndexRef = useRef(0);
  const isTouchDevice = useRef(false);
  const isLoopActiveRef = useRef(false);

  const colors = isNoir ? NOIR_COLORS : POP_COLORS;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { x, y } = mouseRef.current;
    const isMouseActive = x > 0 && y > 0;
    const idleDuration = Date.now() - lastMouseMoveTimeRef.current;

    if (isNoir) {
      // Clear normal trail
      trailRef.current = [];

      const cig = cigStateRef.current;
      const fade = Math.max(0, 1 - Math.max(0, idleDuration - 5000) / 1000);

      if (isMouseActive && fade > 0) {
        if (!cig.initialized) {
          cig.x = x;
          cig.y = y;
          cig.initialized = true;
        } else {
          // Cigarette lags/trails behind mouse cursor
          cig.x += (x - cig.x) * 0.25;
          cig.y += (y - cig.y) * 0.25;
        }

        // Calculate direction cigarette points
        // Cigarette points away from movement direction (i.e. towards mouse-to-cigarette vector)
        const dx = x - cig.x;
        const dy = y - cig.y;
        const dist = Math.hypot(dx, dy);

        let targetAngle = cig.angle;
        if (dist > 1.5) {
          targetAngle = Math.atan2(-dy, -dx);
        } else {
          // Idle floating micro-animation
          targetAngle = cig.angle + Math.sin(Date.now() * 0.003) * 0.001;
        }

        // Normalize angle difference to [-PI, PI] to avoid spinning glitch
        let angleDiff = targetAngle - cig.angle;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        cig.angle += angleDiff * 0.15;

        // Spawn smoke particles from the burning tip (ember) of the cigarette
        const L = 35;
        const activeL = L * fade;
        const ashLength = 3;
        const tipX = cig.x + Math.cos(cig.angle) * (activeL - ashLength);
        const tipY = cig.y + Math.sin(cig.angle) * (activeL - ashLength);

        // Spawn smoke puffs (scaling spawn probability as cigarette fades out)
        if (Math.random() < 0.5 * fade) {
          smokeRef.current.push({
            x: tipX,
            y: tipY,
            // Small wind drift opposite to cigarette's direction of movement
            vx: (Math.random() - 0.5) * 0.35 - Math.cos(cig.angle) * 0.15,
            // Smoke rises upwards
            vy: -Math.random() * 0.8 - 0.4,
            size: Math.random() * 1.5 + 1.5,
            maxSize: Math.random() * 12 + 10,
            opacity: Math.random() * 0.15 + 0.35,
            lifetime: 0,
            maxLifetime: Math.random() * 35 + 40,
          });
        }
      } else {
        cig.initialized = false;
      }

      // Update and draw smoke particles
      const smoke = smokeRef.current;
      
      // Prevent unbounded growth of particle system
      while (smoke.length > 80) {
        smoke.shift();
      }

      for (let i = smoke.length - 1; i >= 0; i--) {
        const p = smoke[i];
        p.lifetime++;
        
        // Physics update
        p.x += p.vx;
        p.y += p.vy;
        p.vy += velocityRef.current * 0.003;
        
        // Add smooth wave sway as it rises
        p.vx += Math.sin(p.lifetime * 0.07) * 0.015;

        // Smoke particles expand as they rise
        p.size = p.size + (p.maxSize - p.size) * 0.04;
        
        // Smoke particles fade out over lifetime
        const lifeRatio = p.lifetime / p.maxLifetime;
        p.opacity = (1 - lifeRatio) * 0.35;

        if (p.lifetime >= p.maxLifetime) {
          smoke.splice(i, 1);
          continue;
        }

        // Draw soft smoke cloud
        ctx.save();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        // Smokey grey gradient
        grad.addColorStop(0, `rgba(200, 200, 202, ${p.opacity})`);
        grad.addColorStop(0.3, `rgba(180, 180, 182, ${p.opacity * 0.6})`);
        grad.addColorStop(0.7, `rgba(140, 140, 142, ${p.opacity * 0.2})`);
        grad.addColorStop(1, 'rgba(140, 140, 142, 0)');
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Draw the cigarette itself on top of the smoke
      if (isMouseActive && fade > 0) {
        ctx.save();
        ctx.globalAlpha = fade;
        drawCigarette(ctx, cig.x, cig.y, cig.angle, fade);
        ctx.restore();
      }

    } else {
      // Clear smoke and cigarette initialization state
      smokeRef.current = [];
      cigStateRef.current.initialized = false;

      // Age and filter existing dots from the previous frame
      trailRef.current = trailRef.current
        .map(dot => ({
          ...dot,
          age: dot.age + 1,
          angle: dot.angle + dot.angleSpeed,
        }))
        .filter(dot => dot.age < TRAIL_LENGTH);

      const trail = trailRef.current;

      // Add new dot at current mouse position if mouse is active and moving
      if (isMouseActive && idleDuration < 150) {
        trail.unshift({
          x,
          y,
          age: 0,
          colorIndex: colorIndexRef.current,
          shape: 'circle',
          angle: Math.random() * Math.PI * 2,
          angleSpeed: (Math.random() - 0.5) * 0.05,
        });
        colorIndexRef.current = (colorIndexRef.current + 1) % colors.length;
      }

      // Trim trail to max length
      while (trail.length > TRAIL_LENGTH) {
        trail.pop();
      }

      // Draw each dot
      const scrollPulse = Math.min(Math.abs(velocityRef.current) / 500, 1) * 3;
      for (let i = trail.length - 1; i >= 0; i--) {
        const dot = trail[i];

        const progress = dot.age / TRAIL_LENGTH; // 0 = newest, 1 = oldest
        const radius = (BASE_DOT_RADIUS + scrollPulse) * (1 - progress * 0.7);
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
    }

    ctx.globalAlpha = 1;

    const fade = isNoir
      ? Math.max(0, 1 - Math.max(0, idleDuration - 5000) / 1000)
      : 1;

    const hasItemsToDraw = isNoir
      ? (smokeRef.current.length > 0 || (isMouseActive && fade > 0))
      : (trailRef.current.length > 0 || (isMouseActive && idleDuration < 150));

    if (hasItemsToDraw) {
      frameRef.current = requestAnimationFrame(draw);
    } else {
      isLoopActiveRef.current = false;
    }
  }, [isNoir, colors]);

  const wakeLoop = useCallback(() => {
    if (!isLoopActiveRef.current) {
      isLoopActiveRef.current = true;
      frameRef.current = requestAnimationFrame(draw);
    }
  }, [draw]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Don't enable on touch/coarse-pointer devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      isTouchDevice.current = true;
      setIsTouch(true);
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
      lastMouseMoveTimeRef.current = Date.now();
      wakeLoop();
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -100, y: -100 };
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(frameRef.current);
        isLoopActiveRef.current = false;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    isLoopActiveRef.current = true;
    frameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(frameRef.current);
    };
  }, [mounted, draw, wakeLoop]);

  if (!mounted || isTouch) {
    return null;
  }

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
