import { unstable_cache } from 'next/cache';
import { supabase } from '@/data/supabase';
import type { Project } from '@/data/projects';
import type { Skill } from '@/data/skills';
import type { Certificate } from '@/data/certificates';
import type { ResumeData } from '@/data/resume';

// Fallback JSON imports
import projectsFallback from '@/data/projects.json';
import skillsFallback from '@/data/skills.json';
import certificatesFallback from '@/data/certificates.json';
import resumeFallback from '@/data/resume.json';

const getErrorMessage = (err: unknown): string => {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return err instanceof Error ? err.message : 'Offline mode';
};

const CANONICAL_PROJECT_ORDER = [
  'rag-lab',
  'scoping-studio',
  'client-workspace',
  'synchronizer-engine',
  'systems-terminal',
];

export const getProjects = unstable_cache(
  async (): Promise<Project[]> => {
    if (!supabase) {
      return projectsFallback as Project[];
    }
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*');
      if (error || !data) throw error || new Error('No data');
      const mapped = data.map((p) => ({
        ...p,
        id: p.slug || p.id,
      })) as Project[];

      return mapped.sort((a, b) => {
        const indexA = CANONICAL_PROJECT_ORDER.indexOf(a.id);
        const indexB = CANONICAL_PROJECT_ORDER.indexOf(b.id);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return 0;
      });
    } catch (err) {
      console.warn('Projects data notice (using local fallback):', getErrorMessage(err));
      return projectsFallback as Project[];
    }
  },
  ['getProjects'],
  { tags: ['portfolio-data', 'projects'] }
);

export const getSkills = unstable_cache(
  async (): Promise<Skill[]> => {
    if (!supabase) {
      return skillsFallback as unknown as Skill[];
    }
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .order('created_at', { ascending: true });
      if (error || !data) throw error || new Error('No data');
      return data as unknown as Skill[];
    } catch (err) {
      console.warn('Skills data notice (using local fallback):', getErrorMessage(err));
      return skillsFallback as unknown as Skill[];
    }
  },
  ['getSkills'],
  { tags: ['portfolio-data', 'skills'] }
);

export const getCertificates = unstable_cache(
  async (): Promise<Certificate[]> => {
    if (!supabase) {
      return certificatesFallback as Certificate[];
    }
    try {
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false });
      if (error || !data) throw error || new Error('No data');
      return data.map((c) => ({
        ...c,
        id: c.slug || c.id,
      })) as Certificate[];
    } catch (err) {
      console.warn('Certificates data notice (using local fallback):', getErrorMessage(err));
      return certificatesFallback as Certificate[];
    }
  },
  ['getCertificates'],
  { tags: ['portfolio-data', 'certificates'] }
);

export const getProfile = unstable_cache(
  async (): Promise<ResumeData | null> => {
    if (!supabase) {
      return resumeFallback as ResumeData;
    }
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('data')
        .eq('id', 1)
        .single();
      if (error || !data) throw error || new Error('No data');
      return data.data as ResumeData;
    } catch (err) {
      console.warn('Profile data notice (using local fallback):', getErrorMessage(err));
      return resumeFallback as ResumeData;
    }
  },
  ['getProfile'],
  { tags: ['portfolio-data', 'profile'] }
);

