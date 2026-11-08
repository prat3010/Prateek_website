/**
 * The Prateeq Playground // Universal Creation & Innovation Registry
 * SSoT for Micro-SaaS Apps, Interactive Games, Generative AI Art & Prompts, and Retriever Cognitive Tools.
 */

import playgroundItemsJson from './playgroundItems.json';

export type PlaygroundKind = 
  | 'saas'               // Micro-SaaS, full-stack product, utility tool
  | 'interactive-toy'   // Playable game, algorithm lab, canvas simulation
  | 'generative-media'  // AI photo / artwork, video, prompt showcase
  | 'cognitive-tool'    // Retriever RAG, LLM agent, interactive brain
  | 'experiment';       // Computer vision, shader, 3D WebGL experiment

export type PlaygroundTaxonomy = 
  | 'all'              // Universal Showcase
  | 'commercial'       // Purchasable Micro-SaaS, Turnkey Starters, Source Codes
  | 'toys-and-games'   // Free Interactive Canvas Engines, Shaders, Puzzles
  | 'ecosystem';       // Live Flagships (Retriever AI, Scoping Studio, Client Workspace)

export interface PlaygroundPricingTier {
  id: string;
  title: string;
  name?: string;
  priceINR: number;
  priceUSD: number;
  features?: string[];
  licenseType?: string;
  downloadKey?: string;
}

export interface PlaygroundShowcaseProject {
  title: string;
  url: string;
  description: string;
  author?: string;
  stats?: string;
}

export interface BasePlaygroundItem {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  kind: PlaygroundKind;
  taxonomy?: PlaygroundTaxonomy;
  tags: string[];
  vibeCodedDate: string;
  featured?: boolean;
  status?: 'live' | 'beta' | 'concept' | 'archived';
  metricsBadge?: string;
  previewImage?: string;

  // Commercial & Packaging Extensions
  isCommercial?: boolean;
  priceINR?: number;
  priceUSD?: number;
  pricingTiers?: PlaygroundPricingTier[];
  pricingModel?: string;
  componentName?: string | null;
  appUrl?: string;
  githubUrl?: string;
  techStack?: string[];
  highlights?: string[];
  controlsGuide?: { key: string; label: string }[];
  downloadPackageKey?: string;
  githubRepoSource?: string;
  fileSize?: string;
  checksumSha256?: string;
  version?: string;
  licenseType?: string;
  showcaseProjects?: PlaygroundShowcaseProject[];
  fileTree?: Record<string, unknown>;
  showcaseSpecs?: Record<string, string>;
  parameters?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// 1. Micro-SaaS & Full Web Apps
export interface SaasPlaygroundItem extends BasePlaygroundItem {
  kind: 'saas';
  appUrl: string;
  isEmbeddable: boolean;
  pricingModel?: 'Free' | 'Freemium' | 'Open Source' | 'Trial' | 'Commercial' | string;
  techStack: string[];
  githubUrl?: string;
  highlights: string[];
}

// 2. Games & Algorithm Labs
export interface InteractiveToyPlaygroundItem extends BasePlaygroundItem {
  kind: 'interactive-toy';
  renderMode: 'native' | 'iframe';
  componentName?: string | null;
  iframeUrl?: string;
  controlsGuide: { key: string; label: string }[];
  soundSupported: boolean;
  hasLeaderboard: boolean;
  terminalCommands: string[];
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Mind-Bending';
}

// 3. Generative Media (AI Art, Prompts, Videos)
export interface GenerativeMediaPlaygroundItem extends BasePlaygroundItem {
  kind: 'generative-media';
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
  parameters?: {
    aspectRatio?: string;
    seed?: number | string;
    cfgScale?: number;
    steps?: number;
    sampler?: string;
  };
  resolution?: string;
  downloadUrl?: string;
}

// 4. Cognitive Tools (Retriever / LLM Micro-Tools)
export interface CognitiveToolPlaygroundItem extends BasePlaygroundItem {
  kind: 'cognitive-tool';
  backendEngine: 'retriever-oracle' | 'gemini-api' | 'ollama-local';
  apiEndpoint?: string;
  capabilities: string[];
  terminalCommands: string[];
}

// 5. Experiments
export interface ExperimentPlaygroundItem extends BasePlaygroundItem {
  kind: 'experiment';
  experimentType: 'computer-vision' | 'webgl-shader' | 'svg-physics';
  techStack: string[];
  githubUrl?: string;
}

export type PlaygroundItem = 
  | SaasPlaygroundItem 
  | InteractiveToyPlaygroundItem 
  | GenerativeMediaPlaygroundItem 
  | CognitiveToolPlaygroundItem 
  | ExperimentPlaygroundItem;

export const PLAYGROUND_ITEMS: PlaygroundItem[] = playgroundItemsJson as unknown as PlaygroundItem[];

export function getPlaygroundItemBySlug(slug: string): PlaygroundItem | undefined {
  return PLAYGROUND_ITEMS.find((item) => item.slug === slug);
}

export function getAllPlaygroundSlugs(): string[] {
  return PLAYGROUND_ITEMS.map((item) => item.slug);
}
