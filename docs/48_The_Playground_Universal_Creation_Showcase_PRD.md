# 48. The Playground: Universal Creation & Innovation Showcase PRD

**Document Version:** `v2.0.0`  
**Status:** `PRODUCTION-TRUTH SPECIFICATION`  
**Authors:** Prateek Sharma (Principal Software Architect & Lead Product Engineer)  
**Target Surfaces:** `prateeq.in/playground` & `prateeq.in/playground/[slug]`  
**Companion Specification:** [PRD: The Playground Commerce, Fulfillment & Publishing Infrastructure](specs/PRD_PLAYGROUND_COMMERCE.md)  
**Target Invariants:** 100% Production Truth, Zero Fakes/Simulated Toys, Zero Fabricated Testimonials, Zero-Destruction of Free Games, User-Activated Game Gate (0ms TBT), Frictionless Guest Checkout (Zero Mandatory OAuth), 100/100 Core Web Vitals  

---

## 1. Executive Summary & Product Vision

### 1.1 The Dual Mission of The Playground
The Playground (`/playground` and `/playground/[slug]`) is Prateek Sharma's **Autonomous Software Laboratory & Digital Goods Platform**. It solves two systemic challenges in traditional engineering portfolios:

1. **The Portfolio Inactivity Trap:** Traditional portfolios showcase static screenshots, dead GitHub links, and passive case studies. They do not demonstrate real-time software execution, interactive systems design, or viral product engagement.
2. **The Terminal & Landing Page Clutter:** Cramming interactive canvas games, WebGL runtimes, and computer vision utilities into landing pages or the text-based diagnostics console (`/terminal`) degrades initial page load, balloons bundle size, and obscures core commercial scoping workflows.

**The Solution:** The Playground is structured as a **Dual-Engine Platform**:
- **Engine 1: Viral Interactive Discovery Laboratory (100% Free):** Playable HTML5 Canvas arcade games (Cyber Snake 2088), computer science visualizers (2D Graph Pathfinder with 13 heuristics), Three.js 3D simulations (Subway Pizza Rat), and high-resolution generative AI prompt studies (Flux 1.1, Midjourney v6.1). These serve as organic discovery anchors, boosting brand affinity, session duration, and social sharing.
- **Engine 2: Production-Truth Digital Goods & Micro-SaaS Store (Monetized Products):** Turnkey software codebases, Micro-SaaS boilerplates (Job Hunter Studio), cognitive component packs, and developer tools delivered via frictionless guest checkout (Razorpay UPI/Cards/LUT-export for international buyers), private storage signed downloads, automated GitHub repository invites, and perpetual cryptographic license keys.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              THE PLAYGROUND PRODUCT MATRIX                             │
└────────────────────────────────────────────────────────────────────────────────────────┘
                 Viral Inbound Traffic (Social, SEO, GitHub, Dev Communities)
                                             │
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │    /playground Universal Innovation Grid     │
                      │  (Real-Time Search, 4 Taxonomies, Badges)    │
                      └──────────────────────┬───────────────────────┘
                                             │
               ┌─────────────────────────────┼─────────────────────────────┐
               ▼                             ▼                             ▼
       ┌───────────────┐             ┌───────────────┐             ┌───────────────┐
       │ Interactive   │             │ Commercial    │             │ Ecosystem     │
       │ Toys & Games  │             │ Micro-SaaS    │             │ Gateways      │
       │ (100% Free)   │             │ & Code Packs  │             │ (RAG, Scoping)│
       └───────┬───────┘             └───────┬───────┘             └───────┬───────┘
               │                             │                             │
               │ Viral Engagement            │ Instant Guest Checkout      │ Enterprise
               │ Brand Affinity              │ (Razorpay UPI/Cards/LUT)    │ Client Inbound
               ▼                             ▼                             ▼
       ┌───────────────┐             ┌───────────────┐             ┌───────────────┐
       │ Leaderboards  │             │ Private ZIP   │             │ High-Ticket   │
       │ & Canvas Labs │             │ + License Key │             │ Contract SOW  │
       └───────────────┘             └───────────────┘             └───────────────┘
