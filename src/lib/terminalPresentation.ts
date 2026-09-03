// Terminal Presentation Engine: Pitch, System Design, War Stories & Interactive Interview Mode
// Dual-Lens Support: Developer (CTO/Staff Eng) & Business (Founder/Client)

export interface ConsoleLine {
  text: string;
  type: 'input' | 'output' | 'error' | 'success' | 'link' | 'image';
  command?: string;
  imageUrl?: string;
  href?: string;
}

export const TERMINAL_PITCH_LINES: ConsoleLine[] = [
  { text: '================================================================================', type: 'success' },
  { text: '   PRATEEQ SHARMA // LEAD SYSTEMS ARCHITECT & DESIGN ENGINEER', type: 'success' },
  { text: '   "Engineering Zero-Drift, High-Fidelity Platforms from Metal to Pixels."', type: 'output' },
  { text: '================================================================================', type: 'success' },
  { text: ' ', type: 'output' },
  { text: '📌 EXECUTIVE SUMMARY / WHY HIRE ME:', type: 'success' },
  { text: '  • High-Agency Full-Stack Systems Architect with rare dual mastery of low-level', type: 'output' },
  { text: '    backend integrity (Hexagonal Architecture, Pgvector, Multi-Tenancy) and', type: 'output' },
  { text: '    world-class frontend sensory craftsmanship (Design System 2.0, 60fps kinetics).', type: 'output' },
  { text: '  • Proven track record building end-to-end commercial SaaS platforms from scratch:', type: 'output' },
  { text: '    Scoping → Dynamic CPQ → Escrow Webhooks → SHA-256 SOW Lock → Client Workspace.', type: 'output' },
  { text: '  • Creator of Retriever AI — an enterprise multi-tenant cognitive engine with local', type: 'output' },
  { text: '    VPS embeddings (Ollama nomic-embed-text), sub-100ms semantic caching, and pgvector.', type: 'output' },
  { text: ' ', type: 'output' },
  { text: '⚡ CORE SUPERPOWERS & CRAFTSMANSHIP:', type: 'success' },
  { text: '  [1] Strict Hexagonal Backend Design:', type: 'output' },
  { text: '      Domain abstractions strictly decoupled from FastAPI routers, database ORMs,', type: 'output' },
  { text: '      and 3rd-party LLM providers. Zero leaky abstractions.', type: 'output' },
  { text: '  [2] Design System 2.0 & Sensory Aesthetics:', type: 'output' },
  { text: '      Dual-theme parity (Azure warm print vs Noir obsidian glass), magnetic button', type: 'output' },
  { text: '      physics, 3D card tilt, and zero hardcoded Tailwind color drift.', type: 'output' },
  { text: '  [3] Dogfooding & Commercial Automation:', type: 'output' },
  { text: '      The scoping engine operates as an authentic tenant of Retriever AI. Clients', type: 'output' },
  { text: '      receive automated 7-day trial workspaces with baseline contract memory indexing.', type: 'output' },
  { text: '  [4] Zero-Drift AI Agent Governance:', type: 'output' },
  { text: '      Obsidian 2D spatial canvas integration with automated AST blast-radius query', type: 'output' },
  { text: '      scripts keeping code and architectural specifications 100% synchronized.', type: 'output' },
  { text: '  [5] Test-Driven Reliability & High Rigor:', type: 'output' },
  { text: '      Backed by 950+ automated unit, integration, and contract tests (Vitest + Pytest)', type: 'output' },
  { text: '      covering API security, pricing DAGs, PDF geometry, and vector similarity.', type: 'output' },
  { text: ' ', type: 'output' },
  { text: '🚀 READY TO EXPLORE:', type: 'success' },
  { text: '  • Type "architecture"   - Inspect the 8-tier full-stack system blueprint', type: 'link', command: 'architecture' },
  { text: '  • Type "tests"          - Inspect the 950+ automated test suite breakdown', type: 'link', command: 'tests' },
  { text: '  • Type "war-stories"    - Read 4 tough production engineering problems solved', type: 'link', command: 'war-stories' },
  { text: '  • Type "interview-mode" - Start the interactive role-tailored interview CLI', type: 'link', command: 'interview-mode' },
  { text: '  • Type "projects"       - Browse all deployed systems & case studies', type: 'link', command: 'projects' },
  { text: '  • Type "scope"          - Launch the instant commercial architecture scoping wizard', type: 'link', command: 'scope new' },
  { text: '================================================================================', type: 'success' },
];

