# 🕹️ Architecture Runbook: Adding a Project, Game, or Micro-SaaS to The Playground

**Objective:** Standard Operating Procedure (SOP) for registering, packaging, and publishing any creation—free interactive arcade game, generative AI prompt showcase, Retriever cognitive tool, or commercial Micro-SaaS codebase—to **The Playground** (`/playground` and `/playground/[slug]`).

Future autonomous AI agents and pair-programmers MUST follow this runbook whenever the developer asks to *"add a new game"*, *"publish a new SaaS product"*, *"share an AI prompt/artwork"*, or *"package a downloadable code template"*.

---

## 🏛️ System Architecture Overview

The Playground operates as a dual-engine platform: a free viral interactive laboratory and a production-truth commercial digital goods store.

| Component | File Path | Purpose |
|---|---|---|
| **Master Publishing Control Plane** | `scripts/sync_tabs/playground.py` | Streamlit Synchronizer tab for metadata, pricing, ZIP uploads & SHA-256 hashing |
| **Database & Private Storage** | Supabase `playground_products` & `playground-releases` | Cloud database records and private encrypted package archives |
| **Local Fallback SSoT** | `src/data/playgroundItems.json` & `playgroundItems.ts` | Local JSON catalog and polymorphic TypeScript interfaces |
| **Component Registry** | `src/components/playground/registry.ts` | Dynamic code-splitting registry mapping component names to client runtimes |
| **Catalog Showcase Grid** | `src/app/playground/page.tsx` & `PlaygroundGrid.tsx` | Search, 4-tier taxonomy filter pills, adaptive responsive cards |
| **Dynamic Runner Route** | `src/app/playground/[slug]/page.tsx` | Arcade cabinet shell, media inspector, architecture stage, and commercial runner |
| **Arcade Cabinet Shell** | `src/components/playground/viewers/ArcadeCabinetShell.tsx` | Retro bezel, CRT scanlines, 8-bit sound synthesizer, fullscreen |
| **Authentic Architecture Stage** | `src/components/playground/PlaygroundArchitectureStage.tsx` | Verifiable quickstart guide (`./launch.sh`), repo file tree, and system specs |
| **Prompt Engineering Lightbox** | `src/components/playground/viewers/MediaPromptLightbox.tsx` | 1-click prompt copier, negative prompt, generation parameters (<Portal> escape) |
| **Guest Checkout Modal** | `src/components/playground/PlaygroundCheckoutModal.tsx` | Frictionless guest checkout (Name + Email + Razorpay UPI/Cards/LUT-export) |
| **Digital Fulfillment Engine** | `/api/playground/checkout/*` & `/api/playground/download` | Concurrency-safe atomic settlement, perpetual licensing, tokenized re-downloads |

---

## 🛠️ Publishing Standard Operating Procedures

### 🌟 Primary Publishing Path: The Streamlit Synchronizer (Recommended)

Always prefer the Streamlit Synchronizer dashboard for managing catalog items and uploading release assets:

1. Launch the Synchronizer:
   ```bash
   streamlit run scripts/synchronizer.py
   ```
2. Navigate to **`🎮 Playground & Micro-SaaS`** in the navigation sidebar.
3. Choose **`➕ Publish New Micro-SaaS Product`** or select an existing item to edit.
4. Fill in metadata, taxonomy classification, and tech stack tags.
5. If publishing a commercial digital good:
   - Check **`Is Commercial Product (Requires Payment)`**.
   - Set Base Price in **INR (₹)** and **USD ($)**.
   - Configure multi-tier licensing JSON if offering multiple tiers (e.g. Developer License vs Team/Agency License).
   - Upload the distribution `.zip` archive via the file uploader. The synchronizer automatically streams the package to private bucket `playground-releases/{slug}/{filename}`, calculates the authentic SHA-256 hash, and sets the file size.
6. Click **`💾 Save & Sync to Supabase + JSON`**.
   - This atomically commits to Supabase table `playground_products`, writes `src/data/playgroundItems.json`, and triggers Next.js cache revalidation via `/api/revalidate?tag=playground-items`.