```

### 1.2 Core Product Invariants & Production Truth Law
1. **Zero Fakes / Zero Simulated CLIs:** Banned entirely. Terminal simulators with `setTimeout` loops spitting fake compile logs are strictly prohibited. For headless code packages and services, display genuine, executable shell commands (`git clone ... && ./launch.sh`, `docker compose up -d`), authentic file trees, and real runtime dependency requirements.
2. **Zero Fabricated Social Proof:** Fictional testimonials, mock metrics, and simulated builder reviews are banned. Only verified GitHub repository stars/forks, genuine test coverage, and reproducible benchmarks are displayed.
3. **Zero-Destruction Catalog Invariant:** None of the existing free interactive creations (Cyber Snake, 2D Pathfinder, Pizza Rat, Matrix Rain) will be deleted or paywalled. Free playable toys remain permanent high-velocity organic discovery anchors.
4. **User-Activated Game Gate (0ms TBT):** Heavy WebGL scenes, physics engines, and audio oscillators are deferred behind an interactive "Launch Environment" gate, guaranteeing **0ms initial Total Blocking Time (TBT)** and 100/100 Core Web Vitals.
5. **Frictionless Guest Checkout:** No customer is ever forced behind a Google OAuth sign-in gate to purchase digital goods. Purchases require only `Name` and `Email`, fulfilling immediately via short-TTL signed URLs, tokenized guest re-download magic links, and optional automated GitHub collaborator invitations.

---

## 2. Architecture & Data Model

### 2.1 The 4-Tier Storefront Taxonomy
The catalog grid at `/playground` organizes items across four distinct business taxonomies:

```typescript
export type PlaygroundTaxonomy = 
  | 'all'              // Universal Showcase: unified view of all products & creations
  | 'commercial'       // Purchasable Micro-SaaS, Turnkey Starters, Source Code Packs
  | 'toys-and-games'   // Free Interactive Canvas Engines, Shaders, Puzzles, AI Media
  | 'ecosystem';       // Live Flagships (Retriever AI Studio, Scoping Studio, Client Workspace)
```

### 2.2 SSoT Registry Schema (`src/data/playgroundItems.ts`)
The polymorphic TypeScript data contract unifies both free interactive creations and commercial digital goods:

```typescript
export type PlaygroundKind = 
  | 'saas'               // Micro-SaaS, full-stack product, utility tool
  | 'interactive-toy'   // Playable game, algorithm lab, canvas simulation
  | 'generative-media'  // AI photo / artwork, video, prompt showcase
  | 'cognitive-tool'    // Retriever RAG, LLM agent, interactive brain
  | 'experiment';       // Computer vision, shader, 3D WebGL experiment

export interface PlaygroundPricingTier {
  id: string;
  title: string;
  name?: string;
  priceINR: number;
  priceUSD: number;
  features?: string[];
  licenseType?: string;
  downloadKey?: string;
}

export interface BasePlaygroundItem {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  kind: PlaygroundKind;
  taxonomy?: PlaygroundTaxonomy;
  tags: string[];
  vibeCodedDate: string;
  featured?: boolean;
  status?: 'live' | 'beta' | 'concept' | 'archived';
  metricsBadge?: string;
  previewImage?: string;

