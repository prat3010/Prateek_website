'use client';

import React from 'react';
import ThreePizzaRat from '@/components/effects/ThreePizzaRat';

export default function PlaygroundPizzaRat() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '540px', background: '#090d16', overflow: 'hidden' }}>
      <ThreePizzaRat />
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0, 0, 0, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '9999px',
        padding: '6px 16px',
        color: '#fff',
        fontFamily: 'var(--font-jetbrains-mono, monospace)',
        fontSize: '0.8rem',
        pointerEvents: 'none',
        backdropFilter: 'blur(4px)',
      }}>
        Move cursor horizontally to guide Pizza Rat across the subway
      </div>
    </div>
  );
}
