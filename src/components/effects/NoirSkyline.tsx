'use client';

import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import styles from './NoirSkyline.module.css';

export default function NoirSkyline() {
  const { theme, pendingTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

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
  const fgOpacity = useTransform(scrollYProgress, [0, 1], [1, 1]);



  const [reducedMotion, setReducedMotion] = useState(false);

  // Track mouse coordinates for subtle parallax offset
  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const mediaListener = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', mediaListener);

    const handleMouseMove = (e: MouseEvent) => {
      // Respect prefers-reduced-motion
      if (mediaQuery.matches) return;

      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      setMouseOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      mediaQuery.removeEventListener('change', mediaListener);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  if (!mounted) return null;

  const isActive = theme === 'noir' || pendingTheme === 'noir';

  return (
    <div className={`${styles.container} ${isActive ? styles.active : ''}`}>
      {/* ── Layer 0: Sky backdrop, Searchlights, and Rain ── */}
      <div className={styles.layer}>
        <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%' }}>
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
          </defs>

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

          {/* Detailed Gliding Retro Airship/Dirigible */}
          <g className={styles.blimpGroup}>
            {/* Sweeping Spotlight beam from the front of the gondola */}
            <polygon 
              points="195,212 230,420 320,400" 
              fill="url(#blimpLightGrad)" 
              className={styles.blimpSpotlight} 
              stroke="none"
            />

            {/* Structural envelope outline */}
            <path 
              d="M 104 180 C 104 160, 135 154, 185 154 C 225 154, 250 168, 250 180 C 250 192, 225 206, 185 206 C 135 206, 104 200, 104 180 Z" 
              fill="var(--color-bg)" 
              stroke="rgba(250, 250, 250, 0.75)" 
              strokeWidth="1.2" 
            />
            {/* Long envelope longitudinal panel lines */}
            <path d="M 105 180 Q 177 159 249 180" fill="none" stroke="rgba(250, 250, 250, 0.3)" strokeWidth="0.8" />
            <path d="M 105 180 Q 177 201 249 180" fill="none" stroke="rgba(250, 250, 250, 0.3)" strokeWidth="0.8" />
            
            {/* Extra detailed longitudinal panel lines for premium texture */}
            <path d="M 104.5 180 Q 177 169 249.5 180" fill="none" stroke="rgba(250, 250, 250, 0.25)" strokeWidth="0.6" />
            <path d="M 104.5 180 Q 177 191 249.5 180" fill="none" stroke="rgba(250, 250, 250, 0.25)" strokeWidth="0.6" />

            {/* Vertical framing bands (ribs) */}
            <path d="M 130 162 A 18 18 0 0 0 130 198" fill="none" stroke="rgba(250, 250, 250, 0.2)" strokeWidth="0.8" />
            <path d="M 160 154 A 26 26 0 0 0 160 206" fill="none" stroke="rgba(250, 250, 250, 0.2)" strokeWidth="0.8" />
            <path d="M 190 154 A 26 26 0 0 0 190 206" fill="none" stroke="rgba(250, 250, 250, 0.2)" strokeWidth="0.8" />
            <path d="M 220 162 A 18 18 0 0 0 220 198" fill="none" stroke="rgba(250, 250, 250, 0.2)" strokeWidth="0.8" />
            {/* Nose cap lines */}
            <path d="M 238 171 A 11 11 0 0 0 238 189" fill="none" stroke="rgba(250, 250, 250, 0.35)" strokeWidth="0.8" />

            {/* Aerodynamic stabilizers & fins */}
            {/* Top Fin */}
            <path d="M 115 170 L 92 153 L 90 178 L 118 178 Z" fill="var(--color-bg)" stroke="rgba(250, 250, 250, 0.75)" strokeWidth="1" />
            {/* Top fin hinge and rudder line */}
            <line x1="96" y1="156" x2="94" y2="178" stroke="rgba(250, 250, 250, 0.5)" strokeWidth="0.8" />

            {/* Bottom Fin */}
            <path d="M 115 190 L 92 207 L 90 182 L 118 182 Z" fill="var(--color-bg)" stroke="rgba(250, 250, 250, 0.75)" strokeWidth="1" />
            {/* Bottom fin hinge and rudder line */}
            <line x1="96" y1="204" x2="94" y2="182" stroke="rgba(250, 250, 250, 0.5)" strokeWidth="0.8" />

            {/* Rear Propeller Engine Pod */}
            <rect x="135" y="202" width="10" height="4" rx="0.5" fill="var(--color-bg)" stroke="rgba(250, 250, 250, 0.75)" strokeWidth="0.8" />
            {/* Spin blades */}
            <line x1="130" y1="199" x2="130" y2="209" stroke="rgba(250, 250, 250, 0.6)" strokeWidth="1" />

            {/* Gondola Cabin (connected by struts and rigging) */}
            {/* Structural struts */}
            <line x1="165" y1="200" x2="165" y2="204" stroke="rgba(250, 250, 250, 0.75)" strokeWidth="0.8" />
            <line x1="180" y1="200" x2="180" y2="204" stroke="rgba(250, 250, 250, 0.75)" strokeWidth="0.8" />
            <line x1="195" y1="200" x2="195" y2="204" stroke="rgba(250, 250, 250, 0.75)" strokeWidth="0.8" />
            {/* Rigging lines cross bracing */}
            <line x1="165" y1="200" x2="180" y2="204" stroke="rgba(250, 250, 250, 0.4)" strokeWidth="0.5" />
            <line x1="180" y1="200" x2="165" y2="204" stroke="rgba(250, 250, 250, 0.4)" strokeWidth="0.5" />
            <line x1="180" y1="200" x2="195" y2="204" stroke="rgba(250, 250, 250, 0.4)" strokeWidth="0.5" />
            <line x1="195" y1="200" x2="180" y2="204" stroke="rgba(250, 250, 250, 0.4)" strokeWidth="0.5" />

            {/* Gondola Body */}
            <path d="M 158 204 L 202 204 L 197 212 L 163 212 Z" fill="var(--color-bg)" stroke="rgba(250, 250, 250, 0.75)" strokeWidth="1" />
            {/* Cabin windows */}
            <rect x="168" y="206" width="5" height="3" rx="0.3" fill="none" stroke="rgba(250, 250, 250, 0.5)" strokeWidth="0.6" />
            <rect x="177" y="206" width="5" height="3" rx="0.3" fill="none" stroke="rgba(250, 250, 250, 0.5)" strokeWidth="0.6" />
            <rect x="186" y="206" width="5" height="3" rx="0.3" fill="none" stroke="rgba(250, 250, 250, 0.5)" strokeWidth="0.6" />

            {/* White Tail flashing beacon */}
            <circle cx="89" cy="153" r="1.5" className={styles.blimpBeacon} />
          </g>



          {/* Searchlights sweeping the sky */}
          <g opacity="0.6">
            <polygon 
              points="380,1080 180,0 480,0" 
              fill="url(#leftLightGrad)" 
              className={`${styles.searchlight} ${styles.searchlightLeft}`} 
            />
            <polygon 
              points="1480,1080 1320,0 1620,0" 
              fill="url(#rightLightGrad)" 
              className={`${styles.searchlight} ${styles.searchlightRight}`} 
            />
          </g>

          {/* Flock of gliding pigeons */}
          <g className={styles.flock} fill="none" stroke="rgba(250, 250, 250, 0.16)" strokeWidth="0.8">
            {/* Bird 1 */}
            <path d="M 0 0 Q 5 -5 10 0 Q 15 -5 20 0" />
            {/* Bird 2 */}
            <path d="M -25 20 Q -20 15 -15 20 Q -10 15 -5 20" />
            {/* Bird 3 */}
            <path d="M 30 15 Q 35 10 40 15 Q 45 10 50 15" />
          </g>
        </svg>
      </div>

      {/* ── Layer 1: Background Buildings (Parallax Scale 1.12) ── */}
      <motion.div
        style={{ scale: bgScale, y: bgY, zIndex: 1 }}
        className={styles.layer}
      >
        <motion.div
          animate={{ x: mouseOffset.x * -10, y: mouseOffset.y * -8 }}
          transition={{ type: 'spring', damping: 30, stiffness: 90 }}
          style={{ width: '100%', height: '100%' }}
        >
          <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%' }}>
            <g className={styles.buildingGroup} stroke="rgba(250, 250, 250, 0.22)" strokeWidth="0.8">
              {/* Left distant skyscrapers */}
              <path d="M 50 1080 L 50 780 L 90 780 L 90 740 L 120 740 L 120 1080" />
              <line x1="90" y1="740" x2="90" y2="780" />
              <line x1="60" y1="780" x2="60" y2="1080" strokeDasharray="2 8" />
              <line x1="75" y1="780" x2="75" y2="1080" strokeDasharray="2 8" />
              <line x1="105" y1="740" x2="105" y2="1080" strokeDasharray="2 8" />
              
              {/* Stepped Needle Tower (Left-Mid) */}
              <path d="M 220 1080 L 220 720 L 230 720 L 230 650 L 240 650 L 240 540 L 246 540 L 246 450 L 250 450 L 250 350" />
              <path d="M 254 350 L 254 450 L 258 450 L 258 540 L 264 540 L 264 650 L 274 650 L 274 720 L 284 720 L 284 1080" />
              <line x1="220" y1="720" x2="284" y2="720" />
              <line x1="230" y1="650" x2="274" y2="650" />
              <line x1="240" y1="540" x2="264" y2="540" />
              <line x1="235" y1="720" x2="235" y2="1080" strokeDasharray="3 6" />
              <line x1="269" y1="720" x2="269" y2="1080" strokeDasharray="3 6" />
              <line x1="245" y1="650" x2="245" y2="1080" />
              <line x1="259" y1="650" x2="259" y2="1080" />
              
              {/* Chrysler-inspired Arched Spire Tower (Left-Center) */}
              <path d="M 450 1080 L 450 670 L 458 640 L 468 640 L 468 590 L 478 590 L 478 535 L 488 500 L 498 340 L 508 500 L 518 535 L 518 590 L 528 590 L 528 640 L 538 640 L 546 670 L 546 1080" />
              {/* Chrysler internal details */}
              <path d="M 478 535 A 10 10 0 0 1 518 535" />
              <path d="M 468 590 A 20 20 0 0 1 528 590" />
              <path d="M 458 640 A 40 40 0 0 1 538 640" />
              <path d="M 488 500 A 10 10 0 0 1 508 500" />
              <line x1="450" y1="670" x2="546" y2="670" />
              <line x1="498" y1="340" x2="498" y2="500" />
              <line x1="498" y1="340" x2="480" y2="480" />
              <line x1="498" y1="340" x2="490" y2="480" />
              <line x1="498" y1="340" x2="506" y2="480" />
              <line x1="498" y1="340" x2="516" y2="480" />

              {/* Empire State Building (Center) */}
              <path d="M 920 1080 L 920 830 L 928 830 L 928 750 L 938 750 L 938 610 L 946 610 L 946 460 L 954 460 L 954 320" />
              <path d="M 960 320 L 960 460 L 968 460 L 968 610 L 976 610 L 976 750 L 986 750 L 986 830 L 994 830 L 994 1080" />
              {/* Empire State Details */}
              <line x1="920" y1="830" x2="994" y2="830" />
              <line x1="928" y1="750" x2="986" y2="750" />
              <line x1="938" y1="610" x2="976" y2="610" />
              <line x1="946" y1="460" x2="968" y2="460" />
              <line x1="957" y1="320" x2="957" y2="460" />
              <line x1="946" y1="460" x2="968" y2="460" strokeDasharray="2 3" />
              <line x1="938" y1="610" x2="976" y2="610" strokeDasharray="2 3" />
              <line x1="957" y1="460" x2="957" y2="830" opacity="0.4" />
              <line x1="935" y1="830" x2="935" y2="1080" />
              <line x1="945" y1="750" x2="945" y2="1080" />
              <line x1="950" y1="610" x2="950" y2="1080" />
              <line x1="954" y1="460" x2="954" y2="1080" />
              <line x1="966" y1="460" x2="966" y2="1080" />
              <line x1="970" y1="610" x2="970" y2="1080" />
              <line x1="975" y1="750" x2="975" y2="1080" />
              <line x1="985" y1="830" x2="985" y2="1080" />

              {/* Flat top tower with twin antenna (Right-Mid) */}
              <path d="M 1320 1080 L 1320 620 L 1420 620 L 1420 1080" />
              <line x1="1350" y1="620" x2="1350" y2="540" />
              <line x1="1390" y1="620" x2="1390" y2="520" />
              <line x1="1340" y1="620" x2="1340" y2="1080" strokeDasharray="5 5" />
              <line x1="1360" y1="620" x2="1360" y2="1080" strokeDasharray="5 5" />
              <line x1="1380" y1="620" x2="1380" y2="1080" strokeDasharray="5 5" />
              <line x1="1400" y1="620" x2="1400" y2="1080" strokeDasharray="5 5" />

              {/* Steeped Block Tower (Far Right) */}
              <path d="M 1720 1080 L 1720 740 L 1735 740 L 1735 680 L 1750 680 L 1750 580 L 1790 580 L 1790 680 L 1805 680 L 1805 740 L 1820 740 L 1820 1080" />
              <line x1="1720" y1="740" x2="1820" y2="740" />
              <line x1="1735" y1="680" x2="1805" y2="680" />
              <line x1="1750" y1="580" x2="1790" y2="580" />
              <line x1="1760" y1="580" x2="1760" y2="1080" strokeDasharray="2 6" />
              <line x1="1770" y1="580" x2="1770" y2="1080" strokeDasharray="2 6" />
              <line x1="1780" y1="580" x2="1780" y2="1080" strokeDasharray="2 6" />


              {/* ── NEW: Art Deco Tower (Gap 1: x=140-200) ── */}
              <path d="M 140 1080 L 140 700 L 155 700 L 155 660 L 170 660 L 170 620 L 175 580 L 180 620 L 195 620 L 195 660 L 200 660 L 200 1080" />
              <line x1="155" y1="660" x2="195" y2="660" />
              <line x1="140" y1="700" x2="200" y2="700" />
              <line x1="160" y1="700" x2="160" y2="1080" strokeDasharray="2 7" />
              <line x1="180" y1="700" x2="180" y2="1080" strokeDasharray="2 7" />
              <line x1="170" y1="660" x2="170" y2="1080" strokeDasharray="2 7" />

              {/* ── NEW: Slim Needle Spire (Gap 2a: x=630-670) ── */}
              <path d="M 630 1080 L 630 640 L 640 640 L 640 520 L 650 400 L 660 520 L 660 640 L 670 640 L 670 1080" />
              <line x1="630" y1="640" x2="670" y2="640" />
              <line x1="640" y1="520" x2="660" y2="520" />
              <line x1="650" y1="400" x2="650" y2="520" />
              <line x1="645" y1="640" x2="645" y2="1080" strokeDasharray="2 8" />
              <line x1="655" y1="640" x2="655" y2="1080" strokeDasharray="2 8" />

              {/* ── NEW: Twin Tower Complex (Gap 2b: x=740-840) ── */}
              <path d="M 740 1080 L 740 590 L 780 590 L 780 1080" />
              <path d="M 800 1080 L 800 550 L 840 550 L 840 1080" />
              <line x1="740" y1="590" x2="780" y2="590" />
              <line x1="800" y1="550" x2="840" y2="550" />
              {/* Twin tower connecting skybridge */}
              <line x1="780" y1="680" x2="800" y2="680" />
              <line x1="780" y1="685" x2="800" y2="685" />
              {/* Internal columns */}
              <line x1="755" y1="590" x2="755" y2="1080" strokeDasharray="2 7" />
              <line x1="765" y1="590" x2="765" y2="1080" strokeDasharray="2 7" />
              <line x1="815" y1="550" x2="815" y2="1080" strokeDasharray="2 7" />
              <line x1="825" y1="550" x2="825" y2="1080" strokeDasharray="2 7" />
              {/* Antenna on taller tower */}
              <line x1="820" y1="550" x2="820" y2="480" />

              {/* ── NEW: Setback Office Block (Gap 3a: x=1050-1140) ── */}
              <path d="M 1050 1080 L 1050 680 L 1070 680 L 1070 600 L 1100 600 L 1100 530 L 1110 530 L 1110 600 L 1140 600 L 1140 1080" />
              <line x1="1050" y1="680" x2="1140" y2="680" />
              <line x1="1070" y1="600" x2="1140" y2="600" />
              <line x1="1060" y1="680" x2="1060" y2="1080" strokeDasharray="3 6" />
              <line x1="1080" y1="600" x2="1080" y2="1080" strokeDasharray="3 6" />
              <line x1="1120" y1="600" x2="1120" y2="1080" strokeDasharray="3 6" />
              <line x1="1130" y1="680" x2="1130" y2="1080" strokeDasharray="3 6" />

              {/* ── NEW: Narrow Deco Tower (Gap 3b: x=1200-1260) ── */}
              <path d="M 1200 1080 L 1200 640 L 1215 640 L 1215 560 L 1225 520 L 1235 560 L 1245 560 L 1245 640 L 1260 640 L 1260 1080" />
              <line x1="1200" y1="640" x2="1260" y2="640" />
              <line x1="1215" y1="560" x2="1245" y2="560" />
              <line x1="1225" y1="520" x2="1225" y2="560" />
              <line x1="1220" y1="640" x2="1220" y2="1080" strokeDasharray="2 8" />
              <line x1="1240" y1="640" x2="1240" y2="1080" strokeDasharray="2 8" />

              {/* Distant Inhabited Window Grids (office lights) */}
              <g fill="none">
                {/* Empire State windows - Glowing */}
                <g className={styles.glowingWindow} strokeWidth="1.0" strokeDasharray="2.5 8">
                  <line x1="942" y1="610" x2="942" y2="830" />
                  <line x1="966" y1="610" x2="966" y2="830" strokeDashoffset="4" />
                </g>
                {/* Empire State windows - Dim */}
                <g className={styles.glowingWindowDim} strokeWidth="1.0" strokeDasharray="2.5 8">
                  <line x1="948" y1="610" x2="948" y2="830" strokeDashoffset="2" />
                  <line x1="972" y1="610" x2="972" y2="830" strokeDashoffset="6" />
                </g>

                {/* Chrysler windows - Glowing */}
                <g className={styles.glowingWindow} strokeWidth="1.0" strokeDasharray="2 7">
                  <line x1="474" y1="670" x2="474" y2="1000" />
                  <line x1="514" y1="670" x2="514" y2="1000" strokeDashoffset="3" />
                </g>
                {/* Chrysler windows - Dim */}
                <g className={styles.glowingWindowDim} strokeWidth="1.0" strokeDasharray="2 7">
                  <line x1="482" y1="670" x2="482" y2="1000" strokeDashoffset="5" />
                  <line x1="522" y1="670" x2="522" y2="1000" strokeDashoffset="1" />
                </g>

                {/* Stepped Needle Tower windows */}
                <g className={styles.glowingWindow} strokeWidth="0.8" strokeDasharray="3 9">
                  <line x1="242" y1="720" x2="242" y2="1000" />
                </g>
                <g className={styles.glowingWindowDim} strokeWidth="0.8" strokeDasharray="3 9">
                  <line x1="262" y1="720" x2="262" y2="1000" strokeDashoffset="4" />
                </g>

                {/* Asynchronous Flickering Window Cells (Layer 1) */}
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
              </g>
            </g>
          </svg>
        </motion.div>
      </motion.div>

      {/* ── Layer 2: Midground Buildings (Parallax Scale 1.35, Masking Fill) ── */}
      <motion.div
        style={{ scale: midScale, y: midY, zIndex: 2 }}
        className={styles.layer}
      >
        <motion.div
          animate={{ x: mouseOffset.x * -24, y: mouseOffset.y * -16 }}
          transition={{ type: 'spring', damping: 28, stiffness: 85 }}
          style={{ width: '100%', height: '100%' }}
        >
          <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%' }}>
            {/* Midground buildings (Solid fill masks Layer 1) */}
            <g className={styles.buildingGroup} fill="var(--color-bg)" stroke="rgba(250, 250, 250, 0.32)" strokeWidth="1.2">
              {/* Far Left block */}
              <path d="M -10 1080 L -10 790 L 80 790 L 80 1080 Z" />

              {/* Staggered double-tower (Left) */}
              <path d="M 120 1080 L 120 680 L 190 680 L 190 620 L 260 620 L 260 1080 Z" />
              {/* Window grid outlines on Left Tower */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="2.5 8">
                  <line x1="150" y1="700" x2="150" y2="1000" />
                  <line x1="210" y1="640" x2="210" y2="1000" strokeDashoffset="3" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="2.5 8">
                  <line x1="170" y1="700" x2="170" y2="1000" strokeDashoffset="5" />
                  <line x1="230" y1="640" x2="230" y2="1000" strokeDashoffset="1" />
                </g>
              </g>



              {/* Blocky Spire (Center-Left) */}
              <path d="M 330 1080 L 330 710 L 370 710 L 370 540 L 373 540 L 373 450 L 377 450 L 377 540 L 380 540 L 380 710 L 420 710 L 420 1080 Z" />

              {/* Flatiron wedge tower (Left-Center) */}
              <path d="M 475 1080 L 475 665 L 505 640 L 525 640 L 540 665 L 540 1080 Z" />
              {/* Flatiron vertical wedge lines */}
              <line x1="505" y1="640" x2="505" y2="1080" stroke="rgba(250, 250, 250, 0.25)" fill="none" />
              <line x1="525" y1="640" x2="525" y2="1080" stroke="rgba(250, 250, 250, 0.25)" fill="none" />
              <g stroke="rgba(250, 250, 250, 0.14)" strokeWidth="0.8" strokeDasharray="2 10" fill="none">
                <line x1="490" y1="675" x2="490" y2="1080" />
                <line x1="515" y1="655" x2="515" y2="1080" />
                <line x1="530" y1="675" x2="530" y2="1080" />
              </g>

              {/* Citigroup-style Slanted Roof (Center-Right) */}
              <path d="M 680 1080 L 680 690 L 760 610 L 790 610 L 790 1080 Z" />
              {/* Citibank window grids */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="3 10">
                  <line x1="700" y1="695" x2="700" y2="1000" />
                  <line x1="740" y1="655" x2="740" y2="1000" strokeDashoffset="4" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="3 10">
                  <line x1="720" y1="675" x2="720" y2="1000" strokeDashoffset="7" />
                  <line x1="760" y1="635" x2="760" y2="1000" strokeDashoffset="2" />
                </g>
              </g>

              {/* Block Tower with setbacks (Right-Mid) */}
              <path d="M 1110 1080 L 1110 650 L 1140 650 L 1140 590 L 1210 590 L 1210 650 L 1240 650 L 1240 1080 Z" />
              <g stroke="rgba(250, 250, 250, 0.15)" strokeWidth="0.8" fill="none">
                <line x1="1175" y1="590" x2="1175" y2="530" />
                {/* Horizontal window lines */}
                <line x1="1150" y1="605" x2="1200" y2="605" stroke="rgba(250, 250, 250, 0.18)" strokeDasharray="4 6" />
                <line x1="1150" y1="620" x2="1200" y2="620" stroke="rgba(250, 250, 250, 0.18)" strokeDasharray="4 6" />
                <line x1="1150" y1="635" x2="1200" y2="635" stroke="rgba(250, 250, 250, 0.18)" strokeDasharray="4 6" />
              </g>

              {/* Glowing Clock Tower (11:45 PM Detective Time) */}
              <path d="M 1250 1080 L 1250 590 L 1300 590 L 1300 1080 Z" />
              {/* Top dome and spire cap */}
              <path d="M 1255 590 L 1255 570 Q 1275 550 1295 570 L 1295 590" />
              <line x1="1275" y1="550" x2="1275" y2="530" strokeWidth="1" />
              {/* Clock Face Circle */}
              <circle cx="1275" cy="580" r="10" fill="rgba(250, 250, 250, 0.85)" stroke="var(--color-bg)" strokeWidth="1.2" />
              {/* Clock hands pointing at 11:45 */}
              <line x1="1275" y1="580" x2="1275" y2="572" stroke="var(--color-bg)" strokeWidth="1" /> {/* Minute hand */}
              <line x1="1275" y1="580" x2="1268" y2="583" stroke="var(--color-bg)" strokeWidth="1.2" /> {/* Hour hand */}
              {/* Clock Face Details (Roman marker lines at 12, 3, 6, 9) */}
              <line x1="1275" y1="571" x2="1275" y2="573" stroke="var(--color-bg)" strokeWidth="0.8" />
              <line x1="1284" y1="580" x2="1282" y2="580" stroke="var(--color-bg)" strokeWidth="0.8" />
              <line x1="1275" y1="589" x2="1275" y2="587" stroke="var(--color-bg)" strokeWidth="0.8" />
              <line x1="1266" y1="580" x2="1268" y2="580" stroke="var(--color-bg)" strokeWidth="0.8" />
              {/* Ring border for aesthetic */}
              <circle cx="1275" cy="580" r="12" fill="none" stroke="rgba(250, 250, 250, 0.5)" strokeWidth="0.6" />
              {/* Clock Tower windows */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="4 8">
                  <line x1="1265" y1="610" x2="1265" y2="1000" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="4 8">
                  <line x1="1285" y1="610" x2="1285" y2="1000" strokeDashoffset="4" />
                </g>
              </g>

              {/* Extra window grid lights in midground layer */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="3 10">
                  {/* Staggered window lights on Citigroup slanted roof building */}
                  <line x1="708" y1="700" x2="708" y2="1000" />
                  <line x1="752" y1="660" x2="752" y2="1000" strokeDashoffset="5" />
                  {/* Staggered windows on Staggered double-tower left */}
                  <line x1="140" y1="720" x2="140" y2="1000" strokeDashoffset="2" />
                  <line x1="220" y1="670" x2="220" y2="1000" strokeDashoffset="6" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="3 10">
                  <line x1="732" y1="680" x2="732" y2="1000" strokeDashoffset="3" />
                  <line x1="772" y1="640" x2="772" y2="1000" strokeDashoffset="1" />
                  <line x1="160" y1="740" x2="160" y2="1000" strokeDashoffset="4" />
                  <line x1="240" y1="690" x2="240" y2="1000" strokeDashoffset="7" />
                </g>
              </g>

              {/* Medium Tower with Water Tower on roof & Neon Sign (Right) */}
              <path d="M 1490 1080 L 1490 670 L 1610 670 L 1610 1080 Z" />
              {/* Hotel windows grid */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="2.5 8">
                  <line x1="1510" y1="690" x2="1510" y2="1000" />
                  <line x1="1550" y1="690" x2="1550" y2="1000" strokeDashoffset="3" />
                  <line x1="1590" y1="690" x2="1590" y2="1000" strokeDashoffset="6" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="2.5 8">
                  <line x1="1530" y1="690" x2="1530" y2="1000" strokeDashoffset="4" />
                  <line x1="1570" y1="690" x2="1570" y2="1000" strokeDashoffset="1" />
                </g>
              </g>
              {/* Roof-top details: Mechanical room */}
              <path d="M 1505 670 L 1505 645 L 1540 645 L 1540 670 Z" />
              





              {/* ── NEW: Slab Building (Gap 1a: x=565-640) ── */}
              <path d="M 565 1080 L 565 690 L 640 690 L 640 1080 Z" />
              {/* Roof cornice line */}
              <line x1="562" y1="690" x2="643" y2="690" strokeWidth="1.4" />
              {/* Horizontal floor bands */}
              <g stroke="rgba(250, 250, 250, 0.18)" strokeWidth="0.8" fill="none">
                <line x1="565" y1="730" x2="640" y2="730" />
                <line x1="565" y1="770" x2="640" y2="770" />
                <line x1="565" y1="810" x2="640" y2="810" />
                <line x1="565" y1="850" x2="640" y2="850" />
              </g>
              {/* Window columns */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="3 9">
                  <line x1="580" y1="700" x2="580" y2="1000" />
                  <line x1="620" y1="700" x2="620" y2="1000" strokeDashoffset="5" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="3 9">
                  <line x1="600" y1="700" x2="600" y2="1000" strokeDashoffset="2" />
                </g>
              </g>

              {/* ── NEW: Narrow Tower (Gap 1b: x=650-680) ── */}
              <path d="M 650 1080 L 650 620 L 658 580 L 672 580 L 680 620 L 680 1080 Z" />
              <line x1="650" y1="620" x2="680" y2="620" />
              <line x1="658" y1="580" x2="672" y2="580" />
              <line x1="665" y1="580" x2="665" y2="1080" stroke="rgba(250, 250, 250, 0.18)" strokeWidth="0.8" strokeDasharray="2 8" fill="none" />
              {/* Antenna mast */}
              <line x1="665" y1="580" x2="665" y2="540" />

              {/* ── NEW: Wide Warehouse (Gap 2a: x=830-930) ── */}
              <path d="M 830 1080 L 830 720 L 930 720 L 930 1080 Z" />
              {/* Sawtooth roof detail */}
              <path d="M 830 720 L 855 695 L 855 720 L 880 695 L 880 720 L 905 695 L 905 720 L 930 720" fill="var(--color-bg)" />
              {/* Internal pillars */}
              <g stroke="rgba(250, 250, 250, 0.2)" strokeWidth="0.8" fill="none">
                <line x1="855" y1="720" x2="855" y2="1080" />
                <line x1="880" y1="720" x2="880" y2="1080" />
                <line x1="905" y1="720" x2="905" y2="1080" />
              </g>
              {/* Windows */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="4 10">
                  <line x1="845" y1="730" x2="845" y2="1000" />
                  <line x1="895" y1="730" x2="895" y2="1000" strokeDashoffset="5" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="4 10">
                  <line x1="870" y1="730" x2="870" y2="1000" strokeDashoffset="3" />
                  <line x1="920" y1="730" x2="920" y2="1000" strokeDashoffset="7" />
                </g>
              </g>

              {/* ── NEW: Glass Office Tower (Gap 2b: x=950-1030) ── */}
              <path d="M 950 1080 L 950 600 L 960 600 L 960 560 L 990 560 L 990 520 L 1000 520 L 1000 560 L 1030 560 L 1030 600 L 1040 600 L 1040 1080 Z" />
              <line x1="950" y1="600" x2="1040" y2="600" />
              <line x1="960" y1="560" x2="1030" y2="560" />
              {/* Vertical mullions */}
              <g stroke="rgba(250, 250, 250, 0.18)" strokeWidth="0.8" fill="none" strokeDasharray="3 7">
                <line x1="970" y1="600" x2="970" y2="1080" />
                <line x1="990" y1="560" x2="990" y2="1080" />
                <line x1="1010" y1="600" x2="1010" y2="1080" />
                <line x1="1020" y1="600" x2="1020" y2="1080" />
              </g>
              {/* Windows */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="2.5 9">
                  <line x1="975" y1="610" x2="975" y2="1000" />
                  <line x1="1015" y1="610" x2="1015" y2="1000" strokeDashoffset="4" />
                </g>
                <g className={styles.glowingWindowDim} strokeDasharray="2.5 9">
                  <line x1="995" y1="570" x2="995" y2="1000" strokeDashoffset="6" />
                </g>
              </g>

              {/* ── NEW: Slim Spire (Gap 2c: x=1055-1095) ── */}
              <path d="M 1055 1080 L 1055 660 L 1065 660 L 1065 580 L 1075 500 L 1085 580 L 1085 660 L 1095 660 L 1095 1080 Z" />
              <line x1="1055" y1="660" x2="1095" y2="660" />
              <line x1="1065" y1="580" x2="1085" y2="580" />
              <line x1="1075" y1="500" x2="1075" y2="580" />
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindowDim} strokeDasharray="2 10">
                  <line x1="1075" y1="670" x2="1075" y2="1000" />
                </g>
              </g>

              {/* ── NEW: Far Right Tower (Gap 3a: x=1700-1780) ── */}
              <path d="M 1700 1080 L 1700 650 L 1730 650 L 1730 600 L 1750 600 L 1750 650 L 1780 650 L 1780 1080 Z" />
              <line x1="1700" y1="650" x2="1780" y2="650" />
              <line x1="1730" y1="600" x2="1750" y2="600" />
              <g stroke="rgba(250, 250, 250, 0.18)" strokeWidth="0.8" fill="none" strokeDasharray="3 8">
                <line x1="1720" y1="660" x2="1720" y2="1080" />
                <line x1="1740" y1="610" x2="1740" y2="1080" />
                <line x1="1760" y1="660" x2="1760" y2="1080" />
              </g>
              {/* Windows */}
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindow} strokeDasharray="3 10">
                  <line x1="1725" y1="660" x2="1725" y2="1000" />
                  <line x1="1755" y1="660" x2="1755" y2="1000" strokeDashoffset="4" />
                </g>
              </g>

              {/* ── NEW: Edge Building (Gap 3b: x=1850-1930) ── */}
              <path d="M 1850 1080 L 1850 680 L 1930 680 L 1930 1080 Z" />
              <line x1="1850" y1="680" x2="1930" y2="680" />
              {/* Rooftop mast */}
              <line x1="1890" y1="680" x2="1890" y2="620" />
              <g stroke="rgba(250, 250, 250, 0.15)" strokeWidth="0.8" fill="none" strokeDasharray="2 8">
                <line x1="1870" y1="690" x2="1870" y2="1080" />
                <line x1="1910" y1="690" x2="1910" y2="1080" />
              </g>
              <g strokeWidth="0.8" fill="none">
                <g className={styles.glowingWindowDim} strokeDasharray="3 10">
                  <line x1="1880" y1="690" x2="1880" y2="1000" strokeDashoffset="3" />
                  <line x1="1900" y1="690" x2="1900" y2="1000" strokeDashoffset="7" />
                </g>
              </g>

              {/* Asynchronous Flickering Window Cells (Layer 2) */}
              <g strokeWidth="1.0" fill="none">
                {/* Staggered double-tower (Left) */}
                <line x1="170" y1="780" x2="170" y2="783" className={styles.windowFlicker2} />
                <line x1="210" y1="730" x2="210" y2="733" className={styles.windowFlicker4} />

                {/* Hotel building */}
                <line x1="1530" y1="720" x2="1530" y2="723" className={styles.windowFlicker1} />
                <line x1="1570" y1="760" x2="1570" y2="763" className={styles.windowFlicker3} />
              </g>
            </g>
          </svg>
        </motion.div>
      </motion.div>

      {/* ── Layer 3: Foreground Rooftops (Parallax Scale 1.8, Masks midground, high opacity) ── */}
      <motion.div
        style={{ scale: fgScale, y: fgY, opacity: fgOpacity, zIndex: 3 }}
        className={styles.layer}
      >
        <motion.div
          animate={{ x: mouseOffset.x * -42, y: mouseOffset.y * -28 }}
          transition={{ type: 'spring', damping: 24, stiffness: 75 }}
          style={{ width: '100%', height: '100%' }}
        >
          <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%' }}>
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
            </defs>
            {/* Foreground elements */}
            <g className={styles.buildingGroup} fill="var(--color-bg)" stroke="rgba(250, 250, 250, 0.48)" strokeWidth="1.8">
              
              {/* LEFT ROOFTOP SECTION */}
              <path d="M -50 1080 L -50 820 L 460 820 L 460 1080 Z" />

              {/* Left Parapet Brick Mortar Lines */}
              <g stroke="rgba(250, 250, 250, 0.50)" strokeWidth="1.0" fill="none">
                <line x1="-50" y1="835" x2="460" y2="835" />
                <line x1="-50" y1="847" x2="460" y2="847" />
                <line x1="-50" y1="859" x2="460" y2="859" />
                <line x1="-50" y1="871" x2="460" y2="871" />
                <line x1="-50" y1="883" x2="460" y2="883" />
                <line x1="-50" y1="895" x2="460" y2="895" />
                <line x1="-50" y1="907" x2="460" y2="907" />

                {/* Staggered Vertical Brick Joints */}
                <line x1="30" y1="826" x2="30" y2="835" />
                <line x1="70" y1="826" x2="70" y2="835" />
                <line x1="110" y1="826" x2="110" y2="835" />
                <line x1="150" y1="826" x2="150" y2="835" />
                <line x1="190" y1="826" x2="190" y2="835" />
                <line x1="230" y1="826" x2="230" y2="835" />
                <line x1="270" y1="826" x2="270" y2="835" />
                <line x1="310" y1="826" x2="310" y2="835" />
                <line x1="350" y1="826" x2="350" y2="835" />
                <line x1="390" y1="826" x2="390" y2="835" />
                <line x1="430" y1="826" x2="430" y2="835" />

                <line x1="10" y1="835" x2="10" y2="847" />
                <line x1="50" y1="835" x2="50" y2="847" />
                <line x1="90" y1="835" x2="90" y2="847" />
                <line x1="130" y1="835" x2="130" y2="847" />
                <line x1="170" y1="835" x2="170" y2="847" />
                <line x1="210" y1="835" x2="210" y2="847" />
                <line x1="250" y1="835" x2="250" y2="847" />
                <line x1="290" y1="835" x2="290" y2="847" />
                <line x1="330" y1="835" x2="330" y2="847" />
                <line x1="370" y1="835" x2="370" y2="847" />
                <line x1="410" y1="835" x2="410" y2="847" />
                <line x1="450" y1="835" x2="450" y2="847" />

                 {/* Left Facade Scattered Brick Patches */}
                 {/* Patch L1 (under fire escape, x=100-160) */}
                 <line x1="100" y1="931" x2="160" y2="931" />
                 <line x1="100" y1="943" x2="160" y2="943" />
                 <line x1="100" y1="955" x2="160" y2="955" />
                 <line x1="100" y1="967" x2="160" y2="967" />
                 <line x1="120" y1="931" x2="120" y2="943" />
                 <line x1="150" y1="931" x2="150" y2="943" />
                 <line x1="105" y1="943" x2="105" y2="955" />
                 <line x1="135" y1="943" x2="135" y2="955" />
                 <line x1="120" y1="955" x2="120" y2="967" />
                 <line x1="150" y1="955" x2="150" y2="967" />

                 {/* Patch L2 (right-center, x=290-360) */}
                 <line x1="290" y1="919" x2="360" y2="919" />
                 <line x1="290" y1="931" x2="360" y2="931" />
                 <line x1="290" y1="943" x2="360" y2="943" />
                 <line x1="290" y1="955" x2="360" y2="955" />
                 <line x1="310" y1="919" x2="310" y2="931" />
                 <line x1="340" y1="919" x2="340" y2="931" />
                 <line x1="295" y1="931" x2="295" y2="943" />
                 <line x1="325" y1="931" x2="325" y2="943" />
                 <line x1="355" y1="931" x2="355" y2="943" />
                 <line x1="310" y1="943" x2="310" y2="955" />
                 <line x1="340" y1="943" x2="340" y2="955" />

                 {/* Patch L3 (lower left, x=30-90) */}
                 <line x1="30" y1="1003" x2="90" y2="1003" />
                 <line x1="30" y1="1015" x2="90" y2="1015" />
                 <line x1="30" y1="1027" x2="90" y2="1027" />
                 <line x1="30" y1="1039" x2="90" y2="1039" />
                 <line x1="50" y1="1003" x2="50" y2="1015" />
                 <line x1="80" y1="1003" x2="80" y2="1015" />
                 <line x1="35" y1="1015" x2="35" y2="1027" />
                 <line x1="65" y1="1015" x2="65" y2="1027" />
                 <line x1="50" y1="1027" x2="50" y2="1039" />
                 <line x1="80" y1="1027" x2="80" y2="1039" />
               </g>
              
              {/* Retro TV Yagi Antenna on left rooftop */}
              <g stroke="rgba(250, 250, 250, 0.48)" strokeWidth="1.5" fill="none">
                <line x1="415" y1="820" x2="415" y2="750" />
                {/* Crossbars */}
                <line x1="400" y1="760" x2="430" y2="760" />
                <line x1="404" y1="772" x2="426" y2="772" />
                <line x1="408" y1="784" x2="422" y2="784" />
                <line x1="411" y1="796" x2="419" y2="796" />
              </g>

              {/* Rooftop Water Puddle on left rooftop */}
              <ellipse cx="150" cy="820" rx="28" ry="2.5" fill="rgba(250, 250, 250, 0.16)" stroke="rgba(250, 250, 250, 0.45)" strokeWidth="0.8" />

              {/* Slanted Glass Skylight */}
              <g fill="var(--color-bg)" stroke="rgba(250, 250, 250, 0.48)" strokeWidth="1.2">
                <polygon points="255,820 255,805 285,812 285,820" />
                {/* Glass pane partitions */}
                <line x1="265" y1="810" x2="265" y2="820" strokeWidth="0.8" />
                <line x1="275" y1="815" x2="275" y2="820" strokeWidth="0.8" />
                {/* Internal glow / light rays shining out */}
                <polygon points="255,805 240,750 300,750 285,812" fill="rgba(250, 250, 250, 0.05)" stroke="none" />
              </g>

              {/* Detective Billboard Rebranded */}
              <g>
                {/* Spotlight cone shining up */}
                <polygon points="130,820 80,695 180,695" fill="url(#leftLightGrad)" stroke="none" className={styles.billboardLight} />
                
                {/* Scaffold support frame */}
                <line x1="90" y1="820" x2="98" y2="760" />
                <line x1="170" y1="820" x2="162" y2="760" />
                <line x1="98" y1="760" x2="162" y2="760" strokeWidth="1" />
                <line x1="98" y1="760" x2="170" y2="820" strokeWidth="0.8" opacity="0.5" />
                <line x1="162" y1="760" x2="90" y2="820" strokeWidth="0.8" opacity="0.5" />

                {/* Sign Board */}
                <rect x="80" y="700" width="100" height="60" rx="3" fill="var(--color-bg)" />
                {/* Border line */}
                <rect x="84" y="704" width="92" height="52" fill="none" strokeWidth="0.8" stroke="rgba(250, 250, 250, 0.4)" />
                
                {/* Cocktail Glass Logo */}
                <path d="M 104 718 L 124 718 L 114 734 Z" fill="none" strokeWidth="1.2" /> {/* Glass Bowl */}
                <line x1="114" y1="734" x2="114" y2="746" strokeWidth="1.5" /> {/* Stem */}
                <line x1="107" y1="746" x2="121" y2="746" strokeWidth="1.5" /> {/* Base */}
                
                <text x="154" y="728" textAnchor="middle" fontFamily="var(--font-code)" fontWeight="bold" fontSize="7.8" fill="rgba(250,250,250,0.85)" stroke="none">NOIR</text>
                <text x="154" y="740" textAnchor="middle" fontFamily="var(--font-code)" fontWeight="bold" fontSize="7.8" fill="rgba(250,250,250,0.85)" stroke="none">GIN</text>
              </g>

              {/* Rooftop Penthouse Brick Access Shed */}
              <g fill="var(--color-bg)" stroke="rgba(250, 250, 250, 0.48)" strokeWidth="1.8">
                {/* Main Shed Structure */}
                <rect x="290" y="750" width="65" height="70" />
                {/* Roof Cap */}
                <line x1="288" y1="750" x2="357" y2="750" />
                
                {/* Brick Mortar Details inside Shed (excluding door x=304-328, y=771-820) */}
                <g stroke="rgba(250, 250, 250, 0.50)" strokeWidth="1.0" fill="none">
                  {/* Rows */}
                  <line x1="290" y1="760" x2="355" y2="760" />
                  <line x1="290" y1="770" x2="355" y2="770" />
                  <line x1="290" y1="780" x2="304" y2="780" /> <line x1="328" y1="780" x2="355" y2="780" />
                  <line x1="290" y1="790" x2="304" y2="790" /> <line x1="328" y1="790" x2="355" y2="790" />
                  <line x1="290" y1="800" x2="304" y2="800" /> <line x1="328" y1="800" x2="355" y2="800" />
                  <line x1="290" y1="810" x2="304" y2="810" /> <line x1="328" y1="810" x2="355" y2="810" />

                  {/* Staggered Vertical Joints */}
                  <line x1="305" y1="750" x2="305" y2="760" />
                  <line x1="325" y1="750" x2="325" y2="760" />
                  <line x1="345" y1="750" x2="345" y2="760" />

                  <line x1="298" y1="760" x2="298" y2="770" />
                  <line x1="315" y1="760" x2="315" y2="770" />
                  <line x1="335" y1="760" x2="335" y2="770" />
                  <line x1="350" y1="760" x2="350" y2="770" />

                  <line x1="295" y1="770" x2="295" y2="780" />
                  <line x1="299" y1="780" x2="299" y2="790" />
                  <line x1="295" y1="790" x2="295" y2="800" />
                  <line x1="299" y1="800" x2="299" y2="810" />
                  <line x1="295" y1="810" x2="295" y2="820" />

                  <line x1="336" y1="770" x2="336" y2="780" />
                  <line x1="348" y1="770" x2="348" y2="780" />
                  <line x1="331" y1="780" x2="331" y2="790" />
                  <line x1="343" y1="780" x2="343" y2="790" />
                  <line x1="352" y1="780" x2="352" y2="790" />
                  <line x1="336" y1="790" x2="336" y2="800" />
                  <line x1="348" y1="790" x2="348" y2="800" />
                  <line x1="331" y1="800" x2="331" y2="810" />
                  <line x1="343" y1="800" x2="343" y2="810" />
                  <line x1="352" y1="800" x2="352" y2="810" />
                  <line x1="336" y1="810" x2="336" y2="820" />
                  <line x1="348" y1="810" x2="348" y2="820" />
                </g>

                {/* Wooden Access Door */}
                <rect x="304" y="771" width="24" height="49" strokeWidth="1.2" />
                {/* Inset Panels */}
                <rect x="308" y="776" width="16" height="17" fill="none" stroke="rgba(250, 250, 250, 0.4)" strokeWidth="0.8" />
                <rect x="308" y="797" width="16" height="19" fill="none" stroke="rgba(250, 250, 250, 0.4)" strokeWidth="0.8" />
                
                {/* Vintage Keyhole */}
                <circle cx="323" cy="798" r="1.2" fill="rgba(250, 250, 250, 0.85)" stroke="none" />
                <path d="M 322.5 798 L 321.5 801.5 L 324.5 801.5 Z" fill="rgba(250, 250, 250, 0.85)" stroke="none" />

                {/* Light fixture */}
                <line x1="316" y1="750" x2="316" y2="762" strokeWidth="1.0" />
                <rect x="314" y="762" width="4" height="3" strokeWidth="0.8" />
                <circle cx="316" cy="767" r="2.2" fill="#fafafa" stroke="none" />
                <circle cx="316" cy="767" r="2.6" fill="none" strokeWidth="0.5" />
                {/* Light cone casting downwards */}
                <polygon points="316,769 292,820 340,820" fill="url(#downwardLightGrad)" stroke="none" />
              </g>

              {/* Cat Silhouette sitting on penthouse roof */}
              <g>
                {/* Cat Body */}
                <path d="M 314 750 C 314 738, 326 738, 326 750 Z" fill="var(--color-bg)" />
                {/* Cat Head */}
                <circle cx="320" cy="728" r="5" fill="var(--color-bg)" />
                {/* Cat Ears */}
                <polygon points="316,725 313,718 318,721" fill="var(--color-bg)" />
                <polygon points="324,725 327,718 322,721" fill="var(--color-bg)" />
                {/* Cat Tail (Twitchy!) */}
                <path d="M 325 746 Q 332 743 329 735 T 333 725" fill="none" className={styles.catTail} />
                {/* Glowing Cat Eyes (blinking) */}
                <g className={styles.catEyes} fill="#fafafa" stroke="none">
                  <circle cx="318.5" cy="727.5" r="0.8" />
                  <circle cx="321.5" cy="727.5" r="0.8" />
                </g>
              </g>

              {/* Parapet Wall Cap details on left roof */}
              <line x1="-50" y1="826" x2="460" y2="826" strokeWidth="0.8" />
              <line x1="40" y1="820" x2="40" y2="1080" stroke="rgba(250, 250, 250, 0.2)" strokeWidth="1" />
              
              {/* Fire Escape details hanging on the left facade */}
              <g stroke="rgba(250, 250, 250, 0.43)" strokeWidth="1.2" fill="none">
                {/* Railings */}
                <path d="M 15 850 L 85 850 M 15 890 L 85 890 M 15 930 L 85 930" />
                <path d="M 15 850 L 15 950 M 85 850 L 85 950" />
                {/* Diagonal ladders */}
                <line x1="70" y1="850" x2="25" y2="890" />
                <line x1="30" y1="890" x2="75" y2="930" />
              </g>

              {/* Rooftop Pipe Chimneys with Steam path generators */}
              <rect x="220" y="780" width="16" height="40" />
              <rect x="215" y="775" width="26" height="6" />

              <rect x="360" y="760" width="22" height="60" />
              <rect x="354" y="754" width="34" height="6" />
              {/* Exhaust Fan Housing */}
              <ellipse cx="371" cy="750" rx="9" ry="4" fill="var(--color-bg)" stroke="rgba(250, 250, 250, 0.48)" strokeWidth="1" />
              {/* Spinning Fan Blades */}
              <g className={styles.fanBlade}>
                <line x1="371" y1="750" x2="366" y2="748" stroke="rgba(250, 250, 250, 0.85)" strokeWidth="1" />
                <line x1="371" y1="750" x2="376" y2="752" stroke="rgba(250, 250, 250, 0.85)" strokeWidth="1" />
                <line x1="371" y1="750" x2="369" y2="753" stroke="rgba(250, 250, 250, 0.85)" strokeWidth="1" />
                <line x1="371" y1="750" x2="373" y2="747" stroke="rgba(250, 250, 250, 0.85)" strokeWidth="1" />
              </g>

              {/* RIGHT ROOFTOP SECTION */}
              <path d="M 1420 1080 L 1420 760 L 1970 760 L 1970 1080 Z" />
              <line x1="1420" y1="766" x2="1970" y2="766" strokeWidth="0.8" />

              {/* Right Parapet Brick Mortar Lines */}
              <g stroke="rgba(250, 250, 250, 0.50)" strokeWidth="1.0" fill="none">
                <line x1="1420" y1="775" x2="1970" y2="775" />
                <line x1="1420" y1="787" x2="1970" y2="787" />
                <line x1="1420" y1="799" x2="1970" y2="799" />
                <line x1="1420" y1="811" x2="1970" y2="811" />
                <line x1="1420" y1="823" x2="1970" y2="823" />

                <line x1="1450" y1="766" x2="1450" y2="775" />
                <line x1="1490" y1="766" x2="1490" y2="775" />
                <line x1="1530" y1="766" x2="1530" y2="775" />
                <line x1="1570" y1="766" x2="1570" y2="775" />
                <line x1="1610" y1="766" x2="1610" y2="775" />
                <line x1="1650" y1="766" x2="1650" y2="775" />
                <line x1="1690" y1="766" x2="1690" y2="775" />
                <line x1="1730" y1="766" x2="1730" y2="775" />

                <line x1="1430" y1="775" x2="1430" y2="787" />
                <line x1="1470" y1="775" x2="1470" y2="787" />
                <line x1="1510" y1="775" x2="1510" y2="787" />
                <line x1="1550" y1="775" x2="1550" y2="787" />
                <line x1="1590" y1="775" x2="1590" y2="787" />
                <line x1="1630" y1="775" x2="1630" y2="787" />
                <line x1="1670" y1="775" x2="1670" y2="787" />
                <line x1="1710" y1="775" x2="1710" y2="787" />

                {/* Right Facade Scattered Brick Patches */}
                {/* Patch R1 (left-center, x=1440-1510) */}
                <line x1="1440" y1="851" x2="1510" y2="851" />
                <line x1="1440" y1="863" x2="1510" y2="863" />
                <line x1="1440" y1="875" x2="1510" y2="875" />
                <line x1="1440" y1="887" x2="1510" y2="887" />
                <line x1="1460" y1="851" x2="1460" y2="863" />
                <line x1="1490" y1="851" x2="1490" y2="863" />
                <line x1="1445" y1="863" x2="1445" y2="875" />
                <line x1="1475" y1="863" x2="1475" y2="875" />
                <line x1="1505" y1="863" x2="1505" y2="875" />
                <line x1="1460" y1="875" x2="1460" y2="887" />
                <line x1="1490" y1="875" x2="1490" y2="887" />

                {/* Patch R2 (right, x=1750-1820) */}
                <line x1="1750" y1="835" x2="1820" y2="835" />
                <line x1="1750" y1="847" x2="1820" y2="847" />
                <line x1="1750" y1="859" x2="1820" y2="859" />
                <line x1="1750" y1="871" x2="1820" y2="871" />
                <line x1="1770" y1="835" x2="1770" y2="847" />
                <line x1="1800" y1="835" x2="1800" y2="847" />
                <line x1="1755" y1="847" x2="1755" y2="859" />
                <line x1="1785" y1="847" x2="1785" y2="859" />
                <line x1="1815" y1="847" x2="1815" y2="859" />
                <line x1="1770" y1="859" x2="1770" y2="871" />
                <line x1="1800" y1="859" x2="1800" y2="871" />

                {/* Patch R3 (lower center, x=1580-1650) */}
                <line x1="1580" y1="935" x2="1650" y2="935" />
                <line x1="1580" y1="947" x2="1650" y2="947" />
                <line x1="1580" y1="959" x2="1650" y2="959" />
                <line x1="1580" y1="971" x2="1650" y2="971" />
                <line x1="1600" y1="935" x2="1600" y2="947" />
                <line x1="1630" y1="935" x2="1630" y2="947" />
                <line x1="1585" y1="947" x2="1585" y2="959" />
                <line x1="1615" y1="947" x2="1615" y2="959" />
                <line x1="1645" y1="947" x2="1645" y2="959" />
                <line x1="1600" y1="959" x2="1600" y2="971" />
                <line x1="1630" y1="959" x2="1630" y2="971" />
              </g>


              {/* Roof HVAC Unit */}
              <rect x="1750" y="715" width="65" height="45" />
              {/* HVAC Grid */}
              <line x1="1760" y1="725" x2="1805" y2="725" strokeWidth="0.8" />
              <line x1="1760" y1="735" x2="1805" y2="735" strokeWidth="0.8" />
              <line x1="1760" y1="745" x2="1805" y2="745" strokeWidth="0.8" />

              {/* Industrial Blower Unit with Spinning Fan Wheel */}
              <g fill="var(--color-bg)" stroke="rgba(250, 250, 250, 0.48)" strokeWidth="1.2">
                <rect x="1587" y="725" width="22" height="35" rx="1" />
                {/* Fan casing circle */}
                <circle cx="1598" cy="742" r="8" />
                
                {/* Blower wheel spokes (blades inside the casing circle) */}
                <circle cx="1598" cy="742" r="1.5" fill="rgba(250, 250, 250, 0.85)" stroke="none" />
                <g className={styles.blowerFan}>
                  <line x1="1598" y1="742" x2="1598" y2="734" stroke="rgba(250, 250, 250, 0.85)" strokeWidth="0.8" />
                  <line x1="1598" y1="742" x2="1598" y2="750" stroke="rgba(250, 250, 250, 0.85)" strokeWidth="0.8" />
                  <line x1="1598" y1="742" x2="1590" y2="742" stroke="rgba(250, 250, 250, 0.85)" strokeWidth="0.8" />
                  <line x1="1598" y1="742" x2="1606" y2="742" stroke="rgba(250, 250, 250, 0.85)" strokeWidth="0.8" />
                  <line x1="1598" y1="742" x2="1592" y2="736" stroke="rgba(250, 250, 250, 0.6)" strokeWidth="0.6" />
                  <line x1="1598" y1="742" x2="1604" y2="748" stroke="rgba(250, 250, 250, 0.6)" strokeWidth="0.6" />
                  <line x1="1598" y1="742" x2="1592" y2="748" stroke="rgba(250, 250, 250, 0.6)" strokeWidth="0.6" />
                  <line x1="1598" y1="742" x2="1604" y2="736" stroke="rgba(250, 250, 250, 0.6)" strokeWidth="0.6" />
                </g>

                {/* Exhaust Pipe Stack */}
                <line x1="1598" y1="725" x2="1598" y2="717" />
                <line x1="1595" y1="717" x2="1601" y2="717" strokeWidth="1.5" />
              </g>

              {/* Rooftop Clothesline with Swaying Laundry */}
              <g>
                {/* Left & Right Posts */}
                <line x1="1640" y1="760" x2="1640" y2="710" />
                <line x1="1705" y1="760" x2="1705" y2="710" />
                <line x1="1635" y1="710" x2="1645" y2="710" strokeWidth="1" />
                <line x1="1700" y1="710" x2="1710" y2="710" strokeWidth="1" />
                {/* Sagging Line */}
                <path d="M 1640 715 Q 1672 725 1705 715" fill="none" strokeWidth="0.8" />
                
                {/* Detailed Comic-Noir Laundry Clothes */}
                {/* Trench Coat (Sway 1) */}
                <g className={styles.laundry1}>
                  <path d="M 1648 718 L 1645 724 L 1642 728 L 1644 738 L 1648 735 L 1648 756 L 1662 756 L 1662 735 L 1666 738 L 1668 728 L 1665 724 L 1662 718 Z" fill="var(--color-bg)" strokeWidth="1" />
                  <line x1="1655" y1="718" x2="1655" y2="756" stroke="rgba(250, 250, 250, 0.4)" strokeWidth="0.6" />
                  <line x1="1648" y1="735" x2="1662" y2="735" stroke="rgba(250, 250, 250, 0.4)" strokeWidth="0.6" />
                </g>
                {/* Trousers (Sway 2) */}
                <g className={styles.laundry2}>
                  <path d="M 1670 720 L 1667 750 L 1673 750 L 1676 730 L 1679 750 L 1685 750 L 1682 720 Z" fill="var(--color-bg)" strokeWidth="1" />
                </g>
                {/* Fedora Hat (Sway 3) */}
                <g className={styles.laundry3}>
                  <path d="M 1687 728 C 1687 724, 1690 717, 1695 717 C 1700 717, 1703 724, 1703 728 C 1706 728, 1708 729, 1708 731 C 1708 733, 1682 733, 1682 731 C 1682 729, 1684 728, 1687 728 Z" fill="var(--color-bg)" strokeWidth="1" />
                  <path d="M 1688 728 Q 1695 727 1702 728 L 1702 726 Q 1695 725 1688 726 Z" fill="rgba(250, 250, 250, 0.85)" stroke="none" />
                </g>
              </g>

              {/* Roof Chimney Duct for Steam */}
              <rect x="1860" y="700" width="18" height="60" />
              <rect x="1854" y="694" width="30" height="6" />

              {/* MIDDLE BRIDGE STRUCTURE (Fills the gap between rooftops) */}
              <path d="M 850 1080 L 850 780 L 870 730 L 890 730 L 910 780 L 910 1080 Z" />
              {/* Bridge Tower Structural Steel Trusses */}
              <g stroke="rgba(250, 250, 250, 0.30)" strokeWidth="0.9" fill="none">
                <line x1="870" y1="730" x2="870" y2="780" />
                <line x1="890" y1="730" x2="890" y2="780" />
                {/* Diagonal Cross-bracing (X trusses) in tower panels */}
                <line x1="870" y1="730" x2="890" y2="760" />
                <line x1="890" y1="730" x2="870" y2="760" />
                <line x1="870" y1="760" x2="890" y2="760" />
                <line x1="870" y1="760" x2="890" y2="790" />
                <line x1="890" y1="760" x2="870" y2="790" />
                <line x1="850" y1="790" x2="910" y2="790" strokeWidth="1.2" />
                {/* Left Leg Panel Diagonals */}
                <line x1="850" y1="790" x2="870" y2="850" />
                <line x1="870" y1="790" x2="850" y2="850" />
                <line x1="850" y1="850" x2="870" y2="850" />
                <line x1="850" y1="850" x2="870" y2="910" />
                <line x1="870" y1="850" x2="850" y2="910" />
                <line x1="850" y1="910" x2="870" y2="910" />
                {/* Right Leg Panel Diagonals */}
                <line x1="890" y1="790" x2="910" y2="850" />
                <line x1="910" y1="790" x2="890" y2="850" />
                <line x1="890" y1="850" x2="910" y2="850" />
                <line x1="890" y1="850" x2="910" y2="910" />
                <line x1="910" y1="850" x2="890" y2="910" />
                <line x1="890" y1="910" x2="910" y2="910" />
              </g>
              {/* Bridge arches */}
              <path d="M 865 840 A 12 25 0 0 1 895 840" fill="none" />
              <path d="M 865 910 A 12 25 0 0 1 895 910" fill="none" />
              {/* Bridge Cables */}
              <path d="M 880 730 Q 670 820 460 850" fill="none" strokeWidth="1" />
              <path d="M 880 730 Q 1150 820 1420 850" fill="none" strokeWidth="1" />

              {/* Bridge Roadway Deck (Warren Truss/Steel Girder Structure) */}
              <g stroke="rgba(250, 250, 250, 0.48)" fill="none">
                {/* Upper Deck Chord */}
                <path d="M 460 850 Q 880 820 1420 850" strokeWidth="1.5" />
                {/* Lower Deck Chord */}
                <path d="M 460 856 Q 880 826 1420 856" strokeWidth="1.5" />
                {/* Vertical Steel Posts (follow the curve) */}
                <path d="M 480 848 L 480 854 M 500 847 L 500 853 M 520 845 L 520 851 M 540 843 L 540 849 M 560 841 L 560 847 M 580 839 L 580 845 M 600 837 L 600 843 M 620 835 L 620 841 M 640 833 L 640 839 M 660 831 L 660 837 M 680 830 L 680 836 M 700 828 L 700 834 M 720 827 L 720 833 M 740 825 L 740 831 M 760 824 L 760 830 M 780 823 L 780 829 M 800 822 L 800 828 M 820 821 L 820 827 M 840 820 L 840 826 M 920 820 L 920 826 M 940 821 L 940 827 M 960 822 L 960 828 M 980 823 L 980 829 M 1000 824 L 1000 830 M 1020 825 L 1020 831 M 1040 827 L 1040 833 M 1060 828 L 1060 834 M 1080 830 L 1080 836 M 1100 831 L 1100 837 M 1120 833 L 1120 839 M 1140 835 L 1140 841 M 1160 837 L 1160 843 M 1180 839 L 1180 845 M 1200 841 L 1200 847 M 1220 843 L 1220 849 M 1240 845 L 1240 851 M 1260 847 L 1260 853 M 1280 848 L 1280 854 M 1300 850 L 1300 856 M 1320 850 L 1320 856 M 1340 850 L 1340 856 M 1360 850 L 1360 856 M 1380 850 L 1380 856 M 1400 850 L 1400 856" strokeWidth="0.8" stroke="rgba(250, 250, 250, 0.30)" />
              </g>

              {/* Roadway traffic lights & car silhouettes */}
              <g fill="rgba(250, 250, 250, 0.85)" stroke="none">
                {/* Outbound Traffic Light Trail (glowing headlights) */}
                <path d="M 460 852 Q 880 822 1420 852" fill="none" stroke="rgba(250, 250, 250, 0.25)" strokeWidth="0.8" />
                {/* Inbound Traffic Light Trail (glowing taillights) */}
                <path d="M 460 854 Q 880 824 1420 854" fill="none" stroke="rgba(250, 250, 250, 0.2)" strokeWidth="0.8" />

                {/* Animated Bridge Traffic Dots (Staggered Outbound Headlights and Inbound Taillights) */}
                
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

              {/* Vertical Bridge Suspender Ropes */}
              <g stroke="rgba(250, 250, 250, 0.28)" strokeWidth="0.8" fill="none">
                {/* Left side suspenders */}
                <line x1="500" y1="847.3" x2="500" y2="843.7" />
                <line x1="530" y1="845.5" x2="530" y2="838.3" />
                <line x1="560" y1="843.8" x2="560" y2="832.3" />
                <line x1="590" y1="842.3" x2="590" y2="825.7" />
                <line x1="620" y1="840.9" x2="620" y2="818.4" />
                <line x1="650" y1="839.7" x2="650" y2="810.6" />
                <line x1="680" y1="838.7" x2="680" y2="802.1" />
                <line x1="710" y1="837.7" x2="710" y2="793.0" />
                <line x1="740" y1="837.0" x2="740" y2="783.3" />
                <line x1="770" y1="836.3" x2="770" y2="773.0" />
                <line x1="800" y1="835.8" x2="800" y2="762.1" />
                <line x1="830" y1="835.4" x2="830" y2="750.6" />
                
                {/* Right side suspenders */}
                <line x1="930" y1="835.0" x2="930" y2="746.2" />
                <line x1="960" y1="835.2" x2="960" y2="755.3" />
                <line x1="990" y1="835.4" x2="990" y2="764.2" />
                <line x1="1020" y1="835.8" x2="1020" y2="772.6" />
                <line x1="1050" y1="836.2" x2="1050" y2="780.7" />
                <line x1="1080" y1="836.8" x2="1080" y2="788.4" />
                <line x1="1110" y1="837.5" x2="1110" y2="795.8" />
                <line x1="1140" y1="838.3" x2="1140" y2="802.8" />
                <line x1="1170" y1="839.1" x2="1170" y2="809.4" />
                <line x1="1200" y1="840.1" x2="1200" y2="815.6" />
                <line x1="1230" y1="841.2" x2="1230" y2="821.5" />
                <line x1="1260" y1="842.3" x2="1260" y2="827.0" />
              </g>

              {/* River waterline & Tugboat under the bridge */}
              <line x1="460" y1="950" x2="1420" y2="950" stroke="rgba(250, 250, 250, 0.16)" strokeWidth="1" strokeDasharray="8 6" />
              
              <g>
                {/* Tugboat hull */}
                <path d="M 1030 950 L 1070 950 L 1065 941 L 1035 941 Z" fill="var(--color-bg)" />
                {/* Cabin */}
                <rect x="1040" y="933" width="16" height="8" fill="var(--color-bg)" strokeWidth="1" />
                {/* Smokestack */}
                <line x1="1052" y1="933" x2="1052" y2="926" strokeWidth="1.2" />
                {/* Smoke puffs */}
                <circle cx="1050" cy="922" r="2" fill="none" stroke="rgba(250,250,250,0.3)" strokeWidth="0.8" />
                <circle cx="1047" cy="918" r="3" fill="none" stroke="rgba(250,250,250,0.2)" strokeWidth="0.8" />
                {/* Propeller wake wave ripples */}
                <path d="M 1026 947 Q 1010 945 995 948" fill="none" stroke="rgba(250, 250, 250, 0.2)" strokeWidth="0.8" />
                <path d="M 1020 951 Q 1005 950 988 953" fill="none" stroke="rgba(250, 250, 250, 0.15)" strokeWidth="0.8" />
              </g>

              {/* Bridge Streetlights (Glowing dots along deck) */}
              <g fill="#fafafa" stroke="none">
                <circle cx="550" cy="840" r="1.8" opacity="0.85" />
                <circle cx="650" cy="833" r="1.8" opacity="0.85" />
                <circle cx="750" cy="828" r="1.8" opacity="0.85" />
                <circle cx="850" cy="825" r="1.8" opacity="0.85" />
                <circle cx="950" cy="825" r="1.8" opacity="0.85" />
                <circle cx="1050" cy="828" r="1.8" opacity="0.85" />
                <circle cx="1150" cy="833" r="1.8" opacity="0.85" />
                <circle cx="1250" cy="840" r="1.8" opacity="0.85" />
                <circle cx="1350" cy="848" r="1.8" opacity="0.85" />
              </g>

              {/* Hanging Power Lines / Catenary wires */}
              <g stroke="rgba(250, 250, 250, 0.28)" strokeWidth="0.8" fill="none">
                <path d="M 450 820 Q 650 900 850 780" />
                <path d="M 450 835 Q 650 915 850 795" />
                <path d="M 910 780 Q 1165 915 1420 760" />
              </g>
            </g>

            {/* Rising Steam/Smoke Paths (CSS Animated) */}
            <g fill="none" stroke="rgba(250, 250, 250, 0.45)" strokeWidth="1">
              {/* Steam from Chimney 1 (Left Roof x=228, y=775) */}
              <path 
                d="M 228 770 Q 220 740 228 720 T 222 670" 
                className={styles.steam} 
              />
              
              {/* Steam from Chimney 2 (Left Roof x=371, y=754) */}
              <path 
                d="M 371 750 Q 380 720 371 700 T 378 650" 
                className={styles.steamDelayed} 
              />

               {/* Steam from Chimney 3 (Right Roof x=1869, y=694) */}
              <path 
                d="M 1869 690 Q 1860 660 1869 640 T 1860 590" 
                className={styles.steam} 
              />

              {/* Steam from Industrial Blower (Right Roof x=1598, y=715) */}
              <path 
                d="M 1598 710 Q 1607 680 1598 660 T 1605 610" 
                className={styles.steamDelayed} 
              />
            </g>

            {/* Rolling River Fog/Mist Layers (Layered depth and gradient texture) */}
            <g fill="url(#fogGradient)" stroke="none">
              {/* Fog Layer 1 (Drifts left) */}
              <path 
                d="M -300 920 C 100 890, 400 890, 800 915 C 1200 895, 1600 895, 2220 920 L 2220 1080 L -300 1080 Z" 
                opacity="0.3" 
                className={styles.fog1} 
              />
              {/* Fog Layer 2 (Drifts right) */}
              <path 
                d="M -300 935 C 200 915, 700 905, 1100 930 C 1500 910, 1800 920, 2220 935 L 2220 1080 L -300 1080 Z" 
                opacity="0.2" 
                className={styles.fog2} 
              />
            </g>
          </svg>
        </motion.div>
      </motion.div>

    </div>
  );
}
