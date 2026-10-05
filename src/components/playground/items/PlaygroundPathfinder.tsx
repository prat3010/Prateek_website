'use client';

import React from 'react';
import TerminalPathfinder from '@/components/ui/TerminalPathfinder';

interface PlaygroundPathfinderProps {
  onClose?: () => void;
}

export default function PlaygroundPathfinder({ onClose }: PlaygroundPathfinderProps) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <TerminalPathfinder
        onClose={onClose || (() => {})}
      />
    </div>
  );
}
