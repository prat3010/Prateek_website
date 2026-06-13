export interface Skill {
  name: string;
  icon: string;
  description: string;
  category: 'orchestration' | 'logic' | 'product' | 'dynamic';
  color: string;
}

export type SkillCategory = Skill['category'];

export const skillCategoryLabels: Record<SkillCategory, string> = {
  orchestration: 'AI Orchestration',
  logic: 'Systems Logic',
  product: 'Product & UX',
  dynamic: 'On-Demand Stack',
};

export const skillCategoryColors: Record<SkillCategory, string> = {
  orchestration: 'var(--pop-pink)',
  logic: 'var(--pop-blue)',
  product: 'var(--pop-red)',
  dynamic: 'var(--pop-orange)',
};

export const skills: Skill[] = [
  {
    name: "AI Agent Orchestration",
    icon: "bot",
    description: "Designing and running autonomous multi-agent networks to perform complex development tasks.",
    category: "orchestration",
    color: "#9C27B0",
  },
  {
    name: "Structured Prompting",
    icon: "brain",
    description: "Writing prompt templates, optimizing context windows, and guiding LLM logical reasoning paths.",
    category: "orchestration",
    color: "#FFEB3B",
  },
  {
    name: "AI Dev Workflows",
    icon: "sparkles",
    description: "Accelerating building speed using agentic composer environments like Cursor and visual prototypes.",
    category: "orchestration",
    color: "#00E5FF",
  },
  {
    name: "Algorithmic Translation",
    icon: "terminal",
    description: "Translating complex mathematical models, coordinate spaces, and geometry into working logic.",
    category: "logic",
    color: "#3776AB",
  },
  {
    name: "Database Engineering",
    icon: "database",
    description: "Structuring relational databases and offline data synchronization via SQLite and Supabase.",
    category: "logic",
    color: "#3ECF8E",
  },
  {
    name: "API Architecture",
    icon: "server",
    description: "Building light REST APIs in Python (Flask/FastAPI) and orchestrating data exchange loops.",
    category: "logic",
    color: "#059669",
  },
  {
    name: "Data Analysis",
    icon: "bar-chart",
    description: "Analyzing raw datasets, Excel modeling, and structuring analytical insights.",
    category: "logic",
    color: "#00897B",
  },
  {
    name: "Product Strategy & UX",
    icon: "layout",
    description: "Defining user flows, functional requirements, and shipping MVPs focused on target problems.",
    category: "product",
    color: "#FF1744",
  },
  {
    name: "Design to Code",
    icon: "paintbrush",
    description: "Converting blueprints into clean, responsive web layouts, custom animations, and UI variables.",
    category: "product",
    color: "#FF4081",
  },
  {
    name: "Privacy Sandboxing",
    icon: "shield",
    description: "Designing offline-first mobile apps that secure data by operating strictly on local device runtime.",
    category: "product",
    color: "#00E676",
  },
  {
    name: "Stack-on-Demand",
    icon: "zap",
    description: "Learning and deploying tools as needed. Shipped projects in Next.js, Flutter/Dart, Python, and SQL.",
    category: "dynamic",
    color: "#FF9100",
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

