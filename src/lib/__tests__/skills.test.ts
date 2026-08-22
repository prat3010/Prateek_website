import { describe, it, expect } from 'vitest';
import { getSkillsHighlight } from '../skills';
import type { Persona } from '../skills';

describe('getSkillsHighlight', () => {
  it('returns fullstack skills for fullstack persona', () => {
    const result = getSkillsHighlight('fullstack');
    expect(result).toEqual(['Next.js & React App Architecture', 'PostgreSQL & Supabase Engineering', 'TypeScript & Type-Safe Architecture', 'API & Integration Pipelines', 'Adaptive Stack & Rapid Prototyping']);
  });

  it('returns ai skills for ai persona', () => {
    const result = getSkillsHighlight('ai');
    expect(result).toEqual(['AI Agent & RAG Architecture', 'Structured Prompting & LLM Tuning', 'AI-Assisted Engineering Workflows', 'Python Systems & Async APIs', 'PostgreSQL & Supabase Engineering']);
  });

  it('returns creative skills for creative persona', () => {
    const result = getSkillsHighlight('creative');
    expect(result).toEqual(['Product Strategy & UX Design', 'Design Systems & Web Performance', 'Privacy Sandboxing & Offline Architecture', 'Flutter & Cross-Platform Mobile']);
  });

  it('returns general skills for general persona', () => {
    const result = getSkillsHighlight('general');
    expect(result).toEqual(['AI Agent & RAG Architecture', 'Next.js & React App Architecture', 'PostgreSQL & Supabase Engineering', 'Product Strategy & UX Design', 'Adaptive Stack & Rapid Prototyping']);
  });

  it('returns default skills for unknown persona', () => {
    const result = getSkillsHighlight('unknown' as Persona);
    expect(result).toEqual(['AI Agent & RAG Architecture', 'Next.js & React App Architecture', 'PostgreSQL & Supabase Engineering', 'Product Strategy & UX Design', 'Adaptive Stack & Rapid Prototyping']);
  });

  it('always returns non-empty arrays', () => {
    const personas: Persona[] = ['general', 'fullstack', 'ai', 'creative'];
    for (const persona of personas) {
      const result = getSkillsHighlight(persona);
      expect(result.length).toBeGreaterThan(0);
    }
  });

  it('returns no duplicates within each persona', () => {
    const personas: Persona[] = ['general', 'fullstack', 'ai', 'creative'];
    for (const persona of personas) {
      const result = getSkillsHighlight(persona);
      expect(new Set(result).size).toBe(result.length);
    }
  });
});