  // Commercial & Packaging Extensions
  isCommercial?: boolean;
  priceINR?: number;
  priceUSD?: number;
  pricingTiers?: PlaygroundPricingTier[];
  pricingModel?: string;
  componentName?: string | null;
  appUrl?: string;
  githubUrl?: string;
  techStack?: string[];
  highlights?: string[];
  controlsGuide?: { key: string; label: string }[];
  downloadPackageKey?: string;
  githubRepoSource?: string;
  fileSize?: string;
  checksumSha256?: string;
  version?: string;
  licenseType?: string;
  showcaseProjects?: PlaygroundShowcaseProject[];
}
```

---

## 3. UI Systems & Viewing Environments

### 3.1 The Catalog Grid (`/playground`)
- **Real-Time Client Filtering:** Instantaneous substring search against title, tagline, tags, prompt text, and tech stack.
- **Dynamic Category Tabs:** Filter tabs with live item count counters (`All Creations`, `SaaS & Apps`, `Games & Labs`, `AI Art & Prompts`, `Cognitive AI`, `Experiments`).
- **Adaptive Cards:**
  - `SaasCard`: Commercial price chips (`₹2,499 / $29`), open-source badges, tech stack chips, and primary launch/details CTA.
  - `ToyCard`: Difficulty rating, 8-bit Web Audio badge, Supabase leaderboard indicator, and arcade cabinet launcher.
  - `MediaCard`: Aspect-ratio optimized image thumbnail, model badge (Flux 1.1 Pro, Midjourney v6.1), and 1-click prompt lightbox trigger.
  - `CognitiveCard`: Live Oracle VPS status badge, vector pipeline highlights, and intelligence console launcher.
  - `ExperimentCard`: Computer vision / WebGL chips and repository links.
- **MediaPromptLightbox:** Mounted via `<Portal target="document.body">` to escape the `will-change: transform` containing block of `ScrollSection` (ADR 05), featuring 1-click clipboard prompt copy and generation parameter breakdown.

### 3.2 The Dynamic Product Runner (`/playground/[slug]`)
Depending on the item's `kind` and whether a browser canvas exists, `/playground/[slug]` presents one of three tailored environments:

1. **The Arcade Cabinet Shell (`kind === 'interactive-toy'`):**
   - Retro bezel styling responsive to Azure and Noir design themes.
   - User-Activated Game Gate (canvas and audio mount only on user interaction).
   - Pure CSS CRT scanline overlay toggleable by user.
   - Web Audio 8-bit procedural sound synthesizer toggle.
   - Fullscreen container expansion with keyboard navigation (ESC to exit).
   - Lenis smooth scroll isolation via `data-lenis-prevent`.
2. **The Prompt Engineering Showcase (`kind === 'generative-media'`):**
   - Full-resolution uncompressed media viewer.
   - Positive and negative prompt inspect cards.
   - Parameter grid: Aspect Ratio, CFG Scale, Sampling Steps, Seed, Sampler.
3. **The Authentic Architecture Stage & Commercial Runner (`kind === 'saas'` or `componentName === null`):**
   - **Verifiable Quickstart Guide:** Genuine shell execution snippets (`./launch.sh`, `docker compose up -d`).
   - **Production Architecture Specs:** Technical breakdown of backend, database, vector stores, and frontends.
   - **Direct Source Links:** Authentic GitHub repository links for inspection.
   - **Sticky Commercial Bar:** Scroll-pinned purchasing bar displaying price in local currency (INR / USD), tier selection, and "Instant Guest Checkout" button.

---

## 4. Digital Commerce & Fulfillment Architecture

Complete architectural and transaction flow specifications are detailed in [PRD_PLAYGROUND_COMMERCE.md](specs/PRD_PLAYGROUND_COMMERCE.md). Summary of core rails:

1. **Guest Checkout Modal (`PlaygroundCheckoutModal`):**
   - Accessible `<Portal>` modal requiring only `Name` and `Email`.
   - Dynamic currency selector (INR via UPI/Cards, USD/EUR via International Cards).
   - Indian GST Letter of Undertaking (LUT) zero-rated export compliance for cross-border transactions.
   - Middleman referral attribution tracking (`?ref=partner_slug` cookie).
2. **Atomic Settlement & Webhook Idempotency:**
   - Timing-safe HMAC SHA-256 signature verification (`crypto.timingSafeEqual`).
   - Atomic conditional database transition (`WHERE status = 'pending'`) preventing race conditions between browser callbacks and Razorpay webhooks.
   - Strict 1-to-1 unique license constraint on `order_id`.
3. **Dual Fulfillment Rails:**
   - **Rail 1 (Direct Signed Binary):** 24-hour cryptographically signed download URL from private Supabase Storage bucket `playground-releases`.
   - **Rail 2 (Automated GitHub Access):** Scoped GitHub REST API trigger inviting the customer's GitHub handle as collaborator to the private template repository.
4. **Tokenized Guest Re-downloads:**
   - Permanent re-download magic link (`/api/playground/download?token=...&order=...`) for non-OAuth buyers, guarded by a max download quota.
5. **Client Dashboard Auto-Linking:**
   - When a customer logs into `/dashboard` with their purchasing email in the future, a dedicated "Digital Goods & Licenses" tab automatically unlocks.

---

## 5. Control Room & Publishing Workflow

Playground catalog items, pricing tiers, and binary distribution archives are managed directly from the **Streamlit Synchronizer** (`scripts/synchronizer.py` ➔ `scripts/sync_tabs/playground.py`):

1. **Metadata & Pricing Editing:** Live editing of titles, slugs, kinds, taxonomies, INR/USD pricing, and feature highlights.
2. **Digital Package Uploader:** Uploads `.zip` distribution packages to the private Supabase Storage bucket `playground-releases/{slug}/{filename}`.
3. **Real SHA-256 Hashing:** Automatically computes genuine SHA-256 checksums from binary byte streams—zero placeholder hashes.
4. **Dual-Persistence:** Atomically commits to live Supabase `playground_products` and local fallback `src/data/playgroundItems.json`, followed by automated Next.js cache revalidation (`/api/revalidate?tag=playground-items`).

---

## 6. Verification & Quality Gates

| Verification Gate | Command | Acceptance Standard |
|---|---|---|
| **TypeScript Typecheck** | `npx tsc --noEmit` | Clean run with 0 errors across all playground interfaces and schemas. |
| **Unit & Integration Tests** | `npm test` | All 97 test files pass, including `playground.test.ts` and `playground-commerce.test.ts`. |
| **Linting & Code Hygiene** | `npm run lint` | 0 ESLint warnings or errors; no unused variables or React hook warnings. |
| **Production Build** | `npm run build` | Successful Next.js static generation of `/playground` and all dynamic `/playground/[slug]` routes. |
| **Production Truth Audit** | Manual Inspection | 0 simulated CLIs (`setTimeout` logs), 0 fake customer testimonials, 0 empty-string checksums. |
