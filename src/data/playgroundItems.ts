/**
 * The Prateeq Playground // Universal Creation & Innovation Registry
 * SSoT for Micro-SaaS Apps, Interactive Games, Generative AI Art & Prompts, and Retriever Cognitive Tools.
 */

export type PlaygroundKind = 
  | 'saas'               // Micro-SaaS, full-stack product, utility tool
  | 'interactive-toy'   // Playable game, algorithm lab, canvas simulation
  | 'generative-media'  // AI photo / artwork, video, prompt showcase
  | 'cognitive-tool'    // Retriever RAG, LLM agent, interactive brain
  | 'experiment';       // Computer vision, shader, 3D WebGL experiment

export interface BasePlaygroundItem {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  kind: PlaygroundKind;
  tags: string[];
  vibeCodedDate: string;
  featured?: boolean;
  status?: 'live' | 'beta' | 'concept' | 'archived';
  metricsBadge?: string;
  previewImage?: string;
}

// 1. Micro-SaaS & Full Web Apps
export interface SaasPlaygroundItem extends BasePlaygroundItem {
  kind: 'saas';
  appUrl: string;
  isEmbeddable: boolean;
  pricingModel?: 'Free' | 'Freemium' | 'Open Source' | 'Trial' | 'Commercial';
  techStack: string[];
  githubUrl?: string;
  highlights: string[];
}

// 2. Games & Algorithm Labs
export interface InteractiveToyPlaygroundItem extends BasePlaygroundItem {
  kind: 'interactive-toy';
  renderMode: 'native' | 'iframe';
  componentName?: 'PlaygroundSnake' | 'PlaygroundPathfinder' | 'PlaygroundPizzaRat' | 'PlaygroundMatrixRain';
  iframeUrl?: string;
  controlsGuide: { key: string; label: string }[];
  soundSupported: boolean;
  hasLeaderboard: boolean;
  terminalCommands: string[];
  difficulty?: 'Easy' | 'Medium' | 'Hard' | 'Mind-Bending';
}

// 3. Generative Media (AI Art, Prompts, Videos)
export interface GenerativeMediaPlaygroundItem extends BasePlaygroundItem {
  kind: 'generative-media';
  mediaType: 'image' | 'video';
  mediaUrl: string;
  thumbnailUrl: string;
  model: string;
  prompt: string;
  negativePrompt?: string;
  parameters?: {
    aspectRatio?: string;
    seed?: number | string;
    cfgScale?: number;
    steps?: number;
    sampler?: string;
  };
  resolution?: string;
  downloadUrl?: string;
}

// 4. Cognitive Tools (Retriever / LLM Micro-Tools)
export interface CognitiveToolPlaygroundItem extends BasePlaygroundItem {
  kind: 'cognitive-tool';
  backendEngine: 'retriever-oracle' | 'gemini-api' | 'ollama-local';
  apiEndpoint?: string;
  capabilities: string[];
  terminalCommands: string[];
}

// 5. Experiments
export interface ExperimentPlaygroundItem extends BasePlaygroundItem {
  kind: 'experiment';
  experimentType: 'computer-vision' | 'webgl-shader' | 'svg-physics';
  techStack: string[];
  githubUrl?: string;
}

export type PlaygroundItem = 
  | SaasPlaygroundItem 
  | InteractiveToyPlaygroundItem 
  | GenerativeMediaPlaygroundItem 
  | CognitiveToolPlaygroundItem
  | ExperimentPlaygroundItem;