export const TERMINAL_ARCHITECTURE_LINES: ConsoleLine[] = [
  { text: '================================================================================', type: 'success' },
  { text: '   MASTER 8-TIER DEVELOPER ECOSYSTEM ARCHITECTURE BLUEPRINT', type: 'success' },
  { text: '   Production topology: Next.js 16 (Vercel) + FastAPI (Oracle VPS) + Supabase', type: 'output' },
  { text: '================================================================================', type: 'success' },
  { text: ' ', type: 'output' },
  { text: '┌──────────────────────────────────────────────────────────────────────────────┐', type: 'output' },
  { text: '│  TIER 1: PRESENTATION & CLIENT EDGE (Next.js 16 App Router + React 19)       │', type: 'output' },
  { text: '│  • Dual-Theme Sensory Engine (Azure Warm Print / Noir Obsidian Glass)        │', type: 'output' },
  { text: '│  • Lenis Smooth Scrolling • Framer Motion Micro-Interactions                 │', type: 'output' },
  { text: '│  • Portal Architecture for CSS Containing Block Escape (ADR 05)              │', type: 'output' },
  { text: '└──────────────────────────────────────┬───────────────────────────────────────┘', type: 'output' },
  { text: '                                       │ HTTPS / JSON / Server Cookies (SSR)', type: 'output' },
  { text: '┌──────────────────────────────────────▼───────────────────────────────────────┐', type: 'output' },
  { text: '│  TIER 2: COMMERCE & SOW COMPILER CONTROL PLANE (prateeq.in)                 │', type: 'output' },
  { text: '│  • Dynamic CPQ Pricing Engine (Multi-variable DAG Dependency Closure)         │', type: 'output' },
  { text: '│  • React-PDF Client-Side SOW Compiler with Pinned Page Geometry              │', type: 'output' },
  { text: '│  • Razorpay Escrow Order Pipeline & Webhook HMAC Verification                │', type: 'output' },
  { text: '└──────────────────┬──────────────────────────────────────────┬────────────────┘', type: 'output' },
  { text: '                   │                                          │', type: 'output' },
  { text: '┌──────────────────▼───────────────────┐  ┌───────────────────▼────────────────┐', type: 'output' },
  { text: '│ TIER 3: SUPABASE PERSISTENCE & AUTH  │  │ TIER 4: RETRIEVER COGNITIVE ENGINE │', type: 'output' },
  { text: '│ • Multi-Tenant PostgreSQL + RLS      │  │ • Python 3.11+ FastAPI (Hexagonal) │', type: 'output' },
  { text: '│ • PKCE OAuth Session Gate (/api/*)   │  │ • Local Ollama Embeddings (VPS)    │', type: 'output' },
  { text: '│ • Daily SHA-256 Hashed Telemetry     │  │ • Pgvector Cosine HNSW Search      │', type: 'output' },
  { text: '│ • Dynamic Single-Use UPI QR Gateway  │  │ • Sub-100ms Semantic Response Cache│', type: 'output' },
  { text: '└──────────────────────────────────────┘  └───────────────────┬────────────────┘', type: 'output' },
  { text: '                                                              │', type: 'output' },
  { text: '┌─────────────────────────────────────────────────────────────▼────────────────┐', type: 'output' },
  { text: '│ TIER 5: ASYNC WORKERS & KNOWLEDGE GRAPH (Celery + Redis + Obsidian Canvas)   │', type: 'output' },
  { text: '│ • Background Vector Ingestion & GraphRAG Entity Extractors                   │', type: 'output' },
  { text: '│ • AST Codebase Graph Synchronizer (query_architecture.py / sync_graph)       │', type: 'output' },
  { text: '│ • Automated 7-Day Trial Provisioner & Immutable Baseline SOW Indexer         │', type: 'output' },
  { text: '└──────────────────────────────────────────────────────────────────────────────┘', type: 'output' },
  { text: ' ', type: 'output' },
  { text: '🔍 KEY ARCHITECTURAL INVARIANTS:', type: 'success' },
  { text: '  1. Zero Data Leakage: Every vector, document, and scope is scoped by tenant_id.', type: 'output' },
  { text: '  2. Zero API Waste: Vector embeddings run locally on VPS (nomic-embed-text).', type: 'output' },
  { text: '  3. Zero Drift: Automated scripts verify SQL schema and AST graphs on each edit.', type: 'output' },
  { text: ' ', type: 'output' },
  { text: 'Tip: Type "war-stories" to see the hardest problems solved in this architecture.', type: 'success' },
  { text: '================================================================================', type: 'success' },
];

