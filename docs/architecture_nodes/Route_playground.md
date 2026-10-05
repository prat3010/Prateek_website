---
id: Route_playground
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/app/playground/page.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/playground/page.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/playground/page.tsx"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/1_frontend
  - security/public
  - domain/portfolio
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../48_The_Playground_Universal_Creation_Showcase_PRD
  - ../99_DECISIONS
  - ../runbooks/RUNBOOK_PLAYGROUND_ADD_ITEM
  - UI_PlaygroundSuite
  - Route_api_playground_chat
  - Route_terminal
---

# Route: `/playground` & `/playground/[slug]` (The Playground)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/playground/page.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/playground/page.tsx)**

#route #frontend #playground #arcade #saas #ai

> **Universal Creation & Innovation Showcase, Retro Arcade Cabinet Shell & AI Prompt Engineering Lightbox.**

- **Path:** `src/app/playground/page.tsx` & `src/app/playground/[slug]/page.tsx`
- **Key Features:**
  - Polymorphic Single Source of Truth (`src/data/playgroundItems.ts`) supporting 5 kinds: `saas`, `interactive-toy`, `generative-media`, `cognitive-tool`, `experiment`.
  - User-Activated Game Gate in `ArcadeCabinetShell.tsx` (0ms initial TBT, 100/100 Core Web Vitals).
  - CRT scanlines shader, 8-bit Web Audio synthesizer, controls guide HUD, and Fullscreen API.
  - Generative AI Media Prompt Lightbox with 1-click clipboard copier and parameter inspection (`<Portal>` containing block escape).
  - Dedicated Cognitive AI chat route proxy (`/api/playground/chat`) to Oracle Cloud VPS.
  - 3-Tier Hosting Architecture: Vercel Native, Static Drop-in, and Cloudflare Pages under `playground.prateeq.in`.

---

## 🔗 Related Architecture & Cross-References
- [48_The_Playground_Universal_Creation_Showcase_PRD](../48_The_Playground_Universal_Creation_Showcase_PRD.md)
- [ADR 45: Playground & Arcade Cabinet Architecture](../99_DECISIONS.md#adr-45-the-playground--polymorphic-creation-showcase-arcade-cabinet-shell-and-cloudflare-pages-3-tier-hosting)
- [SOP Runbook: Adding an Item to Playground](../runbooks/RUNBOOK_PLAYGROUND_ADD_ITEM.md)
- [UI: PlaygroundSuite](UI_PlaygroundSuite.md)
- [Route: api/playground/chat](Route_api_playground_chat.md)
- [Route: terminal](Route_terminal.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

