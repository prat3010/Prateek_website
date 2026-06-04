'use client';

import React, { useEffect, useState, useRef } from 'react';
import { m, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import styles from './NoirSkyline.module.css';
import { WobblyPath, WobblyLine, WobblyRect, WobblyPolygon } from './WobblySVG';

interface LayerProps {
  isMobile?: boolean;
  reducedMotion?: boolean;
}

export default function NoirSkyline() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Track scroll position of the page
  const { scrollYProgress } = useScroll();

  // Background (Layer 1): Scales from 1.0 to 1.06, moves down slightly (Y from 0 to 15px)
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.06]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 15]);

  // Midground (Layer 2): Scales from 1.0 to 1.15, moves down (Y from 0 to 35px)
  const midScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const midY = useTransform(scrollYProgress, [0, 1], [0, 35]);

  // Foreground (Layer 3): Scales from 1.0 to 1.25, moves down slowly (Y from 0 to 50px)
  const fgScale = useTransform(scrollYProgress, [0, 1], [1, 1.25]);
  const fgY = useTransform(scrollYProgress, [0, 1], [0, 50]);

  // Motion values for tracking mouse cursor coordinates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Distinct springs per layer to create organic lag
  const springX1 = useSpring(mouseX, { damping: 30, stiffness: 90 });
  const springY1 = useSpring(mouseY, { damping: 30, stiffness: 90 });

  const springX2 = useSpring(mouseX, { damping: 28, stiffness: 85 });
  const springY2 = useSpring(mouseY, { damping: 28, stiffness: 85 });

  const springX3 = useSpring(mouseX, { damping: 24, stiffness: 80 });
  const springY3 = useSpring(mouseY, { damping: 24, stiffness: 80 });

  // Transforms for mouse offsets
  const layer1X = useTransform(springX1, (x) => x * -10);
  const layer1Y = useTransform(springY1, (y) => y * -8);

  const layer2X = useTransform(springX2, (x) => x * -24);
  const layer2Y = useTransform(springY2, (y) => y * -16);

  const layer3X = useTransform(springX3, (x) => x * -42);
  const layer3Y = useTransform(springY3, (y) => y * -28);

  const [reducedMotion, setReducedMotion] = useState(false);

  // Track mouse coordinates for subtle parallax offset
  useEffect(() => {
    setMounted(true);
    const isMobileDevice =
      window.matchMedia('(max-width: 768px)').matches ||
      window.matchMedia('(pointer: coarse)').matches;
    setIsMobile(isMobileDevice);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const mediaListener = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', mediaListener);

    let rafId: number | null = null;
    const handleMouseMove = (e: MouseEvent) => {
      if (mediaQuery.matches) return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) - 0.5;
        const y = (e.clientY / window.innerHeight) - 0.5;
        mouseX.set(x);
        mouseY.set(y);
      });
    };

    if (!isMobileDevice && !mediaQuery.matches) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      mediaQuery.removeEventListener('change', mediaListener);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [mouseX, mouseY]);

  if (!mounted) return null;

  return (
    <div className={`${styles.container} ${styles.active} ${theme === 'light' ? styles.lightPopart : styles.darkNoir}`}>
      {/* ── Vignette Overlay ── */}
      <div className={styles.vignette} aria-hidden="true" />

      {/* ── Grain Texture Overlay ── */}
      <div className={styles.grain} aria-hidden="true" />

      {/* ── Layer 0: Sky backdrop, Searchlights, and Rain ── */}
      <div className={styles.layer}>
        <Layer0 />
      </div>

      {/* ── Layer 1: Background Buildings (Parallax Scale 1.12) ── */}
      <m.div
        style={{ scale: bgScale, y: bgY, zIndex: 1 }}
        className={styles.layer}
      >
        <m.div
          style={{ x: layer1X, y: layer1Y, width: '100%', height: '100%', willChange: 'transform' }}
        >
          <Layer1 isMobile={isMobile} reducedMotion={reducedMotion} />
        </m.div>
      </m.div>

      <m.div
        style={{ scale: midScale, y: midY, zIndex: 2 }}
        className={styles.layer}
      >
        <m.div
          style={{ x: layer2X, y: layer2Y, width: '100%', height: '100%', willChange: 'transform' }}
        >
          <Layer2 isMobile={isMobile} reducedMotion={reducedMotion} />
        </m.div>
      </m.div>

      {/* ── Layer 3: Foreground Rooftops (Parallax Scale 1.8, Masks midground, high opacity) ── */}
      <m.div
        style={{ scale: fgScale, y: fgY, zIndex: 3 }}
        className={styles.layer}
      >
        <m.div
          style={{ x: layer3X, y: layer3Y, width: '100%', height: '100%', willChange: 'transform' }}
        >
          <Layer3 isMobile={isMobile} reducedMotion={reducedMotion} />
        </m.div>
      </m.div>

    </div>
  );
}