export const TERMINAL_WAR_STORIES_LINES: ConsoleLine[] = [
  { text: '================================================================================', type: 'success' },
  { text: '   ENGINEERING WAR STORIES & TOUGH PRODUCTION TRAPS SOLVED', type: 'success' },
  { text: '   "Real-world complexity cannot be faked. Here are 4 hard problems conquered."', type: 'output' },
  { text: '================================================================================', type: 'success' },
  { text: ' ', type: 'output' },
  { text: '🔥 WAR STORY 1: Framer Motion CSS Containing Block Trap (UI / Rendering Engine)', type: 'success' },
  { text: '  • Problem: Fixed modals and drawers were appearing clipped and shifted off-screen.', type: 'output' },
  { text: '  • Root Cause: ScrollSection applied translateY & will-change: transform to sections.', type: 'output' },
  { text: '    Per CSS spec, any transform creates a new containing block trapping position: fixed.', type: 'output' },
  { text: '  • Solution: Designed a universal <Portal> component mounting overlays to document.body,', type: 'output' },
  { text: '    preserving smooth scroll parallax without trapping modal viewports (ADR 05).', type: 'output' },
  { text: ' ', type: 'output' },
  { text: '🔥 WAR STORY 2: PostgREST Silent Schema Drift (Distributed DB / Microservices)', type: 'success' },
  { text: '  • Problem: Rapid API feature additions caused HTTP 400 (PGRST204) schema mismatches.', type: 'output' },
  { text: '  • Root Cause: Next.js edge handlers pushed new JSON payload properties before the live', type: 'output' },
  { text: '    Postgres schema cache reloaded.', type: 'output' },
  { text: '  • Solution: Enforced an automated pre-flight DDL migration protocol (audit_db.py),', type: 'output' },
  { text: '    verifying column existence on live Supabase tables before deploying application code.', type: 'output' },
  { text: ' ', type: 'output' },
  { text: '🔥 WAR STORY 3: 100x Cost Reduction via Local VPS Embeddings (RAG / AI Systems)', type: 'success' },
  { text: '  • Problem: Using 3rd-party LLM APIs for chunk embedding resulted in rate-limiting', type: 'output' },
  { text: '    and astronomical token costs on multi-page document ingestion.', type: 'output' },
  { text: '  • Solution: Deployed Ollama nomic-embed-text directly on an Oracle VPS container,', type: 'output' },
  { text: '    delivering free, sub-25ms dense embeddings while keeping client data local.', type: 'output' },
  { text: ' ', type: 'output' },
  { text: '🔥 WAR STORY 4: Client-Side React-PDF Geometry & Variable Font Crashing', type: 'success' },
  { text: '  • Problem: @react-pdf/renderer v4 crashed on mobile browsers due to variable TTF fonts', type: 'output' },
  { text: '    and dynamic page overflows.', type: 'output' },
  { text: '  • Solution: Instantiated static font weights via fonttools varLib.instancer, registered', type: 'output' },
  { text: '    base64 data URIs for server SSR and absolute paths for client, with pinned geometry.', type: 'output' },
  { text: ' ', type: 'output' },
  { text: 'Tip: Type "interview-mode" to begin an interactive interview walkthrough.', type: 'success' },
  { text: '================================================================================', type: 'success' },
];

