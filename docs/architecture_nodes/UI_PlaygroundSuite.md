---
id: UI_PlaygroundSuite
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/components/playground/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/playground/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/playground/"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/1_frontend
  - security/public
  - domain/ui
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - Route_playground
  - ../48_The_Playground_Universal_Creation_Showcase_PRD
  - ../99_DECISIONS
---

# UI: `PlaygroundSuite` (The Playground Component Suite)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/playground/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/playground/)**

#ui #frontend #playground #arcade #lightbox

> **Component Ecosystem for Catalog Grid, Retro Arcade Cabinet, Prompt Lightbox & Item Adapters.**

- **Path:** `src/components/playground/`
- **Key Components:**
  - `PlaygroundGrid.tsx`: Master catalog with real-time search and category filter pills.
  - `ArcadeCabinetShell.tsx`: Retro gaming frame with CRT scanlines, 8-bit sound synthesizer audio, and User-Activated Game Gate.
  - `MediaPromptLightbox.tsx`: Prompt inspection and 1-click clipboard copy modal using `<Portal>` to escape `ScrollSection` containing block traps (ADR 05).
  - Category Cards: `SaasCard.tsx`, `ToyCard.tsx`, `MediaCard.tsx`, `CognitiveCard.tsx`, `ExperimentCard.tsx`.
  - Adapters: `PlaygroundSnake.tsx`, `PlaygroundPathfinder.tsx`, `PlaygroundPizzaRat.tsx`, `PlaygroundMatrixRain.tsx`, `PlaygroundNeuralDossier.tsx`.
  - Lenis scroll isolation via `data-lenis-prevent`.

---

## 🔗 Related Architecture & Cross-References
- [Route: playground](Route_playground.md)
- [48_The_Playground_Universal_Creation_Showcase_PRD](../48_The_Playground_Universal_Creation_Showcase_PRD.md)
- [ADR 45: Playground & Arcade Cabinet Architecture](../99_DECISIONS.md#adr-45-the-playground--polymorphic-creation-showcase-arcade-cabinet-shell-and-cloudflare-pages-3-tier-hosting)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

