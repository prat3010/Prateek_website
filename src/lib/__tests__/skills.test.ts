import { describe, it, expect } from 'vitest';
import { getSkillsHighlight } from '../skills';
import type { Persona } from '../skills';

describe('getSkillsHighlight', () => {
  it('returns fullstack skills for fullstack persona', () => {
    const result = getSkillsHighlight('fullstack');
    expect(result).toEqual(['API Architecture', 'Database Engineering', 'Algorithmic Translation', 'Data Analysis', 'Stack-on-Demand']);
  });

  it('returns ai skills for ai persona', () => {
    const result = getSkillsHighlight('ai');
    expect(result).toEqual(['AI Agent Orchestration', 'Structured Prompting', 'AI Dev Workflows', 'API Architecture', 'Python']);
  });

  it('returns creative skills for creative persona', () => {
    const result = getSkillsHighlight('creative');
    expect(result).toEqual(['Product Strategy & UX', 'Design to Code', 'Privacy Sandboxing', 'Stack-on-Demand']);
  });

  it('returns general skills for general persona', () => {
    const result = getSkillsHighlight('general');
    expect(result).toEqual(['AI Agent Orchestration', 'Database Engineering', 'Product Strategy & UX', 'Algorithmic Translation', 'Stack-on-Demand']);
  });

  it('returns default skills for unknown persona', () => {
    const result = getSkillsHighlight('unknown' as Persona);
    expect(result).toEqual(['AI Agent Orchestration', 'Database Engineering', 'Product Strategy & UX', 'Algorithmic Translation', 'Stack-on-Demand']);
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
