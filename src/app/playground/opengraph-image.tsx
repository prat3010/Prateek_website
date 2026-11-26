import { createBrandOgImage } from '@/lib/ogCard';

export const runtime = 'nodejs';
export const alt = 'The Playground // SaaS Prototypes, Games & AI Prompt Studio | Prateeq Sharma';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  return createBrandOgImage({
    badge: 'THE PLAYGROUND // INTERACTIVE LAB',
    title: 'Micro-SaaS Prototypes, Retriever Tools & Web Labs',
    subtitle:
      'Live interactive demos of Retriever AI, Scoping Studio, Client Mission Control, 13-heuristic Pathfinder, and WebGL experiments.',
    pills: ['MICRO-SAAS', 'COGNITIVE AI', 'THREE.JS WEBGL', 'PATHFINDING'],
    pathLabel: 'prateeq.in/playground',
  });
}
