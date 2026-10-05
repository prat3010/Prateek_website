'use client';

import React from 'react';
import MatrixRainOverlay from '@/components/effects/MatrixRainOverlay';

export default function PlaygroundMatrixRain() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '540px', background: '#020a04', overflow: 'hidden' }}>
      <MatrixRainOverlay />
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.75)',
        border: '1px solid rgba(0, 255, 102, 0.3)',
        borderRadius: '9999px',
        padding: '6px 16px',
        color: '#00ff66',
        fontFamily: 'var(--font-jetbrains-mono, monospace)',
        fontSize: '0.8rem',
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
      }}>
        Matrix Phosphor Stream // Katakana Canvas Particle Shader
      </div>
    </div>
  );
}
