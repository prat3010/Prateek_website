---
id: AN_Tactile_Design_Rubric
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/1_frontend
  - security/public
  - domain/general
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../99_DECISIONS
  - ../99_DECISIONS
  - ../05_User_Experience_and_Interaction_Design
  - ../06_Adaptive_Identity_System
  - Route_home
---

# UI Architecture: `AN_Tactile_Design_Rubric` (Tactile Hardware Brutalism & Timeless Design Philosophies)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#design #tokens #tactile #hardware #rams #teenage-engineering #swiss #bauhaus

> **Comprehensive Architectural Design Rubric establishing physical hardware affordances, zero-glassmorphism, and elimination of fake neon halos across Adaptive Portfolio v2.**

- **Primary Token Definitions:** `src/app/globals.css`
- **Related ADR:** [ADR 46: Timeless Design Philosophies & Tactile Hardware Brutalism](../99_DECISIONS.md#adr-46-timeless-design-philosophies--tactile-hardware-brutalism-zero-glassmorphism--elimination-of-fake-neon-halos)

---

## 🏛️ The Four Foundational Design Philosophies

Adaptive Portfolio v2 rejects temporary web trends (watery glassmorphism, muddy translucent surfaces, and fake 50px neon blur clouds) in favor of four enduring design traditions:

### 1. Dieter Rams: 10 Principles of Good Design (Functional Honesty)
- **Principle**: Good design is honest and unobtrusive.
- **Application**: A digital control should not masquerade as a floating sheet of frosted shower glass. Form directly communicates function through clear contrast, solid surfaces, and visual stability.

### 2. Teenage Engineering: Tactile Hardware Brutalism
- **Principle**: High-density physical affordances, machined precision, and mechanical tactility.
- **Application**:
  - UI surfaces are modeled as physical hardware chassis (`--surface-hardware-chassis: #0E0E12`).
  - Switch tracks and segmented bays are physically recessed (`--surface-hardware-recessed: #0A0A0D` with inset shadow).
  - Active buttons and segmented items render as milled keycaps (`--surface-hardware-keycap: #1C1C22`).
  - Edges feature physical micro-bevels (`inset 0 1px 0 rgba(255, 255, 255, 0.08)`) instead of blurry external neon clouds.

### 3. Swiss / International Typographic Style (Objective Hierarchy)
- **Principle**: Extreme legibility, asymmetric mathematical grids, and content isolation.
- **Application**: Background content (skyline silhouettes, star fields, dot patterns) must never bleed into foreground text. Solid surfaces and crisp borders ensure that monospaced telemetry, code, and editorial typography achieve 100% WCAG AA contrast.

### 4. Bauhaus: Truth to Materials (*Materialgerechtigkeit*)
- **Principle**: Respect the inherent qualities of the medium without simulating unnatural physical artifacts.
- **Application**: Displays render discrete RGB subpixels. Removing heavy CSS `backdrop-filter` eliminate compositor jank, saving GPU memory and guaranteeing 60fps smooth scrolling with zero frame drops.

---

## 🎨 Dual-Theme Visual Parity Architecture

The design system enforces strict visual symmetry between two distinct communication personalities:

| Dimension | **Azure Theme (Ligne Claire / Pop Art)** | **Noir Theme (Tactical Hardware / Cyber-Editorial)** |
| :--- | :--- | :--- |
| **Material Metaphor** | Vintage comic print paper (`#F7F2E8`), heavy black ink lines | Machined matte obsidian (`#08080A`), milled ABS plastic |
| **Chassis Surface** | Solid warm white paper (`var(--pop-white)`) | Deep obsidian chassis (`#0E0E12`) |
| **Recessed Bay** | Warm cream recessed track (`var(--pop-cream)`) | Matte dark switch bay (`#0A0A0D`, inset shadow) |
| **Active Keycap** | Crisp pop keycap (`var(--pop-yellow)` / white) | Milled tactile keycap (`#1C1C22`, active `#24242C`) |
| **Border Affordance** | 1.5px to 2px crisp ink border (`var(--color-border)`) | 1px precision hairline (`rgba(255, 255, 255, 0.12)`) |
| **Depth & Shadow** | Solid comic drop shadow (`var(--shadow-comic)`) | Directional drop shadow + top micro-bevel (`inset 0 1px 0`) |
| **Accent Illumination** | Bold primary ink fills (blue, red, yellow) | Crisp pinpoint LED indicators (zero outer halo blur) |

---

## 🛡️ Non-Negotiable Architectural Invariants

1. **Zero-Glassmorphism Invariant**: `backdrop-filter` is completely forbidden across all `src/` stylesheets. All containers, modals, and toolbars must render on solid, opaque physical surfaces.
2. **Zero Fake Neon Halo Invariant**: All `--neon-*-glow` CSS variables are zeroed (`none`). Outer fuzzy box-shadows (`box-shadow: 0 0 15px ...`) and text-shadow halos are prohibited. Depth must be achieved via directional drop shadows (`0 4px 16px rgba(0,0,0,0.6)`) and internal micro-bevels.
3. **Semantic Hardware Token Invariant**: Components must consume `--surface-hardware-*` tokens from `src/app/globals.css` rather than declaring ad-hoc raw hex values.
4. **Theme Parity Invariant**: Every feature or UI component must look equally polished and intentional in both Azure and Noir modes.

---

## 🔗 Related Architecture & Cross-References
- [ADR 46: Timeless Design Philosophies & Tactile Hardware Brutalism](../99_DECISIONS.md#adr-46-timeless-design-philosophies--tactile-hardware-brutalism-zero-glassmorphism--elimination-of-fake-neon-halos)
- [05_User_Experience_and_Interaction_Design](../05_User_Experience_and_Interaction_Design.md)
- [06_Adaptive_Identity_System](../06_Adaptive_Identity_System.md)
- [Route: /](Route_home.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

