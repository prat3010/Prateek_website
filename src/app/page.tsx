import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import Hero from '@/components/Hero/Hero';
import ScrollSection from '@/components/ScrollSection/ScrollSection';
import BlogSection from '@/components/Blog/BlogSection';
import { standardTaglines, noirTaglines } from '@/data/taglines';
import { getAllPosts } from '@/lib/markdown';
import { getProjects, getSkills, getProfile, getCertificates } from '@/lib/data';

const About = dynamic(() => import('@/components/About/About'));
const Skills = dynamic(() => import('@/components/Skills/Skills'));
const Projects = dynamic(() => import('@/components/Projects/Projects'));
const Resume = dynamic(() => import('@/components/Resume/Resume'));
const Pricing = dynamic(() => import('@/components/Pricing/Pricing'));
const Playground = dynamic(() => import('@/components/Playground/Playground'));
const Contact = dynamic(() => import('@/components/Contact/Contact'));

function SectionSkeleton({ height }: { height: string }) {
  return (
    <div 
      className="section-skeleton" 
      style={{ height }} 
      aria-hidden="true" 
    />
  );
}

async function AboutSection() {
  const resume = await getProfile();
  return <About resumeData={resume} />;
}

async function SkillsSection() {
  const skills = await getSkills();
  return <Skills skills={skills} />;
}

async function ProjectsSection() {
  const projects = await getProjects();
  return <Projects projects={projects} />;
}

async function ResumeSection() {
  const [resume, certificates] = await Promise.all([
    getProfile(),
    getCertificates(),
  ]);
  return <Resume resumeData={resume} certificates={certificates} />;
}

async function PricingSection() {
  const resume = await getProfile();
  return <Pricing resumeData={resume} />;
}

async function BlogSectionWrapper() {
  const posts = await getAllPosts();
  return <BlogSection posts={posts} />;
}

export default function Home() {
  return (
    <>
      <Hero taglines={{ standard: standardTaglines, noir: noirTaglines }} />
      
      <Suspense fallback={<SectionSkeleton height="380px" />}>
        <ScrollSection gap={80}>
          <AboutSection />
        </ScrollSection>
      </Suspense>

      <Suspense fallback={<SectionSkeleton height="450px" />}>
        <ScrollSection verticalOffset={150} gap={80}>
          <SkillsSection />
        </ScrollSection>
      </Suspense>

      <Suspense fallback={<SectionSkeleton height="550px" />}>
        <ScrollSection verticalOffset={120} gap={80}>
          <ProjectsSection />
        </ScrollSection>
      </Suspense>

      <Suspense fallback={<SectionSkeleton height="700px" />}>
        <ScrollSection verticalOffset={120} gap={80}>
          <ResumeSection />
        </ScrollSection>
      </Suspense>

      <Suspense fallback={<SectionSkeleton height="450px" />}>
        <ScrollSection verticalOffset={120} gap={80}>
          <PricingSection />
        </ScrollSection>
      </Suspense>

      <ScrollSection verticalOffset={120} gap={80}>
        <Playground />
      </ScrollSection>

      <Suspense fallback={<SectionSkeleton height="550px" />}>
        <ScrollSection verticalOffset={120} gap={80}>
          <BlogSectionWrapper />
        </ScrollSection>
      </Suspense>

      <ScrollSection centerOnly>
        <Contact />
      </ScrollSection>
    </>
  );
}
