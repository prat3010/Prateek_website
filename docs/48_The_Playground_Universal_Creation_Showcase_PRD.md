# 48. The Playground: Universal Creation & Innovation Showcase PRD

**Document Version:** `v1.0.0`  
**Status:** `PRODUCTION`  
**Authors:** Prateek Sharma & Antigravity  
**Domain Surface:** `prateeq.in/playground` & `prateeq.in/playground/[slug]`  
**Target Invariant:** Zero-Bloat Polymorphic Architecture, User-Activated Game Gate (0ms TBT), 100/100 Core Web Vitals, 3-Tier Zero-Cost Hosting  

---

## 1. Executive Summary & Product Vision

### 1.1 The Problem
Historically, interactive engineering creations—such as retro arcade games (Snake, 2D Pathfinder Lab, Matrix Rain, Three.js Subway Pizza Rat), experimental computer vision tools (GestureScroll), and prompt engineering showcases—were crammed inside the text-based diagnostics console at `/terminal` or relegated to static project cards. This created three core problems:
1. **Terminal Clutter:** The diagnostics console became burdened with heavy interactive games and graphical canvas loops, obscuring system diagnostics, QR billing, and CLI scoping commands.
2. **Category Rigidity:** Legacy project grids only accommodated traditional commercial client projects, lacking first-class support for vibe-coded Micro-SaaS tools, generative AI art with prompt engineering parameters, or interactive cognitive prototypes.
3. **Core Web Vitals & Bundle Penalty:** Pre-loading WebGL runtimes, physics loops, and game canvases directly in landing layouts degraded initial page load and Total Blocking Time (TBT).

### 1.2 The Solution: The Playground
**The Playground** is a dedicated, polymorphic creative laboratory hosted at `/playground` and dynamic runner at `/playground/[slug]`. It provides:
- **Polymorphic Showcase:** Unifies 5 creation categories (`saas`, `interactive-toy`, `generative-media`, `cognitive-tool`, `experiment`) under a single TypeScript registry ([`src/data/playgroundItems.ts`](../src/data/playgroundItems.ts)).
- **User-Activated Game Gate:** Defers game canvas initialization until the user clicks "Launch", preserving 0ms TBT and 100/100 Core Web Vitals.
- **Arcade Cabinet Shell:** Delivers nostalgic retro gaming with toggleable CRT scanlines, 8-bit sound synthesizer audio, controls HUD, and Fullscreen API.
- **Prompt Engineering Studio:** High-resolution image/video exhibition with 1-click clipboard prompt copying, negative prompt inspection, and generation parameter telemetry (model, steps, CFG scale, seed, aspect ratio).
- **Cognitive Intelligence Lab:** Direct live chat with the Retriever AI engine on Oracle Cloud VPS (`https://rag.prateeq.in`) via dedicated rate-limited proxy (`/api/playground/chat`).
- **3-Tier Hosting Architecture:** 100% free hosting using existing Vercel Hobby + Oracle Cloud VPS, with a pre-configured Content Security Policy (CSP) for zero-friction Cloudflare Pages expansion under `playground.prateeq.in`.

---

## 2. Architecture & Data Model

### 2.1 Polymorphic Registry Schema

All playground items are defined in `src/data/playgroundItems.ts`:

```typescript
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
```

### 2.2 Category-Specific Interfaces
- **`SaasPlaygroundItem`:** `appUrl`, `isEmbeddable`, `pricingModel`, `techStack`, `githubUrl`, `highlights`.
- **`InteractiveToyPlaygroundItem`:** `renderMode` (`'native' | 'iframe'`), `componentName`, `iframeUrl`, `controlsGuide`, `soundSupported`, `hasLeaderboard`, `terminalCommands`, `difficulty`.
- **`GenerativeMediaPlaygroundItem`:** `mediaType` (`'image' | 'video'`), `mediaUrl`, `thumbnailUrl`, `model`, `prompt`, `negativePrompt`, `parameters` (aspectRatio, seed, cfgScale, steps), `resolution`.
- **`CognitiveToolPlaygroundItem`:** `backendEngine`, `apiEndpoint`, `capabilities`, `terminalCommands`.
- **`ExperimentPlaygroundItem`:** `experimentType`, `techStack`, `githubUrl`.

