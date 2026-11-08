import { unstable_cache } from 'next/cache';
import { supabase } from '@/data/supabase';
import type { Project } from '@/data/projects';
import type { Skill } from '@/data/skills';
import type { Certificate } from '@/data/certificates';
import type { ResumeData } from '@/data/resume';
import type { PlaygroundItem } from '@/data/playgroundItems';

// Fallback JSON imports
import projectsFallback from '@/data/projects.json';
import skillsFallback from '@/data/skills.json';
import certificatesFallback from '@/data/certificates.json';
import resumeFallback from '@/data/resume.json';
import playgroundFallback from '@/data/playgroundItems.json';

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

export const getPlaygroundProducts = unstable_cache(
  async (): Promise<PlaygroundItem[]> => {
    if (!supabase) {
      return playgroundFallback as unknown as PlaygroundItem[];
    }
    try {
      const { data, error } = await supabase
        .from('playground_products')
        .select('*')
        .order('featured', { ascending: false })
        .order('vibe_coded_date', { ascending: false });

      if (error || !data || data.length === 0) {
        throw error || new Error('No playground data found in Supabase');
      }

      // Map snake_case columns back to canonical TypeScript interface
      return data.map((item: Record<string, unknown>) => ({
        id: String(item.id || ''),
        slug: String(item.slug || ''),
        title: String(item.title || ''),
        tagline: item.tagline,
        description: item.description,
        kind: item.kind,
        taxonomy: item.taxonomy || 'toys-and-games',
        tags: item.tags || [],
        vibeCodedDate: item.vibe_coded_date,
        featured: item.featured,
        status: item.status,
        metricsBadge: item.metrics_badge,
        previewImage: item.preview_image,
        isCommercial: item.is_commercial,
        priceINR: item.price_inr,
        priceUSD: item.price_usd,
        pricingTiers: item.pricing_tiers || [],
        pricingModel: item.pricing_model,
        componentName: item.component_name,
        appUrl: item.app_url,
        githubUrl: item.github_url,
        techStack: item.tech_stack || [],
        highlights: item.highlights || [],
        controlsGuide: item.controls_guide || [],
        downloadPackageKey: item.download_package_key,
        githubRepoSource: item.github_repo_source,
        fileSize: item.file_size,
        checksumSha256: item.checksum_sha256,
        version: item.version,
        licenseType: item.license_type,
        showcaseProjects: item.showcase_projects || [],
        parameters: item.parameters || {},
        metadata: item.metadata || {},
      })) as PlaygroundItem[];
    } catch (err) {
      console.warn('Playground products data notice (using local fallback):', getErrorMessage(err));
      return playgroundFallback as unknown as PlaygroundItem[];
    }
  },
  ['getPlaygroundProducts'],
  { tags: ['portfolio-data', 'playground-items'] }
);


