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

### 8. Full Feature Flow Pre-Audit & End-to-End Verification
- **Rule:** Before creating, editing, or integrating any UI feature, animation, or state property:
  1. **Exhaustive Variable/State Search:** Grep/search the entire target file and connected components for ALL render instances of target state variables (e.g. `totalCost`, `price`, `theme`). Never assume a state variable only renders in a single JSX block or summary card.
  2. **Contract & Formatting Alignment:** Verify third-party library defaults against local domain contracts (`src/lib/pricing.ts`, `formatMoney`, `pdfTheme.ts`). Always pass explicit locale/formatting parameters (`locales={currency === 'INR' ? 'en-IN' : 'en-US'}`) matching site-wide conventions.
  3. **Primary User Flow Coverage:** Ensure visual animations and interactive polish are integrated directly into the primary active interaction paths (e.g., sticky action toolbars, live input controls, interactive cards) rather than only on static end steps.
- **Constraint:** Never mark a feature complete without verifying the entire end-to-end user interaction flow across all steps and screen sizes.

### 9. Mandatory Database Schema Pre-Check & Migration Execution
- **Rule:** Whenever modifying, adding, or extending any backend data model, API payload, or python synchronizer record fields (e.g. adding new columns to `outreach_leads`, `projects`, `skills`, or `certificates`):
  1. **Schema Check First:** BEFORE adding new fields to application code or Python write payloads, ALWAYS inspect the live Supabase database table schema using `execute_sql` or database inspection tools.
  2. **Execute Migrations Immediately:** Run `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` via Supabase SQL before making code writes so API REST payloads never fail with `HTTP 400 (PGRST204)` schema cache mismatch errors.
  3. **Synchronize SQL Manifests:** Immediately update `supabase_schema.sql` and run `python3 scripts/audit_contracts.py` to ensure local SQL manifests stay 100% synchronized with the live database.
- **Constraint:** NEVER push new data properties or write payloads to Supabase without first verifying that the target database table has the required columns in the live schema.