---

### 🎮 Recipe A: Adding a Free Interactive Game / Toy

1. **Create the native canvas component:**
   Create `src/components/playground/items/Playground<GameName>.tsx`:
   ```tsx
   'use client';
   import React from 'react';
   import type { PlaygroundComponentProps } from '@/components/playground/registry';

   export default function PlaygroundMyGame({ item }: PlaygroundComponentProps) {
     return (
       <div 
         data-lenis-prevent 
         style={{ width: '100%', height: '100%', position: 'relative' }}
       >
         {/* Canvas / WebGL context mounted here */}
       </div>
     );
   }
   ```
   *Note: Always add `data-lenis-prevent` to the root container to isolate keyboard navigation (arrow keys/WASD) from page scroll listeners.*

2. **Register the component in the registry:**
   In `src/components/playground/registry.ts`, register the dynamic import:
   ```typescript
   export const PLAYGROUND_COMPONENT_REGISTRY: Record<string, ComponentType<PlaygroundComponentProps>> = {
     // ... existing entries
     PlaygroundMyGame: dynamic(
       () => import('@/components/playground/items/PlaygroundMyGame'),
       { ssr: false, loading: LoadingSkeleton }
     ),
   };
   ```

3. **Register the item via Streamlit Synchronizer or `playgroundItems.json`:**
   ```json
   {
     "id": "toy-my-game",
     "slug": "my-game",
     "title": "My Retro Game 2088",
     "tagline": "A fast-paced 60fps arcade game vibe-coded in React.",
     "description": "Detailed description of gameplay, engine, and lore.",
     "kind": "interactive-toy",
     "taxonomy": "toys-and-games",
     "isCommercial": false,
     "renderMode": "native",
     "componentName": "PlaygroundMyGame",
     "controlsGuide": [
       { "key": "W/A/S/D", "label": "Directional Movement" },
       { "key": "SPACE", "label": "Fire Primary Weapon" }
     ],
     "soundSupported": true,
     "hasLeaderboard": false,
     "tags": ["HTML5 Canvas", "Retro Arcade", "Web Audio API"],
     "terminalCommands": ["mygame", "play"],
     "vibeCodedDate": "2026-11-09",
     "status": "live"
   }
   ```

---

### 📦 Recipe B: Adding a Commercial Micro-SaaS or Codebase Product

1. **Prepare the distribution package:**
   - Build and bundle the real source code, Docker Compose files, documentation, and starter scripts into a clean archive:
     ```bash
     zip -r release-v1.0.0.zip . -x "node_modules/*" ".git/*" ".env" "__pycache__/*"
     ```
   - Compute the real cryptographic SHA-256 hash:
     ```bash
     sha256sum release-v1.0.0.zip
     ```
     *(Zero placeholder hashes allowed: the hash must match the actual file bytes).*

