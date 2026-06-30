'use client';

import React from 'react';
import styles from '../NoirSkyline.module.css';

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
    <>
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

        {/* Left Searchlight Gradient Neon (Cyan) */}
        <linearGradient id="leftLightGradNeon" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(0, 240, 255, 0.25)" />
          <stop offset="60%" stopColor="rgba(0, 240, 255, 0.06)" />
          <stop offset="100%" stopColor="rgba(0, 240, 255, 0)" />
        </linearGradient>

        {/* Right Searchlight Gradient Neon (Pink) */}
        <linearGradient id="rightLightGradNeon" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(255, 42, 85, 0.25)" />
          <stop offset="50%" stopColor="rgba(255, 42, 85, 0.06)" />
          <stop offset="100%" stopColor="rgba(255, 42, 85, 0)" />
        </linearGradient>

        {/* Blimp Searchlight Gradient Neon (Yellow) */}
        <linearGradient id="blimpLightGradNeon" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255, 230, 0, 0.35)" />
          <stop offset="60%" stopColor="rgba(255, 230, 0, 0.1)" />
          <stop offset="100%" stopColor="rgba(255, 230, 0, 0)" />
        </linearGradient>

        {/* Sky Gradient Popart */}
        <radialGradient id="skyGradPopart" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stopColor="#FFFDF6" />
          <stop offset="40%" stopColor="#FFE082" />
          <stop offset="100%" stopColor="#90CAF9" />
        </radialGradient>
      </defs>

      {/* Static backdrop SVG */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" className={styles.staticLayerSvg} style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0 }}>
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

          {/* Left Searchlight Gradient Neon (Cyan) */}
          <linearGradient id="leftLightGradNeon" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(0, 240, 255, 0.25)" />
            <stop offset="60%" stopColor="rgba(0, 240, 255, 0.06)" />
            <stop offset="100%" stopColor="rgba(0, 240, 255, 0)" />
          </linearGradient>

          {/* Right Searchlight Gradient Neon (Pink) */}
          <linearGradient id="rightLightGradNeon" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(255, 42, 85, 0.25)" />
            <stop offset="50%" stopColor="rgba(255, 42, 85, 0.06)" />
            <stop offset="100%" stopColor="rgba(255, 42, 85, 0)" />
          </linearGradient>

          {/* Blimp Searchlight Gradient Neon (Yellow) */}
          <linearGradient id="blimpLightGradNeon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255, 230, 0, 0.35)" />
            <stop offset="60%" stopColor="rgba(255, 230, 0, 0.1)" />
            <stop offset="100%" stopColor="rgba(255, 230, 0, 0)" />
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
      </svg>

      {/* Dynamic / Animating Sky Overlay SVG */}
      <svg viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMax slice" style={{ width: '100%', height: '100%', overflow: 'visible', position: 'absolute', inset: 0, pointerEvents: 'none' }}>
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
    </>
  );
});

Layer0.displayName = 'Layer0';

export default Layer0;
