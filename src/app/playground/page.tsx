import type { Metadata } from 'next';
import PlaygroundGrid from '@/components/playground/PlaygroundGrid';

export const metadata: Metadata = {
  title: 'The Playground // SaaS Prototypes, Games & AI Prompt Studio | Prateeq Sharma',
  description:
    'An interactive creative laboratory featuring vibe-coded SaaS prototypes, retro arcade games, AI prompt engineering showcases, and cognitive Retriever experiments.',
  keywords: [
    'AI Playground',
    'Micro-SaaS Prototypes',
    'Retriever AI Demo',
    'Next.js Interactive Labs',
    'Pathfinding Visualizer',
    'Prateeq Sharma',
  ],
  alternates: {
    canonical: '/playground',
  },
  openGraph: {
    title: 'The Playground // SaaS Prototypes, Games & AI Prompt Studio',
    description: 'An interactive creative laboratory featuring vibe-coded SaaS prototypes, retro arcade games, and AI prompt engineering showcases.',
    url: 'https://prateeq.in/playground',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Playground // SaaS Prototypes, Games & AI Prompt Studio',
    description: 'Interactive creative laboratory: Micro-SaaS prototypes, Retriever AI tools, and canvas arcade labs.',
  },
};

const playgroundJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'CollectionPage',
      'name': 'The Playground — Prateeq Sharma',
      'url': 'https://prateeq.in/playground',
      'description':
        'Interactive showcase of Micro-SaaS applications, Retriever cognitive tools, WebGL/Canvas labs, and generative AI experiments.',
      'author': {
        '@type': 'Person',
        'name': 'Prateeq Sharma',
        'url': 'https://prateeq.in',
      },
    },
    {
      '@type': 'BreadcrumbList',
      'itemListElement': [
        { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': 'https://prateeq.in' },
        { '@type': 'ListItem', 'position': 2, 'name': 'Playground', 'item': 'https://prateeq.in/playground' },
      ],
    },
  ],
};

export default function PlaygroundPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(playgroundJsonLd) }}
      />
      <PlaygroundGrid />
    </>
  );
}