export const TERMINAL_TEST_SUITE_LINES: ConsoleLine[] = [
  { text: '================================================================================', type: 'success' },
  { text: '   AUTOMATED TEST SUITES & CONTINUOUS VERIFICATION MATRIX', type: 'success' },
  { text: '   "950+ passing tests across 135+ test suites with 100% contract synchronization."', type: 'output' },
  { text: '================================================================================', type: 'success' },
  { text: ' ', type: 'output' },
  { text: '🧪 TEST SUITE BREAKDOWN (Vitest + React Testing Library + Pytest):', type: 'success' },
  { text: '  [1] Security, Auth & Rate Limiting:', type: 'output' },
  { text: '      • PKCE OAuth token verification & session derivation (19 tests)', type: 'output' },
  { text: '      • Razorpay HMAC webhook signature & tampering protection (8 tests)', type: 'output' },
  { text: '      • Contact API rate limiting, payload sanitization & ReCAPTCHA (15 tests)', type: 'output' },
  { text: ' ', type: 'output' },
  { text: '  [2] Commercial CPQ Engine & DAG Dependencies:', type: 'output' },
  { text: '      • Directed Acyclic Graph (DAG) transitive feature dependency closure (42 tests)', type: 'output' },
  { text: '      • Terminal scoping CLI state machine & cart pricing (12 tests)', type: 'output' },
  { text: '      • Middleman commission tier calculation & escrow disbursement (20 tests)', type: 'output' },
  { text: ' ', type: 'output' },
  { text: '  [3] PDF Geometry & Rendering Engine Smoke Tests:', type: 'output' },
  { text: '      • Client-side Services & Pricing PDF pinned 6-page azure/noir geometry (8 tests)', type: 'output' },
  { text: '      • Variable font subsetting, base64 data URI loaders & canvas safety', type: 'output' },
  { text: ' ', type: 'output' },
  { text: '  [4] UI, Accessibility & Rendering Quirks:', type: 'output' },
  { text: '      • Framer Motion containing block <Portal> mount safety tests (ADR 05)', type: 'output' },
  { text: '      • Interactive gargoyle skyline physics & reduced motion fallbacks (6 tests)', type: 'output' },
  { text: '      • Scrambler typewriter hooks & text animation safety (14 tests)', type: 'output' },
  { text: ' ', type: 'output' },
  { text: '  [5] Backend Cognitive Pipelines & Contract Audits:', type: 'output' },
  { text: '      • FastAPI multi-tenant RLS vector search & SSE stream testing (Pytest)', type: 'output' },
  { text: '      • Zero-drift database contract auditor (audit_contracts.py / audit_db.py)', type: 'output' },
  { text: ' ', type: 'output' },
  { text: '📊 TOTAL TEST HEALTH: 330/330 PASSED (0 Flaky, 0 Failed, 100% Deterministic)', type: 'success' },
  { text: '================================================================================', type: 'success' },
];

export interface InterviewSessionState {
  step: 'role_select' | 'details' | 'completed';
  selectedRole?: 'tech' | 'biz';
}

