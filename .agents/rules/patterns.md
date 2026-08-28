# Primary Architectural Patterns & Enforced Conventions

> **Source:** Extracted & Learned Codebase Conventions for `Prateek_website`  
> **Status:** Active & Enforced Across All Agents & Developers

---

### 1. Vanilla CSS Modules Co-location
- **Rule:** Use co-located CSS modules (`src/components/{ComponentName}/{ComponentName}.module.css`) for styling components.
- **Constraint:** Do not add Tailwind CSS utilities or ad-hoc inline styles unless explicitly requested. Always reference CSS variables from the global design system (e.g. `var(--font-...)`, `var(--color-...)`).

### 2. ScrollSection Containing Block & `<Portal>` Rendering
- **Rule:** `ScrollSection` wraps page sections in `m.div` with `will-change: transform` and `translateY` parallax, creating a CSS containing block that traps `position: fixed` elements.
- **Constraint:** Any modal, popover, tooltip, overlay, or fullscreen UI element rendered inside a `ScrollSection` **MUST** use the `<Portal>` component (`src/components/ui/Portal.tsx`) to render into `document.body`.

### 3. Server-First Cookie Identity & Theme Propagation
- **Rule:** Visual Theme (`azure` / `noir`) and Communication Identity (`dev` / `business`) are extracted from HTTP cookies on the server in Next.js Server Components to prevent layout shifts/flashing (CLS-free hydration).
- **Constraint:** Setting the visual theme must never alter the active communication identity, and vice-versa. Synchronize `localStorage` values lazily on client mount.

### 4. Session Token Identity Derivation for Client API Routes
- **Rule:** All authenticated client scope routes (`/api/client/*`) rely on `Authorization: Bearer <supabase access_token>`.
- **Constraint:** Always derive the client email and user identity from the verified session token (`src/lib/sessionVerify.ts`). Never trust user identity or email passed via request body or URL parameters.

### 5. Mobile vs. Desktop Decoupled Performance Optimization
- **Rule:** Track `isMobile` (width ≤ 768px or coarse pointer) and `reducedMotion` (OS preference or < 4 CPU cores) separately.
- **Constraint:** Maintain smooth parallax scrolling on mobile without horizontal panning, and disable heavy spring mouse-parallax computations on mobile devices to preserve frame rates.

### 6. Prebaked Dynamic Visual Computation Assets
- **Rule:** Prebake heavy dynamic visual calculations (such as skyline SVG wobble paths) into generated static assets (`wobblyPaths.generated.ts` via `scripts/generate-wobbly-paths.mjs`).
- **Constraint:** Avoid running heavy SVG displacement algorithms on the main browser thread at runtime.

### 7. Single Source of Truth for Commercial Pricing & Tiers
- **Rule:** Engine tier rates, care/maintenance plan fees, and feature pricing are strictly stored in `intakeQuestionnaireDefaults.json` and resolved via `src/lib/pricing.ts`.
- **Constraint:** Never hardcode currency figures, absolute prices, or tier multipliers inside TypeScript UI components or frontend JSX.

### 9. Agent Architecture Pre-Flight & Graph Intelligence
- **Rule:** Before creating, editing, or modifying ANY database table, API route handler, core domain utility (`pricing.ts`, `sessionVerify.ts`, `rag-client.ts`), or UI component, the agent **MUST** run:
  ```bash
  python3 scripts/query_architecture.py --target <entity_or_api>
  ```
- **Constraint:** Inspect upstream callers, downstream dependents, and linked PRD specifications before writing code to eliminate regression bugs. After completing changes, execute `python3 scripts/sync_graph_with_code.py` to keep the live code and Obsidian Knowledge Graph synchronized.
- **Constraint:** Never mark a feature complete without verifying the entire end-to-end user interaction flow across all steps and screen sizes.

### 9. Mandatory Database Schema Pre-Check & Migration Execution
- **Rule:** Whenever modifying, adding, or extending any backend data model, API payload, or python synchronizer record fields (e.g. adding new columns to `outreach_leads`, `projects`, `skills`, or `certificates`):
  1. **Schema Check First:** BEFORE adding new fields to application code or Python write payloads, ALWAYS inspect the live Supabase database table schema using `execute_sql` or database inspection tools.
  2. **Execute Migrations Immediately:** Run `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` via Supabase SQL before making code writes so API REST payloads never fail with `HTTP 400 (PGRST204)` schema cache mismatch errors.
  3. **Synchronize SQL Manifests:** Immediately update `supabase_schema.sql` and run `python3 scripts/audit_contracts.py` to ensure local SQL manifests stay 100% synchronized with the live database.
- **Constraint:** NEVER push new data properties or write payloads to Supabase without first verifying that the target database table has the required columns in the live schema.

### 10. Episodic Memory Bank & Failure Postmortems
- **Rule:** Before attempting any complex refactor, CSS layout modification, or debugging task, the agent **MUST** inspect `docs/LEARNINGS.md` for known framework quirks (e.g. Next.js 16 proxy headers, Framer Motion ScrollSection containing block, React 19 synchronous effects).
- **Constraint:** Whenever a non-trivial bug or framework trap is resolved, the agent **MUST** document the failure signature, root cause, anti-pattern, and enforced solution in `docs/LEARNINGS.md`.

### 11. Spec-First Contract Blueprinting & Post-Milestone Graph Sync
- **Pre-Milestone Spec-First Rule:** Before writing implementation code for a new milestone or major feature:
  1. **Draft High-Definition Architecture Nodes:** Create or update specification nodes in `docs/architecture_nodes/` defining TypeScript types, Pydantic schemas, HTTP route signatures, non-negotiable invariants, and test plans.
  2. **Strict Status Tagging:** Explicitly set `status: planned` in the node's YAML frontmatter so agents recognize the target contract without hallucinating that runtime code already exists.
  3. **Low-Definition Horizon:** Keep future milestones (M+3 and beyond) in high-level roadmap markdowns (`docs/`, `ROADMAP.md`), avoiding premature line-by-line over-specification.