---

## 3. UI Systems & Viewing Environments

### 3.1 The Catalog Grid (`/playground`)
- **Real-Time Client Filtering:** Instantaneous substring search against title, tagline, tags, prompt text, and model.
- **Category Tabs:** Pill selector with dynamic item counts for quick segmentation.
- **Adaptive Cards:**
  - `SaasCard`: Status badge, feature bullets, launch link, source repository.
  - `ToyCard`: Difficulty pill, 8-bit audio badge, leaderboard indicator, Play CTA.
  - `MediaCard`: Generation thumbnail, model pill, prompt hover preview, 1-click prompt copy lightbox trigger.
  - `CognitiveCard`: Pipeline capabilities, Oracle VPS badge, intelligence lab launcher.
  - `ExperimentCard`: Technology stack chips, active floating dock indicator.
- **Prompt Engineering Lightbox:** Mounted via `<Portal>` to escape CSS containing blocks (`ScrollSection` ADR 05).

### 3.2 The Arcade Cabinet Runner (`/playground/[slug]`)
- **Cabinet Bezel:** Brushed dark metallic frame with neon accents responsive to Azure and Noir themes.
- **CRT Shader:** Pure CSS scanline overlay toggled by user preference.
- **Web Audio 8-Bit Synthesizer:** Direct toggle for retro procedural audio effects (`src/lib/terminalAudio.ts`).
- **Fullscreen API:** Container-level fullscreen expansion supporting keyboard navigation (ESC to exit).
- **Lenis Smooth Scroll Isolation:** Canvas stage tagged with `data-lenis-prevent` to prevent Lenis from intercepting arrow keys or touch gestures.

---

## 4. Hosting & Scalability Infrastructure

### 4.1 The 3-Tier Hosting Rule
| Tier | Asset Payload | Hosting Surface | Integration Pattern | Cost |
|---|---|---|---|---|
| **Tier 1 (Default)** | `< 10 MB` | Vercel Next.js 16 Native | Dynamic React Chunk (`renderMode: 'native'`) | **$0** (Vercel Hobby) |
| **Tier 2 (Drop-in)** | `< 20 MB` | `public/playground/apps/[slug]/` | Sandboxed Iframe (`renderMode: 'iframe'`) | **$0** (Vercel Hobby) |
| **Tier 3 (Heavy WASM/3D)** | `> 20 MB` | Cloudflare Pages (`playground.prateeq.in`) | Edge-Cached Iframe (`renderMode: 'iframe'`) | **$0** (Unlimited CF Pages) |

### 4.2 Security & Content Security Policy (CSP)
In `next.config.ts`, the Content Security Policy is hardened:
```ts
frame-src 'self' https://playground.prateeq.in https://*.pages.dev;
```
Root domain clickjacking is blocked via `frame-ancestors 'none'`, while the portfolio can securely embed its own subdomains and Cloudflare Pages builds.

### 4.3 Proxy Telemetry Exclusions
In `src/proxy.ts`, the telemetry matcher explicitly excludes `/playground/assets/` and `/playground/apps/` from triggering unnecessary Supabase `page_visits` writes, preserving database connection pools.

---

## 5. Dedicated Cognitive Route (`/api/playground/chat`)

- **Sliding-Window Rate Limiting:** 20 requests/minute per client IP via `src/lib/rateLimit.ts` (Upstash Redis with thread-safe in-memory fallback).
- **Oracle Cloud VPS Proxy:**
  - Upstream URL: `https://rag.prateeq.in/v1/tenants/6797e2c8-745a-4bd1-aa4c-3854b8d79c22/chat/completions`
  - Authentication: Server-side Bearer token injection (secrets never leak to client).
  - Telemetry: Returns reply content, bracket citations, and `x-cache-lookup` (HIT/MISS) status.

---

## 6. Verification & Quality Gates

- **Unit Tests:** `src/lib/__tests__/playground.test.ts` asserts slug uniqueness, schema validity, and helper resolution across all items.
- **Static Types:** `npx tsc --noEmit` verifies strict TypeScript conformance.
- **Linting:** `npm run lint` asserts zero ESLint errors and zero unused variable warnings.
- **Production Build:** Static pre-rendering verified via Next.js Turbopack (`npm run build`).
