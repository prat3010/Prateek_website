'use client';

import React, { useEffect, useState, useRef } from 'react';
import { m, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useTheme, useThemeTransition } from '@/context/ThemeContext';
import { useLenisScroll } from '@/context/LenisProvider';
import { usePerformanceGovernor } from '@/context/PerformanceGovernor';
import { SkylineInteractionProvider } from './SkylineInteractionContext';
import styles from './NoirSkyline.module.css';

import Layer0 from './skyline/Layer0';
import Layer1 from './skyline/Layer1';
import Layer1_5 from './skyline/Layer1_5';
import Layer2 from './skyline/Layer2';
import BridgeLayer from './skyline/BridgeLayer';
import Layer3 from './skyline/Layer3';

function SkylineInner() {
  const { theme } = useTheme();
  const { isTransitioning } = useThemeTransition();
  const { performanceTier } = usePerformanceGovernor();
  const perfTierRef = useRef(performanceTier);
  useEffect(() => { perfTierRef.current = performanceTier; }, [performanceTier]);
  const [mounted] = useState(true);
  const { scrollProgress: scrollYProgress } = useLenisScroll();
  const isTransitioningRef = useRef(isTransitioning);
  useEffect(() => {
    isTransitioningRef.current = isTransitioning;
  }, [isTransitioning]);

  // Background (Layer 1): Scales from 1.0 to 1.09, moves down slightly (Y from 0 to 22px)
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.09]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 22]);

  // Far Midground (Layer 1.5): Scales from 1.0 to 1.16, moves down (Y from 0 to 38px)
  const midBgScale = useTransform(scrollYProgress, [0, 1], [1, 1.16]);
  const midBgY = useTransform(scrollYProgress, [0, 1], [0, 38]);

  // Midground (Layer 2): Scales from 1.0 to 1.24, moves down (Y from 0 to 52px)
  const midScale = useTransform(scrollYProgress, [0, 1], [1, 1.24]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, 52]);

  // Bridge (Layer 2.5): Scales from 1.0 to 1.32, moves down (Y from 0 to 62px)
  const bridgeScale = useTransform(scrollYProgress, [0, 1], [1, 1.32]);
  const bridgeY = useTransform(scrollYProgress, [0, 1], [0, 62]);

  // Foreground (Layer 3): Scales from 1.0 to 1.40, moves down slowly (Y from 0 to 75px)
  const fgScale = useTransform(scrollYProgress, [0, 1], [1, 1.40]);
  const fgY = useTransform(scrollYProgress, [0, 1], [0, 75]);



  // Motion values for tracking mouse cursor coordinates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Distinct springs per layer to create organic lag
  const springX1 = useSpring(mouseX, { damping: 30, stiffness: 90 });
  const springY1 = useSpring(mouseY, { damping: 30, stiffness: 90 });

  const springX1_5 = useSpring(mouseX, { damping: 29, stiffness: 87 });
  const springY1_5 = useSpring(mouseY, { damping: 29, stiffness: 87 });

  const springX2 = useSpring(mouseX, { damping: 28, stiffness: 85 });
  const springY2 = useSpring(mouseY, { damping: 28, stiffness: 85 });

  const springXBridge = useSpring(mouseX, { damping: 26, stiffness: 82 });
  const springYBridge = useSpring(mouseY, { damping: 26, stiffness: 82 });

  const springX3 = useSpring(mouseX, { damping: 24, stiffness: 80 });
  const springY3 = useSpring(mouseY, { damping: 24, stiffness: 80 });

  // Transforms for mouse offsets
  const layer1X = useTransform(springX1, (x) => x * -10);
  const layer1Y = useTransform(springY1, (y) => y * -8);

  const layer1_5X = useTransform(springX1_5, (x) => x * -17);
  const layer1_5Y = useTransform(springY1_5, (y) => y * -12);

  const layer2X = useTransform(springX2, (x) => x * -24);
  const layer2Y = useTransform(springY2, (y) => y * -16);

  const bridgeLayerX = useTransform(springXBridge, (x) => x * -33);
  const bridgeLayerY = useTransform(springYBridge, (y) => y * -22);

  const layer3X = useTransform(springX3, (x) => x * -42);
  const layer3Y = useTransform(springY3, (y) => y * -28);

  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    const cores = navigator.hardwareConcurrency ?? 4;
    const lowEnd = cores < 4;
    const isMobileDevice = window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || lowEnd || isMobileDevice;
  });

  // Track mouse coordinates for subtle parallax offset & update reducedMotion on resize
  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 4;
    const lowEnd = cores < 4;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const checkReducedMotion = () => {
      const isMobileDevice = window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
      setReducedMotion(mediaQuery.matches || lowEnd || isMobileDevice);
    };

    const mediaListener = (e: MediaQueryListEvent) => {
      const isMobileDevice = window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
      setReducedMotion(e.matches || lowEnd || isMobileDevice);
    };
    mediaQuery.addEventListener('change', mediaListener);
    window.addEventListener('resize', checkReducedMotion);

    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (isTransitioningRef.current) return;
      if (perfTierRef.current === 'low') return;
      const isMobileDevice = window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
      if (mediaQuery.matches || isMobileDevice) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;
        if (Math.abs(x - mouseX.get()) > 0.005 || Math.abs(y - mouseY.get()) > 0.005) {
          mouseX.set(x);
          mouseY.set(y);
        }
      });
    };

    const isMobileDevice = window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
    if (!isMobileDevice && !mediaQuery.matches && !lowEnd) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      mediaQuery.removeEventListener('change', mediaListener);
      window.removeEventListener('resize', checkReducedMotion);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  return (
    <div className={`${styles.container} ${styles.active} ${theme === 'light' ? styles.lightPopart : styles.darkNoir} ${reducedMotion ? styles.reducedMotion : ''}`}>
      {/* ── Vignette Overlay ── */}
      <div className={styles.vignette} aria-hidden="true" />


      {/* ── Layer 0: Sky backdrop, Searchlights, and Rain ── */}
      <div className={styles.layer}>
        <Layer0 />
      </div>

      {/* ── Layer 1: Background Buildings (Parallax Scale 1.12) ── */}
      <m.div
        style={reducedMotion
          ? { zIndex: 1 }
          : { scale: bgScale, y: bgY, zIndex: 1, willChange: 'transform' }}
        className={styles.layer}
      >
        <m.div
          style={reducedMotion
            ? { width: '100%', height: '100%' }
            : { x: layer1X, y: layer1Y, width: '100%', height: '100%', willChange: 'transform' }}
        >
          <Layer1 reducedMotion={reducedMotion} />
        </m.div>
      </m.div>

      {/* ── Layer 1.5: Far Midground Buildings (Parallax Scale 1.10) ── */}
      <m.div
        style={reducedMotion
          ? { zIndex: 1 }
          : { scale: midBgScale, y: midBgY, zIndex: 1, willChange: 'transform' }}
        className={styles.layer}
      >
        <m.div
          style={reducedMotion
            ? { width: '100%', height: '100%' }
            : { x: layer1_5X, y: layer1_5Y, width: '100%', height: '100%', willChange: 'transform' }}
        >
          <Layer1_5 reducedMotion={reducedMotion} />
        </m.div>
      </m.div>

      {/* ── Layer 2: Midground Buildings ── */}
      <m.div
        style={reducedMotion
          ? { zIndex: 2 }
          : { scale: midScale, y: midY, zIndex: 2, willChange: 'transform' }}
        className={styles.layer}
      >
        <m.div
          style={reducedMotion
            ? { width: '100%', height: '100%' }
            : { x: layer2X, y: layer2Y, width: '100%', height: '100%', willChange: 'transform' }}
        >
          <Layer2 reducedMotion={reducedMotion} />
        </m.div>
      </m.div>

      {/* ── Layer 2.5: Bridge Structure (Parallax Scale bridgeScale) ── */}
      <m.div
        style={reducedMotion
          ? { zIndex: 2 }
          : { scale: bridgeScale, y: bridgeY, zIndex: 2, willChange: 'transform' }}
        className={styles.layer}
      >
        <m.div
          style={reducedMotion
            ? { width: '100%', height: '100%' }
            : { x: bridgeLayerX, y: bridgeLayerY, width: '100%', height: '100%', willChange: 'transform' }}
        >
          <BridgeLayer reducedMotion={reducedMotion} />
        </m.div>
      </m.div>

      {/* ── Layer 3: Foreground Rooftops (Parallax Scale 1.8, Masks midground, high opacity) ── */}
      <m.div
        style={reducedMotion
          ? { zIndex: 3 }
          : { scale: fgScale, y: fgY, zIndex: 3, willChange: 'transform' }}
        className={styles.layer}
      >
        <m.div
          style={reducedMotion
            ? { width: '100%', height: '100%' }
            : { x: layer3X, y: layer3Y, width: '100%', height: '100%', willChange: 'transform' }}
        >
          <Layer3 reducedMotion={reducedMotion} />
        </m.div>
      </m.div>

      {/* ── Watercolor Texture Overlay (only in light theme to preserve watercolor paper feel without SVG render overhead) ── */}
      {theme === 'light' && (
        <div className={styles.watercolorOverlay} aria-hidden="true" />
      )}
    </div>
  );
}

export default function NoirSkyline() {
  return (
    <SkylineInteractionProvider>
      <SkylineInner />
    </SkylineInteractionProvider>
  );
}