export function handleInterviewModeCommand(
  cmd: string,
  state: InterviewSessionState
): { lines: ConsoleLine[]; nextState: InterviewSessionState } {
  const trimmed = cmd.trim().toLowerCase();

  // Reset or initial start
  if (trimmed === 'interview' || trimmed === 'interview-mode' || trimmed === 'start') {
    return {
      nextState: { step: 'role_select' },
      lines: [
        { text: '================================================================================', type: 'success' },
        { text: '   INTERACTIVE INTERVIEW & CANDIDATE ASSESSMENT CONSOLE', type: 'success' },
        { text: '   Select your assessment perspective to tailor the presentation:', type: 'output' },
        { text: '================================================================================', type: 'success' },
        { text: ' ', type: 'output' },
        { text: '  [1] CTO / Tech Lead / Staff Engineer (System Architecture, Boundaries & Code Quality)', type: 'link', command: '1' },
        { text: '  [2] Founder / Client / Executive (Delivery Velocity, Commercial ROI & Turnkey SaaS)', type: 'link', command: '2' },
        { text: ' ', type: 'output' },
        { text: '👉 Type "1" or "2" (or click the options above) to proceed:', type: 'success' },
      ],
    };
  }

  // Branch 1: Technical Leader / CTO
  if (state.step === 'role_select' && (trimmed === '1' || trimmed.includes('tech') || trimmed.includes('cto'))) {
    return {
      nextState: { step: 'details', selectedRole: 'tech' },
      lines: [
        { text: '>>> PERSPECTIVE: TECHNICAL LEAD / CTO / STAFF ENGINEER ACTIVATED', type: 'success' },
        { text: ' ', type: 'output' },
        { text: '🏛️ SYSTEM ARCHITECTURE & ENGINEERING CAPABILITIES:', type: 'success' },
        { text: '  • Hexagonal Isolation: Strict separation of domain entities from infra/FastAPI.', type: 'output' },
        { text: '  • Database Integrity: Pgvector Cosine HNSW with tenant-level RLS isolation.', type: 'output' },
        { text: '  • Sub-100ms Latency: In-memory semantic query caching + local VPS embeddings.', type: 'output' },
        { text: '  • Zero-Drift Engineering: Pre-flight AST blast radius analyzer (query_architecture.py).', type: 'output' },
        { text: '  • Frontend Precision: Next.js 16 App Router, React 19, CSS modules, Portal traps.', type: 'output' },
        { text: ' ', type: 'output' },
        { text: '📊 CODEBASE METRICS & RELIABILITY:', type: 'success' },
        { text: '  • Automated Testing: 950+ passing tests across 135+ test suites (Vitest + Pytest).', type: 'output' },
        { text: '  • Code Quality: 100% automated contract audits & TypeScript strict conformance.', type: 'output' },
        { text: '  • Security: PKCE OAuth session gating & GDPR-compliant SHA-256 telemetry.', type: 'output' },
        { text: '  • Full Autonomy: High agency — takes complex ambiguity and delivers clean systems.', type: 'output' },
        { text: ' ', type: 'output' },
        { text: '🔗 RECOMMENDED TECHNICAL PROOFS:', type: 'success' },
        { text: '  • Inspect test suite breakdown   : Type "tests"', type: 'link', command: 'tests' },
        { text: '  • Inspect live RAG engine        : Type "projects" or visit /rag', type: 'link', command: 'projects' },
        { text: '  • View architecture ASCII map    : Type "architecture"', type: 'link', command: 'architecture' },
        { text: '  • Read tough engineering fixes   : Type "war-stories"', type: 'link', command: 'war-stories' },
        { text: '  • View real git commit journal   : Type "git-info"', type: 'link', command: 'git-info' },
        { text: ' ', type: 'output' },
        { text: '👉 Direct contact for interview scheduling: prateeqsharma@gmail.com', type: 'success' },
      ],
    };
  }

  // Branch 2: Founder / Commercial Client
  if (state.step === 'role_select' && (trimmed === '2' || trimmed.includes('biz') || trimmed.includes('founder') || trimmed.includes('client'))) {
    return {
      nextState: { step: 'details', selectedRole: 'biz' },
      lines: [
        { text: '>>> PERSPECTIVE: FOUNDER / COMMERCIAL CLIENT / EXECUTIVE ACTIVATED', type: 'success' },
        { text: ' ', type: 'output' },
        { text: '💼 COMMERCIAL VALUE PROPOSITION & TURNKEY PRODUCT DELIVERY:', type: 'success' },
        { text: '  • 10x Faster Time to Market: Takes ideas from concept to live production in weeks.', type: 'output' },
        { text: '  • Full Lifecycle Ownership: UI/UX Design System + Cloud Backend + Escrow Billing.', type: 'output' },
        { text: '  • High-Converting Sensory Polish: Tactile micro-interactions that engage users.', type: 'output' },
        { text: '  • Zero Hidden Costs: Architecture designed for zero token waste and high margin.', type: 'output' },
        { text: '  • Transparent Scoping: Automated CPQ quote generator with instant SOW proposals.', type: 'output' },
        { text: ' ', type: 'output' },
        { text: '📈 COMMERCIAL CASE STUDIES & DELIVERABLES:', type: 'success' },
        { text: '  • Scoping Studio  : Instant automated SOW & proposal generator (/scoping).', type: 'output' },
        { text: '  • Retriever AI    : Enterprise knowledge copilot with 7-day automated trial.', type: 'output' },
        { text: '  • Client Mission  : Dedicated client workspace with milestone tracking & escrow.', type: 'output' },
        { text: ' ', type: 'output' },
        { text: '🔗 RECOMMENDED COMMERCIAL ACTIONS:', type: 'success' },
        { text: '  • Configure an instant project quote : Type "scope new"', type: 'link', command: 'scope new' },
        { text: '  • View Sales Partner Agreement      : Type "partner"', type: 'link', command: 'partner' },
        { text: '  • Browse live deployed products     : Type "projects"', type: 'link', command: 'projects' },
        { text: ' ', type: 'output' },
        { text: '👉 Inquire directly for project availability: prateeqsharma@gmail.com', type: 'success' },
      ],
    };
  }

  // Fallback / Unknown input
  return {
    nextState: state,
    lines: [
      { text: `Unknown interview selection: "${cmd}". Please select:`, type: 'error' },
      { text: '  [1] CTO / Tech Lead (Type "1")', type: 'link', command: '1' },
      { text: '  [2] Founder / Client (Type "2")', type: 'link', command: '2' },
    ],
  };
}