const Layer0 = React.memo(function Layer0() {
  // Generate 24 conic rays radiating from the center of the horizon (960, 450)
  const raysCount = 24;
  const raysPath = Array.from({ length: raysCount }).map((_, i) => {
    const angle1 = (i * 360) / raysCount;
    const angle2 = ((i + 0.5) * 360) / raysCount;
    const r = 2500;
    const rad1 = (angle1 * Math.PI) / 180;
    const rad2 = (angle2 * Math.PI) / 180;
    const x1 = 960 + r * Math.cos(rad1);
    const y1 = 450 + r * Math.sin(rad1);
    const x2 = 960 + r * Math.cos(rad2);
    const y2 = 450 + r * Math.sin(rad2);
    return `M 960 450 L ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
  }).join(' ');

  return (
    <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <defs>
            {/* Left Searchlight Gradient */}
            <linearGradient id="leftLightGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(250, 250, 250, 0.15)" />
              <stop offset="60%" stopColor="rgba(250, 250, 250, 0.04)" />
              <stop offset="100%" stopColor="rgba(250, 250, 250, 0)" />
            </linearGradient>

            {/* Right Searchlight Gradient */}
            <linearGradient id="rightLightGrad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(250, 250, 250, 0.18)" />
              <stop offset="50%" stopColor="rgba(250, 250, 250, 0.05)" />
              <stop offset="100%" stopColor="rgba(250, 250, 250, 0)" />
            </linearGradient>

            {/* Blimp Searchlight Gradient */}
            <linearGradient id="blimpLightGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.28)" />
              <stop offset="60%" stopColor="rgba(255, 255, 255, 0.08)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>

            {/* Radial Moon Glow Gradient */}
            <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
              <stop offset="70%" stopColor="rgba(255, 255, 255, 0.08)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </radialGradient>

            {/* Left Searchlight Gradient Popart */}
            <linearGradient id="leftLightGradPopart" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(41, 121, 255, 0.25)" />
              <stop offset="60%" stopColor="rgba(41, 121, 255, 0.06)" />
              <stop offset="100%" stopColor="rgba(41, 121, 255, 0)" />
            </linearGradient>

            {/* Right Searchlight Gradient Popart */}
            <linearGradient id="rightLightGradPopart" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="rgba(255, 23, 68, 0.25)" />
              <stop offset="50%" stopColor="rgba(255, 23, 68, 0.06)" />
              <stop offset="100%" stopColor="rgba(255, 23, 68, 0)" />
            </linearGradient>

            {/* Blimp Searchlight Gradient Popart */}
            <linearGradient id="blimpLightGradPopart" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(0, 230, 118, 0.35)" />
              <stop offset="60%" stopColor="rgba(0, 230, 118, 0.1)" />
              <stop offset="100%" stopColor="rgba(0, 230, 118, 0)" />
            </linearGradient>

            {/* Sky Gradient Popart */}
            <radialGradient id="skyGradPopart" cx="50%" cy="40%" r="70%">
              <stop offset="0%" stopColor="#FFFDF6" />
              <stop offset="40%" stopColor="#FFE082" />
              <stop offset="100%" stopColor="#90CAF9" />
            </radialGradient>
          </defs>

          {/* Sky background layer (uses radial gradient in Popart, transparent in Noir) */}
          <rect width="100%" height="100%" fill="var(--skyline-sky-bg)" />

          {/* Pop-art Conic Sunburst Rays */}
          <path d={raysPath} className={styles.sunburstRays} fill="none" />

          {/* Twinkling Starfield */}
          <g fill="#fafafa" stroke="none">
            <circle cx="120" cy="80" r="0.8" className={styles.star1} />
            <circle cx="250" cy="150" r="1.2" className={styles.star2} />
            <circle cx="340" cy="60" r="0.7" className={styles.star3} />
            <circle cx="480" cy="120" r="1.0" className={styles.star1} />
            <circle cx="620" cy="200" r="0.9" className={styles.star2} />
            <circle cx="710" cy="90" r="1.3" className={styles.star3} />
            <circle cx="850" cy="140" r="0.8" className={styles.star1} />
            <circle cx="960" cy="50" r="1.1" className={styles.star2} />
            <circle cx="1050" cy="180" r="0.6" className={styles.star3} />
            <circle cx="1150" cy="70" r="1.2" className={styles.star1} />
            <circle cx="1280" cy="130" r="0.9" className={styles.star2} />
            <circle cx="1380" cy="60" r="0.8" className={styles.star3} />
            <circle cx="1520" cy="90" r="1.1" className={styles.star1} />
            <circle cx="1700" cy="110" r="0.7" className={styles.star2} />
            <circle cx="1820" cy="140" r="1.0" className={styles.star3} />
          </g>

          {/* Glowing Noir Full Moon & Clouds */}
          <g pointerEvents="none">
            {/* Soft outer glow */}
            <circle cx="650" cy="250" r="100" fill="url(#moonGlow)" stroke="none" className={styles.moonGlow} />
            {/* Main Moon body */}
            <circle cx="650" cy="250" r="50" fill="rgba(250, 250, 250, 0.12)" stroke="rgba(250, 250, 250, 0.22)" strokeWidth="0.8" className={styles.moonBody} />
            
            {/* Wispy cloud silhouettes passing in front of the moon */}
            <path d="M 500 240 Q 650 260 800 240 Q 650 220 500 240 Z" fill="var(--skyline-cloud-fill)" stroke="none" />
            <path d="M 550 265 Q 670 280 790 265 Q 670 250 550 265 Z" fill="var(--skyline-cloud-fill)" stroke="none" />
            <path d="M 460 215 Q 600 230 740 215 Q 600 200 460 215 Z" fill="var(--skyline-cloud-fill)" stroke="none" />
          </g>

          {/* Detailed Gliding Retro Airship/Dirigible */}
          <g className={styles.blimpGroup}>
            {/* Sweeping Spotlight beam from the front of the gondola */}
            <polygon 
              points="195,212 230,420 320,400" 
              fill="var(--skyline-blimp-spotlight)" 
              className={styles.blimpSpotlight} 
              stroke="none"
            />

            {/* Structural envelope outline */}
            <path 
              d="M 104 180 C 104 160, 135 154, 185 154 C 225 154, 250 168, 250 180 C 250 192, 225 206, 185 206 C 135 206, 104 200, 104 180 Z" 
              fill="var(--skyline-blimp-envelope)" 
              stroke="var(--skyline-blimp-stroke)" 
              strokeWidth="1.2" 
            />
            {/* Long envelope longitudinal panel lines */}
            <path d="M 105 180 Q 177 159 249 180" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />
            <path d="M 105 180 Q 177 201 249 180" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />
            
            {/* Extra detailed longitudinal panel lines for premium texture */}
            <path d="M 104.5 180 Q 177 169 249.5 180" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.6" />
            <path d="M 104.5 180 Q 177 191 249.5 180" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.6" />

            {/* Vertical framing bands (ribs) */}
            <path d="M 130 162 A 18 18 0 0 0 130 198" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />
            <path d="M 160 154 A 26 26 0 0 0 160 206" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />
            <path d="M 190 154 A 26 26 0 0 0 190 206" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />
            <path d="M 220 162 A 18 18 0 0 0 220 198" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />
            {/* Nose cap lines */}
            <path d="M 238 171 A 11 11 0 0 0 238 189" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />

            {/* Aerodynamic stabilizers & fins */}
            {/* Top Fin */}
            <path d="M 115 170 L 92 153 L 90 178 L 118 178 Z" fill="var(--skyline-blimp-envelope)" stroke="var(--skyline-blimp-stroke)" strokeWidth="1" />
            {/* Top fin hinge and rudder line */}
            <line x1="96" y1="156" x2="94" y2="178" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />

            {/* Bottom Fin */}
            <path d="M 115 190 L 92 207 L 90 182 L 118 182 Z" fill="var(--skyline-blimp-envelope)" stroke="var(--skyline-blimp-stroke)" strokeWidth="1" />
            {/* Bottom fin hinge and rudder line */}
            <line x1="96" y1="204" x2="94" y2="182" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.8" />

            {/* Rear Propeller Engine Pod */}
            <rect x="135" y="202" width="10" height="4" rx="0.5" fill="var(--skyline-blimp-envelope)" stroke="var(--skyline-blimp-stroke)" strokeWidth="0.8" />
            {/* Spin blades */}
            <line x1="130" y1="199" x2="130" y2="209" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="1" />

            {/* Gondola Cabin (connected by struts and rigging) */}
            {/* Structural struts */}
            <line x1="165" y1="200" x2="165" y2="204" stroke="var(--skyline-blimp-stroke)" strokeWidth="0.8" />
            <line x1="180" y1="200" x2="180" y2="204" stroke="var(--skyline-blimp-stroke)" strokeWidth="0.8" />
            <line x1="195" y1="200" x2="195" y2="204" stroke="var(--skyline-blimp-stroke)" strokeWidth="0.8" />
            {/* Rigging lines cross bracing */}
            <line x1="165" y1="200" x2="180" y2="204" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.5" />
            <line x1="180" y1="200" x2="165" y2="204" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.5" />
            <line x1="180" y1="200" x2="195" y2="204" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.5" />
            <line x1="195" y1="200" x2="180" y2="204" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.5" />

            {/* Gondola Body */}
            <path d="M 158 204 L 202 204 L 197 212 L 163 212 Z" fill="var(--skyline-blimp-envelope)" stroke="var(--skyline-blimp-stroke)" strokeWidth="1" />
            {/* Cabin windows */}
            <rect x="168" y="206" width="5" height="3" rx="0.3" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.6" />
            <rect x="177" y="206" width="5" height="3" rx="0.3" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.6" />
            <rect x="186" y="206" width="5" height="3" rx="0.3" fill="none" stroke="var(--skyline-blimp-stroke-fine)" strokeWidth="0.6" />

            {/* White Tail flashing beacon */}
            <circle cx="89" cy="153" r="1.5" className={styles.blimpBeacon} />
          </g>



          {/* Searchlights sweeping the sky */}
          <g opacity="0.6">
            <polygon 
              points="380,1080 180,0 480,0" 
              fill="var(--skyline-searchlight-left)" 
              className={`${styles.searchlight} ${styles.searchlightLeft}`} 
            />
            <polygon 
              points="1480,1080 1320,0 1620,0" 
              fill="var(--skyline-searchlight-right)" 
              className={`${styles.searchlight} ${styles.searchlightRight}`} 
            />
          </g>

          {/* Flock of gliding pigeons */}
          <g className={styles.flock} fill="none" stroke="var(--skyline-pigeon-stroke)" strokeWidth="0.8">
            {/* Bird 1 */}
            <path d="M 0 0 Q 5 -5 10 0 Q 15 -5 20 0" />
            {/* Bird 2 */}
            <path d="M -25 20 Q -20 15 -15 20 Q -10 15 -5 20" />
            {/* Bird 3 */}
            <path d="M 30 15 Q 35 10 40 15 Q 45 10 50 15" />
          </g>
        </svg>
  );
});
Layer0.displayName = 'Layer0';


const Layer1 = React.memo(function Layer1({ isMobile, reducedMotion }: LayerProps) {
  const wobble = !reducedMotion;
  const strength = 2.0; // Subtle background wobble
  return (
    <>
      {/* Static Layer */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id="hatch-bg" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(250, 250, 250, 0.08)" strokeWidth="0.8" />
              </pattern>
              <pattern id="hatch-bg-black" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(26, 26, 46, 0.08)" strokeWidth="0.8" />
              </pattern>
            </defs>
            <g className={styles.buildingGroup} stroke="var(--skyline-stroke-bg)" strokeWidth="0.8">
              {/* Left distant skyscrapers */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M -1000 1080 L -1000 820 L -350 820 L -350 780 L -250 780 L -250 800 L -100 800 L -100 760 L -50 760 L -50 1080 Z M 50 1080 L 50 780 L 90 780 L 90 740 L 120 740 L 120 1080 Z" className={styles.bldBgSkyscrapers} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="90" y1="740" x2="90" y2="780" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="60" y1="780" x2="60" y2="1080" strokeDasharray="2 8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="75" y1="780" x2="75" y2="1080" strokeDasharray="2 8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="105" y1="740" x2="105" y2="1080" strokeDasharray="2 8" />
              
              {/* Stepped Needle Tower (Left-Mid) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 220 1080 L 220 720 L 230 720 L 230 650 L 240 650 L 240 540 L 246 540 L 246 450 L 250 450 L 250 350 L 254 350 L 254 450 L 258 450 L 258 540 L 264 540 L 264 650 L 274 650 L 274 720 L 284 720 L 284 1080 Z" className={styles.bldBgNeedle} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="220" y1="720" x2="284" y2="720" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="230" y1="650" x2="274" y2="650" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="240" y1="540" x2="264" y2="540" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="235" y1="720" x2="235" y2="1080" strokeDasharray="3 6" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="269" y1="720" x2="269" y2="1080" strokeDasharray="3 6" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="245" y1="650" x2="245" y2="1080" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="259" y1="650" x2="259" y2="1080" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="252" y1="280" x2="252" y2="650" />
              
              {/* Chrysler-inspired Arched Spire Tower (Left-Center) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 450 1080 L 450 670 L 458 640 L 468 640 L 468 590 L 478 590 L 478 535 L 488 500 L 498 340 L 508 500 L 518 535 L 518 590 L 528 590 L 528 640 L 538 640 L 546 670 L 546 1080 Z" className={styles.bldBgChrysler} />
              {/* Chrysler internal details */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 478 535 A 10 10 0 0 1 518 535" />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 468 590 A 20 20 0 0 1 528 590" />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 458 640 A 40 40 0 0 1 538 640" />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 488 500 A 10 10 0 0 1 508 500" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="450" y1="670" x2="546" y2="670" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="498" y1="340" x2="498" y2="500" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="498" y1="340" x2="480" y2="480" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="498" y1="340" x2="490" y2="480" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="498" y1="340" x2="506" y2="480" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="498" y1="340" x2="516" y2="480" />
 
              {/* Empire State Building (Center) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 920 1080 L 920 830 L 928 830 L 928 750 L 928 750 L 938 750 L 938 610 L 946 610 L 946 460 L 954 460 L 954 320 L 960 320 L 960 460 L 968 460 L 968 610 L 976 610 L 976 750 L 986 750 L 986 830 L 994 830 L 994 1080 Z" className={styles.bldBgEmpire} />
              {/* Empire State Details */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="920" y1="830" x2="994" y2="830" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="928" y1="750" x2="986" y2="750" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="938" y1="610" x2="976" y2="610" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="946" y1="460" x2="968" y2="460" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="957" y1="240" x2="957" y2="460" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="946" y1="460" x2="968" y2="460" strokeDasharray="2 3" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="938" y1="610" x2="976" y2="610" strokeDasharray="2 3" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="957" y1="460" x2="957" y2="830" opacity="0.4" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="935" y1="830" x2="935" y2="1080" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="945" y1="750" x2="945" y2="1080" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="950" y1="610" x2="950" y2="1080" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="954" y1="460" x2="954" y2="1080" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="966" y1="460" x2="966" y2="1080" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="970" y1="610" x2="970" y2="1080" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="975" y1="750" x2="975" y2="1080" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="985" y1="830" x2="985" y2="1080" />
 
              {/* Flat top tower with twin antenna (Right-Mid) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1320 1080 L 1320 620 L 1420 620 L 1420 1080 Z" className={styles.bldBgFlatTop} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1350" y1="620" x2="1350" y2="540" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1390" y1="620" x2="1390" y2="520" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1340" y1="620" x2="1340" y2="1080" strokeDasharray="5 5" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1360" y1="620" x2="1360" y2="1080" strokeDasharray="5 5" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1380" y1="620" x2="1380" y2="1080" strokeDasharray="5 5" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1400" y1="620" x2="1400" y2="1080" strokeDasharray="5 5" />
 
              {/* Steeped Block Tower (Far Right) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1720 1080 L 1720 740 L 1735 740 L 1735 680 L 1750 680 L 1750 580 L 1790 580 L 1790 680 L 1805 680 L 1805 740 L 1820 740 L 1820 1080 Z M 1840 1080 L 1840 760 L 1890 760 L 1890 700 L 1940 700 L 1940 760 L 1990 760 L 1990 1080 Z M 2010 1080 L 2010 730 L 2070 730 L 2070 1080 Z M 2090 1080 L 2090 750 L 2170 750 L 2170 690 L 2250 690 L 2250 1080 Z M 2270 1080 L 2270 720 L 2920 720 L 2920 1080 Z" className={styles.bldBgStepped} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1720" y1="740" x2="1820" y2="740" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1735" y1="680" x2="1805" y2="680" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1750" y1="580" x2="1790" y2="580" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1760" y1="580" x2="1760" y2="1080" strokeDasharray="2 6" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1770" y1="580" x2="1770" y2="1080" strokeDasharray="2 6" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1780" y1="580" x2="1780" y2="1080" strokeDasharray="2 6" />
 
              {/* ── NEW: Art Deco Tower (Gap 1: x=140-200) ── */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 140 1080 L 140 700 L 155 700 L 155 660 L 170 660 L 170 620 L 175 580 L 180 620 L 195 620 L 195 660 L 200 660 L 200 1080 Z" className={styles.bldBgArtDecoGap1} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="660" x2="195" y2="660" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="140" y1="700" x2="200" y2="700" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="160" y1="700" x2="160" y2="1080" strokeDasharray="2 7" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="180" y1="700" x2="180" y2="1080" strokeDasharray="2 7" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="170" y1="660" x2="170" y2="1080" strokeDasharray="2 7" />
 
              {/* ── NEW: Slim Needle Spire (Gap 2a: x=630-670) ── */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 630 1080 L 630 640 L 640 640 L 640 520 L 650 400 L 660 520 L 660 640 L 670 640 L 670 1080 Z" className={styles.bldBgSlimNeedleGap2a} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="630" y1="640" x2="670" y2="640" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="640" y1="520" x2="660" y2="520" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="650" y1="400" x2="650" y2="520" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="645" y1="640" x2="645" y2="1080" strokeDasharray="2 8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="655" y1="640" x2="655" y2="1080" strokeDasharray="2 8" />
 
              {/* ── NEW: Twin Tower Complex (Gap 2b: x=740-840) ── */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 740 1080 L 740 590 L 780 590 L 780 1080 Z" className={styles.bldBgTwinLeft} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 800 1080 L 800 550 L 840 550 L 840 1080 Z" className={styles.bldBgTwinRight} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="740" y1="590" x2="780" y2="590" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="800" y1="550" x2="840" y2="550" />
              {/* Twin tower connecting skybridge */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="780" y1="680" x2="800" y2="680" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="780" y1="685" x2="800" y2="685" />
              {/* Internal columns */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="755" y1="590" x2="755" y2="1080" strokeDasharray="2 7" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="765" y1="590" x2="765" y2="1080" strokeDasharray="2 7" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="815" y1="550" x2="815" y2="1080" strokeDasharray="2 7" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="825" y1="550" x2="825" y2="1080" strokeDasharray="2 7" />
              {/* Antenna on taller tower */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="820" y1="550" x2="820" y2="480" />
 
              {/* ── NEW: Setback Office Block (Gap 3a: x=1050-1140) ── */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1050 1080 L 1050 680 L 1070 680 L 1070 600 L 1100 600 L 1100 530 L 1110 530 L 1110 600 L 1140 600 L 1140 1080 Z" className={styles.bldBgSetbackGap3a} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1050" y1="680" x2="1140" y2="680" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1070" y1="600" x2="1140" y2="600" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1060" y1="680" x2="1060" y2="1080" strokeDasharray="3 6" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1080" y1="600" x2="1080" y2="1080" strokeDasharray="3 6" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1120" y1="600" x2="1120" y2="1080" strokeDasharray="3 6" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1130" y1="680" x2="1130" y2="1080" strokeDasharray="3 6" />
 
              {/* ── NEW: Narrow Deco Tower (Gap 3b: x=1200-1260) ── */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1200 1080 L 1200 640 L 1215 640 L 1215 560 L 1225 520 L 1235 560 L 1245 560 L 1245 640 L 1260 640 L 1260 1080 Z" className={styles.bldBgNarrowDecoGap3b} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1200" y1="640" x2="1260" y2="640" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1215" y1="560" x2="1245" y2="560" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1225" y1="520" x2="1225" y2="560" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1220" y1="640" x2="1220" y2="1080" strokeDasharray="2 8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1240" y1="640" x2="1240" y2="1080" strokeDasharray="2 8" />
 
              {/* Distant Inhabited Window Grids (office lights) */}
              <g fill="none">
                {/* Empire State windows - Glowing */}
                <g className={styles.glowingWindow} strokeWidth="1.0" strokeDasharray="2.5 8">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="942" y1="610" x2="942" y2="830" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="966" y1="610" x2="966" y2="830" strokeDashoffset="4" />
                </g>
                {/* Empire State windows - Dim */}
                <g className={styles.glowingWindowDim} strokeWidth="1.0" strokeDasharray="2.5 8">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="948" y1="610" x2="948" y2="830" strokeDashoffset="2" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="972" y1="610" x2="972" y2="830" strokeDashoffset="6" />
                </g>
 
                {/* Chrysler windows - Glowing */}
                <g className={styles.glowingWindow} strokeWidth="1.0" strokeDasharray="2 7">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="474" y1="670" x2="474" y2="1000" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="514" y1="670" x2="514" y2="1000" strokeDashoffset="3" />
                </g>
                {/* Chrysler windows - Dim */}
                <g className={styles.glowingWindowDim} strokeWidth="1.0" strokeDasharray="2 7">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="482" y1="670" x2="482" y2="1000" strokeDashoffset="5" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="522" y1="670" x2="522" y2="1000" strokeDashoffset="1" />
                </g>
 
                {/* Stepped Needle Tower windows */}
                <g className={styles.glowingWindow} strokeWidth="0.8" strokeDasharray="3 9">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="242" y1="720" x2="242" y2="1000" />
                </g>
                <g className={styles.glowingWindowDim} strokeWidth="0.8" strokeDasharray="3 9">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="262" y1="720" x2="262" y2="1000" strokeDashoffset="4" />
                </g>
 
                {/* Shadow overlay paths for wobbly hatching depth */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 498 1080 L 498 340 L 508 500 L 518 535 L 518 590 L 528 590 L 528 640 L 538 640 L 546 670 L 546 1080 Z" className={styles.shadowHatchBg} />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 957 1080 L 957 320 L 960 320 L 960 460 L 968 460 L 968 610 L 976 610 L 976 750 L 986 750 L 986 830 L 994 830 L 994 1080 Z" className={styles.shadowHatchBg} />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 252 1080 L 252 350 L 254 350 L 254 450 L 258 450 L 258 540 L 264 540 L 264 650 L 274 650 L 274 720 L 284 720 L 284 1080 Z" className={styles.shadowHatchBg} />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 760 1080 L 760 590 L 780 590 L 780 1080 Z" className={styles.shadowHatchBg} />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 820 1080 L 820 550 L 840 550 L 840 1080 Z" className={styles.shadowHatchBg} />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1370 1080 L 1370 620 L 1420 620 L 1420 1080 Z" className={styles.shadowHatchBg} />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1770 1080 L 1770 580 L 1790 580 L 1790 680 L 1805 680 L 1805 740 L 1820 740 L 1820 1080 Z" className={styles.shadowHatchBg} />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 170 1080 L 170 620 L 195 620 L 195 660 L 200 660 L 200 1080 Z" className={styles.shadowHatchBg} />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1095 1080 L 1095 530 L 1100 530 L 1110 530 L 1110 600 L 1140 600 L 1140 1080 Z" className={styles.shadowHatchBg} />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1230 1080 L 1230 520 L 1235 560 L 1245 560 L 1245 640 L 1260 640 L 1260 1080 Z" className={styles.shadowHatchBg} />
              </g>
            </g>
      </svg>
 
      {/* Animated Layer (Unfiltered) */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {/* Asynchronous Flickering Window Cells (Layer 1 - Unfiltered for performance) */}
            <g strokeWidth="1.0" fill="none">
              {/* Empire State */}
              <line x1="950" y1="650" x2="950" y2="653" className={styles.windowFlicker1} />
              <line x1="950" y1="710" x2="950" y2="713" className={styles.windowFlicker3} />
              <line x1="966" y1="550" x2="966" y2="553" className={styles.windowFlicker2} />
              <line x1="966" y1="780" x2="966" y2="783" className={styles.windowFlicker4} />
              
              {/* Chrysler */}
              <line x1="488" y1="600" x2="488" y2="603" className={styles.windowFlicker2} />
              <line x1="508" y1="560" x2="508" y2="563" className={styles.windowFlicker4} />
 
              {/* Flat top tower */}
              <line x1="1360" y1="680" x2="1360" y2="683" className={styles.windowFlicker1} />
              <line x1="1380" y1="750" x2="1380" y2="753" className={styles.windowFlicker3} />
              <line x1="1340" y1="820" x2="1340" y2="823" className={styles.windowFlicker2} />
              <line x1="1400" y1="710" x2="1400" y2="713" className={styles.windowFlicker4} />
 
              {/* Stepped block tower */}
              <line x1="1760" y1="630" x2="1760" y2="633" className={styles.windowFlicker1} />
              <line x1="1780" y1="700" x2="1780" y2="703" className={styles.windowFlicker3} />
 
              {/* NEW: Art Deco tower */}
              <line x1="170" y1="680" x2="170" y2="683" className={styles.windowFlicker2} />
 
              {/* NEW: Twin towers */}
              <line x1="755" y1="650" x2="755" y2="653" className={styles.windowFlicker1} />
              <line x1="825" y1="610" x2="825" y2="613" className={styles.windowFlicker4} />
 
              {/* NEW: Setback office */}
              <line x1="1080" y1="640" x2="1080" y2="643" className={styles.windowFlicker3} />
              <line x1="1120" y1="700" x2="1120" y2="703" className={styles.windowFlicker1} />
 
              {/* NEW: Narrow Deco tower */}
              <line x1="1220" y1="680" x2="1220" y2="683" className={styles.windowFlicker2} />
            </g>
      </svg>
    </>
  );
});
Layer1.displayName = 'Layer1';


const Layer2 = React.memo(function Layer2({ isMobile, reducedMotion }: LayerProps) {
  const wobble = !reducedMotion;
  const strength = 3.0; // Medium midground wobble
  return (
    <>
      {/* Static Layer */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0 }}>
            <defs>
              <pattern id="hatch-mid" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(250, 250, 250, 0.15)" strokeWidth="1.0" />
              </pattern>
              <pattern id="hatch-mid-black" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(26, 26, 46, 0.15)" strokeWidth="1.0" />
              </pattern>
            </defs>
            {/* Midground buildings (Solid fill masks Layer 1) */}
            <g className={styles.buildingGroup} stroke="var(--skyline-stroke-mid)" strokeWidth="1.2">
              {/* Far Left block */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M -1000 1080 L -1000 730 L -330 730 L -330 760 L -80 760 L -80 790 L 80 790 L 80 1080 Z" className={styles.bldMidFarLeft} />

              {/* Staggered double-tower (Left) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 120 1080 L 120 680 L 190 680 L 190 620 L 260 620 L 260 1080 Z" className={styles.bldMidStaggered} />
              {/* Window grid outlines on Left Tower */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="2.5 8">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="150" y1="700" x2="150" y2="1000" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="210" y1="640" x2="210" y2="1000" strokeDashoffset="3" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="2.5 8">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="170" y1="700" x2="170" y2="1000" strokeDashoffset="5" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="230" y1="640" x2="230" y2="1000" strokeDashoffset="1" />
                </g>
              </g>

              {/* Blocky Spire (Center-Left) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 330 1080 L 330 710 L 370 710 L 370 540 L 373 540 L 373 450 L 377 450 L 377 540 L 380 540 L 380 710 L 420 710 L 420 1080 Z" className={styles.bldMidBlockySpire} />

              {/* Flatiron wedge tower (Left-Center) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 475 1080 L 475 665 L 505 640 L 525 640 L 540 665 L 540 1080 Z" className={styles.bldMidFlatiron} />
              {/* Flatiron vertical wedge lines */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="505" y1="640" x2="505" y2="1080" stroke="var(--skyline-stroke-mid)" fill="none" opacity="0.8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="525" y1="640" x2="525" y2="1080" stroke="var(--skyline-stroke-mid)" fill="none" opacity="0.8" />
              <g stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" strokeDasharray="2 10" fill="none">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="490" y1="675" x2="490" y2="1080" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="515" y1="655" x2="515" y2="1080" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="530" y1="675" x2="530" y2="1080" />
              </g>

              {/* Citigroup-style Slanted Roof (Center-Right) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 680 1080 L 680 690 L 760 610 L 790 610 L 790 1080 Z" className={styles.bldMidCitigroup} />
              {/* Citibank window grids */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="3 10">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="700" y1="695" x2="700" y2="1000" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="740" y1="655" x2="740" y2="1000" strokeDashoffset="4" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="3 10">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="720" y1="675" x2="720" y2="1000" strokeDashoffset="7" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="760" y1="635" x2="760" y2="1000" strokeDashoffset="2" />
                </g>
              </g>

              {/* Block Tower with setbacks (Right-Mid) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1110 1080 L 1110 650 L 1140 650 L 1140 590 L 1210 590 L 1210 650 L 1240 650 L 1240 1080 Z" className={styles.bldMidSetbacks} />
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" opacity="0.8">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1175" y1="590" x2="1175" y2="530" />
                {/* Horizontal window lines */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1150" y1="605" x2="1200" y2="605" strokeDasharray="4 6" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1150" y1="620" x2="1200" y2="620" strokeDasharray="4 6" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1150" y1="635" x2="1200" y2="635" strokeDasharray="4 6" />
              </g>

              {/* Glowing Clock Tower (11:45 PM Detective Time) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1250 1080 L 1250 590 L 1300 590 L 1300 1080 Z" className={styles.bldMidClock} />
              {/* Top dome and spire cap */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1255 590 L 1255 570 Q 1275 550 1295 570 L 1295 590" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="550" x2="1275" y2="530" strokeWidth="1" />
              {/* Clock Face Circle */}
              <circle cx="1275" cy="580" r="10" fill="var(--skyline-clock-face)" stroke="var(--skyline-clock-border)" strokeWidth="1.2" />
              {/* Clock hands pointing at 11:45 */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="580" x2="1275" y2="572" stroke="var(--skyline-clock-details)" strokeWidth="1" /> {/* Minute hand */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="580" x2="1268" y2="583" stroke="var(--skyline-clock-details)" strokeWidth="1.2" /> {/* Hour hand */}
              {/* Clock Face Details (Roman marker lines at 12, 3, 6, 9) */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="571" x2="1275" y2="573" stroke="var(--skyline-clock-details)" strokeWidth="0.8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1284" y1="580" x2="1282" y2="580" stroke="var(--skyline-clock-details)" strokeWidth="0.8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="589" x2="1275" y2="587" stroke="var(--skyline-clock-details)" strokeWidth="0.8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1266" y1="580" x2="1268" y2="580" stroke="var(--skyline-clock-details)" strokeWidth="0.8" />
              {/* Ring border for aesthetic */}
              <circle cx="1275" cy="580" r="12" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
              {/* Clock Tower windows */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="4 8">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1265" y1="610" x2="1265" y2="1000" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="4 8">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1285" y1="610" x2="1285" y2="1000" strokeDashoffset="4" />
                </g>
              </g>

              {/* Extra window grid lights in midground layer */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="3 10">
                  {/* Staggered window lights on Citigroup slanted roof building */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="708" y1="700" x2="708" y2="1000" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="752" y1="660" x2="752" y2="1000" strokeDashoffset="5" />
                  {/* Staggered windows on Staggered double-tower left */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="140" y1="720" x2="140" y2="1000" strokeDashoffset="2" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="220" y1="670" x2="220" y2="1000" strokeDashoffset="6" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="3 10">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="732" y1="680" x2="732" y2="1000" strokeDashoffset="3" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="772" y1="640" x2="772" y2="1000" strokeDashoffset="1" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="160" y1="740" x2="160" y2="1000" strokeDashoffset="4" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="240" y1="690" x2="240" y2="1000" strokeDashoffset="7" />
                </g>
              </g>

              {/* Medium Tower with Water Tower on roof & Neon Sign (Right) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1490 1080 L 1490 670 L 1610 670 L 1610 1080 Z" className={styles.bldMidWaterTower} />
              {/* Hotel windows grid */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="2.5 8">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1510" y1="690" x2="1510" y2="1000" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1550" y1="690" x2="1550" y2="1000" strokeDashoffset="3" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1590" y1="690" x2="1590" y2="1000" strokeDashoffset="6" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="2.5 8">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1530" y1="690" x2="1530" y2="1000" strokeDashoffset="4" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1570" y1="690" x2="1570" y2="1000" strokeDashoffset="1" />
                </g>
              </g>
              {/* Roof-top details: Mechanical room */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1505 670 L 1505 645 L 1540 645 L 1540 670 Z" />

              {/* ── NEW: Slab Building (Gap 1a: x=565-640) ── */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 565 1080 L 565 690 L 640 690 L 640 1080 Z" className={styles.bldMidSlab} />
              {/* Roof cornice line */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="562" y1="690" x2="643" y2="690" strokeWidth="1.4" />
              {/* Horizontal floor bands */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" opacity="0.8">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="565" y1="730" x2="640" y2="730" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="565" y1="770" x2="640" y2="770" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="565" y1="810" x2="640" y2="810" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="565" y1="850" x2="640" y2="850" />
              </g>
              {/* Window columns */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="3 9">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="580" y1="700" x2="580" y2="1000" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="620" y1="700" x2="620" y2="1000" strokeDashoffset="5" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="3 9">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="600" y1="700" x2="600" y2="1000" strokeDashoffset="2" />
                </g>
              </g>

              {/* ── NEW: Narrow Tower (Gap 1b: x=650-680) ── */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 650 1080 L 650 620 L 658 580 L 672 580 L 680 620 L 680 1080 Z" className={styles.bldMidNarrow} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="650" y1="620" x2="680" y2="620" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="658" y1="580" x2="672" y2="580" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="665" y1="580" x2="665" y2="1080" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" strokeDasharray="2 8" fill="none" opacity="0.8" />
              {/* Antenna mast */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="665" y1="580" x2="665" y2="540" />

              {/* ── NEW: Wide Warehouse (Gap 2a: x=830-930) ── */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 830 1080 L 830 720 L 930 720 L 930 1080 Z" className={styles.bldMidWarehouse} />
              {/* Sawtooth roof detail */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 830 720 L 855 695 L 855 720 L 880 695 L 880 720 L 905 695 L 905 720 L 930 720" fill="var(--skyline-fill-bg)" />
              {/* Internal pillars */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" opacity="0.8">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="855" y1="720" x2="855" y2="1080" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="880" y1="720" x2="880" y2="1080" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="905" y1="720" x2="905" y2="1080" />
              </g>
              {/* Windows */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="4 10">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="845" y1="730" x2="845" y2="1000" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="895" y1="730" x2="895" y2="1000" strokeDashoffset="5" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="4 10">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="730" x2="870" y2="1000" strokeDashoffset="3" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="920" y1="730" x2="920" y2="1000" strokeDashoffset="7" />
                </g>
              </g>

              {/* ── NEW: Glass Office Tower (Gap 2b: x=950-1030) ── */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 950 1080 L 950 600 L 960 600 L 960 560 L 990 560 L 990 520 L 1000 520 L 1000 560 L 1030 560 L 1030 600 L 1040 600 L 1040 1080 Z" className={styles.bldMidGlass} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="950" y1="600" x2="1040" y2="600" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="960" y1="560" x2="1030" y2="560" />
              {/* Vertical mullions */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" strokeDasharray="3 7" opacity="0.8">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="970" y1="600" x2="970" y2="1080" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="990" y1="560" x2="990" y2="1080" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1010" y1="600" x2="1010" y2="1080" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1020" y1="600" x2="1020" y2="1080" />
              </g>
              {/* Windows */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="2.5 9">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="975" y1="610" x2="975" y2="1000" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1015" y1="610" x2="1015" y2="1000" strokeDashoffset="4" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="2.5 9">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="995" y1="570" x2="995" y2="1000" strokeDashoffset="6" />
                </g>
              </g>

              {/* ── NEW: Slim Spire (Gap 2c: x=1055-1095) ── */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1055 1080 L 1055 660 L 1065 660 L 1065 580 L 1075 500 L 1085 580 L 1085 660 L 1095 660 L 1095 1080 Z" className={styles.bldMidSlimSpire} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1055" y1="660" x2="1095" y2="660" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1065" y1="580" x2="1085" y2="580" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1075" y1="500" x2="1075" y2="580" />
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindowDim} strokeDasharray="2 10">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1075" y1="670" x2="1075" y2="1000" />
                </g>
              </g>

              {/* ── NEW: Far Right Tower (Gap 3a: x=1700-1780) ── */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1700 1080 L 1700 650 L 1730 650 L 1730 600 L 1750 600 L 1750 650 L 1780 650 L 1780 1080 Z" className={styles.bldMidFarRight} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1700" y1="650" x2="1780" y2="650" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1730" y1="600" x2="1750" y2="600" />
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" strokeDasharray="3 8" opacity="0.8">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1720" y1="660" x2="1720" y2="1080" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1740" y1="610" x2="1740" y2="1080" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1760" y1="660" x2="1760" y2="1080" />
              </g>
              {/* Windows */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="3 10">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1725" y1="660" x2="1725" y2="1000" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1755" y1="660" x2="1755" y2="1000" strokeDashoffset="4" />
                </g>
              </g>

              {/* ── NEW: Edge Building (Gap 3b: x=1850-1930) ── */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1850 1080 L 1850 680 L 1930 680 L 1930 720 L 2010 720 L 2010 660 L 2070 660 L 2070 700 L 2170 700 L 2170 650 L 2920 650 L 2920 1080 Z" className={styles.bldMidEdge} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1850" y1="680" x2="1930" y2="680" />
              {/* Rooftop mast */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1890" y1="680" x2="1890" y2="620" />
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none" strokeDasharray="2 8" opacity="0.8">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1870" y1="690" x2="1870" y2="1080" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1910" y1="690" x2="1910" y2="1080" />
              </g>
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindowDim} strokeDasharray="3 10">
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1880" y1="690" x2="1880" y2="1000" strokeDashoffset="3" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1900" y1="690" x2="1900" y2="1000" strokeDashoffset="7" />
                </g>
              </g>

              {/* Shadow overlay paths for wobbly hatching depth */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 155 1080 L 155 680 L 190 680 L 190 1080 Z" className={styles.shadowHatchMid} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 225 1080 L 225 620 L 260 620 L 260 1080 Z" className={styles.shadowHatchMid} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 375 1080 L 375 450 L 377 450 L 377 540 L 380 540 L 380 710 L 420 710 L 420 1080 Z" className={styles.shadowHatchMid} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 735 1080 L 735 635 L 760 610 L 790 610 L 790 1080 Z" className={styles.shadowHatchMid} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1175 1080 L 1175 590 L 1210 590 L 1210 650 L 1240 650 L 1240 1080 Z" className={styles.shadowHatchMid} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1275 1080 L 1275 590 L 1300 590 L 1300 1080 Z" className={styles.shadowHatchMid} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1550 1080 L 1550 670 L 1610 670 L 1610 1080 Z" className={styles.shadowHatchMid} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 602.5 1080 L 602.5 690 L 640 690 L 640 1080 Z" className={styles.shadowHatchMid} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 665 1080 L 665 580 L 672 580 L 680 620 L 680 1080 Z" className={styles.shadowHatchMid} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 880 1080 L 880 720 L 930 720 L 930 1080 Z" className={styles.shadowHatchMid} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 995 1080 L 995 560 L 1000 560 L 1030 560 L 1030 600 L 1040 600 L 1040 1080 Z" className={styles.shadowHatchMid} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1075 1080 L 1075 500 L 1085 580 L 1085 660 L 1095 660 L 1095 1080 Z" className={styles.shadowHatchMid} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1740 1080 L 1740 600 L 1750 600 L 1750 650 L 1780 650 L 1780 1080 Z" className={styles.shadowHatchMid} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1890 1080 L 1890 680 L 1930 680 L 1930 720 L 2010 720 L 2010 660 L 2070 660 L 2070 700 L 2170 700 L 2170 650 L 2920 650 L 2920 1080 Z" className={styles.shadowHatchMid} />
            </g>

            {/* Distant Background Shoreline / Docks at the Waterline (y = 938 to 950) */}
            <g className={styles.buildingGroup} stroke="var(--skyline-stroke-fg)" strokeWidth="1.8">
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0" fill="var(--skyline-fill-bg)">
                {/* Horizontal concrete seawall slab */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="-1000" y="938" width="3920" height="12" fill="var(--skyline-fill-bg)" className={styles.buildingGroup} stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />

                {/* Coping stone horizontal accent line */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="-1000" y1="944" x2="2920" y2="944" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />

                {/* Vertical concrete block joint lines */}
                {Array.from({ length: 160 }).map((_, i) => {
                  const x = -1000 + i * 25;
                  return x > -1000 && x < 2920 ? (
                    <WobblyLine key={`seawall-seam-${i}`} wobble={wobble} wobbleStrength={strength} x1={x} y1="938" x2={x} y2="950" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
                  ) : null;
                })}

                {/* Miniature dock streetlights */}
                {/* Spaced along the promenade: x = 485, 755, 985, 1225 */}
                {[485, 755, 985, 1225].map((x, i) => (
                  <g key={`dock-light-${i}`} stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" fill="none">
                    <WobblyLine wobble={wobble} wobbleStrength={strength} x1={x} y1="938" x2={x} y2="918" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d={`M ${x} 918 Q ${x} 914 ${x + 3} 914`} />
                    <circle cx={x + 3} cy={915} r="1" fill="var(--skyline-bulb-glow)" stroke="none" />
                  </g>
                ))}

                {/* Mooring Bollards spaced along the edge of the seawall */}
                {[510, 590, 710, 790, 955, 1035, 1115, 1195, 1320].map((x, i) => (
                  <g key={`bollard-${i}`} stroke="var(--skyline-stroke-fg)" strokeWidth="0.8">
                    <WobblyLine wobble={wobble} wobbleStrength={strength} x1={x - 2} y1="934" x2={x + 2} y2="934" strokeWidth="1.0" />
                    <WobblyLine wobble={wobble} wobbleStrength={strength} x1={x} y1="934" x2={x} y2="938" strokeWidth="1.4" />
                  </g>
                ))}

                {/* Stacked Cargo Crates on the docks */}
                {/* Left crates (near Warehouse 1) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="502" y="930" width="8" height="8" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="510" y="932" width="6" height="6" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="503" y="924" width="6" height="6" />
                {/* Right crates (near Warehouse 4) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="1318" y="930" width="8" height="8" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="1319" y="922" width="8" height="8" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="1326" y="932" width="6" height="6" />

                {/* Left side warehouses */}
                {/* Warehouse 1 (Pitched roof) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="470" y="918" width="30" height="20" />
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="470,918 485,906 500,918" />
                
                {/* Warehouse 2 (Flat roof with small skylight) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="575" y="922" width="35" height="16" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="588" y="918" width="9" height="4" />

                {/* Distant Gantry Crane 1 (Left) */}
                <g strokeWidth="0.8">
                  {/* Legs */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 520 938 L 535 893 L 550 938" fill="none" />
                  {/* Boom arm */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="508" y1="893" x2="565" y2="878" />
                  {/* Upper support tower & trusses */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="535" y1="893" x2="535" y2="868" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="535" y1="868" x2="565" y2="878" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="535" y1="868" x2="508" y2="893" />
                  {/* Cabin block */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="529" y="893" width="12" height="8" />
                </g>

                {/* Moored Cargo Ship (Center-Left) */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 625 938 L 690 938 L 685 926 L 630 926 Z" />
                {/* Superstructure & Funnel */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="668" y="912" width="14" height="14" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="674" y="904" width="4" height="8" />
                {/* Cargo containers on deck */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="636" y="918" width="12" height="8" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="650" y="918" width="12" height="8" />

                {/* Right side warehouses */}
                {/* Warehouse 3 (Pitched roof) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="1335" y="916" width="45" height="22" />
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="1335,916 1357.5,904 1380,916" />

                {/* Warehouse 4 (Flat roof) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="1385" y="922" width="30" height="16" />

                {/* Distant Gantry Crane 2 (Right) */}
                <g strokeWidth="0.8">
                  {/* Legs */}
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1260 938 L 1275 893 L 1290 938" fill="none" />
                  {/* Boom arm */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1235" y1="878" x2="1292" y2="893" />
                  {/* Upper support tower & trusses */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="893" x2="1275" y2="868" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="868" x2="1235" y2="878" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1275" y1="868" x2="1292" y2="893" />
                  {/* Cabin block */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1269" y="893" width="12" height="8" />
                </g>
              </g>

              {/* River water body under the bridge */}
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="-1000" y="950" width="3920" height="500" fill="var(--skyline-river-fill)" stroke="none" />

              {/* Chugging Tugboat (Moving behind buildings) */}
              <g className={styles.tugboatTransit}>
                <g className={styles.tugboatBobbing}>
                  <g className={styles.bldFgTugboat}>
                    {/* Tugboat hull */}
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1030 950 L 1070 950 L 1065 941 L 1035 941 Z" fill="var(--skyline-tugboat-hull)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
                    {/* Cabin */}
                    <WobblyRect wobble={wobble} wobbleStrength={strength} x="1040" y="933" width="16" height="8" fill="var(--skyline-tugboat-cabin)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
                    {/* Cabin window */}
                    <WobblyRect
                      wobble={wobble}
                      wobbleStrength={strength}
                      x="1043"
                      y="935"
                      width="4"
                      height="4"
                      className={styles.tugboatWindow}
                      fill="var(--skyline-bulb-glow)"
                      stroke="none"
                    />
                    {/* Smokestack */}
                    <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1052" y1="933" x2="1052" y2="926" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />
                    {/* Smoke puffs */}
                    <circle cx="1052" cy="924" r="1.5" className={styles.smokePuff1} fill="none" stroke="var(--skyline-tugboat-smoke)" strokeWidth="0.8" />
                    <circle cx="1052" cy="924" r="1.5" className={styles.smokePuff2} fill="none" stroke="var(--skyline-tugboat-smoke)" strokeWidth="0.8" />
                    <circle cx="1052" cy="924" r="1.5" className={styles.smokePuff3} fill="none" stroke="var(--skyline-tugboat-smoke)" strokeWidth="0.8" />
                    {/* Propeller wake wave ripples */}
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1026 947 Q 1010 945 995 948" className={styles.tugboatWake1} fill="none" stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" />
                    <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1020 951 Q 1005 950 988 953" className={styles.tugboatWake2} fill="none" stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" />
                  </g>
                </g>
              </g>
            </g>
      </svg>

      {/* Animated Layer (Unfiltered) */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {/* Asynchronous Flickering Window Cells (Layer 2 - Unfiltered for performance) */}
            <g strokeWidth="1.0" fill="none">
              {/* Staggered double-tower (Left) */}
              <line x1="170" y1="780" x2="170" y2="783" className={styles.windowFlicker2} />
              <line x1="210" y1="730" x2="210" y2="733" className={styles.windowFlicker4} />

              {/* Hotel building */}
              <line x1="1530" y1="720" x2="1530" y2="723" className={styles.windowFlicker1} />
              <line x1="1570" y1="760" x2="1570" y2="763" className={styles.windowFlicker3} />
            </g>
      </svg>
    </>
  );
});
Layer2.displayName = 'Layer2';


interface RunningCatProps {
  reducedMotion?: boolean;
}

const RunningCat: React.FC<RunningCatProps> = ({ reducedMotion }) => {
  const [state, setState] = useState<
    'sitting' | 'standing' | 'walking' | 'jumping' | 'landing' | 'running' | 'hidden' | 'returning' | 'jumping_up' | 'landing_up' | 'walking_back' | 'sitting_down'
  >('sitting');
  const [frameIndex, setFrameIndex] = useState(0);
  const [posX, setPosX] = useState(320);
  const [posY, setPosY] = useState(750);

  const ticksRef = useRef(0);
  const stateRef = useRef(state);
  const catRef = useRef<SVGGElement>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Global mousemove and click detection to bypass browser pointer-event bugs (especially Safari parent pointer-events: none bug)
  useEffect(() => {
    if (reducedMotion) return;

    const handleGlobalInteraction = (e: MouseEvent) => {
      if (stateRef.current !== 'sitting') return;
      const rect = catRef.current?.getBoundingClientRect();
      if (!rect) return;

      const padding = 15; // px hover boundary padding
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const isOver = 
        mouseX >= rect.left - padding &&
        mouseX <= rect.right + padding &&
        mouseY >= rect.top - padding &&
        mouseY <= rect.bottom + padding;

      if (isOver) {
        setState('standing');
      }
    };

    window.addEventListener('mousemove', handleGlobalInteraction, { capture: true, passive: true });
    window.addEventListener('click', handleGlobalInteraction, { capture: true, passive: true });

    return () => {
      window.removeEventListener('mousemove', handleGlobalInteraction, { capture: true });
      window.removeEventListener('click', handleGlobalInteraction, { capture: true });
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    const interval = setInterval(() => {
      const currentState = stateRef.current;

      if (currentState === 'sitting') {
        ticksRef.current = 0;
        return;
      }

      ticksRef.current++;
      const ticks = ticksRef.current;

      if (currentState === 'standing') {
        if (ticks >= 10) {
          ticksRef.current = 0;
          setState('walking');
        }
      } else if (currentState === 'walking') {
        setPosX((x) => x - 3);
        setFrameIndex((f) => (f + 1) % 2);
        if (ticks >= 10) {
          ticksRef.current = 0;
          setState('jumping');
        }
      } else if (currentState === 'jumping') {
        const t = ticks;
        const tMax = 8;

        const nextX = 290 - (t / tMax) * 30;
        const yLinear = 750 + (t / tMax) * 70;
        const yArc = 20 * Math.sin(Math.PI * (t / tMax));
        const nextY = yLinear - yArc;

        setPosX(nextX);
        setPosY(nextY);

        if (t >= tMax) {
          ticksRef.current = 0;
          setPosX(260);
          setPosY(820);
          setState('landing');
        }
      } else if (currentState === 'landing') {
        if (ticks >= 4) {
          ticksRef.current = 0;
          setState('running');
        }
      } else if (currentState === 'running') {
        setPosX((x) => Math.max(-50, x - 12));
        setFrameIndex((f) => (f + 1) % 4);

        if (ticks >= 26) {
          ticksRef.current = 0;
          setState('hidden');
        }
      } else if (currentState === 'hidden') {
        if (ticks >= 40) { // 3.2 seconds delay hidden off-screen
          ticksRef.current = 0;
          setPosX(-50);
          setPosY(820);
          setState('returning');
        }
      } else if (currentState === 'returning') {
        setPosX((x) => Math.min(260, x + 3));
        setFrameIndex((f) => (f + 1) % 2);

        if (ticks >= 103) { // 310px / 3 = 103 ticks
          ticksRef.current = 0;
          setPosX(260);
          setPosY(820);
          setState('jumping_up');
        }
      } else if (currentState === 'jumping_up') {
        const t = ticks;
        const tMax = 8;

        const nextX = 260 + (t / tMax) * 30;
        const yLinear = 820 - (t / tMax) * 70;
        const yArc = 20 * Math.sin(Math.PI * (t / tMax));
        const nextY = yLinear - yArc;

        setPosX(nextX);
        setPosY(nextY);

        if (t >= tMax) {
          ticksRef.current = 0;
          setPosX(290);
          setPosY(750);
          setState('landing_up');
        }
      } else if (currentState === 'landing_up') {
        if (ticks >= 4) {
          ticksRef.current = 0;
          setState('walking_back');
        }
      } else if (currentState === 'walking_back') {
        setPosX((x) => Math.min(320, x + 3));
        setFrameIndex((f) => (f + 1) % 2);

        if (ticks >= 10) {
          ticksRef.current = 0;
          setPosX(320);
          setPosY(750);
          setState('sitting_down');
        }
      } else if (currentState === 'sitting_down') {
        if (ticks >= 4) {
          ticksRef.current = 0;
          setState('sitting');
        }
      }
    }, 80);

    return () => clearInterval(interval);
  }, [reducedMotion]);

  const handleMouseEnter = () => {
    setState((s) => {
      if (s === 'sitting') {
        return 'standing';
      }
      return s;
    });
  };

  const renderFrame = () => {
    const catFill = 'var(--skyline-cat-fill)';
    const strokeColor = 'var(--skyline-stroke-fg)';
    const eyeColor = 'var(--skyline-cat-eyes)';

    const isFacingRight = [
      'returning',
      'jumping_up',
      'landing_up',
      'walking_back',
      'sitting_down'
    ].includes(state);

    const getElement = () => {
      switch (state) {
        case 'sitting':
        case 'sitting_down':
          return (
            <g>
              <path d="M -6 0 C -6 -12, 6 -12, 6 0 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <circle cx="0" cy="-22" r="5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="-4,-25 -7,-32 -2,-29" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="4,-25 7,-32 2,-29" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path
                d="M 5 -4 Q 12 -7 9 -15 T 13 -25"
                fill="none"
                stroke={strokeColor}
                strokeWidth="1.2"
                className={styles.catTail}
                style={{ transformOrigin: '5px -4px' }}
              />
              <g
                className={styles.catEyes}
                fill={eyeColor}
                stroke="none"
                style={{ transformOrigin: '0px -22.5px' }}
              >
                <circle cx="-1.5" cy="-22.5" r="0.8" />
                <circle cx="1.5" cy="-22.5" r="0.8" />
              </g>
            </g>
          );
        case 'standing':
          return (
            <g>
              <path d="M -8 -3 C -8 -11, 6 -11, 6 -3 L 5 0 L -6 0 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path d="M -5 -3 L -6 0 M -3 -3 L -4 0 M 3 -3 L 2 0 M 5 -3 L 4 0" fill="none" stroke={strokeColor} strokeWidth="1" />
              <circle cx="7" cy="-15" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="4.5,-17.5 3,-22 6.5,-20" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="9.5,-17.5 11,-22 8,-20" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path d="M -8 -8 Q -12 -12 -8 -16 T -11 -21" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <g fill={eyeColor} stroke="none">
                <circle cx="5.5" cy="-15.5" r="0.7" />
                <circle cx="8.5" cy="-15.5" r="0.7" />
              </g>
            </g>
          );
        case 'walking':
        case 'returning':
        case 'walking_back':
          const isAlt = frameIndex % 2 === 0;
          return (
            <g>
              <path d="M -7 -4 C -7 -11, 7 -11, 7 -4 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              {isAlt ? (
                <path d="M -5 -4 L -8 -1 M -3 -4 L -2 0 M 3 -4 L 2 0 M 5 -4 L 8 -1" fill="none" stroke={strokeColor} strokeWidth="1" />
              ) : (
                <path d="M -5 -4 L -4 0 M -3 -4 L -6 -1 M 3 -4 L 5 -1 M 5 -4 L 4 0" fill="none" stroke={strokeColor} strokeWidth="1" />
              )}
              <circle cx="-9" cy="-12" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="-11.5,-14.5 -13,-19 -10,-17" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="-7.5,-14.5 -6,-19 -9,-17" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path d="M 6 -8 Q 11 -7 14 -11" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <g fill={eyeColor} stroke="none">
                <circle cx="-10.5" cy="-12.5" r="0.7" />
                <circle cx="-7.5" cy="-12.5" r="0.7" />
              </g>
            </g>
          );
        case 'jumping':
        case 'jumping_up':
          return (
            <g>
              <path d="M -9 -5 C -7 -12, 5 -10, 7 -3 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path d="M 6 -3 L 10 1 M 4 -4 L 7 0 M -8 -5 L -12 -8 M -6 -5 L -10 -7" fill="none" stroke={strokeColor} strokeWidth="1" />
              <circle cx="-10" cy="-11" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="-12.5,-13 -14,-18 -11,-15.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="-8.5,-13 -7,-18 -10,-15.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path d="M 7 -6 Q 13 -4 17 -7" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <g fill={eyeColor} stroke="none">
                <circle cx="-11.5" cy="-11.5" r="0.7" />
                <circle cx="-8.5" cy="-11.5" r="0.7" />
              </g>
            </g>
          );
        case 'landing':
        case 'landing_up':
          return (
            <g>
              <path d="M -8 -2 C -8 -9, 6 -9, 6 -2 L 5 0 L -6 0 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path d="M -5 -2 L -7 0 M -3 -2 L -4 0 M -1 -2 L -2 0 M 3 -2 L 2 0" fill="none" stroke={strokeColor} strokeWidth="1" />
              <circle cx="-7" cy="-9" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="-9.5,-11.5 -11,-16 -8,-14" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <polygon points="-5.5,-11.5 -4,-16 -7,-14" fill={catFill} stroke={strokeColor} strokeWidth="1" />
              <path d="M 5 -4 Q 10 -2 9 -8" fill="none" stroke={strokeColor} strokeWidth="1.2" />
              <g fill={eyeColor} stroke="none">
                <circle cx="-8.5" cy="-9.5" r="0.7" />
                <circle cx="-5.5" cy="-9.5" r="0.7" />
              </g>
            </g>
          );
        case 'running':
          if (frameIndex === 0) {
            return (
              <g>
                <path d="M -8 -5 C -8 -12, 7 -12, 7 -5 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 6 -5 L 11 -1 M 4 -5 L 8 -2 M -7 -5 L -12 -1 M -5 -5 L -9 -2" fill="none" stroke={strokeColor} strokeWidth="1" />
                <circle cx="-10" cy="-13" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-12.5,-15.5 -14,-20 -11,-18" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-8.5,-15.5 -7,-20 -10,-18" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 7 -9 Q 13 -8 16 -12" fill="none" stroke={strokeColor} strokeWidth="1.2" />
                <g fill={eyeColor} stroke="none">
                  <circle cx="-11.5" cy="-13.5" r="0.7" />
                  <circle cx="-8.5" cy="-13.5" r="0.7" />
                </g>
              </g>
            );
          } else if (frameIndex === 1) {
            return (
              <g>
                <path d="M -7 -7 C -7 -14, 7 -14, 7 -7 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 4 -7 L 3 -1 M 2 -7 L 1 -2 M -4 -7 L -3 -1 M -2 -7 L -1 -2" fill="none" stroke={strokeColor} strokeWidth="1" />
                <circle cx="-9" cy="-15" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-11.5,-17.5 -13,-22.5 -10,-20" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-7.5,-17.5 -6,-22.5 -9,-20" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 6 -11 Q 12 -13 14 -9" fill="none" stroke={strokeColor} strokeWidth="1.2" />
                <g fill={eyeColor} stroke="none">
                  <circle cx="-10.5" cy="-15.5" r="0.7" />
                  <circle cx="-7.5" cy="-15.5" r="0.7" />
                </g>
              </g>
            );
          } else if (frameIndex === 2) {
            return (
              <g>
                <path d="M -6 -6 C -6 -13, 6 -13, 6 -6 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 4 -6 L 6 -3 M -4 -6 L -6 -3" fill="none" stroke={strokeColor} strokeWidth="1" />
                <circle cx="-8" cy="-14" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-10.5,-16.5 -12,-21.5 -9,-19" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-6.5,-16.5 -5,-21.5 -8,-19" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 5 -10 Q 9 -15 13 -12" fill="none" stroke={strokeColor} strokeWidth="1.2" />
                <g fill={eyeColor} stroke="none">
                  <circle cx="-9.5" cy="-14.5" r="0.7" />
                  <circle cx="-6.5" cy="-14.5" r="0.7" />
                </g>
              </g>
            );
          } else {
            return (
              <g>
                <path d="M -8 -8 C -8 -15, 8 -15, 8 -8 Z" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 5 -8 L 8 -5 M 3 -8 L 6 -6 M -6 -8 L -9 -5 M -4 -8 L -7 -6" fill="none" stroke={strokeColor} strokeWidth="1" />
                <circle cx="-10" cy="-16" r="4.5" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-12.5,-18.5 -14,-23.5 -11,-21" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <polygon points="-8.5,-18.5 -7,-23.5 -10,-21" fill={catFill} stroke={strokeColor} strokeWidth="1" />
                <path d="M 7 -12 Q 12 -15 15 -11" fill="none" stroke={strokeColor} strokeWidth="1.2" />
                <g fill={eyeColor} stroke="none">
                  <circle cx="-11.5" cy="-16.5" r="0.7" />
                  <circle cx="-8.5" cy="-16.5" r="0.7" />
                </g>
              </g>
            );
          }
        case 'hidden':
        default:
          return null;
      }
    };

    const element = getElement();
    if (!element) return null;

    if (isFacingRight) {
      return (
        <g transform="scale(-1, 1)">
          {element}
        </g>
      );
    }
    return element;
  };

  if (reducedMotion) {
    return (
      <g transform="translate(320, 750)">
        <path d="M -6 0 C -6 -12, 6 -12, 6 0 Z" fill="var(--skyline-cat-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        <circle cx="0" cy="-22" r="5" fill="var(--skyline-cat-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        <polygon points="-4,-25 -7,-32 -2,-29" fill="var(--skyline-cat-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        <polygon points="4,-25 7,-32 2,-29" fill="var(--skyline-cat-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        <path d="M 5 -4 Q 12 -7 9 -15 T 13 -25" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" className={styles.catTail} />
        <g className={styles.catEyes} fill="var(--skyline-cat-eyes)" stroke="none">
          <circle cx="-1.5" cy="-22.5" r="0.8" />
          <circle cx="1.5" cy="-22.5" r="0.8" />
        </g>
      </g>
    );
  }

  return (
    <g
      ref={catRef}
      transform={`translate(${posX}, ${posY})`}
      onMouseEnter={handleMouseEnter}
      onClick={handleMouseEnter}
      style={{ 
        cursor: state === 'sitting' ? 'pointer' : 'default',
        pointerEvents: 'auto'
      }}
    >
      <rect x="-20" y="-35" width="40" height="40" fill="black" opacity="0" style={{ pointerEvents: 'all' }} />
      {renderFrame()}
    </g>
  );
};


interface InteractiveGargoyleProps {
  reducedMotion?: boolean;
}

const InteractiveGargoyle: React.FC<InteractiveGargoyleProps> = ({ reducedMotion }) => {
  const [state, setState] = useState<
    'sitting' | 'blinking' | 'awakening' | 'leaping' | 'gliding_fg' | 'gliding_bg' | 'returning' | 'landing'
  >('sitting');
  const [posX, setPosX] = useState(1426);
  const [posY, setPosY] = useState(756);
  const [scale, setScale] = useState(1.0);
  const [opacity, setOpacity] = useState(1.0);
  const [frameIndex, setFrameIndex] = useState(0);

  const ticksRef = useRef(0);
  const stateRef = useRef(state);
  const gargoyleRef = useRef<SVGGElement>(null);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Global mousemove and click detection to bypass browser pointer-event bugs
  useEffect(() => {
    if (reducedMotion) return;

    const handleGlobalInteraction = (e: MouseEvent) => {
      if (stateRef.current !== 'sitting' && stateRef.current !== 'blinking') return;
      const rect = gargoyleRef.current?.getBoundingClientRect();
      if (!rect) return;

      const padding = 15; // px hover boundary padding
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const isOver = 
        mouseX >= rect.left - padding &&
        mouseX <= rect.right + padding &&
        mouseY >= rect.top - padding &&
        mouseY <= rect.bottom + padding;

      if (isOver) {
        setState('awakening');
      }
    };

    window.addEventListener('mousemove', handleGlobalInteraction, { capture: true, passive: true });
    window.addEventListener('click', handleGlobalInteraction, { capture: true, passive: true });

    return () => {
      window.removeEventListener('mousemove', handleGlobalInteraction, { capture: true });
      window.removeEventListener('click', handleGlobalInteraction, { capture: true });
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    const interval = setInterval(() => {
      const currentState = stateRef.current;
      ticksRef.current++;
      const ticks = ticksRef.current;

      const isFlying = ['leaping', 'gliding_fg', 'gliding_bg', 'returning', 'landing'].includes(currentState);
      if (isFlying) {
        setFrameIndex((f) => (f + 1) % 6);
      } else {
        setFrameIndex(0);
      }

      if (currentState === 'sitting') {
        // Periodically blink eyes
        if (ticks >= 80) { // every 6.4 seconds
          ticksRef.current = 0;
          setState('blinking');
        }
      } else if (currentState === 'blinking') {
        if (ticks >= 6) { // blink duration
          ticksRef.current = 0;
          setState('sitting');
        }
      } else if (currentState === 'awakening') {
        if (ticks >= 6) {
          ticksRef.current = 0;
          setState('leaping');
        }
      } else if (currentState === 'leaping') {
        // Leap up and left (parabolic path from right building corner)
        const t = ticks;
        const tMax = 8;
        
        const nextX = 1426 - (t / tMax) * 66;
        const yLinear = 756 - (t / tMax) * 76;
        const yArc = 35 * Math.sin(Math.PI * (t / tMax));
        const nextY = yLinear - yArc;

        setPosX(nextX);
        setPosY(nextY);
        setScale(1.0);
        setOpacity(1.0);

        if (t >= tMax) {
          ticksRef.current = 0;
          setPosX(1360);
          setPosY(680);
          setState('gliding_fg');
        }
      } else if (currentState === 'gliding_fg') {
        // Glide left and swoop low over the river deck with smooth scaling/opacity fade
        const nextX = posX - 20;
        setPosX(nextX);

        if (nextX > 200) {
          setScale(1.0);
          setOpacity(1.0);
          // Swoops low toward y: 930 at bridge center (x: 947), then climbs back up towards 400
          setPosY(680 + Math.sin((1360 - nextX) * 0.0038) * 250);
        } else {
          const ratio = Math.max(0, Math.min(1, (nextX - (-80)) / (200 - (-80))));
          setScale(0.35 + ratio * (1.0 - 0.35));
          setOpacity(0.55 + ratio * (1.0 - 0.55));
          setPosY(420 + ratio * (400 - 420));
        }

        if (nextX < -80) {
          ticksRef.current = 0;
          setPosX(-80);
          setPosY(420); // Fly higher in the background sky
          setScale(0.35);
          setOpacity(0.55);
          setState('gliding_bg');
        }
      } else if (currentState === 'gliding_bg') {
        // Distant small silhouette gliding right
        const nextX = posX + 10;
        setPosX(nextX);
        setPosY(420 + Math.sin(ticks * 0.15) * 15);
        setScale(0.35);
        setOpacity(0.55);

        if (nextX > 2000) {
          ticksRef.current = 0;
          setPosX(2000);
          setPosY(710);
          setState('returning');
        }
      } else if (currentState === 'returning') {
        // Return from right in foreground with smooth scaling back up
        const nextX = posX - 20;
        setPosX(nextX);
        const ratio = Math.max(0, Math.min(1, (nextX - 1488) / (2000 - 1488)));
        setScale(1.0 - ratio * (1.0 - 0.35));
        setOpacity(1.0 - ratio * (1.0 - 0.55));
        setPosY(710 - ratio * (710 - 420));

        if (nextX <= 1488) {
          ticksRef.current = 0;
          setState('landing');
        }
      } else if (currentState === 'landing') {
        const t = ticks;
        const tMax = 6;
        
        // Linear interpolation back to perch (1426, 756)
        const startX = 1488;
        const startY = posY;
        const nextX = startX - (t / tMax) * (startX - 1426);
        const nextY = startY - (t / tMax) * (startY - 756);

        setPosX(nextX);
        setPosY(nextY);
        setScale(1.0);
        setOpacity(1.0);

        if (t >= tMax) {
          ticksRef.current = 0;
          setPosX(1426);
          setPosY(756);
          setState('sitting');
        }
      }
    }, 80);

    return () => clearInterval(interval);
  }, [reducedMotion, posX, posY]);

  const handleMouseEnter = () => {
    setState((s) => {
      if (s === 'sitting' || s === 'blinking') {
        return 'awakening';
      }
      return s;
    });
  };

  const renderFrame = () => {
    const gargoyleFill = 'var(--skyline-gargoyle-fill)';
    const strokeColor = 'var(--skyline-stroke-fg)';
    const eyeColor = 'var(--skyline-gargoyle-eyes)';

    // Distant background scale down and color blend
    const isDistant = state === 'gliding_bg' || (state === 'gliding_fg' && scale < 0.6) || (state === 'returning' && scale < 0.6);
    const fillValue = isDistant ? 'var(--skyline-stroke-mid)' : gargoyleFill;
    const strokeValue = isDistant ? 'var(--skyline-stroke-bg)' : strokeColor;

    const isFacingRight = state === 'gliding_bg';

    const getElement = () => {
      switch (state) {
        case 'sitting':
        case 'blinking':
          return (
            <g>
              {/* Pedestal */}
              <path d="M -10 0 L 10 0 L 8 3 L -8 3 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* S-curve tail rising prominently to the side with spade tip */}
              <path d="M 5 -4 C 16 -1, 14 -12, 18 -18" fill="none" stroke={strokeValue} strokeWidth="1" />
              <path d="M 18 -18 L 14 -19 L 17 -15 Z" fill={fillValue} stroke={strokeValue} strokeWidth="0.8" />

              {/* Arching bat wings pointing down and out */}
              <path d="M -4 -11 C -8 -17, -18 -17, -22 -4 C -18 -1, -12 -3, -5 -4 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 4 -11 C 8 -17, 18 -17, 22 -4 C 18 -1, 12 -3, 5 -4 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* Wings Inner Rib Lines */}
              <path d="M -4 -11 C -10 -9, -18 -6, -22 -4" fill="none" stroke={strokeValue} strokeWidth="0.8" />
              <path d="M 4 -11 C 10 -9, 18 -6, 22 -4" fill="none" stroke={strokeValue} strokeWidth="0.8" />
              
              {/* Crouched Body & low hunched chest */}
              <path d="M -6 0 C -9 -5, -8 -13, 0 -14 C 8 -13, 9 -5, 6 0 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />

              {/* Knees pulled up wide */}
              <path d="M -6 0 C -14 -2, -13 -8, -5 -6" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 6 0 C 14 -2, 13 -8, 5 -6" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* Muscle lines/shoulders */}
              <path d="M -4 -8 C -7 -9, -7 -14, -3 -12" fill="none" stroke={strokeValue} strokeWidth="1" />
              <path d="M 4 -8 C 7 -9, 7 -14, 3 -12" fill="none" stroke={strokeValue} strokeWidth="1" />

              {/* Legs details */}
              <path d="M -5 -1 Q -8 -4 -4 -2" fill="none" stroke={strokeValue} strokeWidth="1.2" />
              <path d="M 5 -1 Q 8 -4 4 -2" fill="none" stroke={strokeValue} strokeWidth="1.2" />

              {/* Claws clutching pedestal outer corners */}
              <path d="M -8 0 L -11 3 L -9 4 L -7 2" fill="none" stroke={strokeValue} strokeWidth="1.2" />
              <path d="M 8 0 L 11 3 L 9 4 L 7 2" fill="none" stroke={strokeValue} strokeWidth="1.2" />

              {/* Head nestled between shoulders (squat) */}
              <path d="M -4 -13 C -6 -18, -4 -20, 0 -21 C 4 -20, 6 -18, 4 -13 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* Snout/fangs details */}
              <path d="M -1.8 -15 L 0 -13.5 L 1.8 -15" fill="none" stroke={strokeValue} strokeWidth="0.8" />

              {/* Pointed ears sticking out */}
              <path d="M -2.5 -18 L -6 -22 L -4 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 2.5 -18 L 6 -22 L 4 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* Coiled ram horns wrapping around ears */}
              <path d="M -1.5 -19 C -5 -21, -8 -17, -6 -14 C -5 -13, -3 -15, -1.8 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 1.5 -19 C 5 -21, 8 -17, 6 -14 C 5 -13, 3 -15, 1.8 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />

              {/* Eyes */}
              <g
                className={state === 'blinking' ? styles.gargoyleEyes : ''}
                fill={eyeColor}
                stroke="none"
              >
                <circle cx="-1.5" cy="-16.5" r="0.7" />
                <circle cx="1.5" cy="-16.5" r="0.7" />
              </g>
            </g>
          );
        case 'awakening':
          return (
            <g>
              {/* Pedestal */}
              <path d="M -10 0 L 10 0 L 8 3 L -8 3 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* S-curve tail rising prominently to the side with spade tip */}
              <path d="M 5 -4 C 16 -1, 14 -12, 18 -18" fill="none" stroke={strokeValue} strokeWidth="1" />
              <path d="M 18 -18 L 14 -19 L 17 -15 Z" fill={fillValue} stroke={strokeValue} strokeWidth="0.8" />

              {/* Wings unfolding high */}
              <path d="M -4 -15 C -25 -18, -25 -2, -10 2 C -10 -4, -6 -10, -4 -15 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 4 -15 C 25 -18, 25 -2, 10 2 C 10 -4, 6 -10, 4 -15 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M -4 -15 C -15 -10, -17 -3, -10 2" fill="none" stroke={strokeValue} strokeWidth="0.8" />
              <path d="M 4 -15 C 15 -10, 17 -3, 10 2" fill="none" stroke={strokeValue} strokeWidth="0.8" />
              
              {/* Crouched Body & low hunched chest */}
              <path d="M -6 0 C -9 -5, -8 -13, 0 -14 C 8 -13, 9 -5, 6 0 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />

              {/* Knees pulled up wide */}
              <path d="M -6 0 C -14 -2, -13 -8, -5 -6" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 6 0 C 14 -2, 13 -8, 5 -6" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* Muscle lines/shoulders */}
              <path d="M -4 -8 C -7 -9, -7 -14, -3 -12" fill="none" stroke={strokeValue} strokeWidth="1" />
              <path d="M 4 -8 C 7 -9, 7 -14, 3 -12" fill="none" stroke={strokeValue} strokeWidth="1" />

              {/* Legs details */}
              <path d="M -5 -1 Q -8 -4 -4 -2" fill="none" stroke={strokeValue} strokeWidth="1.2" />
              <path d="M 5 -1 Q 8 -4 4 -2" fill="none" stroke={strokeValue} strokeWidth="1.2" />

              {/* Claws clutching pedestal outer corners */}
              <path d="M -8 0 L -11 3 L -9 4 L -7 2" fill="none" stroke={strokeValue} strokeWidth="1.2" />
              <path d="M 8 0 L 11 3 L 9 4 L 7 2" fill="none" stroke={strokeValue} strokeWidth="1.2" />

              {/* Head nestled between shoulders (squat) */}
              <path d="M -4 -13 C -6 -18, -4 -20, 0 -21 C 4 -20, 6 -18, 4 -13 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* Snout/fangs details */}
              <path d="M -1.8 -15 L 0 -13.5 L 1.8 -15" fill="none" stroke={strokeValue} strokeWidth="0.8" />

              {/* Pointed ears sticking out */}
              <path d="M -2.5 -18 L -6 -22 L -4 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 2.5 -18 L 6 -22 L 4 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              
              {/* Coiled ram horns wrapping around ears */}
              <path d="M -1.5 -19 C -5 -21, -8 -17, -6 -14 C -5 -13, -3 -15, -1.8 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
              <path d="M 1.5 -19 C 5 -21, 8 -17, 6 -14 C 5 -13, 3 -15, 1.8 -18 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />

              {/* Glowing Eyes */}
              <g className={styles.gargoyleEyesAwake} stroke="none">
                <circle cx="-1.5" cy="-16.5" r="0.9" />
                <circle cx="1.5" cy="-16.5" r="0.9" />
              </g>
            </g>
          );
        case 'leaping':
        case 'gliding_fg':
        case 'gliding_bg':
        case 'returning':
        case 'landing': {
          const isFastFlap = state === 'leaping' || state === 'returning' || state === 'landing';
          const isWingUp = isFastFlap 
            ? frameIndex % 2 === 0 
            : Math.floor(frameIndex / 3) === 0;

          return (
            <g>
              {isWingUp ? (
                <>
                  {/* Wings fully spread for flight - Scalloped Gothic shape */}
                  <path d="M -3 -12 C -24 -26, -38 -18, -44 -6 C -37 -3, -29 -8, -23 -3 C -18 1, -10 -1, -3 -10 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
                  <path d="M 3 -12 C 24 -26, 38 -18, 44 -6 C 37 -3, 29 -8, 22 -3 C 18 1, 10 -1, 3 -10 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
                  
                  {/* Wing structural ribs */}
                  <path d="M -3 -12 C -18 -12, -29 -8, -44 -6" fill="none" stroke={strokeValue} strokeWidth="0.8" />
                  <path d="M -3 -12 C -15 -8, -21 -4, -23 -3" fill="none" stroke={strokeValue} strokeWidth="0.8" />
                  <path d="M 3 -12 C 18 -12, 29 -8, 44 -6" fill="none" stroke={strokeValue} strokeWidth="0.8" />
                  <path d="M 3 -12 C 15 -8, 21 -4, 22 -3" fill="none" stroke={strokeValue} strokeWidth="0.8" />
                </>
              ) : (
                <>
                  {/* Wings flapped down for flight */}
                  <path d="M -3 -12 C -24 -6, -38 2, -44 10 C -37 11, -29 6, -23 9 C -18 10, -10 5, -3 -10 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
                  <path d="M 3 -12 C 24 -6, 38 2, 44 10 C 37 11, 29 6, 23 9 C 18 10, 10 5, 3 -10 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
                  
                  {/* Wing structural ribs for flapped state */}
                  <path d="M -3 -12 C -18 -4, -29 4, -44 10" fill="none" stroke={strokeValue} strokeWidth="0.8" />
                  <path d="M -3 -12 C -15 -2, -21 5, -23 9" fill="none" stroke={strokeValue} strokeWidth="0.8" />
                  <path d="M 3 -12 C 18 -4, 29 4, 44 10" fill="none" stroke={strokeValue} strokeWidth="0.8" />
                  <path d="M 3 -12 C 15 -2, 21 5, 22 9" fill="none" stroke={strokeValue} strokeWidth="0.8" />
                </>
              )}

              {/* Stretched gliding body */}
              <path d="M -16 -4 C -14 -12, 12 -12, 14 -4 C 10 -2, -12 -2, -16 -4 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />

              {/* Head facing forward / profile snout */}
              <g transform="translate(-16, -6)">
                <path d="M 0 2 C -4 -2, -5 -9, 0 -8 C 5 -7, 6 -1, 0 2 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
                <path d="M -2.5 -5 L -5 -11 L -1 -8 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
                <path d="M 2.5 -5 L 5 -11 L 1 -8 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
                
                {/* Glowing Profile Eye */}
                {!isDistant && (
                  <g className={styles.gargoyleEyesAwake} stroke="none">
                    <circle cx="-1.5" cy="-2.5" r="0.9" />
                  </g>
                )}
              </g>

              {/* Legs tucked in back */}
              <path d="M 10 -4 C 14 -3, 15 2, 11 3" fill="none" stroke={strokeValue} strokeWidth="1" />
              
              {/* Tail trailing behind with spade */}
              <path d="M 14 -6 Q 24 -12, 28 -7" fill="none" stroke={strokeValue} strokeWidth="1" />
              <path d="M 28 -7 L 25 -4 L 31 -6 Z" fill={fillValue} stroke={strokeValue} strokeWidth="1" />
            </g>
          );
        }
        default:
          return null;
      }
    };

    const element = getElement();
    if (!element) return null;

    let transformStr = `scale(${scale})`;
    if (isFacingRight) {
      transformStr += ' scale(-1, 1)';
    }

    return (
      <g transform={transformStr}>
        {element}
      </g>
    );
  };

  if (reducedMotion) {
    // Renders static stone gargoyle state
    return (
      <g transform="translate(1426, 756)">
        {/* Pedestal */}
        <path d="M -10 0 L 10 0 L 8 3 L -8 3 Z" fill="var(--skyline-gargoyle-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        
        {/* S-curve tail rising prominently to the side with spade tip */}
        <path d="M 5 -4 C 16 -1, 14 -12, 18 -18" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        <path d="M 18 -18 L 14 -19 L 17 -15 Z" fill="var(--skyline-gargoyle-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />

        {/* Arching bat wings pointing down and out */}
        <path d="M -4 -11 C -8 -17, -18 -17, -22 -4 C -18 -1, -12 -3, -5 -4 Z" fill="var(--skyline-gargoyle-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        <path d="M 4 -11 C 8 -17, 18 -17, 22 -4 C 18 -1, 12 -3, 5 -4 Z" fill="var(--skyline-gargoyle-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        
        {/* Wings Inner Rib Lines */}
        <path d="M -4 -11 C -10 -9, -18 -6, -22 -4" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
        <path d="M 4 -11 C 10 -9, 18 -6, 22 -4" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
        
        {/* Crouched Body & low hunched chest */}
        <path d="M -6 0 C -9 -5, -8 -13, 0 -14 C 8 -13, 9 -5, 6 0 Z" fill="var(--skyline-gargoyle-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        
        {/* Knees pulled up wide */}
        <path d="M -6 0 C -14 -2, -13 -8, -5 -6" fill="var(--skyline-gargoyle-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        <path d="M 6 0 C 14 -2, 13 -8, 5 -6" fill="var(--skyline-gargoyle-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        
        {/* Muscle lines/shoulders */}
        <path d="M -4 -8 C -7 -9, -7 -14, -3 -12" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        <path d="M 4 -8 C 7 -9, 7 -14, 3 -12" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        
        {/* Legs details */}
        <path d="M -5 -1 Q -8 -4 -4 -2" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />
        <path d="M 6 -1 Q 8 -4 4 -2" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />
        
        {/* Claws clutching pedestal outer corners */}
        <path d="M -8 0 L -11 3 L -9 4 L -7 2" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />
        <path d="M 8 0 L 11 3 L 9 4 L 7 2" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />

        {/* Head nestled between shoulders (squat) */}
        <path d="M -4 -13 C -6 -18, -4 -20, 0 -21 C 4 -20, 6 -18, 4 -13 Z" fill="var(--skyline-gargoyle-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        
        {/* Snout/fangs details */}
        <path d="M -1.8 -15 L 0 -13.5 L 1.8 -15" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />

        {/* Pointed ears sticking out */}
        <path d="M -2.5 -18 L -6 -22 L -4 -18 Z" fill="var(--skyline-gargoyle-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        <path d="M 2.5 -18 L 6 -22 L 4 -18 Z" fill="var(--skyline-gargoyle-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        
        {/* Coiled ram horns wrapping around ears */}
        <path d="M -1.5 -19 C -5 -21, -8 -17, -6 -14 C -5 -13, -3 -15, -1.8 -18 Z" fill="var(--skyline-gargoyle-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
        <path d="M 1.5 -19 C 5 -21, 8 -17, 6 -14 C 5 -13, 3 -15, 1.8 -18 Z" fill="var(--skyline-gargoyle-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />

        {/* Eyes */}
        <g fill="var(--skyline-gargoyle-eyes)" opacity="0.6" stroke="none">
          <circle cx="-1.5" cy="-16.5" r="0.8" />
          <circle cx="1.5" cy="-16.5" r="0.8" />
        </g>
      </g>
    );
  }

  return (
    <g
      ref={gargoyleRef}
      transform={`translate(${posX}, ${posY})`}
      onMouseEnter={handleMouseEnter}
      onClick={handleMouseEnter}
      style={{
        cursor: (state === 'sitting' || state === 'blinking') ? 'pointer' : 'default',
        pointerEvents: 'auto',
        opacity
      }}
    >
      <rect x="-35" y="-35" width="70" height="45" fill="black" opacity="0" style={{ pointerEvents: 'all' }} />
      {renderFrame()}
    </g>
  );
};


const Layer3 = React.memo(function Layer3({ isMobile, reducedMotion }: LayerProps) {
  const wobble = !reducedMotion;
  const strength = 4.0; // Heavy foreground wobbly brush style
  return (
    <>
      {/* Static Layer */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0 }}>
            <defs>
              {/* Fog Mist Vertical Linear Gradient */}
              <linearGradient id="fogGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(250, 250, 250, 0.15)" />
                <stop offset="50%" stopColor="rgba(250, 250, 250, 0.06)" />
                <stop offset="100%" stopColor="rgba(250, 250, 250, 0)" />
              </linearGradient>

              {/* Downward Light Bulb Gradient */}
              <linearGradient id="downwardLightGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.55)" />
                <stop offset="50%" stopColor="rgba(255, 255, 255, 0.2)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
              </linearGradient>

              {/* Downward Light Bulb Gradient Popart */}
              <linearGradient id="downwardLightGradPopart" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(255, 234, 0, 0.5)" />
                <stop offset="50%" stopColor="rgba(255, 234, 0, 0.15)" />
                <stop offset="100%" stopColor="rgba(255, 234, 0, 0)" />
              </linearGradient>

              {/* Billboard Spotlight Gradient */}
              <linearGradient id="leftLightGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(250, 250, 250, 0.15)" />
                <stop offset="60%" stopColor="rgba(250, 250, 250, 0.04)" />
                <stop offset="100%" stopColor="rgba(250, 250, 250, 0)" />
              </linearGradient>

              {/* Billboard Spotlight Gradient Popart */}
              <linearGradient id="leftLightGradPopart" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(255, 64, 129, 0.25)" />
                <stop offset="60%" stopColor="rgba(255, 64, 129, 0.06)" />
                <stop offset="100%" stopColor="rgba(255, 64, 129, 0)" />
              </linearGradient>

              <pattern id="hatch-fg" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(250, 250, 250, 0.22)" strokeWidth="1.2" />
              </pattern>

              <pattern id="hatch-fg-black" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(26, 26, 46, 0.22)" strokeWidth="1.2" />
              </pattern>
              
              {/* River Gradients */}
              <linearGradient id="riverGradPopart" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A1DEDC" />
                <stop offset="100%" stopColor="#7FB3D5" />
              </linearGradient>
              <linearGradient id="riverGradNoir" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#111116" />
                <stop offset="100%" stopColor="#070709" />
              </linearGradient>

              {/* Brick Mortar pattern */}
              <pattern id="brick-fg" width="24" height="12" patternUnits="userSpaceOnUse">
                {/* Horizontal mortar lines */}
                <line x1="0" y1="6" x2="24" y2="6" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <line x1="0" y1="12" x2="24" y2="12" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                {/* Vertical joints (Staggered row 1) */}
                <line x1="12" y1="0" x2="12" y2="6" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                {/* Vertical joints (Staggered row 2) */}
                <line x1="0" y1="6" x2="0" y2="12" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <line x1="24" y1="6" x2="24" y2="12" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
              </pattern>
            </defs>

             {/* Group A: Foreground Static Elements (Wobbled for hand-drawn look) */}
            <g className={styles.buildingGroup} stroke="var(--skyline-stroke-fg)" strokeWidth="1.8">
              
              {/* LEFT ROOFTOP SECTION */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M -1000 1250 L -1000 820 L 460 820 L 460 1250 Z" className={styles.bldFgLeftRoof} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M -1000 1250 L -1000 820 L 460 820 L 460 1250 Z" fill="url(#brick-fg)" stroke="none" pointerEvents="none" className={styles.brickOverlay} />

              {/* Left Parapet Brick Mortar Lines (Removed) */}
              
              {/* Retro TV Yagi Antenna on left rooftop */}
              <g stroke="var(--skyline-stroke-fg)" strokeWidth="1.5" fill="none">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="440" y1="820" x2="440" y2="750" />
                {/* Crossbars */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="425" y1="760" x2="455" y2="760" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="429" y1="772" x2="451" y2="772" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="784" x2="447" y2="784" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="436" y1="796" x2="444" y2="796" />
              </g>

              {/* Rooftop Water Puddle on left rooftop */}
              <ellipse cx="150" cy="820" rx="28" ry="2.5" fill="var(--skyline-puddle-fill)" stroke="var(--skyline-puddle-stroke)" strokeWidth="0.8" />

              {/* Left Rooftop Water Tank */}
              <g>
                {/* Trestle Support Legs */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="381" y1="820" x2="384" y2="792" strokeWidth="1.2" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="411" y1="820" x2="408" y2="792" strokeWidth="1.2" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="391" y1="820" x2="393" y2="792" strokeWidth="0.8" opacity="0.6" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="820" x2="399" y2="792" strokeWidth="0.8" opacity="0.6" />
                
                {/* Cross Bracing */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="384" y1="792" x2="409" y2="806" strokeWidth="0.8" opacity="0.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="408" y1="792" x2="383" y2="806" strokeWidth="0.8" opacity="0.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="383" y1="806" x2="411" y2="820" strokeWidth="0.8" opacity="0.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="409" y1="806" x2="381" y2="820" strokeWidth="0.8" opacity="0.5" />
                
                {/* Horizontal Struts */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="383" y1="806" x2="409" y2="806" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="382" y1="792" x2="410" y2="792" strokeWidth="1.6" />
                
                {/* Center Pipe */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="792" x2="396" y2="820" strokeWidth="2.2" />
                
                {/* Tank Barrel Body */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="380" y="748" width="32" height="44" className={styles.bldFgLeftWaterTankBody} />
                
                {/* Vertical Staves (Planks) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="384" y1="748" x2="384" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="388" y1="748" x2="388" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="392" y1="748" x2="392" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="748" x2="396" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="400" y1="748" x2="400" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="404" y1="748" x2="404" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="408" y1="748" x2="408" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                
                {/* Horizontal Steel Hoops */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="380" y1="753" x2="412" y2="753" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="380" y1="762" x2="412" y2="762" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="380" y1="771" x2="412" y2="771" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="380" y1="779" x2="412" y2="779" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="380" y1="786" x2="412" y2="786" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="380" y1="790" x2="412" y2="790" strokeWidth="0.8" />
                
                {/* Conical Roof */}
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="378,748 396,726 414,748" className={styles.bldFgLeftWaterTankRoof} />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="378" y2="748" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="384" y2="748" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="390" y2="748" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="396" y2="748" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="402" y2="748" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="408" y2="748" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="414" y2="748" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                
                {/* Finial Peak */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="396" y1="726" x2="396" y2="718" strokeWidth="1.2" />
                <circle cx="396" cy="718" r="1.2" fill="var(--skyline-stroke-fg)" stroke="none" />
                
                {/* Side Ladder */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="795" x2="375" y2="744" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="378" y1="795" x2="378" y2="744" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="748" x2="378" y2="748" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="752" x2="378" y2="752" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="756" x2="378" y2="756" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="760" x2="378" y2="760" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="764" x2="378" y2="764" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="768" x2="378" y2="768" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="772" x2="378" y2="772" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="776" x2="378" y2="776" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="780" x2="378" y2="780" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="784" x2="378" y2="784" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="788" x2="378" y2="788" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="375" y1="792" x2="378" y2="792" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
              </g>


              {/* Slanted Glass Skylight */}
              <g fill="var(--bld-fg-left-fill)" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2">
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="255,820 255,805 285,812 285,820" />
                {/* Glass pane partitions */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="265" y1="810" x2="265" y2="820" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="275" y1="815" x2="275" y2="820" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
                {/* Internal glow / light rays shining out */}
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="255,805 240,750 300,750 285,812" fill="var(--skyline-light-ray)" stroke="none" />
              </g>

              {/* Detective Billboard Support Frame & Sign (Static) */}
              <g>
                {/* Scaffold support frame */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="90" y1="820" x2="98" y2="760" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="170" y1="820" x2="162" y2="760" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="98" y1="760" x2="162" y2="760" stroke="var(--skyline-stroke-mid)" strokeWidth="1" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="98" y1="760" x2="170" y2="820" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" opacity="0.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="162" y1="760" x2="90" y2="820" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" opacity="0.5" />

                {/* Sign Board */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="80" y="700" width="100" height="60" rx="3" fill="var(--skyline-billboard-bg)" stroke="var(--skyline-stroke-fg)" strokeWidth="1.8" />
                {/* Border line */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="84" y="704" width="92" height="52" fill="none" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
                
                {/* Cocktail Glass Logo */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 104 718 L 124 718 L 114 734 Z" fill="none" stroke="var(--skyline-billboard-text)" strokeWidth="1.2" /> {/* Glass Bowl */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="114" y1="734" x2="114" y2="746" stroke="var(--skyline-billboard-text)" strokeWidth="1.5" /> {/* Stem */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="107" y1="746" x2="121" y2="746" stroke="var(--skyline-billboard-text)" strokeWidth="1.5" /> {/* Base */}
                
                <text x="154" y="728" textAnchor="middle" fontFamily="var(--font-code)" fontWeight="bold" fontSize="7.8" fill="var(--skyline-billboard-text)" stroke="none">NOIR</text>
                <text x="154" y="740" textAnchor="middle" fontFamily="var(--font-code)" fontWeight="bold" fontSize="7.8" fill="var(--skyline-billboard-text)" stroke="none">GIN</text>
              </g>

              {/* Rooftop Penthouse Brick Access Shed (Static part) */}
              <g className={styles.bldFgShed} stroke="var(--skyline-stroke-fg)" strokeWidth="1.8">
                {/* Main Shed Structure */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="290" y="750" width="65" height="70" />
                {/* Roof Cap */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="288" y1="750" x2="357" y2="750" />
                
                {/* Brick Mortar Details inside Shed (Removed) */}

                {/* Wooden Access Door */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="304" y="771" width="24" height="49" fill="var(--skyline-shed-door)" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />
                {/* Inset Panels */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="308" y="776" width="16" height="17" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="308" y="797" width="16" height="19" fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
                
                {/* Vintage Keyhole */}
                <circle cx="323" cy="798" r="1.2" fill="var(--skyline-stroke-fg)" stroke="none" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 322.5 798 L 321.5 801.5 L 324.5 801.5 Z" fill="var(--skyline-stroke-fg)" stroke="none" />

                {/* Light fixture */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="316" y1="750" x2="316" y2="762" stroke="var(--skyline-stroke-mid)" strokeWidth="1.0" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="314" y="762" width="4" height="3" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
                <circle cx="316" cy="767" r="2.2" fill="var(--skyline-bulb-glow)" stroke="none" />
                <circle cx="316" cy="767" r="2.6" fill="none" stroke="var(--skyline-stroke-fg)" strokeWidth="0.5" />
                {/* Light cone casting downwards */}
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="316,769 292,820 340,820" fill="var(--skyline-downward-light)" stroke="none" />
              </g>

              {/* Parapet Wall Cap details on left roof */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="-1000" y1="826" x2="460" y2="826" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="40" y1="820" x2="40" y2="1250" stroke="var(--skyline-stroke-fine)" strokeWidth="1" />
              
              {/* ── LEFT FACADE WINDOWS (Arched Top Row + Rectangular Grid) ── */}
              <g fill="var(--skyline-window-dark-fill)">
                {/* Row 1: Arched windows just below the parapet (y=840-870) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.2">
                  {/* Arched window 1 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="50" y="850" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 50 850 A 11 11 0 0 1 72 850" />
                  {/* Arched window 2 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="90" y="850" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 90 850 A 11 11 0 0 1 112 850" />
                  {/* Arched window 3 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="130" y="850" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 130 850 A 11 11 0 0 1 152 850" />
                  {/* Arched window 4 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="195" y="850" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 195 850 A 11 11 0 0 1 217 850" />
                  {/* Arched window 5 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="235" y="850" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 235 850 A 11 11 0 0 1 257 850" />
                  {/* Arched window 6 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="360" y="850" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 360 850 A 11 11 0 0 1 382 850" />
                  {/* Arched window 7 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="400" y="850" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 400 850 A 11 11 0 0 1 422 850" />
                </g>

                {/* Row 2: Rectangular windows (y=895-920) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="50" y="895" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="82" y="895" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="114" y="895" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="146" y="895" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="200" y="895" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="232" y="895" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="360" y="895" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="392" y="895" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="424" y="895" width="18" height="22" />
                  {/* Window mullions (center vertical bars) */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="59" y1="895" x2="59" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="91" y1="895" x2="91" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="123" y1="895" x2="123" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="895" x2="155" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="209" y1="895" x2="209" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="241" y1="895" x2="241" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="369" y1="895" x2="369" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="895" x2="401" y2="917" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="895" x2="433" y2="917" strokeWidth="0.6" />
                </g>

                {/* Row 3: Rectangular windows (y=940-962) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="50" y="940" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="82" y="940" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="114" y="940" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="146" y="940" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="200" y="940" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="232" y="940" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="360" y="940" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="392" y="940" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="424" y="940" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="59" y1="940" x2="59" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="91" y1="940" x2="91" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="123" y1="940" x2="123" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="940" x2="155" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="209" y1="940" x2="209" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="241" y1="940" x2="241" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="369" y1="940" x2="369" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="940" x2="401" y2="962" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="940" x2="433" y2="962" strokeWidth="0.6" />
                </g>

                {/* Row 4: Rectangular windows (y=985-1007) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="50" y="985" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="82" y="985" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="114" y="985" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="146" y="985" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="200" y="985" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="232" y="985" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="360" y="985" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="392" y="985" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="424" y="985" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="59" y1="985" x2="59" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="91" y1="985" x2="91" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="123" y1="985" x2="123" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="985" x2="155" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="209" y1="985" x2="209" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="241" y1="985" x2="241" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="369" y1="985" x2="369" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="985" x2="401" y2="1007" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="985" x2="433" y2="1007" strokeWidth="0.6" />
                </g>

                {/* Row 5: Rectangular windows (y=1030-1052) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="50" y="1030" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="82" y="1030" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="114" y="1030" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="146" y="1030" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="200" y="1030" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="232" y="1030" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="360" y="1030" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="392" y="1030" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="424" y="1030" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="59" y1="1030" x2="59" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="91" y1="1030" x2="91" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="123" y1="1030" x2="123" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="1030" x2="155" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="209" y1="1030" x2="209" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="241" y1="1030" x2="241" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="369" y1="1030" x2="369" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="1030" x2="401" y2="1052" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="1030" x2="433" y2="1052" strokeWidth="0.6" />
                </g>

                {/* Row 6: Rectangular windows (y=1075-1097) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="50" y="1075" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="82" y="1075" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="114" y="1075" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="146" y="1075" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="200" y="1075" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="232" y="1075" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="360" y="1075" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="392" y="1075" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="424" y="1075" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="59" y1="1075" x2="59" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="91" y1="1075" x2="91" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="123" y1="1075" x2="123" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="1075" x2="155" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="209" y1="1075" x2="209" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="241" y1="1075" x2="241" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="369" y1="1075" x2="369" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="1075" x2="401" y2="1097" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="1075" x2="433" y2="1097" strokeWidth="0.6" />
                </g>

                {/* Row 7: Rectangular windows (y=1120-1142) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="50" y="1120" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="82" y="1120" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="114" y="1120" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="146" y="1120" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="200" y="1120" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="232" y="1120" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="360" y="1120" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="392" y="1120" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="424" y="1120" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="59" y1="1120" x2="59" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="91" y1="1120" x2="91" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="123" y1="1120" x2="123" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="155" y1="1120" x2="155" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="209" y1="1120" x2="209" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="241" y1="1120" x2="241" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="369" y1="1120" x2="369" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="401" y1="1120" x2="401" y2="1142" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="433" y1="1120" x2="433" y2="1142" strokeWidth="0.6" />
                </g>

                {/* Decorative horizontal band / stringcourse between arched and rectangular rows */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="0" y1="885" x2="460" y2="885" stroke="var(--skyline-stroke-mid)" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="0" y1="930" x2="460" y2="930" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="0" y1="975" x2="460" y2="975" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="0" y1="1020" x2="460" y2="1020" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="0" y1="1065" x2="460" y2="1065" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="0" y1="1110" x2="460" y2="1110" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="0" y1="1155" x2="460" y2="1155" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
              </g>

              {/* ── LEFT FACADE FIRE ESCAPE (Zigzag Staircase) ── */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.2" fill="none">
                {/* Vertical structural rails (full height) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="270" y1="830" x2="270" y2="1250" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="340" y1="830" x2="340" y2="1250" />

                {/* Landing platforms (horizontal) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="878" x2="342" y2="878" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="925" x2="342" y2="925" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="970" x2="342" y2="970" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="1015" x2="342" y2="1015" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="1060" x2="342" y2="1060" strokeWidth="1.5" />

                {/* Railings (short verticals on each platform) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="870" x2="268" y2="878" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="870" x2="342" y2="878" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="917" x2="268" y2="925" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="917" x2="342" y2="925" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="962" x2="268" y2="970" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="962" x2="342" y2="970" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="1007" x2="268" y2="1015" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="1007" x2="342" y2="1015" strokeWidth="0.8" />
                {/* Top railing bars */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="870" x2="342" y2="870" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="917" x2="342" y2="917" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="962" x2="342" y2="962" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="1007" x2="342" y2="1007" strokeWidth="0.8" />

                {/* Zigzag diagonal ladders between platforms */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="335" y1="878" x2="275" y2="925" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="275" y1="925" x2="335" y2="970" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="335" y1="970" x2="275" y2="1015" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="275" y1="1015" x2="335" y2="1060" strokeWidth="1.0" />

                {/* Ladder rungs (small horizontal steps on diagonals) */}
                {/* Ladder 1: 335,878 → 275,925 */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="325" y1="886" x2="331" y2="882" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="315" y1="894" x2="321" y2="890" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="305" y1="902" x2="311" y2="898" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="295" y1="910" x2="301" y2="906" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="285" y1="918" x2="291" y2="914" strokeWidth="0.7" />
                {/* Ladder 2: 275,925 → 335,970 */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="285" y1="933" x2="279" y2="929" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="295" y1="941" x2="289" y2="937" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="305" y1="949" x2="299" y2="945" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="315" y1="957" x2="309" y2="953" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="325" y1="965" x2="319" y2="961" strokeWidth="0.7" />
                {/* Ladder 3: 335,970 → 275,1015 */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="325" y1="978" x2="331" y2="974" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="315" y1="986" x2="321" y2="982" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="305" y1="994" x2="311" y2="990" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="295" y1="1002" x2="301" y2="998" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="285" y1="1010" x2="291" y2="1006" strokeWidth="0.7" />
                {/* Ladder 4: 275,1015 → 335,1060 */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="285" y1="1023" x2="279" y2="1019" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="295" y1="1031" x2="289" y2="1027" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="305" y1="1039" x2="299" y2="1035" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="315" y1="1047" x2="309" y2="1043" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="325" y1="1055" x2="319" y2="1051" strokeWidth="0.7" />

                {/* Drop-down retractable bottom ladder segment */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="305" y1="1060" x2="305" y2="1250" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="302" y1="1065" x2="308" y2="1065" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="302" y1="1070" x2="308" y2="1070" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="302" y1="1075" x2="308" y2="1075" strokeWidth="0.7" />

                {/* Bracket supports attaching to wall */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="878" x2="262" y2="878" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="925" x2="262" y2="925" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="970" x2="262" y2="970" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="1015" x2="262" y2="1015" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="268" y1="1060" x2="262" y2="1060" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="878" x2="348" y2="878" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="925" x2="348" y2="925" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="970" x2="348" y2="970" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="1015" x2="348" y2="1015" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="342" y1="1060" x2="348" y2="1060" strokeWidth="1.5" />
              </g>

              {/* Rooftop Pipe Chimneys with Steam path generators */}
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="220" y="780" width="16" height="40" className={styles.bldFgChimney} />
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="215" y="775" width="26" height="6" className={styles.bldFgChimney} />

              <WobblyRect wobble={wobble} wobbleStrength={strength} x="360" y="760" width="22" height="60" className={styles.bldFgChimney} />
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="354" y="754" width="34" height="6" className={styles.bldFgChimney} />
              {/* Exhaust Fan Housing */}
              <ellipse cx="371" cy="750" rx="9" ry="4" fill="var(--skyline-fill-bg)" stroke="var(--skyline-stroke-mid)" strokeWidth="1" />

              {/* Gothic Corbel/Pedestal for Gargoyle at the corner of the right building */}
              <WobblyPath 
                wobble={wobble} 
                wobbleStrength={strength} 
                d="M 1416 760 C 1416 775, 1428 785, 1428 795 L 1438 795 C 1438 780, 1426 768, 1426 760 Z" 
                fill="var(--skyline-gargoyle-fill)" 
                stroke="var(--skyline-stroke-fg)" 
                strokeWidth="1.5" 
              />
              <WobblyRect 
                wobble={wobble} 
                wobbleStrength={strength} 
                x="1412" 
                y="756" 
                width="28" 
                height="5" 
                fill="var(--skyline-gargoyle-fill)" 
                stroke="var(--skyline-stroke-fg)" 
                strokeWidth="1.5" 
              />

              {/* RIGHT ROOFTOP SECTION */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1420 1250 L 1420 760 L 2920 760 L 2920 1250 Z" className={styles.bldFgRightRoof} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1420 1250 L 1420 760 L 2920 760 L 2920 1250 Z" fill="url(#brick-fg)" stroke="none" pointerEvents="none" className={styles.brickOverlay} />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="766" x2="2920" y2="766" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />

              {/* Right Parapet Brick Mortar Lines (Removed) */}

              {/* ── RIGHT FACADE WINDOWS (Arched Top Row + Rectangular Grid) ── */}
              <g fill="var(--skyline-window-dark-fill)">
                {/* Row 1: Arched windows below parapet (y=790-818) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.2">
                  {/* Arched window 1 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1440" y="790" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1440 790 A 11 11 0 0 1 1462 790" />
                  {/* Arched window 2 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1480" y="790" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1480 790 A 11 11 0 0 1 1502 790" />
                  {/* Arched window 3 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1520" y="790" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1520 790 A 11 11 0 0 1 1542 790" />
                  {/* Arched window 4 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1580" y="790" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1580 790 A 11 11 0 0 1 1602 790" />
                  {/* Arched window 5 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1620" y="790" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1620 790 A 11 11 0 0 1 1642 790" />
                  {/* Arched window 6 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1700" y="790" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1700 790 A 11 11 0 0 1 1722 790" />
                  {/* Arched window 7 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1740" y="790" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1740 790 A 11 11 0 0 1 1762 790" />
                  {/* Arched window 8 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1840" y="790" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1840 790 A 11 11 0 0 1 1862 790" />
                  {/* Arched window 9 */}
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1880" y="790" width="22" height="28" />
                  <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1880 790 A 11 11 0 0 1 1902 790" />
                </g>

                {/* Row 2: Rectangular windows (y=840-862) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1440" y="840" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1472" y="840" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1504" y="840" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1536" y="840" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1580" y="840" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1612" y="840" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1700" y="840" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1732" y="840" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1840" y="840" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1872" y="840" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1449" y1="840" x2="1449" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1481" y1="840" x2="1481" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1513" y1="840" x2="1513" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1545" y1="840" x2="1545" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1589" y1="840" x2="1589" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1621" y1="840" x2="1621" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1709" y1="840" x2="1709" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1741" y1="840" x2="1741" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1849" y1="840" x2="1849" y2="862" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1881" y1="840" x2="1881" y2="862" strokeWidth="0.6" />
                </g>

                {/* Row 3: Rectangular windows (y=885-907) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1440" y="885" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1472" y="885" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1504" y="885" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1536" y="885" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1580" y="885" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1612" y="885" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1700" y="885" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1732" y="885" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1840" y="885" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1872" y="885" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1449" y1="885" x2="1449" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1481" y1="885" x2="1481" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1513" y1="885" x2="1513" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1545" y1="885" x2="1545" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1589" y1="885" x2="1589" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1621" y1="885" x2="1621" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1709" y1="885" x2="1709" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1741" y1="885" x2="1741" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1849" y1="885" x2="1849" y2="907" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1881" y1="885" x2="1881" y2="907" strokeWidth="0.6" />
                </g>

                {/* Row 4: Rectangular windows (y=930-952) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1440" y="930" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1472" y="930" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1504" y="930" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1536" y="930" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1580" y="930" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1612" y="930" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1700" y="930" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1732" y="930" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1840" y="930" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1872" y="930" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1449" y1="930" x2="1449" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1481" y1="930" x2="1481" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1513" y1="930" x2="1513" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1545" y1="930" x2="1545" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1589" y1="930" x2="1589" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1621" y1="930" x2="1621" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1709" y1="930" x2="1709" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1741" y1="930" x2="1741" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1849" y1="930" x2="1849" y2="952" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1881" y1="930" x2="1881" y2="952" strokeWidth="0.6" />
                </g>

                {/* Row 5: Rectangular windows (y=975-997) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1440" y="975" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1472" y="975" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1504" y="975" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1536" y="975" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1580" y="975" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1612" y="975" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1700" y="975" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1732" y="975" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1840" y="975" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1872" y="975" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1449" y1="975" x2="1449" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1481" y1="975" x2="1481" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1513" y1="975" x2="1513" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1545" y1="975" x2="1545" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1589" y1="975" x2="1589" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1621" y1="975" x2="1621" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1709" y1="975" x2="1709" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1741" y1="975" x2="1741" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1849" y1="975" x2="1849" y2="997" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1881" y1="975" x2="1881" y2="997" strokeWidth="0.6" />
                </g>

                {/* Row 6: Rectangular windows (y=1020-1042) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1440" y="1020" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1472" y="1020" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1504" y="1020" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1536" y="1020" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1580" y="1020" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1612" y="1020" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1700" y="1020" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1732" y="1020" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1840" y="1020" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1872" y="1020" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1449" y1="1020" x2="1449" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1481" y1="1020" x2="1481" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1513" y1="1020" x2="1513" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1545" y1="1020" x2="1545" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1589" y1="1020" x2="1589" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1621" y1="1020" x2="1621" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1709" y1="1020" x2="1709" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1741" y1="1020" x2="1741" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1849" y1="1020" x2="1849" y2="1042" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1881" y1="1020" x2="1881" y2="1042" strokeWidth="0.6" />
                </g>

                {/* Row 7: Rectangular windows (y=1065-1087) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1440" y="1065" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1472" y="1065" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1504" y="1065" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1536" y="1065" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1580" y="1065" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1612" y="1065" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1700" y="1065" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1732" y="1065" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1840" y="1065" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1872" y="1065" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1449" y1="1065" x2="1449" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1481" y1="1065" x2="1481" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1513" y1="1065" x2="1513" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1545" y1="1065" x2="1545" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1589" y1="1065" x2="1589" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1621" y1="1065" x2="1621" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1709" y1="1065" x2="1709" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1741" y1="1065" x2="1741" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1849" y1="1065" x2="1849" y2="1087" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1881" y1="1065" x2="1881" y2="1087" strokeWidth="0.6" />
                </g>

                {/* Row 8: Rectangular windows (y=1110-1132) */}
                <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.0">
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1440" y="1110" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1472" y="1110" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1504" y="1110" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1536" y="1110" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1580" y="1110" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1612" y="1110" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1700" y="1110" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1732" y="1110" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1840" y="1110" width="18" height="22" />
                  <WobblyRect wobble={wobble} wobbleStrength={strength} x="1872" y="1110" width="18" height="22" />
                  {/* Mullions */}
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1449" y1="1110" x2="1449" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1481" y1="1110" x2="1481" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1513" y1="1110" x2="1513" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1545" y1="1110" x2="1545" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1589" y1="1110" x2="1589" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1621" y1="1110" x2="1621" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1709" y1="1110" x2="1709" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1741" y1="1110" x2="1741" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1849" y1="1110" x2="1849" y2="1132" strokeWidth="0.6" />
                  <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1881" y1="1110" x2="1881" y2="1132" strokeWidth="0.6" />
                </g>

                {/* Decorative horizontal stringcourse bands */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="828" x2="1920" y2="828" stroke="var(--skyline-stroke-mid)" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="873" x2="1920" y2="873" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="918" x2="1920" y2="918" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="963" x2="1920" y2="963" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="1008" x2="1920" y2="1008" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="1053" x2="1920" y2="1053" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="1098" x2="1920" y2="1098" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1420" y1="1143" x2="1920" y2="1143" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
              </g>

              {/* ── RIGHT FACADE FIRE ESCAPE (Zigzag Staircase) ── */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="1.2" fill="none">
                {/* Vertical structural rails (full height) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1660" y1="770" x2="1660" y2="1250" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1690" y1="770" x2="1690" y2="1250" />

                {/* Landing platforms (horizontal) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="818" x2="1692" y2="818" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="862" x2="1692" y2="862" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="907" x2="1692" y2="907" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="952" x2="1692" y2="952" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="997" x2="1692" y2="997" strokeWidth="1.5" />

                {/* Railings (short verticals on each platform) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="810" x2="1658" y2="818" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1692" y1="810" x2="1692" y2="818" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="854" x2="1658" y2="862" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1692" y1="854" x2="1692" y2="862" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="899" x2="1658" y2="907" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1692" y1="899" x2="1692" y2="907" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="944" x2="1658" y2="952" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1692" y1="944" x2="1692" y2="952" strokeWidth="0.8" />
                {/* Top railing bars */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="810" x2="1692" y2="810" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="854" x2="1692" y2="854" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="899" x2="1692" y2="899" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="944" x2="1692" y2="944" strokeWidth="0.8" />

                {/* Zigzag diagonal ladders between platforms */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1688" y1="818" x2="1662" y2="862" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1662" y1="862" x2="1688" y2="907" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1688" y1="907" x2="1662" y2="952" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1662" y1="952" x2="1688" y2="997" strokeWidth="1.0" />

                {/* Ladder rungs */}
                {/* Ladder 1: 1688,818 → 1662,862 */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1685" y1="826" x2="1681" y2="830" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1680" y1="834" x2="1676" y2="838" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1675" y1="842" x2="1671" y2="846" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1670" y1="850" x2="1666" y2="854" strokeWidth="0.7" />
                {/* Ladder 2: 1662,862 → 1688,907 */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1665" y1="870" x2="1669" y2="874" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1670" y1="878" x2="1674" y2="882" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1675" y1="886" x2="1679" y2="890" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1680" y1="894" x2="1684" y2="898" strokeWidth="0.7" />
                {/* Ladder 3: 1688,907 → 1662,952 */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1685" y1="915" x2="1681" y2="919" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1680" y1="923" x2="1676" y2="927" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1675" y1="931" x2="1671" y2="935" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1670" y1="939" x2="1666" y2="943" strokeWidth="0.7" />
                {/* Ladder 4: 1662,952 → 1688,997 */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1665" y1="960" x2="1669" y2="964" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1670" y1="968" x2="1674" y2="972" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1675" y1="976" x2="1679" y2="980" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1680" y1="984" x2="1684" y2="988" strokeWidth="0.7" />

                {/* Drop-down retractable bottom ladder */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1675" y1="997" x2="1675" y2="1020" strokeWidth="1.0" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1672" y1="1003" x2="1678" y2="1003" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1672" y1="1009" x2="1678" y2="1009" strokeWidth="0.7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1672" y1="1015" x2="1678" y2="1015" strokeWidth="0.7" />

                {/* Bracket supports attaching to wall */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="818" x2="1652" y2="818" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="862" x2="1652" y2="862" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="907" x2="1652" y2="907" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="952" x2="1652" y2="952" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1658" y1="997" x2="1652" y2="997" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1692" y1="818" x2="1698" y2="818" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1692" y1="862" x2="1698" y2="862" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1692" y1="907" x2="1698" y2="907" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1692" y1="952" x2="1698" y2="952" strokeWidth="1.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1692" y1="997" x2="1698" y2="997" strokeWidth="1.5" />
              </g>

              {/* Roof HVAC Unit */}
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="1750" y="715" width="65" height="45" className={styles.bldFgHvac} />
              {/* HVAC Grid */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1760" y1="725" x2="1805" y2="725" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1760" y1="735" x2="1805" y2="735" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1760" y1="745" x2="1805" y2="745" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />

              {/* Industrial Blower Unit (Static parts) */}
              <g className={styles.bldFgBlower} stroke="var(--skyline-stroke-fg)" strokeWidth="1.2">
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="1587" y="725" width="22" height="35" rx="1" />
                {/* Fan casing circle */}
                <circle cx="1598" cy="742" r="8" />

                {/* Exhaust Pipe Stack */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1598" y1="725" x2="1598" y2="717" stroke="var(--skyline-stroke-fg)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1595" y1="717" x2="1601" y2="717" stroke="var(--skyline-stroke-fg)" strokeWidth="1.5" />
              </g>

              {/* Rooftop Clothesline (Static posts & wire) */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="1" fill="none">
                {/* Left & Right Posts */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1640" y1="760" x2="1640" y2="710" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1705" y1="760" x2="1705" y2="710" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1635" y1="710" x2="1645" y2="710" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1700" y1="710" x2="1710" y2="710" />
                {/* Sagging Line */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1640 715 Q 1672 725 1705 715" strokeWidth="0.8" />
              </g>

              {/* Roof Chimney Duct for Steam */}
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="1860" y="700" width="18" height="60" className={styles.bldFgChimney} />
              <WobblyRect wobble={wobble} wobbleStrength={strength} x="1854" y="694" width="30" height="6" className={styles.bldFgChimney} />

              {/* Right Rooftop Water Tank */}
              <g>
                {/* Trestle Support Legs */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1445" y1="760" x2="1448" y2="725" strokeWidth="1.4" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1485" y1="760" x2="1482" y2="725" strokeWidth="1.4" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1457" y1="760" x2="1459" y2="725" strokeWidth="0.8" opacity="0.6" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1473" y1="760" x2="1471" y2="725" strokeWidth="0.8" opacity="0.6" />
                
                {/* Cross Bracing */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1448" y1="725" x2="1483" y2="742" strokeWidth="0.8" opacity="0.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1482" y1="725" x2="1447" y2="742" strokeWidth="0.8" opacity="0.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1447" y1="742" x2="1485" y2="760" strokeWidth="0.8" opacity="0.5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1483" y1="742" x2="1445" y2="760" strokeWidth="0.8" opacity="0.5" />
                
                {/* Horizontal Struts */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1447" y1="742" x2="1483" y2="742" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1446" y1="725" x2="1484" y2="725" strokeWidth="1.8" />
                
                {/* Center Pipe */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="725" x2="1465" y2="760" strokeWidth="2.5" />
                
                {/* Tank Barrel Body */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="1445" y="670" width="40" height="55" className={styles.bldFgRightWaterTankBody} />
                
                {/* Vertical Staves (Planks) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1450" y1="670" x2="1450" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1455" y1="670" x2="1455" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1460" y1="670" x2="1460" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="670" x2="1465" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1470" y1="670" x2="1470" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1475" y1="670" x2="1475" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1480" y1="670" x2="1480" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-fine)" />
                
                {/* Horizontal Steel Hoops */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1445" y1="676" x2="1485" y2="676" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1445" y1="686" x2="1485" y2="686" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1445" y1="697" x2="1485" y2="697" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1445" y1="707" x2="1485" y2="707" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1445" y1="716" x2="1485" y2="716" strokeWidth="0.8" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1445" y1="721" x2="1485" y2="721" strokeWidth="0.8" />
                
                {/* Conical Roof */}
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="1442,670 1465,642 1488,670" className={styles.bldFgRightWaterTankRoof} />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1442" y2="670" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1449" y2="670" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1457" y2="670" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1465" y2="670" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1473" y2="670" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1481" y2="670" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1488" y2="670" strokeWidth="0.8" stroke="var(--skyline-stroke-fine)" />
                
                {/* Finial Peak */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1465" y1="642" x2="1465" y2="632" strokeWidth="1.2" />
                <circle cx="1465" cy="632" r="1.5" fill="var(--skyline-stroke-fg)" stroke="none" />
                
                {/* Side Ladder */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="728" x2="1490" y2="666" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1493.5" y1="728" x2="1493.5" y2="666" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="670" x2="1493.5" y2="670" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="675" x2="1493.5" y2="675" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="680" x2="1493.5" y2="680" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="685" x2="1493.5" y2="685" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="690" x2="1493.5" y2="690" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="695" x2="1493.5" y2="695" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="700" x2="1493.5" y2="700" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="705" x2="1493.5" y2="705" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="710" x2="1493.5" y2="710" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="715" x2="1493.5" y2="715" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="720" x2="1493.5" y2="720" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="1490" y1="725" x2="1493.5" y2="725" strokeWidth="0.6" stroke="var(--skyline-stroke-mid)" />
              </g>

              {/* MIDDLE BRIDGE STRUCTURE (Fills the gap between rooftops) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 850 1250 L 850 780 L 870 730 L 890 730 L 910 780 L 910 1250 Z" className={styles.bldFgBridgeTower} />

              {/* Steel Plate Joint Seams on Tower Legs */}
              <WobblyPath 
                wobble={wobble}
                wobbleStrength={strength}
                d="M 850 750 L 870 750 M 890 750 L 910 750 M 850 780 L 870 780 M 890 780 L 910 780 M 850 810 L 870 810 M 890 810 L 910 810 M 850 840 L 870 840 M 890 840 L 910 840 M 850 870 L 870 870 M 890 870 L 910 870 M 850 900 L 870 900 M 890 900 L 910 900 M 850 930 L 870 930 M 890 930 L 910 930 M 860 730 L 860 935 M 900 730 L 900 935" 
                stroke="var(--skyline-stroke-fine)" 
                strokeWidth="0.8" 
                fill="none" 
              />

              {/* Bridge Tower Structural Steel Trusses (Extended above and below deck) */}
              <g stroke="var(--skyline-stroke-mid)" strokeWidth="0.9" fill="none">
                {/* Inner legs vertical lines */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="730" x2="870" y2="780" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="730" x2="890" y2="780" />
                
                {/* Upper Center Trusses (above deck) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="730" x2="890" y2="760" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="730" x2="870" y2="760" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="760" x2="890" y2="760" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="760" x2="890" y2="790" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="760" x2="870" y2="790" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="850" y1="790" x2="910" y2="790" strokeWidth="1.2" />

                {/* Left Leg Upper Diagonals */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="850" y1="790" x2="870" y2="850" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="790" x2="850" y2="850" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="850" y1="850" x2="870" y2="850" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="850" y1="850" x2="870" y2="910" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="850" x2="850" y2="910" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="850" y1="910" x2="870" y2="910" />

                {/* Right Leg Upper Diagonals */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="790" x2="910" y2="850" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="910" y1="790" x2="890" y2="850" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="850" x2="910" y2="850" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="850" x2="910" y2="910" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="910" y1="850" x2="890" y2="910" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="910" x2="910" y2="910" />

                {/* Lower Inner columns extending below deck */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="850" x2="870" y2="935" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="850" x2="890" y2="935" />

                {/* Lower Center Trusses (below deck, x=870-890) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="850" x2="890" y2="880" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="850" x2="870" y2="880" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="880" x2="890" y2="880" />
                
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="880" x2="890" y2="910" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="880" x2="870" y2="910" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="910" x2="890" y2="910" strokeWidth="1.2" />

                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="910" x2="890" y2="935" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="910" x2="870" y2="935" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="935" x2="890" y2="935" strokeWidth="1.4" />

                {/* Left Leg Lower Diagonals (x=850-870, y=910-935) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="850" y1="910" x2="870" y2="935" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="870" y1="910" x2="850" y2="935" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="850" y1="935" x2="870" y2="935" strokeWidth="1.2" />

                {/* Right Leg Lower Diagonals (x=890-910, y=910-935) */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="910" x2="910" y2="935" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="910" y1="910" x2="890" y2="935" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="890" y1="935" x2="910" y2="935" strokeWidth="1.2" />
              </g>

              {/* Decorative Art Deco Tower Crown Plates */}
              <g stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" fill="var(--skyline-fill-bg)">
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="864,730 896,730 896,726 864,726" />
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="871,726 889,726 889,720 871,720" />
                <WobblyPolygon wobble={wobble} wobbleStrength={strength} points="877,720 883,720 880,712" />
              </g>

              {/* Detailed double gothic arches */}
              <g fill="none">
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 865 840 A 12 25 0 0 1 895 840" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 868 840 A 9 20 0 0 1 892 840" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 865 910 A 12 25 0 0 1 895 910" stroke="var(--skyline-stroke-fg)" strokeWidth="1.2" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 868 910 A 9 20 0 0 1 892 910" stroke="var(--skyline-stroke-mid)" strokeWidth="0.8" />
              </g>


              {/* Concrete Pier / Caisson Base at the Waterline */}
              <g className={styles.bldFgBridgePier} stroke="var(--skyline-stroke-fg)" strokeWidth="1.5">
                {/* Stepped Block 1 (Top) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="842" y="935" width="76" height="15" rx="2" />
                {/* Stepped Block 2 (Middle, water contact) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="832" y="950" width="96" height="18" rx="3" />
                {/* Stepped Block 3 (Submerged Pier) */}
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="838" y="968" width="84" height="282" />
              </g>

              {/* Art Deco Recessed Panel Grooves on concrete base */}
              <g stroke="var(--skyline-stroke-fine)" strokeWidth="1.0" fill="none">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="860" y1="968" x2="860" y2="1250" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="880" y1="968" x2="880" y2="1250" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="900" y1="968" x2="900" y2="1250" />
                {/* Horizontal banding accents on concrete pier */}
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="990" x2="922" y2="990" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="1025" x2="922" y2="1025" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="1060" x2="922" y2="1060" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="1095" x2="922" y2="1095" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="1130" x2="922" y2="1130" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="1165" x2="922" y2="1165" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="1200" x2="922" y2="1200" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="838" y1="1235" x2="922" y2="1235" />
              </g>

              {/* Protective Harbor Dolphin Piles next to tower */}
              {/* Left dolphin piles */}
              <g className={styles.bldFgDolphinPiles} stroke="var(--skyline-stroke-mid)" strokeWidth="1">
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="783" y="934" width="4.5" height="50" rx="1.2" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="791" y="930" width="4.5" height="54" rx="1.2" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="787" y="926" width="4.5" height="58" rx="1.2" />
                {/* Steel cable wraps binding them */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 783 942 L 795.5 942 M 783 944 L 795.5 944 M 783 955 L 795.5 955 M 783 957 L 795.5 957" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" fill="none" />
              </g>
              {/* Right dolphin piles */}
              <g className={styles.bldFgDolphinPiles} stroke="var(--skyline-stroke-mid)" strokeWidth="1">
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="972" y="934" width="4.5" height="50" rx="1.2" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="964" y="930" width="4.5" height="54" rx="1.2" />
                <WobblyRect wobble={wobble} wobbleStrength={strength} x="968" y="926" width="4.5" height="58" rx="1.2" />
                {/* Steel cable wraps binding them */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 964 942 L 976.5 942 M 964 944 L 976.5 944 M 964 955 L 976.5 955 M 964 957 L 976.5 957" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" fill="none" />
              </g>

              {/* Stylized water reflection ripples under the concrete pier */}
              <g stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" fill="none">
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="810" y1="974" x2="950" y2="974" strokeDasharray="6 4" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="825" y1="984" x2="935" y2="984" strokeDasharray="5 5" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="840" y1="994" x2="920" y2="994" strokeDasharray="4 6" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="855" y1="1004" x2="905" y2="1004" strokeDasharray="3 7" />
                <WobblyLine wobble={wobble} wobbleStrength={strength} x1="865" y1="1014" x2="895" y2="1014" strokeDasharray="2 8" />
              </g>

              {/* Bridge Cables */}
              {/* Thick Main Cables */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 880 730 Q 670 820 460 850" fill="none" strokeWidth="2.2" stroke="var(--skyline-stroke-fg)" />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 880 730 Q 1150 820 1420 850" fill="none" strokeWidth="2.2" stroke="var(--skyline-stroke-fg)" />
              {/* Secondary parallel accent cables */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 880 726 Q 670 816 460 846" fill="none" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 880 726 Q 1150 816 1420 846" fill="none" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />

              {/* Cable clamps (nodes where suspenders connect) */}
              <g fill="var(--skyline-stroke-fg)" stroke="none">
                {/* Left side clamps */}
                <circle cx="500" cy="843.7" r="1.3" />
                <circle cx="530" cy="838.3" r="1.3" />
                <circle cx="560" cy="832.3" r="1.3" />
                <circle cx="590" cy="825.7" r="1.3" />
                <circle cx="620" cy="818.4" r="1.3" />
                <circle cx="650" cy="810.6" r="1.3" />
                <circle cx="680" cy="802.1" r="1.3" />
                <circle cx="710" cy="793.0" r="1.3" />
                <circle cx="740" cy="783.3" r="1.3" />
                <circle cx="770" cy="773.0" r="1.3" />
                <circle cx="800" cy="762.1" r="1.3" />
                <circle cx="830" cy="750.6" r="1.3" />

                {/* Right side clamps */}
                <circle cx="930" cy="746.2" r="1.3" />
                <circle cx="960" cy="755.3" r="1.3" />
                <circle cx="990" cy="764.2" r="1.3" />
                <circle cx="1020" cy="772.6" r="1.3" />
                <circle cx="1050" cy="780.7" r="1.3" />
                <circle cx="1080" cy="788.4" r="1.3" />
                <circle cx="1110" cy="795.8" r="1.3" />
                <circle cx="1140" cy="802.8" r="1.3" />
                <circle cx="1170" cy="809.4" r="1.3" />
                <circle cx="1200" cy="815.6" r="1.3" />
                <circle cx="1230" cy="821.5" r="1.3" />
                <circle cx="1260" cy="827.0" r="1.3" />
              </g>

              {/* Bridge Roadway Deck (Warren Truss/Steel Girder Structure) */}
              <g stroke="var(--skyline-stroke-fg)" fill="none">
                {/* Upper Deck Chord */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 460 850 Q 880 820 1420 850" strokeWidth="1.5" />
                {/* Lower Deck Chord */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 460 856 Q 880 826 1420 856" strokeWidth="1.5" />
                {/* Vertical Steel Posts (follow the curve) */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 480 848 L 480 854 M 500 847 L 500 853 M 520 845 L 520 851 M 540 843 L 540 849 M 560 841 L 560 847 M 580 839 L 580 845 M 600 837 L 600 843 M 620 835 L 620 841 M 640 833 L 640 839 M 660 831 L 660 837 M 680 830 L 680 836 M 700 828 L 700 834 M 720 827 L 720 833 M 740 825 L 740 831 M 760 824 L 760 830 M 780 823 L 780 829 M 800 822 L 800 828 M 820 821 L 820 827 M 840 820 L 840 826 M 920 820 L 920 826 M 940 821 L 940 827 M 960 822 L 960 828 M 980 823 L 980 829 M 1000 824 L 1000 830 M 1020 825 L 1020 831 M 1040 827 L 1040 833 M 1060 828 L 1060 834 M 1080 830 L 1080 836 M 1100 831 L 1100 837 M 1120 833 L 1120 839 M 1140 835 L 1140 841 M 1160 837 L 1160 843 M 1180 839 L 1180 845 M 1200 841 L 1200 847 M 1220 843 L 1220 849 M 1240 845 L 1240 851 M 1260 847 L 1260 853 M 1280 848 L 1280 854 M 1300 850 L 1300 856 M 1320 850 L 1320 856 M 1340 850 L 1340 856 M 1360 850 L 1360 856 M 1380 850 L 1380 856 M 1400 850 L 1400 856" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
                {/* Warren Truss Diagonals (calculated zigzags) */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 460 850.0 L 480 854.6 L 500 847.3 L 520 852.1 L 540 844.9 L 560 849.8 L 580 842.8 L 600 847.8 L 620 840.9 L 640 846.1 L 660 839.4 L 680 844.7 L 700 838.0 L 720 843.5 L 740 837.0 L 760 842.5 L 780 836.1 L 800 841.8 L 820 835.5 L 840 841.3" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 920 835.0 L 940 841.1 L 960 835.2 L 980 841.3 L 1000 835.5 L 1020 841.8 L 1040 836.1 L 1060 842.4 L 1080 836.8 L 1100 843.2 L 1120 837.7 L 1140 844.3 L 1160 838.8 L 1180 845.4 L 1200 840.1 L 1220 846.8 L 1240 841.5 L 1260 848.3 L 1280 843.1 L 1300 850.0 L 1320 844.9 L 1340 851.9 L 1360 846.8 L 1380 853.9 L 1400 848.9 L 1420 856.0" strokeWidth="0.8" stroke="var(--skyline-stroke-mid)" />
              </g>

              {/* Roadway traffic light trails (Static lines) */}
              <g stroke="none">
                {/* Outbound Traffic Light Trail (glowing headlights) */}
                <path d="M 460 852 Q 880 822 1420 852" fill="none" stroke="var(--skyline-traffic-headlight-trail)" strokeWidth="0.8" />
                {/* Inbound Traffic Light Trail (glowing taillights) */}
                <path d="M 460 854 Q 880 824 460 854" fill="none" stroke="var(--skyline-traffic-taillight-trail)" strokeWidth="0.8" />
              </g>

              {/* River waterline & Tugboat under the bridge (Static) */}
              <WobblyLine wobble={wobble} wobbleStrength={strength} x1="460" y1="950" x2="1420" y2="950" stroke="var(--skyline-stroke-fine)" strokeWidth="1" strokeDasharray="8 6" />
              
              {/* Stylized River Waves/Ripples across the river */}
              <g stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" fill="none">
                {/* Row 1 (near waterline) */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 500 960 Q 515 958 530 960 M 570 962 Q 585 960 600 962 M 700 958 Q 715 956 730 958 M 1100 960 Q 1115 958 1130 960 M 1250 962 Q 1265 960 1280 962" />
                {/* Row 2 */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 470 980 Q 490 977 510 980 M 620 978 Q 640 975 660 978 M 760 982 Q 780 979 800 982 M 1180 978 Q 1200 975 1220 978 M 1330 982 Q 1350 979 1370 982" />
                {/* Row 3 */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 530 1005 Q 555 1002 580 1005 M 690 1008 Q 715 1005 740 1008 M 1060 1005 Q 1085 1002 1110 1005 M 1210 1008 Q 1235 1005 1260 1008" />
                {/* Row 4 */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 480 1035 Q 510 1031 540 1035 M 710 1038 Q 740 1034 770 1038 M 980 1035 Q 1010 1031 1040 1035 M 1280 1038 Q 1310 1034 1340 1038" />
                {/* Row 5 (bottom) */}
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 580 1065 Q 615 1061 650 1065 M 1080 1065 Q 1115 1061 1150 1065 M 1200 1068 Q 1235 1064 1270 1068" />
              </g>

              {/* Curved Streetlight Poles & Arms (Static) */}
              <WobblyPath 
                wobble={wobble}
                wobbleStrength={strength}
                d="M 550 844.3 L 550 832.3 Q 550 830.3 546 830.3 M 650 839.7 L 650 827.7 Q 650 825.7 646 825.7 M 750 836.7 L 750 824.7 Q 750 822.7 746 822.7 M 850 835.2 L 850 823.2 Q 850 821.2 846 821.2 M 950 835.1 L 950 823.1 Q 950 821.1 954 821.1 M 1050 836.2 L 1050 824.2 Q 1050 822.2 1054 822.2 M 1150 838.5 L 1150 826.5 Q 1150 824.5 1154 824.5 M 1250 841.9 L 1250 829.9 Q 1250 827.9 1254 827.9 M 1350 846.3 L 1350 834.3 Q 1350 832.3 1354 832.3"
                stroke="var(--skyline-stroke-mid)"
                strokeWidth="0.8"
                fill="none"
              />

              {/* Hanging Power Lines / Catenary wires (Static) */}
              <g stroke="var(--skyline-stroke-fine)" strokeWidth="0.8" fill="none">
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 450 820 Q 650 900 850 780" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 450 835 Q 650 915 850 795" />
                <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 910 780 Q 1165 915 1420 760" />
              </g>

              {/* Shadow overlay paths for wobbly hatching depth (Static) */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 205 1250 L 205 820 L 460 820 L 460 1250 Z" className={styles.shadowHatchFg} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1695 1250 L 1695 760 L 2920 760 L 2920 1250 Z" className={styles.shadowHatchFg} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 890 730 L 910 780 L 910 1250 L 890 1250 Z" className={styles.shadowHatchFg} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 880 935 L 918 935 L 918 950 L 928 950 L 928 968 L 922 968 L 922 1250 L 880 1250 Z" className={styles.shadowHatchFg} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 322 750 L 355 750 L 355 820 L 322 820 Z" className={styles.shadowHatchFg} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1782 715 L 1815 715 L 1815 760 L 1782 760 Z" className={styles.shadowHatchFg} />

              {/* Left water tank shadow hatches */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 396 748 L 412 748 L 412 792 L 396 792 Z" className={styles.shadowHatchFg} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 396 726 L 414 748 L 396 748 Z" className={styles.shadowHatchFg} />
              
              {/* Right water tank shadow hatches */}
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1465 670 L 1485 670 L 1485 725 L 1465 725 Z" className={styles.shadowHatchFg} />
              <WobblyPath wobble={wobble} wobbleStrength={strength} d="M 1465 642 L 1488 670 L 1465 670 Z" className={styles.shadowHatchFg} />
            </g>
      </svg>

      {/* Animated Layer (Unfiltered) */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <defs>
              {/* Fog Mist Vertical Linear Gradient */}
              <linearGradient id="fogGradient" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(250, 250, 250, 0.15)" />
                <stop offset="50%" stopColor="rgba(250, 250, 250, 0.06)" />
                <stop offset="100%" stopColor="rgba(250, 250, 250, 0)" />
              </linearGradient>

              {/* Billboard Spotlight Gradient */}
              <linearGradient id="leftLightGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(250, 250, 250, 0.15)" />
                <stop offset="60%" stopColor="rgba(250, 250, 250, 0.04)" />
                <stop offset="100%" stopColor="rgba(250, 250, 250, 0)" />
              </linearGradient>

              {/* Billboard Spotlight Gradient Popart */}
              <linearGradient id="leftLightGradPopart" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(255, 64, 129, 0.25)" />
                <stop offset="60%" stopColor="rgba(255, 64, 129, 0.06)" />
                <stop offset="100%" stopColor="rgba(255, 64, 129, 0)" />
              </linearGradient>
            </defs>

            {/* Group B: Unfiltered Foreground Animating Elements (Separated to bypass displacement map redraw cost for GPU performance) */}
            <g fill="var(--skyline-fill-bg)" stroke="var(--skyline-stroke-fg)" strokeWidth="1.8" className={styles.buildingGroup}>
              {/* Animated Billboard Spotlight */}
              <polygon points="130,820 80,695 180,695" fill="var(--skyline-left-light-grad)" stroke="none" className={styles.billboardLight} />

              {/* Cat Silhouette sitting on penthouse roof (Animating tail & blinking eyes, interactive hover running animation) */}
              <RunningCat reducedMotion={reducedMotion} />

              {/* Interactive wobbly Gargoyle sitting on bridge tower peak */}
              <InteractiveGargoyle reducedMotion={reducedMotion} />

              {/* Spinning Fan Blades (Animating) */}
              <g className={styles.fanBlade}>
                <line x1="371" y1="750" x2="366" y2="748" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
                <line x1="371" y1="750" x2="376" y2="752" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
                <line x1="371" y1="750" x2="369" y2="753" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
                <line x1="371" y1="750" x2="373" y2="747" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
              </g>

              {/* Blower wheel spokes (Animating) */}
              <circle cx="1598" cy="742" r="1.5" fill="var(--skyline-stroke-fg)" stroke="none" />
              <g className={styles.blowerFan}>
                <line x1="1598" y1="742" x2="1598" y2="734" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
                <line x1="1598" y1="742" x2="1598" y2="750" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
                <line x1="1598" y1="742" x2="1590" y2="742" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
                <line x1="1598" y1="742" x2="1606" y2="742" stroke="var(--skyline-stroke-fg)" strokeWidth="0.8" />
                <line x1="1598" y1="742" x2="1592" y2="736" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
                <line x1="1598" y1="742" x2="1604" y2="748" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
                <line x1="1598" y1="742" x2="1592" y2="748" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
                <line x1="1598" y1="742" x2="1604" y2="736" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
              </g>

              {/* Swaying Laundry (Animating) */}
              <g>
                {/* Trench Coat (Sway 1) */}
                <g className={styles.laundry1}>
                  <path d="M 1648 718 L 1645 724 L 1642 728 L 1644 738 L 1648 735 L 1648 756 L 1662 756 L 1662 735 L 1666 738 L 1668 728 L 1665 724 L 1662 718 Z" fill="var(--skyline-laundry-coat)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
                  <line x1="1655" y1="718" x2="1655" y2="756" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
                  <line x1="1648" y1="735" x2="1662" y2="735" stroke="var(--skyline-stroke-mid)" strokeWidth="0.6" />
                </g>
                {/* Trousers (Sway 2) */}
                <g className={styles.laundry2}>
                  <path d="M 1670 720 L 1667 750 L 1673 750 L 1676 730 L 1679 750 L 1685 750 L 1682 720 Z" fill="var(--skyline-laundry-trousers)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
                </g>
                {/* Fedora Hat (Sway 3) */}
                <g className={styles.laundry3}>
                  <path d="M 1687 728 C 1687 724, 1690 717, 1695 717 C 1700 717, 1703 724, 1703 728 C 1706 728, 1708 729, 1708 731 C 1708 733, 1682 733, 1682 731 C 1682 729, 1684 728, 1687 728 Z" fill="var(--skyline-laundry-fedora)" stroke="var(--skyline-stroke-fg)" strokeWidth="1" />
                  <path d="M 1688 728 Q 1695 727 1702 728 L 1702 726 Q 1695 725 1688 726 Z" fill="var(--skyline-laundry-fedora-band)" stroke="none" />
                </g>
              </g>

              {/* Warning Beacon at Tower Peak (Animating) */}
              <circle cx="880" cy="710" r="2.0" className={styles.bridgeBeacon} />

              {/* Bridge Streetlights (Glowing dots, Animating opacity subtly) */}
              <g fill="var(--skyline-bulb-glow)" stroke="none">
                <circle cx="546" cy="830.3" r="1.8" opacity="0.85" />
                <circle cx="646" cy="825.7" r="1.8" opacity="0.85" />
                <circle cx="746" cy="822.7" r="1.8" opacity="0.85" />
                <circle cx="846" cy="821.2" r="1.8" opacity="0.85" />
                <circle cx="954" cy="821.1" r="1.8" opacity="0.85" />
                <circle cx="1054" cy="822.2" r="1.8" opacity="0.85" />
                <circle cx="1154" cy="824.5" r="1.8" opacity="0.85" />
                <circle cx="1254" cy="827.9" r="1.8" opacity="0.85" />
                <circle cx="1354" cy="832.3" r="1.8" opacity="0.85" />
              </g>

              {/* Animated Bridge Traffic Dots (Staggered Outbound Headlights and Inbound Taillights) */}
              <g fill="rgba(250, 250, 250, 0.85)" stroke="none">
                {/* Outbound Headlights (Left to Right, bright white) */}
                <circle cx={reducedMotion ? 588 : 0} cy={reducedMotion ? 841.6 : 0} r="0.9" className={styles.trafficHeadlight}>
                  {!reducedMotion && (
                    <animateMotion dur="14s" repeatCount="indefinite" path="M 460 852 Q 880 822 1420 852" begin="0s" />
                  )}
                </circle>
                <circle cx={reducedMotion ? 1168 : 0} cy={reducedMotion ? 837.6 : 0} r="0.9" className={styles.trafficHeadlight}>
                  {!reducedMotion && (
                    <animateMotion dur="14s" repeatCount="indefinite" path="M 460 852 Q 880 822 1420 852" begin="4.6s" />
                  )}
                </circle>
                <circle cx={reducedMotion ? 750 : 0} cy={reducedMotion ? 828.5 : 0} r="0.9" className={styles.trafficHeadlight}>
                  {!reducedMotion && (
                    <animateMotion dur="14s" repeatCount="indefinite" path="M 460 852 Q 880 822 1420 852" begin="9.2s" />
                  )}
                </circle>
                {/* Fast Car */}
                <circle cx={reducedMotion ? 500 : 0} cy={reducedMotion ? 845.5 : 0} r="0.8" className={styles.trafficHeadlight} opacity="0.8">
                  {!reducedMotion && (
                    <animateMotion dur="10s" repeatCount="indefinite" path="M 460 852 Q 880 822 1420 852" begin="2.5s" />
                  )}
                </circle>
                {/* Slow Car */}
                <circle cx={reducedMotion ? 1350 : 0} cy={reducedMotion ? 848.5 : 0} r="1.1" className={styles.trafficHeadlight}>
                  {!reducedMotion && (
                    <animateMotion dur="20s" repeatCount="indefinite" path="M 460 852 Q 880 822 1420 852" begin="6.8s" />
                  )}
                </circle>

                {/* Inbound Taillights (Right to Left, dim white/grey representing red in monochrome) */}
                <circle cx={reducedMotion ? 979 : 0} cy={reducedMotion ? 824.6 : 0} r="0.8" className={styles.trafficTaillight}>
                  {!reducedMotion && (
                    <animateMotion dur="16s" repeatCount="indefinite" path="M 1420 854 Q 880 824 460 854" begin="0s" />
                  )}
                </circle>
                <circle cx={reducedMotion ? 650 : 0} cy={reducedMotion ? 833.5 : 0} r="0.8" className={styles.trafficTaillight}>
                  {!reducedMotion && (
                    <animateMotion dur="16s" repeatCount="indefinite" path="M 1420 854 Q 880 824 460 854" begin="5.3s" />
                  )}
                </circle>
                <circle cx={reducedMotion ? 1250 : 0} cy={reducedMotion ? 840.5 : 0} r="0.8" className={styles.trafficTaillight}>
                  {!reducedMotion && (
                    <animateMotion dur="16s" repeatCount="indefinite" path="M 1420 854 Q 880 824 460 854" begin="10.6s" />
                  )}
                </circle>
                {/* Fast Car */}
                <circle cx={reducedMotion ? 1050 : 0} cy={reducedMotion ? 828.5 : 0} r="0.7" className={styles.trafficTaillight}>
                  {!reducedMotion && (
                    <animateMotion dur="12s" repeatCount="indefinite" path="M 1420 854 Q 880 824 460 854" begin="3.2s" />
                  )}
                </circle>
                {/* Slow Car */}
                <circle cx={reducedMotion ? 550 : 0} cy={reducedMotion ? 840.5 : 0} r="1.0" className={styles.trafficTaillight}>
                  {!reducedMotion && (
                    <animateMotion dur="22s" repeatCount="indefinite" path="M 1420 854 Q 880 824 460 854" begin="7.8s" />
                  )}
                </circle>
              </g>
            </g>

            {/* Group C: Rising Steam/Smoke Paths (CSS Animated - Unfiltered Wavy Bezier curves for maximum performance) */}
            <g fill="none" stroke="var(--skyline-stroke-mid)" strokeWidth="1">
              {/* Steam from Chimney 1 (Left Roof x=228, y=775) */}
              <path d="M 228 770 C 222 745, 234 720, 226 695 C 220 675, 228 655, 222 635" className={styles.steam} />
              
              {/* Steam from Chimney 2 (Left Roof x=371, y=754) */}
              <path d="M 371 750 C 378 725, 366 700, 374 675 C 380 655, 372 635, 378 615" className={styles.steamDelayed} />

              {/* Steam from Chimney 3 (Right Roof x=1869, y=694) */}
              <path d="M 1869 690 C 1861 665, 1873 640, 1865 615 C 1859 595, 1867 575, 1861 555" className={styles.steam} />

              {/* Steam from Industrial Blower (Right Roof x=1598, y=715) */}
              <path d="M 1598 710 C 1606 685, 1594 660, 1602 635 C 1608 615, 1600 595, 1606 575" className={styles.steamDelayed} />
            </g>

            {/* Rolling River Fog/Mist Layers (Layered depth and gradient texture) */}
            <g fill="url(#fogGradient)" stroke="none">
              {/* Fog Layer 1 (Drifts left) */}
              <path 
                d="M -1000 920 C 100 890, 400 890, 800 915 C 1200 895, 1600 895, 2920 920 L 2920 1250 L -1000 1250 Z" 
                opacity="0.3" 
                className={styles.fog1} 
              />
              {/* Fog Layer 2 (Drifts right) */}
              <path 
                d="M -1000 935 C 200 915, 700 905, 1100 930 C 1500 910, 1800 920, 2920 935 L 2920 1250 L -1000 1250 Z" 
                opacity="0.2" 
                className={styles.fog2} 
              />
            </g>
      </svg>
    </>
  );
});
Layer3.displayName = 'Layer3';
