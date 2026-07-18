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

export async function getProjects(): Promise<Project[]> {
  if (!supabase) {
    console.log('Supabase not configured, using projects fallback');
    return projectsFallback as Project[];
  }
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) throw error || new Error('No data');
    return data.map((p) => ({
      ...p,
      id: p.slug || p.id,
    })) as Project[];
  } catch (err) {
    console.error('Failed to fetch projects from Supabase, falling back to local data:', err);
    return projectsFallback as Project[];
  }
}

export async function getSkills(): Promise<Skill[]> {
  if (!supabase) {
    console.log('Supabase not configured, using skills fallback');
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
    console.error('Failed to fetch skills from Supabase, falling back to local data:', err);
    return skillsFallback as unknown as Skill[];
  }
}

export async function getCertificates(): Promise<Certificate[]> {
  if (!supabase) {
    console.log('Supabase not configured, using certificates fallback');
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
    console.error('Failed to fetch certificates from Supabase, falling back to local data:', err);
    return certificatesFallback as Certificate[];
  }
}

export async function getProfile(): Promise<ResumeData | null> {
  if (!supabase) {
    console.log('Supabase not configured, using resume fallback');
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
    console.error('Failed to fetch profile from Supabase, falling back to local data:', err);
    return resumeFallback as ResumeData;
  }
}

