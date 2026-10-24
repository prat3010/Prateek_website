'use client';

import React, { useEffect, useState, useRef } from 'react';
import { m, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useTheme, useThemeTransition } from '@/context/ThemeContext';
import { useLenisScroll } from '@/context/LenisProvider';
import { usePerformanceGovernor } from '@/context/PerformanceGovernor';
import { useSkylineStatus, SkylineInteractionProvider } from './SkylineInteractionContext';
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
  const { isIdle, isOccluded } = useSkylineStatus();
  const perfTierRef = useRef(performanceTier);
  useEffect(() => { perfTierRef.current = performanceTier; }, [performanceTier]);
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

  // Consolidated spring physics (single spring pair instead of 10 separate springs)
  const springX = useSpring(mouseX, { damping: 28, stiffness: 85 });
  const springY = useSpring(mouseY, { damping: 28, stiffness: 85 });

  // Transforms for mouse offsets
  const layer1X = useTransform(springX, (x) => x * -10);
  const layer1Y = useTransform(springY, (y) => y * -8);

  const layer1_5X = useTransform(springX, (x) => x * -17);
  const layer1_5Y = useTransform(springY, (y) => y * -12);

  const layer2X = useTransform(springX, (x) => x * -24);
  const layer2Y = useTransform(springY, (y) => y * -16);

  const bridgeLayerX = useTransform(springX, (x) => x * -33);
  const bridgeLayerY = useTransform(springY, (y) => y * -22);

  const layer3X = useTransform(springX, (x) => x * -42);
  const layer3Y = useTransform(springY, (y) => y * -28);

  // Consolidated single-layer vertical transforms (scroll Y + mouse Y combined)
  const layer1CombinedY = useTransform([bgY, layer1Y], ([sy, my]) => Number(sy) + Number(my));
  const layer1_5CombinedY = useTransform([midBgY, layer1_5Y], ([sy, my]) => Number(sy) + Number(my));
  const layer2CombinedY = useTransform([midY, layer2Y], ([sy, my]) => Number(sy) + Number(my));
  const bridgeLayerCombinedY = useTransform([bridgeY, bridgeLayerY], ([sy, my]) => Number(sy) + Number(my));
  const layer3CombinedY = useTransform([fgY, layer3Y], ([sy, my]) => Number(sy) + Number(my));

  // Viewport dimensions for responsive panoramic calculations
  const [dimensions, setDimensions] = useState(() => {
    if (typeof window === 'undefined') return { width: 1920, height: 1080 };
    return { width: window.innerWidth, height: window.innerHeight };
  });

  // Mobile composition is decoupled from reducedMotion
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    const cores = navigator.hardwareConcurrency ?? 4;
    const lowEnd = cores < 4;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || lowEnd;
  });

  // Portrait phone check: device is mobile, portrait orientation, and not reduced motion
  const isPortraitMobile = isMobile && dimensions.height > dimensions.width && !reducedMotion;

  // 16:9 canvas dimensions: width is scaled to fill full height
  const canvasWidth = isPortraitMobile ? Math.round(dimensions.height * (16 / 9)) : dimensions.width;
  const maxPan = isPortraitMobile ? Math.max(0, canvasWidth - dimensions.width) : 0;
  const maxPanRef = useRef(maxPan);
  useEffect(() => {
    maxPanRef.current = maxPan;
  }, [maxPan]);

  // Mobile horizontal panning transforms with differential 3D depth parallax
  const mobilePanL3 = useTransform(scrollYProgress, (p) => -maxPanRef.current * 1.0 * p);
  const mobilePanL2 = useTransform(scrollYProgress, (p) => -maxPanRef.current * 0.85 * p);
  const mobilePanL1_5 = useTransform(scrollYProgress, (p) => -maxPanRef.current * 0.77 * p);
  const mobilePanL1 = useTransform(scrollYProgress, (p) => -maxPanRef.current * 0.70 * p);
  const mobilePanL0 = useTransform(scrollYProgress, (p) => -maxPanRef.current * 0.40 * p);

  const preserveAspect = isPortraitMobile
    ? 'xMinYMax slice'
    : isMobile
    ? 'xMidYMax meet'
    : 'xMidYMax slice';

  // Track mouse coordinates for subtle parallax offset & update device/motion state
  useEffect(() => {
    const cores = navigator.hardwareConcurrency ?? 4;
    const lowEnd = cores < 4;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const checkMotionState = () => {
      const isMobileDevice = window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(isMobileDevice);
      setReducedMotion(mediaQuery.matches || lowEnd);
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    const mediaListener = (e: MediaQueryListEvent) => {
      const isMobileDevice = window.innerWidth <= 768 || window.matchMedia('(pointer: coarse)').matches;
      setIsMobile(isMobileDevice);
      setReducedMotion(e.matches || lowEnd);
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    mediaQuery.addEventListener('change', mediaListener);
    window.addEventListener('resize', checkMotionState);

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
      window.removeEventListener('resize', checkMotionState);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [mouseX, mouseY]);

  return (
    <div className={`${styles.container} ${styles.active} ${isIdle ? styles.isIdle : ''} ${isOccluded ? styles.isOccluded : ''} ${theme === 'light' ? styles.lightPopart : styles.darkNoir} ${reducedMotion ? styles.reducedMotion : ''} ${isMobile ? styles.mobileSkyline : ''} ${isPortraitMobile ? styles.panoramicMobile : ''}`}>
      {/* ── Vignette Overlay ── */}
      <div className={styles.vignette} aria-hidden="true" />

      {/* ── Layer 0: Sky backdrop, Searchlights, and Rain ── */}
      <m.div
        style={
          isPortraitMobile
            ? { x: mobilePanL0, width: canvasWidth, height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0, willChange: 'transform' }
            : { zIndex: 0 }
        }
        className={isPortraitMobile ? styles.mobilePortraitLayer : styles.layer}
      >
        <Layer0 reducedMotion={reducedMotion} isMobile={isMobile} preserveAspectRatio={preserveAspect} />
      </m.div>

      {/* ── Layer 1: Background Buildings (Parallax Scale 1.12) ── */}
      <m.div
        style={
          isPortraitMobile
            ? { x: mobilePanL1, width: canvasWidth, height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1, willChange: 'transform' }
            : reducedMotion
            ? { zIndex: 1 }
            : { scale: bgScale, x: layer1X, y: layer1CombinedY, zIndex: 1, willChange: 'transform' }
        }
        className={isPortraitMobile ? styles.mobilePortraitLayer : styles.layer}
      >
        <Layer1 reducedMotion={reducedMotion} isMobile={isMobile} preserveAspectRatio={preserveAspect} />
      </m.div>

      {/* ── Layer 1.5: Far Midground Buildings (Parallax Scale 1.10) ── */}
      <m.div
        style={
          isPortraitMobile
            ? { x: mobilePanL1_5, width: canvasWidth, height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1, willChange: 'transform' }
            : reducedMotion
            ? { zIndex: 1 }
            : { scale: midBgScale, x: layer1_5X, y: layer1_5CombinedY, zIndex: 1, willChange: 'transform' }
        }
        className={isPortraitMobile ? styles.mobilePortraitLayer : styles.layer}
      >
        <Layer1_5 reducedMotion={reducedMotion} isMobile={isMobile} preserveAspectRatio={preserveAspect} />
      </m.div>

      {/* ── Layer 2: Midground Buildings ── */}
      <m.div
        style={
          isPortraitMobile
            ? { x: mobilePanL2, width: canvasWidth, height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 2, willChange: 'transform' }
            : reducedMotion
            ? { zIndex: 2 }
            : { scale: midScale, x: layer2X, y: layer2CombinedY, zIndex: 2, willChange: 'transform' }
        }
        className={isPortraitMobile ? styles.mobilePortraitLayer : styles.layer}
      >
        <Layer2 reducedMotion={reducedMotion} isMobile={isMobile} preserveAspectRatio={preserveAspect} />
      </m.div>

      {/* ── Layer 2.5: Bridge Structure (Parallax Scale bridgeScale) ── */}
      <m.div
        style={
          isPortraitMobile
            ? { x: mobilePanL2, width: canvasWidth, height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 2, willChange: 'transform' }
            : reducedMotion
            ? { zIndex: 2 }
            : { scale: bridgeScale, x: bridgeLayerX, y: bridgeLayerCombinedY, zIndex: 2, willChange: 'transform' }
        }
        className={isPortraitMobile ? styles.mobilePortraitLayer : styles.layer}
      >
        <BridgeLayer reducedMotion={reducedMotion} isMobile={isMobile} preserveAspectRatio={preserveAspect} />
      </m.div>

      {/* ── Layer 3: Foreground Rooftops (Parallax Scale 1.8, Masks midground, high opacity) ── */}
      <m.div
        style={
          isPortraitMobile
            ? { x: mobilePanL3, width: canvasWidth, height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 3, willChange: 'transform' }
            : reducedMotion
            ? { zIndex: 3 }
            : { scale: fgScale, x: layer3X, y: layer3CombinedY, zIndex: 3, willChange: 'transform' }
        }
        className={isPortraitMobile ? styles.mobilePortraitLayer : styles.layer}
      >
        <Layer3 reducedMotion={reducedMotion} isMobile={isMobile} preserveAspectRatio={preserveAspect} />
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