export const PLAYGROUND_ITEMS: PlaygroundItem[] = [
  // ─── 🚀 MICRO-SAAS & LIVE PRODUCTS ───
  {
    id: 'saas-retriever',
    slug: 'retriever',
    title: 'Retriever AI Studio',
    tagline: 'Enterprise Cognitive RAG platform with pgvector hybrid search & local Ollama inference.',
    description: 'A production-grade Retrieval-Augmented Generation engine built with strict Hexagonal Architecture. Features dense Ollama embeddings, sparse BM25 indexing, multi-tenant RLS, and sub-100ms semantic response caching.',
    kind: 'saas',
    appUrl: '/rag',
    isEmbeddable: false,
    pricingModel: 'Freemium',
    techStack: ['Next.js 16', 'FastAPI', 'pgvector', 'Ollama', 'Docker', 'Oracle VPS'],
    githubUrl: 'https://github.com/prat3010/retriever',
    tags: ['RAG', 'Hexagonal Architecture', 'FastAPI', 'pgvector', 'Ollama'],
    vibeCodedDate: '2026-08-15',
    featured: true,
    status: 'live',
    metricsBadge: 'LIVE ON ORACLE VPS',
    previewImage: '/images/project-rag-lab.webp',
    highlights: [
      'Multi-tenant PostgreSQL Row-Level Security (RLS)',
      'Sub-25ms semantic cache hits via pgvector',
      '$0 embedding compute using local nomic-embed-text',
      '1-line embeddable web widget script'
    ],
  },
  {
    id: 'saas-scoping-studio',
    slug: 'scoping-studio',
    title: 'Scoping Studio',
    tagline: 'Autonomous requirement modeling engine & instant commercial SOW compiler.',
    description: 'An interactive client discovery wizard that translates high-level business goals into verifiable engineering roadmaps, transparent pricing estimates, and downloadable React-PDF proposals.',
    kind: 'saas',
    appUrl: '/scoping',
    isEmbeddable: false,
    pricingModel: 'Commercial',
    techStack: ['Next.js 16', 'React 19', 'React-PDF', 'DAG Topological Closures', 'TypeScript'],
    githubUrl: 'https://github.com/prat3010/Prateek_website',
    tags: ['CPQ Engine', 'Dynamic Pricing', 'PDF Compilation', 'DAG Resolver'],
    vibeCodedDate: '2026-08-20',
    featured: true,
    status: 'live',
    metricsBadge: 'INSTANT SOW COMPILER',
    previewImage: '/images/project-scoping-studio.webp',
    highlights: [
      'DAG topological closure resolving transitive dependencies in <1ms',
      'Client-side pixel-perfect pinned page-count PDF generation',
      'Geo-IP currency detection (INR / USD) without layout shift',
      'Instant fast-pass deposit checkout via dynamic UPI QR'
    ],
  },
  {
    id: 'saas-client-workspace',
    slug: 'client-workspace',
    title: 'Client Mission Control',
    tagline: 'PKCE OAuth client operational portal with automated tenant provisioning & milestone tracking.',
    description: 'A closed-loop client operations hub featuring cryptographically verified sessions, milestone sprint progress bars, immutable baseline contract indexing, and Razorpay escrow payment ledgers.',
    kind: 'saas',
    appUrl: '/dashboard',
    isEmbeddable: false,
    pricingModel: 'Commercial',
    techStack: ['Supabase Auth (PKCE)', 'Next.js 16', 'Razorpay Webhooks', 'RLS Security'],
    githubUrl: 'https://github.com/prat3010/Prateek_website',
    tags: ['PKCE OAuth', 'Escrow Ledger', 'Milestone Tracker', 'Contract Immutability'],
    vibeCodedDate: '2026-08-28',
    status: 'live',
    metricsBadge: 'PKCE SESSION GATE',
    previewImage: '/images/project-client-workspace.webp',
    highlights: [
      'Dual cookie + localStorage persistence adapter for Safari ITP',
      'Automated tenant activation bridge calling Retriever APIs on login',
      'HMAC signature-verified Razorpay invoice and payment ledgers',
      'Dedicated project AI copilot pre-grounded on signed SOW'
    ],
  },

  // ─── 🎮 INTERACTIVE GAMES & LABS ───
  {
    id: 'toy-snake',
    slug: 'snake',
    title: 'Cyber Snake 2088',
    tagline: 'Retro terminal arcade snake with Web Audio 8-bit sound and Supabase global leaderboards.',
    description: 'A high-performance HTML5 Canvas remake of retro snake. Features accelerating tick rates, procedural fruit placement, Web Audio oscillator sound synthesis, confetti victory bursts, and live high-score synchronization with Supabase.',
    kind: 'interactive-toy',
    renderMode: 'native',
    componentName: 'PlaygroundSnake',
    tags: ['HTML5 Canvas', 'Web Audio API', 'Supabase RLS', 'Retro Arcade', 'Leaderboard'],
    terminalCommands: ['snake', 'play', 'game'],
    vibeCodedDate: '2026-07-15',
    featured: true,
    difficulty: 'Medium',
    soundSupported: true,
    hasLeaderboard: true,
    metricsBadge: 'SUPABASE LEADERBOARD',
    previewImage: '/images/hero-illustration-wavy.webp',
    controlsGuide: [
      { key: '↑ ↓ ← → / WASD', label: 'Directional Movement' },
      { key: 'Space / P', label: 'Pause / Resume Game' },
      { key: 'Esc', label: 'Exit / Restart' },
    ],
  },
  {
    id: 'toy-pathfinder',
    slug: 'pathfinder',
    title: '2D Graph Pathfinder Lab',
    tagline: 'Interactive algorithm visualization engine featuring 13 pathfinding heuristics.',
    description: 'A comprehensive computer science algorithm lab comparing 13 search heuristics including A*, Dijkstra, Theta*, Jump Point Search (JPS), Bidirectional BFS, and Trémaux maze solving with dynamic obstacles.',
    kind: 'interactive-toy',
    renderMode: 'native',
    componentName: 'PlaygroundPathfinder',
    tags: ['Pure TypeScript', 'Graph Theory', 'Algorithms', 'Generators', 'Computer Science'],
    terminalCommands: ['pathfinder', 'playground', 'algo', 'lab', 'path'],
    vibeCodedDate: '2026-07-20',
    featured: true,
    difficulty: 'Hard',
    soundSupported: true,
    hasLeaderboard: false,
    metricsBadge: '13 HEURISTICS',
    previewImage: '/images/project-systems-terminal.webp',
    controlsGuide: [
      { key: 'Drag Start / Target', label: 'Reposition Coordinates' },
      { key: 'Click & Drag Grid', label: 'Paint / Erase Laser Walls' },
      { key: 'Space', label: 'Execute Path Search' },
    ],
  },
  {
    id: 'toy-pizza-rat',
    slug: 'pizza-rat',
    title: 'NYC Pizza Rat 3D',
    tagline: 'Interactive Three.js physics model with procedural fur and inertia mechanics.',
    description: 'An interactive 3D WebGL tribute to the legendary NYC subway rat carrying a full slice of pepperoni pizza. Features procedural canvas textures, cybernetic glowing fur in Noir theme, and inertia mouse tracking.',
    kind: 'interactive-toy',
    renderMode: 'native',
    componentName: 'PlaygroundPizzaRat',
    tags: ['Three.js', 'WebGL', 'Shaders', 'Inertia Physics', 'Easter Egg'],
    terminalCommands: ['pizzarat', 'konami', 'rat'],
    vibeCodedDate: '2026-08-05',
    difficulty: 'Easy',
    soundSupported: false,
    hasLeaderboard: false,
    metricsBadge: 'THREE.JS WEBGL',
    previewImage: '/images/hero-noir.webp',
    controlsGuide: [
      { key: 'Click & Drag', label: 'Rotate 3D Viewport' },
      { key: 'Scroll Wheel', label: 'Zoom In / Out' },
      { key: 'Space', label: 'Trigger Pizza Bounce' },
    ],
  },
  {
    id: 'toy-matrix-rain',
    slug: 'matrix-rain',
    title: 'Matrix Digital Rain Canvas',
    tagline: 'Authentic phosphor green Katakana particle stream simulator.',
    description: 'Full-bleed HTML5 Canvas particle simulation capturing the iconic 1999 digital rain with glowing leader glyphs, fading Katakana trails, and dynamic column speeds.',
    kind: 'interactive-toy',
    renderMode: 'native',
    componentName: 'PlaygroundMatrixRain',
    tags: ['HTML5 Canvas', 'Generative Art', 'Cyberpunk', 'Theme Aware'],
    terminalCommands: ['matrix', 'rain'],
    vibeCodedDate: '2026-07-10',
    difficulty: 'Easy',
    soundSupported: false,
    hasLeaderboard: false,
    metricsBadge: 'CANVAS SHADER',
    previewImage: '/images/project-systems-terminal.webp',
    controlsGuide: [
      { key: 'Click', label: 'Trigger Energy Ripple' },
      { key: 'Esc', label: 'Exit Canvas' },
    ],
  },

  // ─── 🎨 GENERATIVE STUDIO (AI ART, PROMPTS & VIDEOS) ───
  {
    id: 'art-neotokyo-rain',
    slug: 'neotokyo-rain',
    title: 'Neo-Tokyo Monsoon Twilight',
    tagline: 'Cinematic cyberpunk street photograph generated with Flux 1.1 Pro.',
    description: 'A torrential downpour illuminating the subterranean alleys of Neo-Tokyo. Features hyper-realistic asphalt water caustics, volumetric amber sign diffusion, and intricate cable infrastructure.',
    kind: 'generative-media',
    mediaType: 'image',
    mediaUrl: '/images/project-rag-lab.webp',
    thumbnailUrl: '/images/project-rag-lab.webp',
    model: 'Flux 1.1 Pro',
    prompt: 'cinematic wide 35mm photograph of neo-tokyo alleyway in torrential monsoon rain, glowing amber and cyan neon sign reflections pooling in wet asphalt puddles, volumetric mist, dense overhead cable bundles, f/1.4 aperture, film grain, photorealistic octane render, 8k',
    negativePrompt: 'blurry, plastic skin, oversaturated, deformed geometry, low resolution, watermark, cartoon 3d',
    parameters: {
      aspectRatio: '16:9',
      seed: 849204192,
      cfgScale: 3.5,
      steps: 40,
      sampler: 'Euler A',
    },
    resolution: '3840x2160 (4K UHD)',
    tags: ['Flux 1.1 Pro', 'Cyberpunk', 'Cinematic Photography', 'Lighting Study'],
    vibeCodedDate: '2026-09-12',
    featured: true,
    metricsBadge: 'FLUX 1.1 PRO',
    previewImage: '/images/project-rag-lab.webp',
  },
  {
    id: 'art-mechanical-heart',
    slug: 'mechanical-heart',
    title: 'The Clockwork Sovereign',
    tagline: 'Baroque biomechanical horology artwork generated with Midjourney v6.1.',
    description: 'An intricate biomechanical heart forged from antique brass, obsidian, and glowing quartz resonators. Features micro-gears, ruby escapement bearings, and volumetric dust motes.',
    kind: 'generative-media',
    mediaType: 'image',
    mediaUrl: '/images/project-synchronizer.webp',
    thumbnailUrl: '/images/project-synchronizer.webp',
    model: 'Midjourney v6.1',
    prompt: 'intricate biomechanical clockwork heart forged from brushed brass and obsidian, micro-gears ticking inside transparent sapphire crystal chamber, ruby escapements, dramatic museum chiaroscuro lighting, depth of field macro lens, 8k --ar 1:1 --v 6.1 --style raw',
    negativePrompt: 'low detail, flat lighting, plastic render, noisy, text',
    parameters: {
      aspectRatio: '1:1',
      seed: 390192841,
      cfgScale: 6.0,
      steps: 50,
    },
    resolution: '2048x2048',
    tags: ['Midjourney v6.1', 'Macro Photography', 'Steampunk', 'Horology'],
    vibeCodedDate: '2026-09-18',
    metricsBadge: 'MIDJOURNEY v6.1',
    previewImage: '/images/project-synchronizer.webp',
  },
  {
    id: 'art-noir-skyline-reel',
    slug: 'noir-skyline-reel',
    title: 'Manhattan Nocturne Atmospheric Reel',
    tagline: 'Volumetric cinematic AI video reel generated with Runway Gen-3 Alpha.',
    description: 'A cinematic drone sweep passing gothic cathedral gargoyles and art-deco skyscrapers as twilight mist descends over a stylized 1930s noir metropolis.',
    kind: 'generative-media',
    mediaType: 'image',
    mediaUrl: '/images/hero-noir.webp',
    thumbnailUrl: '/images/hero-noir.webp',
    model: 'Runway Gen-3 Alpha',
    prompt: 'slow cinematic drone tracking shot sweeping past gargoyle spires on an art-deco skyscraper, heavy twilight fog rolling between illuminated office windows, 24fps motion blur, Kodak Tri-X 400 film stock aesthetic',
    parameters: {
      aspectRatio: '16:9',
      steps: 30,
    },
    resolution: '1920x1080 (60fps)',
    tags: ['Runway Gen-3', 'Cinematic Video', 'Noir Aesthetic', 'Drone Motion'],
    vibeCodedDate: '2026-09-25',
    metricsBadge: 'RUNWAY GEN-3',
    previewImage: '/images/hero-noir.webp',
  },

  // ─── 🧠 COGNITIVE & RETRIEVER AI TOOLS ───
  {
    id: 'ai-neural-dossier',
    slug: 'neural-dossier',
    title: 'The Sovereign Neural Dossier',
    tagline: 'Live cognitive intelligence console powered by Retriever on Oracle Cloud VPS.',
    description: 'An interactive MI6-style intelligence terminal cross-examining engineering architecture, postmortems, and system decisions using pgvector hybrid search, local Ollama embeddings, and sub-10ms semantic caching.',
    kind: 'cognitive-tool',
    backendEngine: 'retriever-oracle',
    apiEndpoint: '/api/playground/chat',
    capabilities: [
      'Hybrid Cosine Vector Search + BM25 Lexical Matching',
      'PostgreSQL Sub-10ms Semantic Response Caching',
      'Automatic Verifiable Bracket Source Citations',
      'Local nomic-embed-text VPS Inference ($0 Token Cost)'
    ],
    tags: ['Retriever AI', 'FastAPI', 'pgvector', 'Ollama', 'Oracle VPS'],
    terminalCommands: ['dossier', 'twin', 'ai'],
    vibeCodedDate: '2026-10-04',
    featured: true,
    metricsBadge: 'LIVE ORACLE VPS',
    previewImage: '/images/project-systems-terminal.webp',
  },

  // ─── ⚡ EXPERIMENTS & COMPUTER VISION ───
  {
    id: 'exp-gesture-scroll',
    slug: 'gesture-scroll',
    title: 'GestureScroll Computer Vision',
    tagline: 'Touchless hand-tracking navigation controller using Google MediaPipe HandLandmarker.',
    description: 'A touchless web navigation interface using your webcam and computer vision. Detects thumb-and-index pinch gestures in real time to scroll smoothly down web pages without touching keyboard or mouse.',
    kind: 'experiment',
    experimentType: 'computer-vision',
    techStack: ['MediaPipe', 'Webcam API', 'Lenis Smooth Scroll', 'Canvas 2D'],
    githubUrl: 'https://github.com/prat3010/Prateek_website',
    tags: ['Computer Vision', 'MediaPipe', 'Human-Computer Interaction', 'Webcam'],
    vibeCodedDate: '2026-08-10',
    metricsBadge: 'MEDIAPIPE CV',
    previewImage: '/images/hero-illustration-wavy.webp',
  },
];

export function getPlaygroundItemBySlug(slug: string): PlaygroundItem | undefined {
  return PLAYGROUND_ITEMS.find((item) => item.slug === slug);
}

export function getAllPlaygroundSlugs(): string[] {
  return PLAYGROUND_ITEMS.map((item) => item.slug);
}