2. **Publish the product via the Synchronizer or `playgroundItems.json`:**
   ```json
   {
     "id": "saas-my-tool",
     "slug": "my-tool",
     "title": "CloudCost Estimator Pro",
     "tagline": "Autonomous multi-cloud infrastructure pricing analyzer & FinOps engine.",
     "description": "Full-stack Micro-SaaS that calculates real-time multi-cloud egress and compute pricing with zero simulated data.",
     "kind": "saas",
     "taxonomy": "commercial",
     "isCommercial": true,
     "priceINR": 2499,
     "priceUSD": 29,
     "pricingModel": "Commercial Release + Open Core",
     "pricingTiers": [
       {
         "id": "developer-license",
         "title": "Developer Source Code License",
         "name": "Developer Source Code License",
         "priceINR": 2499,
         "priceUSD": 29,
         "licenseType": "commercial_single",
         "downloadKey": "my-tool/release-v1.0.0.zip",
         "features": [
           "Full production source code with MIT-commercial license",
           "1-click native launcher (./launch.sh) and Docker Compose",
           "Perpetual updates & tokenized guest re-downloads"
         ]
       },
       {
         "id": "agency-license",
         "title": "Agency & Team Distribution License",
         "name": "Agency & Team Distribution License",
         "priceINR": 7999,
         "priceUSD": 99,
         "licenseType": "commercial_team",
         "downloadKey": "my-tool/release-team-v1.0.0.zip",
         "features": [
           "Unlimited developer seats across organization",
           "White-label client presentation mode",
           "Direct GitHub collaborator private repository invite"
         ]
       }
     ],
     "componentName": null,
     "appUrl": "/playground/my-tool",
     "githubUrl": "https://github.com/prat3010/my-tool",
     "githubRepoSource": "prat3010/my-tool",
     "techStack": ["Next.js 16", "TypeScript", "FastAPI", "Docker"],
     "highlights": [
       "Real-time egress rate matrices across 14 cloud regions",
       "Single-click JSON/PDF invoice export",
       "Containerized Docker Compose multi-service architecture"
     ],
     "downloadPackageKey": "my-tool/release-v1.0.0.zip",
     "fileSize": "14.2 MB",
     "checksumSha256": "8a4f91b...",
     "version": "1.0.0",
     "licenseType": "commercial_single",
     "tags": ["Micro-SaaS", "FinOps", "FastAPI", "Docker"],
     "vibeCodedDate": "2026-11-09",
     "status": "live"
   }
   ```
   *(Setting `componentName: null` automatically activates the authentic `PlaygroundArchitectureStage`, presenting genuine quickstart commands, architecture trees, and system requirements).*

---

### 🎨 Recipe C: Adding AI Generative Media & Prompts

1. Save optimized WebP image/video to `public/images/playground/<image-name>.webp`.
2. Register item in Synchronizer or `playgroundItems.json`:
   ```json
   {
     "id": "art-cyber-samurai",
     "slug": "cyber-samurai",
     "title": "Neo-Tokyo Ronin at Dawn",
     "tagline": "Photorealistic cyberpunk portrait generated with Flux 1.1 Pro.",
     "description": "Volumetric cinematic lighting through holographic neon signage reflecting off carbon-fiber armor plating.",
     "kind": "generative-media",
     "taxonomy": "toys-and-games",
     "isCommercial": false,
     "mediaType": "image",
     "mediaUrl": "/images/playground/cyber-samurai.webp",
     "thumbnailUrl": "/images/playground/cyber-samurai.webp",
     "previewImage": "/images/playground/cyber-samurai.webp",
     "model": "Flux 1.1 Pro",
     "prompt": "cinematic medium shot of cybernetic ronin standing on rain-slicked balcony overlooking Neo-Tokyo skyline...",
     "negativePrompt": "blurry, oversaturated, cartoon, extra limbs",
     "parameters": {
       "aspectRatio": "16:9",
       "seed": 88492019,
       "steps": 28,
       "cfgScale": 4.5,
       "sampler": "Euler A"
     },
     "resolution": "3840x2160 (4K UHD)",
     "tags": ["Flux 1.1 Pro", "Cyberpunk", "Cinematic Photography"],
     "vibeCodedDate": "2026-11-09",
     "metricsBadge": "FLUX 1.1 PRO",
     "status": "live"
   }
   ```

---

## 🔒 Security & Quality Verification Checklist

Before committing changes:
- [ ] **No Simulated CLIs:** Zero `setTimeout` loops spitting fake compile logs. Genuine shell commands only.
- [ ] **No Fake Reviews or Testimonials:** Zero fabricated metrics or synthetic customer quotes.
- [ ] **Real SHA-256 Hashes:** Cryptographic hashes must match genuine binary bytes.
- [ ] **CSS Containing Block:** Any modal or full-screen overlay must use `<Portal>` to escape `ScrollSection` containing block traps (ADR 05).
- [ ] **Lenis Scroll Isolation:** Any canvas or game stage must include `data-lenis-prevent` (ADR 47).
- [ ] **Run Quality Verification:**
  ```bash
  npx tsc --noEmit
  npm test
  npm run lint
  ```
