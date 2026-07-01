import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { unstable_cache } from 'next/cache';
import { supabase } from '@/data/supabase';

const postsDirectory = path.join(process.cwd(), 'src/content/posts');

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  tags: string[];
  coverImage?: string;
  content: string;
}

function getLocalAllPosts(): BlogPost[] {
  if (!fs.existsSync(postsDirectory)) {
    fs.mkdirSync(postsDirectory, { recursive: true });
    return [];
  }

  const fileNames = fs.readdirSync(postsDirectory);
  const allPosts = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: data.title || 'Untitled',
        date: data.date || '',
        excerpt: data.excerpt || '',
        tags: data.tags || [],
        coverImage: data.coverImage || '',
        content,
      } as BlogPost;
    });

  // Sort posts by date (newest first)
  return allPosts.sort((a, b) => (a.date < b.date ? 1 : -1));
}

function getLocalPostBySlug(slug: string): BlogPost | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    if (!fs.existsSync(fullPath)) return null;

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || 'Untitled',
      date: data.date || '',
      excerpt: data.excerpt || '',
      tags: data.tags || [],
      coverImage: data.coverImage || '',
      content,
    };
  } catch {
    return null;
  }
}

export const getAllPosts = unstable_cache(
  async (): Promise<BlogPost[]> => {
    if (!supabase) {
      console.log('Supabase not configured, using local posts fallback');
      return getLocalAllPosts();
    }
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('date', { ascending: false });
      if (error || !data) throw error || new Error('No data');
      return data.map((p) => ({
        slug: p.slug,
        title: p.title,
        date: p.date,
        excerpt: p.excerpt,
        tags: p.tags || [],
        coverImage: p.coverImage || '',
        content: p.content,
      })) as BlogPost[];
    } catch (err) {
      console.error('Failed to fetch posts from Supabase, falling back to local files:', err);
      return getLocalAllPosts();
    }
  },
  ['blog-posts-list'],
  { tags: ['portfolio-data', 'posts'] }
);

export const getPostBySlug = (slug: string) => unstable_cache(
  async (): Promise<BlogPost | null> => {
    if (!supabase) {
      return getLocalPostBySlug(slug);
    }
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('slug', slug)
        .single();
      if (error || !data) throw error || new Error('No data');
      return {
        slug: data.slug,
        title: data.title,
        date: data.date,
        excerpt: data.excerpt,
        tags: data.tags || [],
        coverImage: data.coverImage || '',
        content: data.content,
      } as BlogPost;
    } catch (err) {
      console.error(`Failed to fetch post '${slug}' from Supabase, falling back to local files:`, err);
      return getLocalPostBySlug(slug);
    }
  },
  ['blog-post-detail', slug],
  { tags: ['portfolio-data', 'posts'] }
)();
