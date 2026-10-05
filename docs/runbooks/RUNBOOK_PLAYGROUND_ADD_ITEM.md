# 🕹️ Architecture Runbook: Adding a Project, Game, or SaaS to The Playground

**Objective:** Standard Operating Procedure (SOP) for adding any new creation—Micro-SaaS product, retro arcade game, generative AI prompt showcase, or Retriever cognitive tool—to **The Playground** (`/playground` and `/playground/[slug]`).

Future autonomous AI agents and pair-programmers MUST follow this runbook whenever the developer asks to *"add a new game"*, *"showcase a new SaaS"*, *"share an AI prompt/artwork"*, or *"add an interactive toy"*.

---

## 🏛️ System Architecture Overview

The Playground replaces ad-hoc terminal clutter and legacy project grids with a unified, polymorphic showcase.

| Component | File Path | Purpose |
|---|---|---|
| **Single Source of Truth (SSoT)** | `src/data/playgroundItems.ts` | Polymorphic TypeScript registry for all items |
| **Catalog Showcase Grid** | `src/app/playground/page.tsx` | Search, filter pills, adaptive responsive cards |
| **Dynamic Runner Route** | `src/app/playground/[slug]/page.tsx` | Arcade cabinet shell, media inspector, SaaS preview |
| **Arcade Cabinet Shell** | `src/components/playground/viewers/ArcadeCabinetShell.tsx` | Retro bezel, CRT scanlines, 8-bit sound synthesizer, fullscreen |
| **Prompt Engineering Lightbox** | `src/components/playground/viewers/MediaPromptLightbox.tsx` | 1-click prompt copier, negative prompt, generation parameters |
| **Retriever AI Chat Proxy** | `src/app/api/playground/chat/route.ts` | Rate-limited bridge to Oracle Cloud VPS (`https://rag.prateeq.in`) |

---

## 🌐 Hosting & Bandwidth Tiers (Zero Unnecessary Signups)

100% of current projects are hosted comfortably on the existing **free Vercel Hobby tier** + **free Oracle Cloud VPS (`rag.prateeq.in`)**. No new accounts or billing setups are required.

When choosing where to place a new project's assets, apply the 3-Tier Rule:

### Tier 1: Native Next.js Component (Default for < 10 MB)
- **Best For:** React canvas games (Snake, Pathfinder, Tetris), Three.js WebGL shaders, Tailwind/CSS tools, forms.
- **Location:** `src/components/playground/items/Playground<Name>.tsx`.
- **Render Mode:** `renderMode: 'native'`.
- **Bandwidth Impact:** Zero extra requests (bundled into Next.js dynamic chunks).

### Tier 2: Static Drop-in Asset (< 20 MB)
- **Best For:** Self-contained HTML5 builds, Phaser engines, Godot Web exports under 20 MB.
- **Location:** `public/playground/apps/<slug>/index.html`.
- **Render Mode:** `renderMode: 'iframe'` with `iframeUrl: '/playground/apps/<slug>/index.html'`.
- **Note:** `src/proxy.ts` automatically excludes `/playground/assets/` and `/playground/apps/` from triggering Supabase `page_visits` telemetry.

### Tier 3: Cloudflare Pages for Heavy WASM / WebGL Builds (> 20 MB)
- **Best For:** Large 3D engines, Unity WebGL, Unreal HTML5, or heavy asset packs that exceed 20 MB.
- **Why Cloudflare Pages?** Unlimited free bandwidth, 25 MB file sizes, global edge caching.
- **Domain Configuration:**
  - Build deployed to Cloudflare Pages.
  - Custom domain mapped to: **`playground.prateeq.in`** (or `subdomain.pages.dev`).
  - `next.config.ts` Content Security Policy (CSP) is **ALREADY PRE-CONFIGURED** with:
    ```ts
    frame-src 'self' https://playground.prateeq.in https://*.pages.dev;
    ```
- **Registration in Code:**
  ```ts
  {
    id: 'heavy-game-slug',
    slug: 'heavy-game',
    kind: 'interactive-toy',
    renderMode: 'iframe',
    iframeUrl: 'https://playground.prateeq.in/heavy-game',
    // ...
  }
  ```
  *(Zero backend or frontend code changes required! Just point the URL in `playgroundItems.ts`)*.

---

## 🛠️ Step-by-Step Recipes

### 🎮 Recipe A: Adding an Interactive Game / Toy
1. **Create the component adapter:**
   Create `src/components/playground/items/Playground<GameName>.tsx`:
   ```tsx
   'use client';
   import React from 'react';

   export default function PlaygroundMyGame() {
     return (
       <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         {/* Game Canvas or Logic */}
       </div>
     );
   }
   ```
2. **Register the item in `src/data/playgroundItems.ts`:**
   ```ts
   {
     id: 'toy-my-game',
     slug: 'my-game',
     title: 'My Retro Game',
     tagline: 'A fast-paced 60fps arcade game vibe-coded in React.',
     description: 'Detailed description of gameplay, engine, and lore.',
     kind: 'interactive-toy',
     renderMode: 'native',
     componentName: 'PlaygroundMyGame',
     controlsGuide: [
       { key: 'W/A/S/D', label: 'Movement' },
       { key: 'SPACE', label: 'Fire' },
     ],
     soundSupported: true,
     hasLeaderboard: false,
     tags: ['React Canvas', 'Retro Arcade', 'Vibe-Coded'],
     terminalCommands: ['mygame', 'play-mygame'],
     vibeCodedDate: '2026-10-04',
   }
   ```
