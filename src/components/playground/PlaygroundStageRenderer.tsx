'use client';

import React from 'react';
import type { PlaygroundItem } from '@/data/playgroundItems';
import { PLAYGROUND_COMPONENT_REGISTRY } from '@/components/playground/registry';

export interface PlaygroundStageRendererProps {
  componentName?: string | null;
  item?: PlaygroundItem;
  slug?: string;
  isCommercial?: boolean;
}

const Snake = PLAYGROUND_COMPONENT_REGISTRY.PlaygroundSnake;
const Pathfinder = PLAYGROUND_COMPONENT_REGISTRY.PlaygroundPathfinder;
const PizzaRat = PLAYGROUND_COMPONENT_REGISTRY.PlaygroundPizzaRat;
const MatrixRain = PLAYGROUND_COMPONENT_REGISTRY.PlaygroundMatrixRain;
const NeuralDossier = PLAYGROUND_COMPONENT_REGISTRY.PlaygroundNeuralDossier;

export default function PlaygroundStageRenderer({
  componentName,
  item,
  slug,
  isCommercial,
}: PlaygroundStageRendererProps) {
  if (componentName === 'PlaygroundSnake') {
    return <Snake item={item} slug={slug} isCommercial={isCommercial} />;
  }
  if (componentName === 'PlaygroundPathfinder') {
    return <Pathfinder item={item} slug={slug} isCommercial={isCommercial} />;
  }
  if (componentName === 'PlaygroundPizzaRat') {
    return <PizzaRat item={item} slug={slug} isCommercial={isCommercial} />;
  }
  if (componentName === 'PlaygroundMatrixRain') {
    return <MatrixRain item={item} slug={slug} isCommercial={isCommercial} />;
  }
  if (componentName === 'PlaygroundNeuralDossier') {
    return <NeuralDossier item={item} slug={slug} isCommercial={isCommercial} />;
  }
  return null;
}
