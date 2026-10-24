'use client';

import React from 'react';

/**
 * Unified Skyline SVG Definitions.
 * Centralizes all atmospheric lighting gradients, searchlight cones, and architectural hatch patterns
 * into a single global <defs> block mounted in Layer0.
 */
const SkylineDefs = React.memo(function SkylineDefs() {
  return (
    <defs>
      {/* ── Searchlight Gradients (Noir / Default) ── */}
      <linearGradient id="leftLightGrad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="rgba(250, 250, 250, 0.15)" />
        <stop offset="60%" stopColor="rgba(250, 250, 250, 0.04)" />
        <stop offset="100%" stopColor="rgba(250, 250, 250, 0)" />
      </linearGradient>

      <linearGradient id="rightLightGrad" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="rgba(250, 250, 250, 0.18)" />
        <stop offset="50%" stopColor="rgba(250, 250, 250, 0.05)" />
        <stop offset="100%" stopColor="rgba(250, 250, 250, 0)" />
      </linearGradient>

      <linearGradient id="blimpLightGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.28)" />
        <stop offset="60%" stopColor="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
      </linearGradient>

      {/* ── Radial Moon Glow ── */}
      <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
        <stop offset="70%" stopColor="rgba(255, 255, 255, 0.08)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
      </radialGradient>

      {/* ── Searchlight Gradients (Azure / Popart) ── */}
      <linearGradient id="leftLightGradPopart" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="rgba(41, 121, 255, 0.25)" />
        <stop offset="60%" stopColor="rgba(41, 121, 255, 0.06)" />
        <stop offset="100%" stopColor="rgba(41, 121, 255, 0)" />
      </linearGradient>

      <linearGradient id="rightLightGradPopart" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="rgba(255, 23, 68, 0.25)" />
        <stop offset="50%" stopColor="rgba(255, 23, 68, 0.06)" />
        <stop offset="100%" stopColor="rgba(255, 23, 68, 0)" />
      </linearGradient>

      <linearGradient id="blimpLightGradPopart" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(0, 230, 118, 0.35)" />
        <stop offset="60%" stopColor="rgba(0, 230, 118, 0.1)" />
        <stop offset="100%" stopColor="rgba(0, 230, 118, 0)" />
      </linearGradient>

      {/* ── Searchlight Gradients (Neon Accent) ── */}
      <linearGradient id="leftLightGradNeon" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="rgba(0, 240, 255, 0.25)" />
        <stop offset="60%" stopColor="rgba(0, 240, 255, 0.06)" />
        <stop offset="100%" stopColor="rgba(0, 240, 255, 0)" />
      </linearGradient>

      <linearGradient id="rightLightGradNeon" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="rgba(255, 42, 85, 0.25)" />
        <stop offset="50%" stopColor="rgba(255, 42, 85, 0.06)" />
        <stop offset="100%" stopColor="rgba(255, 42, 85, 0)" />
      </linearGradient>

      <linearGradient id="blimpLightGradNeon" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(255, 230, 0, 0.35)" />
        <stop offset="60%" stopColor="rgba(255, 230, 0, 0.1)" />
        <stop offset="100%" stopColor="rgba(255, 230, 0, 0)" />
      </linearGradient>

      {/* ── Sky Gradient Popart ── */}
      <radialGradient id="skyGradPopart" cx="50%" cy="40%" r="70%">
        <stop offset="0%" stopColor="#FFFDF6" />
        <stop offset="40%" stopColor="#FFE082" />
        <stop offset="100%" stopColor="#90CAF9" />
      </radialGradient>

      {/* ── Downward Bulbs & Fixtures ── */}
      <linearGradient id="downwardLightGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(255, 255, 255, 0.55)" />
        <stop offset="50%" stopColor="rgba(255, 255, 255, 0.2)" />
        <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
      </linearGradient>

      <linearGradient id="downwardLightGradPopart" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="rgba(255, 234, 0, 0.5)" />
        <stop offset="50%" stopColor="rgba(255, 234, 0, 0.15)" />
        <stop offset="100%" stopColor="rgba(255, 234, 0, 0)" />
      </linearGradient>

      {/* ── River Water Gradients ── */}
      <linearGradient id="riverGradNoir" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#111116" />
        <stop offset="100%" stopColor="#070709" />
      </linearGradient>

      <linearGradient id="riverGradPopart" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A1DEDC" />
        <stop offset="100%" stopColor="#7FB3D5" />
      </linearGradient>

      {/* ── Architectural Hatch Patterns ── */}
      {/* Layer 1 Background Hatch */}
      <pattern id="hatch-bg" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(250, 250, 250, 0.08)" strokeWidth="0.8" />
      </pattern>
      <pattern id="hatch-bg-black" width="6" height="6" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(26, 26, 46, 0.08)" strokeWidth="0.8" />
      </pattern>

      {/* Layer 2 Midground Hatch */}
      <pattern id="hatch-mid" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(250, 250, 250, 0.15)" strokeWidth="1.0" />
      </pattern>
      <pattern id="hatch-mid-black" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(26, 26, 46, 0.15)" strokeWidth="1.0" />
      </pattern>

      {/* Layer 3 Foreground Hatch */}
      <pattern id="hatch-fg" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(250, 250, 250, 0.22)" strokeWidth="1.2" />
      </pattern>
      <pattern id="hatch-fg-black" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(26, 26, 46, 0.22)" strokeWidth="1.2" />
      </pattern>

      {/* Layer 3 Brick Mortar Texture */}
      <pattern id="brick-fg" width="24" height="12" patternUnits="userSpaceOnUse">
        <line x1="0" y1="6" x2="24" y2="6" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
        <line x1="0" y1="12" x2="24" y2="12" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
        <line x1="12" y1="0" x2="12" y2="6" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
        <line x1="0" y1="6" x2="0" y2="12" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
        <line x1="24" y1="6" x2="24" y2="12" stroke="var(--skyline-mortar-stroke)" strokeWidth="0.8" />
      </pattern>
    </defs>
  );
});

export default SkylineDefs;
