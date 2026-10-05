'use client';

import React from 'react';
import TerminalSnakeGame from '@/components/ui/TerminalSnakeGame';

interface PlaygroundSnakeProps {
  onClose?: () => void;
}

export default function PlaygroundSnake({ onClose }: PlaygroundSnakeProps) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <TerminalSnakeGame
        onClose={onClose || (() => {})}
      />
    </div>
  );
}
