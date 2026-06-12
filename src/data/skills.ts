export interface Skill {
  name: string;
  icon: string;
  description: string;
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
  frontend: 'var(--pop-red)',
  backend: 'var(--pop-blue)',
  tools: 'var(--pop-orange)',
  creative: 'var(--pop-pink)',
};

export const skills: Skill[] = [
  {
    name: "React / Next.js",
    icon: "atom",
    description: "Directing AI to synthesize React components, manage application state, and orchestrate client/server code.",
    category: "frontend",
    color: "#61DAFB",
  },
  {
    name: "HTML5 & CSS3",
    icon: "paintbrush",
    description: "Steering AI to generate responsive structures, layout systems, and clean HTML/CSS code.",
    category: "frontend",
    color: "#1572B6",
  },
  {
    name: "Responsive Design",
    icon: "layout",
    description: "Polishing viewport dynamics, media-query triggers, and adaptive structures.",
    category: "frontend",
    color: "#FF1744",
  },
  {
    name: "UI/UX Animations",
    icon: "sparkles",
    description: "Guiding smooth transition curves, GSAP sequences, and Framer Motion effects.",
    category: "frontend",
    color: "#FF4081",
  },
  {
    name: "LLM Prompting",
    icon: "brain",
    description: "The steering wheel. Writing structured prompts, orchestrating agent context, and debugging models.",
    category: "backend",
    color: "#FFEB3B",
  },
  {
    name: "AI Agent Orchestration",
    icon: "bot",
    description: "Designing and running autonomous multi-agent networks to perform complex development tasks.",
    category: "backend",
    color: "#9C27B0",
  },
  {
    name: "Python",
    icon: "terminal",
    description: "Instructing AI to write utility scripts, automation tasks, and backend helper scripts.",
    category: "backend",
    color: "#3776AB",
  },
  {
    name: "API Integrations",
    icon: "server",
    description: "Connecting data pipes, authenticating services, and handling fetch payloads.",
    category: "backend",
    color: "#339933",
  },
  {
    name: "AI Dev Tools (Cursor, v0)",
    icon: "sparkles",
    description: "My main workspace. Vibe-coding at speed using Cursor's composer and v0's visual prototyping.",
    category: "tools",
    color: "#00E5FF",
  },
  {
    name: "Git & GitHub",
    icon: "git-branch",
    description: "Managing branch workflows, commit history, and deployment sync.",
    category: "tools",
    color: "#F05032",
  },
  {
    name: "Vercel Deployment",
    icon: "cloud",
    description: "Instantly launching web apps and setting up serverless preview branches.",
    category: "tools",
    color: "#000000",
  },
  {
    name: "Microsoft Excel",
    icon: "file-text",
    description: "Analyzing data, building spreadsheets, and organizing complex datasets.",
    category: "tools",
    color: "#107C41",
  },
  {
    name: "Figma",
    icon: "figma",
    description: "Reviewing and translating design blueprints into prompt templates and CSS variables.",
    category: "creative",
    color: "#F24E1E",
  },
  {
    name: "Rapid Prototyping",
    icon: "zap",
    description: "Turning paper ideas into functional interactive software in record time using AI speed.",
    category: "creative",
    color: "#FF9100",
  },
  {
    name: "AI Image Generation",
    icon: "image",
    description: "Using Midjourney, DALL-E, or Imagen to generate custom illustrations and graphical assets.",
    category: "creative",
    color: "#E040FB",
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