- **Post-Milestone Synchronization Rule:** Immediately upon completing code implementation and verifying tests:
  1. **Promote Node Status:** Update the frontmatter from `status: planned` → `status: production`.
  2. **Synchronize Roadmaps & Learnings:** Update milestone checkboxes in `UNIFIED_MASTER_ROADMAP.md` / `ROADMAP.md` and document any runtime quirks/learnings in `docs/LEARNINGS.md`.
  3. **Regenerate Canvases & Vault Index:** Execute:
     ```bash
     python3 scripts/sync_graph_with_code.py
     python3 scripts/audit_contracts.py
     ```
  4. **Zero-Drift Invariant:** Never finish a milestone task while leaving Obsidian canvases, architecture index files, or markdown PRDs desynchronized from the live codebase.

### 12. Design System 2.0 & Sensory Aesthetics Invariant Rule
- **Rule:** Every future component, modal, drawer, page, widget, or UI section created or edited in this codebase MUST strictly adhere to Design System 2.0 dual-theme aesthetics, micro-interactions, and semantic token contracts.
- **Dual-Theme Aesthetic Parity:**
  - **Azure Mode (Graphic Novel Print & Warm Editorial):** Warm linen/paper surfaces (`#FAF9F6`), crisp `#FFFFFF` cards (`var(--surface-card)`), graphite typography (`var(--color-text)` / `#2B2B36`), muted terracotta/slate metadata (`var(--color-text-muted)`), terracotta warm accents (`var(--pop-yellow)`, `#E06D53`), and slate blue interactive highlights (`var(--pop-blue)`, `#3F6E91`).
  - **Noir Mode (Cyber-Monospace & Obsidian Glass):** Obsidian glass surfaces (`#08080a`), deep dark cards (`#0d0d10`), `#2F2F3D` borders, glowing neon cyan (`var(--neon-cyan)`, `#00f0ff`), neon green highlights (`var(--neon-green)`, `#39ff14`), and hot magenta (`var(--neon-pink)`).
- **Zero Hardcoded Tailwind Drift:**
  - **Constraint:** NEVER use hardcoded dark Tailwind palette hex codes (such as `#f8fafc`, `#94a3b8`, `#1e293b`, `#0f172a`, `#fff`, `rgba(255,255,255,...)`) inside CSS modules or inline JSX styles.
  - **Constraint:** Always use semantic tokens: `--color-text`, `--color-text-muted`, `--color-text-dim`, `--surface-card`, `--surface-elevated`, `--surface-glass-bg`, `--surface-glass-border`, `--surface-glass-header`, `--badge-active-*`, `--badge-success-*`, `--badge-danger-*`, `--app-btn-primary-*`.
- **Sensory Kinetics & Micro-Interactions Standard:**
  - **Magnetic Button Kinetics:** Primary CTAs, key navigation triggers, and interactive submit buttons must be wrapped in `<MagneticButton strength={0.25}>` (`src/components/ui/MagneticButton.tsx`) to provide tactile physics and cursor attraction.
  - **3D Card Tilt & Depth:** Primary showcase cards, blueprint options, and interactive tiles should utilize `<TiltCard maxAngle={2} glare={false}>` (`src/components/ui/TiltCard.tsx`).
  - **Animated Numerical Transitions:** Dynamic financial figures, pricing breakdowns, currency values, and counters must use `@number-flow/react` (`<NumberFlow value={...} format={{ style: 'currency', currency }} />`).
  - **Framer Motion Layout Transitions:** Tab switchers, mode toggles, and state pill indicators must use Framer Motion `m.span` with `layoutId` (spring physics `type: 'spring', stiffness: 350, damping: 28`) for morphing indicator pills.
  - **Graphic Novel & Editorial Detailing:** Vintage issue stamps (`VOL. 26`), registration crosshair brackets (`⌜ ⌟`), perforated dashed voucher lines (`border-top: 1.5px dashed var(--border-muted)`), and 5-segment proficiency gauge meters.

### 13. Mandatory Pre-Implementation Double-Audit & Edge-Case Stress Testing
- **Rule:** Before executing implementation code on ANY approved plan or milestone, the agent **MUST** perform an exhaustive double-audit of the implementation plan to identify hidden gaps, cascading side-effects, responsive edge cases, and state desync risks.
- **Stress-Testing Checklist:**
  1. **Transitive Graph & State Cascades:** Verify direct and transitive dependency resolution (BFS graph traversal), batch state updates, atomic financial recalculations (volume discounts, promo codes, taxes), and multi-item undo state restoration.
  2. **Viewport & Responsive Constraints:** Verify mobile rendering (<640px, coarse pointers), responsive SVG `viewBox` vs fallback matrix views, and touch target sizing (≥44px).
  3. **Containing Block & Portal Safety:** Verify that all modals, drawers, tooltips, and popovers escape CSS containing blocks using `<Portal>` (`ADR 05`).
  4. **Design System 2.0 & Dual-Theme SVG Parity:** Verify contrast and token mapping across both Azure and Noir themes without hardcoded hex drift.
  5. **Zero-Breakage Backward Compatibility:** Ensure domain helper signatures (`calcQuote`, `generateQuestionnairePDF`, `resolveFeatureDependencies`) maintain strict backward compatibility with existing tests and callers.
- **Constraint:** Never rush to execute source code modifications before double-auditing and refining the implementation plan.
