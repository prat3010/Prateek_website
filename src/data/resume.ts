export interface WorkExperience {
  id: string;
  company: string;
  role: string;
  period: string;
  location: string;
  bullets: {
    general: string;
    fullstack?: string;
    ai?: string;
    creative?: string;
  }[];
  tags: string[];
}

export interface Education {
  school: string;
  degree: string;
  period: string;
  location: string;
}

export interface ResumeData {
  name: string;
  title: string;
  email: string;
  phone: string;
  website: string;
  github: string;
  linkedin: string;
  summary: {
    general: string;
    fullstack: string;
    ai: string;
    creative: string;
  };
  experience: WorkExperience[];
  education: Education[];
  lastSynced?: {
    timestamp: string;
    status: 'success' | 'failed';
    summary: string;
  };
}

export const resumeData: ResumeData = {
  name: "Prateek Sharma",
  title: "Full-Stack Developer & AI Orchestration Engineer",
  email: "3010prateeksharma@gmail.com",
  phone: "+91 9050433260",
  website: "https://prateeq.in",
  github: "https://github.com/prat3010",
  linkedin: "https://linkedin.com/in/freshlimevodka",
  summary: {
    general: "Versatile software engineer specializing in building high-performance web applications and interactive interfaces. Expert in combining clean backend APIs with modern frontend frameworks, while utilizing state-of-the-art AI systems for rapid prototyping and deployment.",
    fullstack: "Engineered web architectures focusing on robust server backends, database schema optimizations, and seamless client-server integration using Next.js, Flask, FastAPI, and Supabase.",
    ai: "Specialist in AI agent orchestration and Prompt Engineering, building and automating LLM-backed pipelines (retrieval-augmented generation, agents, multimodal processing) to solve complex workflows.",
    creative: "UI/UX focused developer dedicated to creating stunning interactive visual interfaces, micro-animations, and responsive layouts that deliver premium user experiences.",
  },
  experience: [
    {
      id: "freelance-developer",
      company: "Independent Consultant / Freelance Developer",
      role: "Full-Stack Engineer & AI Prototyper",
      period: "2023 - Present",
      location: "Remote / India",
      bullets: [
        {
          general: "Designed and built custom web platforms, simulation systems, and mobile utility tools using React, Next.js, Flutter, and Python.",
          fullstack: "Constructed high-speed API layers in Flask and FastAPI, and integrated robust PostgreSQL/Supabase database schemas with row-level security (RLS).",
          ai: "Implemented custom LLM prompt pipelines, automated content generators, and local script runners leveraging Gemini and OpenAI models via API wrappers.",
          creative: "Translated visual layouts into clean responsive code using pop-art, neo-brutalist, and modern dark-mode aesthetics with Framer Motion and custom CSS.",
        },
        {
          general: "Optimized website performance and SEO compliance, securing fast page loads and smooth client navigation via Lenis smooth scrolling and viewport-linked parallax.",
          fullstack: "Programmed offline-capable data layers with Drift and SQLite to keep mobile apps fully functional without network coverage.",
          ai: "Leveraged agentic developer tools to prototype features in record time, achieving up to 5x faster shipping cycles compared to boilerplate-heavy workflows.",
          creative: "Crafted interactive components including pathfinding visualizers, custom animated speech bubbles, and reactive vector cards.",
        },
        {
          general: "Engineered PrateekSync AI, an AI-powered headless CMS, automating portfolio content generation and credential verification, increasing resume relevance and data accuracy by 30%.",
          fullstack: "Designed and implemented a Python-based headless CMS with Streamlit UI, integrating GitHub REST API and a custom TypeScript parser for dynamic content orchestration and data synchronization.",
          ai: "Developed an AI-powered orchestrator leveraging Google Gemini 2.5 Flash API for multimodal OCR, intelligent resume bullet generation, and technical ghostwriting, enhancing data synthesis and content creation efficiency.",
          creative: "Built an interactive Streamlit dashboard for a headless CMS, featuring dynamic skill dependency mapping, Lucide icon support, and automated image format conversions for optimized web assets.",
        },
      ],
      tags: ["React", "Next.js", "Flutter", "Python", "FastAPI", "Supabase", "Framer Motion", "SQLite", "Google Gemini", "Streamlit", "GitHub API", "TypeScript"]
    },
  ],
  education: [
    {
      school: "Delhi University",
      degree: "Bachelor of Commerce",
      period: "2020",
      location: "New Delhi, India"
    },
  ],
  lastSynced: {
    timestamp: "2026-06-15T13:14:56.604842",
    status: "success",
    summary: "Synchronized new project: PrateekSync AI: Intelligent Portfolio & Resume Automation Engine.",
  }
};
