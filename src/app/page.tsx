import Hero from '@/components/Hero/Hero';
import About from '@/components/About/About';
import Skills from '@/components/Skills/Skills';
import Projects from '@/components/Projects/Projects';
import Playground from '@/components/Playground/Playground';
import Contact from '@/components/Contact/Contact';
import { projects } from '@/data/projects';
import { skills } from '@/data/skills';
import { standardTaglines, noirTaglines } from '@/data/taglines';

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
