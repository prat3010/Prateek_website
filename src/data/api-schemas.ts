import { z } from 'zod';

export const projectSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  longDescription: z.string(),
  description_business: z.string().optional(),
  longDescription_business: z.string().optional(),
  image: z.string(),
  tags: z.array(z.string()),
  liveUrl: z.string(),
  githubUrl: z.string(),
  color: z.string(),
  isLive: z.boolean(),
  status: z.enum(['live', 'soon', 'personal']),
});

export const skillSchema = z.object({
  name: z.string().min(1),
  name_business: z.string().optional(),
  icon: z.string(),
  description: z.string(),
  description_business: z.string().optional(),
  category: z.enum(['orchestration', 'logic', 'product', 'dynamic']),
  color: z.string(),
  level: z.string().optional(),
  prereq: z.string().optional(),
  status: z.enum(['legendary', 'mastered', 'quest']).optional(),
  projects: z.array(z.object({ title: z.string(), id: z.string() })).optional(),
});

export const certificateSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  issuer: z.string(),
  date: z.string(),
  image: z.string(),
  credentialId: z.string().optional(),
  verifyUrl: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const profileSchema = z.record(z.string(), z.unknown());

export const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().max(254),
  message: z.string().min(1).max(5000),
});
