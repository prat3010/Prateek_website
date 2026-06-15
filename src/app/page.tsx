import dynamic from 'next/dynamic';
import Hero from '@/components/Hero/Hero';
import ScrollSection from '@/components/ScrollSection/ScrollSection';
import BlogSection from '@/components/Blog/BlogSection';
import { projects } from '@/data/projects';
import { standardTaglines, noirTaglines } from '@/data/taglines';
import { getAllPosts } from '@/lib/markdown';

const About = dynamic(() => import('@/components/About/About'));
const Skills = dynamic(() => import('@/components/Skills/Skills'));
const Projects = dynamic(() => import('@/components/Projects/Projects'));
const Resume = dynamic(() => import('@/components/Resume/Resume'));
const Playground = dynamic(() => import('@/components/Playground/Playground'));
const Contact = dynamic(() => import('@/components/Contact/Contact'));

export default function Home() {
  const posts = getAllPosts();

  return (
    <>
      <Hero taglines={{ standard: standardTaglines, noir: noirTaglines }} />
      <ScrollSection direction="right" gap={80}><About /></ScrollSection>
      <ScrollSection direction="left" verticalOffset={150} gap={80}><Skills /></ScrollSection>
      <ScrollSection direction="right" verticalOffset={120} gap={80}><Projects projects={projects} /></ScrollSection>
      <ScrollSection direction="left" verticalOffset={120} gap={80}><Resume /></ScrollSection>
      <ScrollSection direction="right" verticalOffset={120} gap={80}><Playground /></ScrollSection>
      <ScrollSection direction="left" verticalOffset={120} gap={80}><BlogSection posts={posts} /></ScrollSection>
      <ScrollSection direction="right" centerOnly><Contact /></ScrollSection>
    </>
  );
}
