export interface Skill {
  name: string;
  icon: string;
  level: number;
  category: 'frontend' | 'backend' | 'tools' | 'creative';
  color: string;
}

export type SkillCategory = Skill['category'];

export const skillCategoryLabels: Record<SkillCategory, string> = {
  frontend: 'Frontend',
  backend: 'Backend',
  tools: 'Tools & DevOps',
  creative: 'Creative',
};

export const skillCategoryColors: Record<SkillCategory, string> = {
  frontend: '#FF1744',
  backend: '#2979FF',
  tools: '#FF9100',
  creative: '#FF4081',
};

export const skills: Skill[] = [
  // ── Frontend & Core ─────────────────────────────
  {
    name: 'React / Next.js',
    icon: 'atom',
    level: 80,
    category: 'frontend',
    color: '#61DAFB',
  },
  {
    name: 'HTML5 & CSS3',
    icon: 'paintbrush',
    level: 90,
    category: 'frontend',
    color: '#1572B6',
  },
  {
    name: 'Responsive Design',
    icon: 'layout',
    level: 88,
    category: 'frontend',
    color: '#FF1744',
  },
  {
    name: 'UI/UX Animations',
    icon: 'sparkles',
    level: 85,
    category: 'frontend',
    color: '#FF4081',
  },

  // ── AI Capabilities & Logic ──────────────────────
  {
    name: 'LLM Prompting',
    icon: 'brain',
    level: 95,
    category: 'backend',
    color: '#FFEB3B',
  },
  {
    name: 'AI Agent Orchestration',
    icon: 'bot',
    level: 92,
    category: 'backend',
    color: '#9C27B0',
  },
  {
    name: 'Python',
    icon: 'terminal',
    level: 70,
    category: 'backend',
    color: '#3776AB',
  },
  {
    name: 'API Integrations',
    icon: 'server',
    level: 88,
    category: 'backend',
    color: '#339933',
  },

  // ── Tools & Workflows ───────────────────────────
  {
    name: 'AI Dev Tools (Cursor, v0)',
    icon: 'sparkles',
    level: 95,
    category: 'tools',
    color: '#00E5FF',
  },
  {
    name: 'Git & GitHub',
    icon: 'git-branch',
    level: 85,
    category: 'tools',
    color: '#F05032',
  },
  {
    name: 'Vercel Deployment',
    icon: 'cloud',
    level: 88,
    category: 'tools',
    color: '#000000',
  },

  // ── Creative ────────────────────────────────────
  {
    name: 'Figma',
    icon: 'figma',
    level: 80,
    category: 'creative',
    color: '#F24E1E',
  },
  {
    name: 'Rapid Prototyping',
    icon: 'zap',
    level: 98,
    category: 'creative',
    color: '#FF9100',
  },
  {
    name: 'AI Image Generation',
    icon: 'image',
    level: 90,
    category: 'creative',
    color: '#E040FB',
  },
];

/** Return skills filtered by category */
export function getSkillsByCategory(category: SkillCategory): Skill[] {
  return skills.filter((s) => s.category === category);
}

/** All unique categories present in the data */
export const categories: SkillCategory[] = [
  ...new Set(skills.map((s) => s.category)),
] as SkillCategory[];

/** Alias for backward compatibility */
export const categoryLabels = skillCategoryLabels;
export const categoryColors = skillCategoryColors;
