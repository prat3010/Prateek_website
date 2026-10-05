import { describe, it, expect } from 'vitest';
import { 
  PLAYGROUND_ITEMS, 
  getPlaygroundItemBySlug, 
  getAllPlaygroundSlugs,
  type InteractiveToyPlaygroundItem,
  type SaasPlaygroundItem,
  type GenerativeMediaPlaygroundItem,
  type CognitiveToolPlaygroundItem,
  type ExperimentPlaygroundItem,
} from '@/data/playgroundItems';

describe('Playground Registry Data Integrity', () => {
  it('contains registered playground items', () => {
    expect(PLAYGROUND_ITEMS.length).toBeGreaterThan(0);
  });

  it('ensures all items have unique IDs and unique slugs', () => {
    const ids = new Set<string>();
    const slugs = new Set<string>();

    for (const item of PLAYGROUND_ITEMS) {
      expect(ids.has(item.id), `Duplicate ID found: ${item.id}`).toBe(false);
      expect(slugs.has(item.slug), `Duplicate slug found: ${item.slug}`).toBe(false);
      ids.add(item.id);
      slugs.add(item.slug);
    }
  });

  it('validates common base fields across all items', () => {
    const validKinds = ['saas', 'interactive-toy', 'generative-media', 'cognitive-tool', 'experiment'];

    for (const item of PLAYGROUND_ITEMS) {
      expect(item.id.trim()).not.toBe('');
      expect(item.slug.trim()).not.toBe('');
      expect(item.title.trim()).not.toBe('');
      expect(item.tagline.trim()).not.toBe('');
      expect(item.description.trim()).not.toBe('');
      expect(validKinds).toContain(item.kind);
      expect(item.vibeCodedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Array.isArray(item.tags)).toBe(true);
    }
  });

  it('validates interactive toys specification', () => {
    const toys = PLAYGROUND_ITEMS.filter((i) => i.kind === 'interactive-toy') as InteractiveToyPlaygroundItem[];
    expect(toys.length).toBeGreaterThan(0);

    for (const toy of toys) {
      expect(['native', 'iframe']).toContain(toy.renderMode);
      expect(Array.isArray(toy.controlsGuide)).toBe(true);
      expect(typeof toy.soundSupported).toBe('boolean');
      expect(typeof toy.hasLeaderboard).toBe('boolean');
      expect(Array.isArray(toy.terminalCommands)).toBe(true);

      if (toy.renderMode === 'iframe') {
        expect(toy.iframeUrl).toBeDefined();
      } else {
        expect(toy.componentName).toBeDefined();
      }
    }
  });

  it('validates micro-saas specification', () => {
    const saasItems = PLAYGROUND_ITEMS.filter((i) => i.kind === 'saas') as SaasPlaygroundItem[];
    expect(saasItems.length).toBeGreaterThan(0);

    for (const saas of saasItems) {
      expect(saas.appUrl).toBeDefined();
      expect(Array.isArray(saas.techStack)).toBe(true);
      expect(saas.techStack.length).toBeGreaterThan(0);
      expect(Array.isArray(saas.highlights)).toBe(true);
      expect(typeof saas.isEmbeddable).toBe('boolean');
    }
  });

  it('validates generative media specification and prompt engineering details', () => {
    const mediaItems = PLAYGROUND_ITEMS.filter((i) => i.kind === 'generative-media') as GenerativeMediaPlaygroundItem[];
    expect(mediaItems.length).toBeGreaterThan(0);

    for (const media of mediaItems) {
      expect(['image', 'video']).toContain(media.mediaType);
      expect(media.mediaUrl.trim()).not.toBe('');
      expect(media.model.trim()).not.toBe('');
      expect(media.prompt.trim()).not.toBe('');
      if (media.parameters) {
        expect(typeof media.parameters).toBe('object');
      }
    }
  });

  it('validates cognitive tools and Retriever engine linking', () => {
    const cognitive = PLAYGROUND_ITEMS.filter((i) => i.kind === 'cognitive-tool') as CognitiveToolPlaygroundItem[];
    expect(cognitive.length).toBeGreaterThan(0);

    for (const cog of cognitive) {
      expect(['retriever-oracle', 'gemini-api', 'ollama-local']).toContain(cog.backendEngine);
      expect(Array.isArray(cog.capabilities)).toBe(true);
      expect(cog.capabilities.length).toBeGreaterThan(0);
    }
  });

  it('validates experiment items', () => {
    const experiments = PLAYGROUND_ITEMS.filter((i) => i.kind === 'experiment') as ExperimentPlaygroundItem[];
    expect(experiments.length).toBeGreaterThan(0);

    for (const exp of experiments) {
      expect(['computer-vision', 'webgl-shader', 'svg-physics']).toContain(exp.experimentType);
      expect(Array.isArray(exp.techStack)).toBe(true);
      expect(exp.techStack.length).toBeGreaterThan(0);
    }
  });

  it('retrieves items by slug accurately', () => {
    const snake = getPlaygroundItemBySlug('snake');
    expect(snake).toBeDefined();
    expect(snake?.title).toContain('Snake');
    expect(snake?.kind).toBe('interactive-toy');

    const retriever = getPlaygroundItemBySlug('retriever');
    expect(retriever).toBeDefined();
    expect(retriever?.kind).toBe('saas');

    const unknown = getPlaygroundItemBySlug('non-existent-slug-xyz');
    expect(unknown).toBeUndefined();
  });

  it('returns all slugs for static route generation', () => {
    const slugs = getAllPlaygroundSlugs();
    expect(slugs.length).toBe(PLAYGROUND_ITEMS.length);
    expect(slugs).toContain('snake');
    expect(slugs).toContain('pathfinder');
    expect(slugs).toContain('matrix-rain');
    expect(slugs).toContain('pizza-rat');
    expect(slugs).toContain('neural-dossier');
  });
});
