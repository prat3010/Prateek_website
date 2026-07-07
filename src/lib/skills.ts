export type Persona = 'general' | 'fullstack' | 'ai' | 'creative';

export function getSkillsHighlight(activePersona: Persona): string[] {
  switch (activePersona) {
    case 'fullstack':
      return ['API Architecture', 'Database Engineering', 'Algorithmic Translation', 'Data Analysis', 'Stack-on-Demand'];
    case 'ai':
      return ['AI Agent Orchestration', 'Structured Prompting', 'AI Dev Workflows', 'API Architecture', 'Python'];
    case 'creative':
      return ['Product Strategy & UX', 'Design to Code', 'Privacy Sandboxing', 'Stack-on-Demand'];
    default:
      return ['AI Agent Orchestration', 'Database Engineering', 'Product Strategy & UX', 'Algorithmic Translation', 'Stack-on-Demand'];
  }
}
