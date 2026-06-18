import 'server-only';
import { supabase } from '@/data/supabase';
import type { Project } from '@/data/projects';
import type { Skill } from '@/data/skills';
import type { Certificate } from '@/data/certificates';
import type { ResumeData } from '@/data/resume';

export async function getProjects(): Promise<Project[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as unknown as Project[];
}

export async function getSkills(): Promise<Skill[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('skills')
    .select('*')
    .order('created_at', { ascending: true });
  return (data || []) as unknown as Skill[];
}

export async function getCertificates(): Promise<Certificate[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('certificates')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as unknown as Certificate[];
}

export async function getProfile(): Promise<ResumeData | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from('profile')
    .select('data')
    .eq('id', 1)
    .single();
  if (!data) return null;
  return data.data as ResumeData;
}
