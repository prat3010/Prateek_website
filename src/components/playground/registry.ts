'use client';

import dynamic from 'next/dynamic';
import React, { type ComponentType } from 'react';
import type { PlaygroundItem } from '@/data/playgroundItems';

export interface PlaygroundComponentProps {
  slug?: string;
  isCommercial?: boolean;
  item?: PlaygroundItem;
}

const LoadingSkeleton = () => {
  return React.createElement(
    'div',
    {
      style: {
        minHeight: '320px',
        background: 'var(--surface-elevated, #161616)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--color-text-muted, #888888)',
        fontFamily: 'var(--font-jetbrains-mono, monospace)',
        fontSize: '0.85rem',
      },
    },
    React.createElement('span', null, 'Loading interactive environment...')
  );
};

export const PLAYGROUND_COMPONENT_REGISTRY: Record<
  string, 
  ComponentType<PlaygroundComponentProps>
> = {
  PlaygroundSnake: dynamic(
    () => import('@/components/playground/items/PlaygroundSnake'),
    { ssr: false, loading: LoadingSkeleton }
  ) as unknown as ComponentType<PlaygroundComponentProps>,
  PlaygroundPathfinder: dynamic(
    () => import('@/components/playground/items/PlaygroundPathfinder'),
    { ssr: false, loading: LoadingSkeleton }
  ) as unknown as ComponentType<PlaygroundComponentProps>,
  PlaygroundPizzaRat: dynamic(
    () => import('@/components/playground/items/PlaygroundPizzaRat'),
    { ssr: false, loading: LoadingSkeleton }
  ) as unknown as ComponentType<PlaygroundComponentProps>,
  PlaygroundMatrixRain: dynamic(
    () => import('@/components/playground/items/PlaygroundMatrixRain'),
    { ssr: false, loading: LoadingSkeleton }
  ) as unknown as ComponentType<PlaygroundComponentProps>,
  PlaygroundNeuralDossier: dynamic(
    () => import('@/components/playground/items/PlaygroundNeuralDossier'),
    { ssr: false, loading: LoadingSkeleton }
  ) as unknown as ComponentType<PlaygroundComponentProps>,
  // Default interactive stage for headless code packs, CLI tools, and starter kits
  PlaygroundHeadlessStage: dynamic(
    () => import('@/components/playground/items/PlaygroundHeadlessStage'),
    { ssr: false, loading: LoadingSkeleton }
  ) as unknown as ComponentType<PlaygroundComponentProps>,
};

export function resolvePlaygroundComponent(componentName?: string | null): ComponentType<PlaygroundComponentProps> {
  if (componentName && PLAYGROUND_COMPONENT_REGISTRY[componentName]) {
    return PLAYGROUND_COMPONENT_REGISTRY[componentName];
  }
  // Headless commercial fallback: renders CLI simulator, file tree, and architecture inspector
  return PLAYGROUND_COMPONENT_REGISTRY.PlaygroundHeadlessStage;
}
