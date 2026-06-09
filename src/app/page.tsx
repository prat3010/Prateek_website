import Hero from '@/components/Hero/Hero';
import About from '@/components/About/About';
import Skills from '@/components/Skills/Skills';
import Projects from '@/components/Projects/Projects';
import Playground from '@/components/Playground/Playground';
import Contact from '@/components/Contact/Contact';
import ScrollSection from '@/components/ScrollSection/ScrollSection';
import { projects } from '@/data/projects';
import { skills } from '@/data/skills';
import { standardTaglines, noirTaglines } from '@/data/taglines';

export default function Home() {
  return (
    <>
      <Hero taglines={{ standard: standardTaglines, noir: noirTaglines }} />
      <ScrollSection direction="right" gap={80}><About /></ScrollSection>
      <ScrollSection direction="left" verticalOffset={150} gap={80}><Skills skills={skills} /></ScrollSection>
      <ScrollSection direction="right" verticalOffset={120} gap={80}><Projects projects={projects} /></ScrollSection>
      <ScrollSection direction="left" verticalOffset={120} gap={80}><Playground /></ScrollSection>
      <ScrollSection direction="right" centerOnly><Contact /></ScrollSection>
    </>
  );
}
