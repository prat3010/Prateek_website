import dynamic from 'next/dynamic';
import Hero from '@/components/Hero/Hero';
import { projects } from '@/data/projects';
import { skills } from '@/data/skills';
import { standardTaglines, noirTaglines } from '@/data/taglines';
import SectionSkeleton from '@/components/ui/SectionSkeleton';

const About = dynamic(() => import('@/components/About/About'), {
  loading: () => <SectionSkeleton height="420px" />
});
const Skills = dynamic(() => import('@/components/Skills/Skills'), {
  loading: () => <SectionSkeleton height="450px" />
});
const Projects = dynamic(() => import('@/components/Projects/Projects'), {
  loading: () => <SectionSkeleton height="550px" />
});
const Playground = dynamic(() => import('@/components/Playground/Playground'), {
  loading: () => <SectionSkeleton height="580px" />
});
const Contact = dynamic(() => import('@/components/Contact/Contact'), {
  loading: () => <SectionSkeleton height="420px" />
});

export default function Home() {
  return (
    <>
      <Hero taglines={{ standard: standardTaglines, noir: noirTaglines }} />
      <About />
      <Skills skills={skills} />
      <Projects projects={projects} />
      <Playground />
      <Contact />
    </>
  );
}
