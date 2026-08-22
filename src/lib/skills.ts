export type Persona = 'general' | 'fullstack' | 'ai' | 'creative';

export function getSkillsHighlight(activePersona: Persona): string[] {
  switch (activePersona) {
    case 'fullstack':
      return ['Next.js & React App Architecture', 'PostgreSQL & Supabase Engineering', 'TypeScript & Type-Safe Architecture', 'API & Integration Pipelines', 'Adaptive Stack & Rapid Prototyping'];
    case 'ai':
      return ['AI Agent & RAG Architecture', 'Structured Prompting & LLM Tuning', 'AI-Assisted Engineering Workflows', 'Python Systems & Async APIs', 'PostgreSQL & Supabase Engineering'];
    case 'creative':
      return ['Product Strategy & UX Design', 'Design Systems & Web Performance', 'Privacy Sandboxing & Offline Architecture', 'Flutter & Cross-Platform Mobile'];
    default:
      return ['AI Agent & RAG Architecture', 'Next.js & React App Architecture', 'PostgreSQL & Supabase Engineering', 'Product Strategy & UX Design', 'Adaptive Stack & Rapid Prototyping'];
  }
}
