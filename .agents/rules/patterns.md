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
