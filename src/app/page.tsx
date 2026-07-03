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

export default async function Home() {
  const [posts, projects, skills, resume, certificates] = await Promise.all([
    getAllPosts(),
    getProjects(),
    getSkills(),
    getProfile(),
    getCertificates(),
  ]);

  return (
    <>
      <Hero taglines={{ standard: standardTaglines, noir: noirTaglines }} />
      <ScrollSection gap={80}><About resumeData={resume} /></ScrollSection>
      <ScrollSection verticalOffset={150} gap={80}><Skills skills={skills} /></ScrollSection>
      <ScrollSection verticalOffset={120} gap={80}><Projects projects={projects} /></ScrollSection>
      <ScrollSection verticalOffset={120} gap={80}><Resume resumeData={resume} certificates={certificates} /></ScrollSection>
      <ScrollSection verticalOffset={120} gap={80}><Pricing resumeData={resume} /></ScrollSection>
      <ScrollSection verticalOffset={120} gap={80}><Playground /></ScrollSection>
      <ScrollSection verticalOffset={120} gap={80}><BlogSection posts={posts} /></ScrollSection>
      <ScrollSection centerOnly><Contact /></ScrollSection>
    </>
  );
}
