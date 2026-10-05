import type { Metadata } from 'next';
import PlaygroundGrid from '@/components/playground/PlaygroundGrid';

export const metadata: Metadata = {
  title: 'The Playground // SaaS Prototypes, Games & AI Prompt Studio | Prateeq Sharma',
  description:
    'An interactive creative laboratory featuring vibe-coded SaaS prototypes, retro arcade games, AI prompt engineering showcases, and cognitive Retriever experiments.',
  alternates: {
    canonical: '/playground',
  },
  openGraph: {
    title: 'The Playground // SaaS Prototypes, Games & AI Prompt Studio',
    description: 'An interactive creative laboratory featuring vibe-coded SaaS prototypes, retro arcade games, and AI prompt engineering showcases.',
    url: 'https://prateeq.in/playground',
  },
};

export default function PlaygroundPage() {
  return <PlaygroundGrid />;
}