3. **Mount in runner `src/app/playground/[slug]/page.tsx`:**
   Add the component check inside `if (item.kind === 'interactive-toy')`:
   ```tsx
   toy.componentName === 'PlaygroundMyGame' ? (
     <PlaygroundMyGame />
   ) : ...
   ```
4. **(Optional) Add Terminal shortcut:**
   In `src/components/ui/useTerminalCommands.ts`, add:
   ```ts
   case 'mygame':
     return {
       lines: [
         { text: '🎮 Launching My Retro Game in Playground...', type: 'info' },
         { text: 'Link: /playground/my-game', type: 'link', url: '/playground/my-game' },
       ],
     };
   ```

---

### 🚀 Recipe B: Adding a Micro-SaaS App or Prototype
1. **Register the item in `src/data/playgroundItems.ts`:**
   ```ts
   {
     id: 'saas-my-tool',
     slug: 'my-tool',
     title: 'CloudCost Estimator',
     tagline: 'Instant AWS vs GCP vs Hetzner infrastructure pricing analyzer.',
     description: 'A full-stack Micro-SaaS that calculates real-time multi-cloud egress and compute pricing with zero authentication required.',
     kind: 'saas',
     appUrl: 'https://cost.prateeq.in', // or internal route '/tools/cost'
     isEmbeddable: false,
     pricingModel: 'Free',
     techStack: ['Next.js 16', 'Tailwind', 'Cloudflare Workers'],
     githubUrl: 'https://github.com/prat3010/cloud-cost',
     highlights: [
       'Real-time egress rate matrices across 14 regions',
       'Single-click JSON invoice export',
     ],
     tags: ['Micro-SaaS', 'Cloud FinOps', 'Next.js'],
     vibeCodedDate: '2026-10-04',
   }
   ```
2. The catalog card (`SaasCard.tsx`) and dynamic page (`/playground/[slug]`) will automatically generate the status badge, feature highlights, tech pills, and launch buttons.

---

### 🎨 Recipe C: Adding AI Generative Art / Videos & Prompts
1. Save thumbnail/preview to `public/images/<image-name>.webp` (or provide external CDN URL).
2. **Register in `src/data/playgroundItems.ts`:**
   ```ts
   {
     id: 'art-cyber-samurai',
     slug: 'cyber-samurai',
     title: 'Neo-Tokyo Ronin at Dawn',
     tagline: 'Photorealistic cyberpunk portrait generated with Flux.1 Schnell.',
     description: 'Volumetric cinematic lighting through holographic neon signage reflecting off carbon-fiber armor plating.',
     kind: 'generative-media',
     mediaType: 'image',
     mediaUrl: '/images/cyber-samurai.webp',
     thumbnailUrl: '/images/cyber-samurai.webp',
     model: 'Flux.1 Schnell',
     prompt: 'cinematic medium shot of cybernetic ronin standing on rain-slicked balcony overlooking Neo-Tokyo skyline, holographic signs casting magenta and cyan rim light, carbon fiber armor weave, 8k resolution, Leica M11 50mm f/1.2 lens',
     negativePrompt: 'blurry, oversaturated, cartoon, extra limbs',
     parameters: {
       aspectRatio: '16:9',
       seed: 88492019,
       steps: 28,
       cfgScale: 4.5,
     },
     resolution: '3840x2160',
     tags: ['Flux.1', 'Cyberpunk', 'Cinematic Photography'],
     vibeCodedDate: '2026-10-04',
   }
   ```
3. Clicking the card in `/playground` opens the **MediaPromptLightbox** with 1-click prompt copying. Navigating to `/playground/cyber-samurai` renders the full-resolution studio showcase.

---

### 🧠 Recipe D: Adding a Retriever Cognitive AI App
1. When connecting to Oracle Cloud VPS (`https://rag.prateeq.in` at `130.210.35.134`), proxy all chat queries through `/api/playground/chat`.
2. The proxy handles sliding-window rate limiting (20 requests/minute per client IP) and injects the portfolio API key securely without exposing secrets to the browser.
3. Register the item under `kind: 'cognitive-tool'` with `backendEngine: 'retriever-oracle'`.

---

## 🔒 Security & Performance Checklist
Before committing any changes:
- [ ] **CSS Containing Block:** Any modal or full-screen overlay must use `<Portal>` (`src/components/ui/Portal.tsx`) to avoid being trapped by `ScrollSection`'s `will-change: transform` (ADR 05).
- [ ] **Lenis Smooth Scroll:** Any canvas, scrollable table, or game viewport must include `data-lenis-prevent` to prevent Lenis smooth scroll from intercepting arrow keys or gestures.
- [ ] **No Secrets in Client:** Never hardcode Supabase `SERVICE_ROLE_KEY` or Retriever master admin keys into client components.
- [ ] **Run Quality Verification:**
  ```bash
  npx tsc --noEmit
  npm test
  npm run lint
  ```
