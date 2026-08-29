# Architectural Learnings & Episodic Memory Bank (`Prateek_website`)

This document serves as the **Episodic Long-Term Memory** for AI agents and developers working on `Prateek_website`. AI agents MUST consult this file before undertaking architecture modifications, refactors, or debugging sessions to prevent repeating known traps.

---

## 1. UI & Layout Traps

### Quirk: `ScrollSection` Containing Block Trapping Fixed Modals
- **Context / Framework**: Framer Motion + Next.js 16
- **Symptom**: Modals, drawer sidebars, toasts, or fullscreen overlays rendered inside a section appear shifted, clipped, or relative to the parent section instead of the viewport.
- **Root Cause**: `ScrollSection` wraps page sections in an `m.div` with `will-change: transform` and `translateY`. In CSS, any transform or `will-change: transform` creates a new containing block that traps `position: fixed` descendants.
- **Anti-Pattern**:
  ```tsx
  // BAD: Rendered directly inside a page section
  <div className={styles.fixedModal}>...</div>
  ```
- **Enforced Solution**: Always wrap modals and fullscreen overlays in the `<Portal>` component (`src/components/ui/Portal.tsx`) to mount them outside the transformed containing block.
  ```tsx
  // GOOD: Escapes the transformed containing block to document.body
  <Portal>
    <div className={styles.fixedModal}>...</div>
  </Portal>
  ```
- **ADR Reference**: ADR 05.

---

### Quirk: React 19 Synchronous State Updates in `useEffect`
- **Context / Framework**: React 19
- **Symptom**: Cascading re-render warnings, layout flash, or infinite render loops.
- **Root Cause**: Calling `setState` synchronously within a `useEffect` on mount triggers immediate synchronous re-renders.
- **Anti-Pattern**:
  ```tsx
  // BAD: Synchronous reset in effect
  useEffect(() => {
    setError(null);
    setInitialData(props.data[0]);
  }, [props.data]);
  ```
- **Enforced Solution**: Initialize state lazily in `useState(() => ...)` or derive state values during render whenever possible.

### Quirk: Cross-Page Anchor Navigation Interception in Navbar
- **Context / Framework**: Next.js App Router + Lenis Smooth Scroll
- **Symptom**: Clicking "Home" (or other section anchors like `/#about`) from subpages (`/blog`, `/terminal`, `/scoping`, etc.) fails silently with no navigation.
- **Root Cause**: `handleNavClick` checked `targetPath === '/'` unconditionally when determining `isCurrentPage`. On subpages like `/blog`, `targetPath === '/'` evaluated to `true`, causing `e.preventDefault()` to run and attempt to Lenis-scroll to `#home`, which does not exist on `/blog`.
- **Anti-Pattern**:
  ```tsx
  // BAD: Treats targetPath === '/' as current page even when window.location.pathname === '/blog'
  const isCurrentPage = targetPath === '' || targetPath === '/' || targetPath === currentPath;
  ```
- **Enforced Solution**: Check exact path equality against `window.location.pathname` and use Next.js `<Link>` for all navbar items and the logo so cross-route transitions occur naturally without preventDefault interception.
  ```tsx
  // GOOD: Only intercepts when actually on the same page
  const isCurrentPage =
    targetPath === currentPath ||
    ((targetPath === '/' || targetPath === '') && (currentPath === '/' || currentPath === ''));
  ```

---

## 2. Framework & Routing Quirks

### Quirk: Next.js 16 Proxy Architecture & Geolocation Headers
- **Context / Framework**: Next.js 16 App Router
- **Symptom**: Deprecation warnings or broken middleware when using `middleware.ts`.
- **Root Cause**: Next.js 16 renames and modernizes middleware to `src/proxy.ts`. Geolocation detection relies solely on `x-vercel-ip-country`.
- **Anti-Pattern**: Relying on `x-vercel-ip-country-region` or `x-vercel-ip-city` (these produce inaccurate city geolocation from ISP routing).
- **Enforced Solution**: Use `src/proxy.ts` and only inspect `x-vercel-ip-country` for Geo-IP (INR vs. USD pricing). Leave region/city as `null`.

---

### Quirk: Server-Only vs Client Data Module Boundaries
- **Context / Framework**: Next.js Server Components & Supabase
- **Symptom**: Build failures or compilation errors complaining about `server-only` inside client bundles.
- **Root Cause**: `src/data/supabase.ts` intentionally imports `server-only` because it contains direct service role logic.
- **Anti-Pattern**: Importing `src/data/supabase.ts` into any file containing `"use client"`.
- **Enforced Solution**: Client components must use `src/lib/auth.ts` or `@supabase/ssr` browser clients. Server routes and SSR loaders use `src/lib/data.ts` or `src/lib/supabase/server.ts`.

---

## 3. PDF Rendering Quirks (`@react-pdf/renderer` v4)

### Quirk: Variable Font Rendering Failures & Relative Font Paths
- **Context / Framework**: `@react-pdf/renderer` v4
- **Symptom**: Blank PDF pages, font parsing crashes, or corrupted typography.
- **Root Cause**: `@react-pdf/renderer` v4 does NOT support variable TTFs and rejects raw `Buffer` instances and relative URL paths.
- **Anti-Pattern**: Passing relative paths like `../fonts/font.ttf` or variable font binaries to `Font.register()`.
- **Enforced Solution**:
  1. Client-side registration (`pdfFontsClient.ts`) MUST use absolute `/fonts/...` URLs.
  2. Server-side registration (`pdfFontsServer.ts`) MUST use base64 data URLs read from disk (`data:font/truetype;charset=utf-8;base64,...`).
  3. Use static TTFs generated via `fonttools varLib.instancer`.

---

## 4. Database & State Synchronization Traps

### Quirk: Un-Migrated Columns in Supabase Payloads
- **Context / Framework**: Supabase REST API (PostgREST)
- **Symptom**: Supabase REST requests return `400 Bad Request: column "..." does not exist` or silent data truncation.
- **Root Cause**: PostgREST rejects payloads containing columns not defined in the live database schema.
- **Anti-Pattern**: Adding a new property to `intakeQuestionnaireDefaults.json` or `resume.json` before applying the migration.
- **Enforced Solution**: ALWAYS run `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...` via Supabase SQL first. Then run `python3 scripts/seed_supabase.py` and `python3 scripts/audit_db.py`.

---

## 5. Agent Workflow & Blast Radius Checklist

Before completing any task modifying domain logic or API routes:
1. **Pre-Flight**: Run `python3 scripts/query_architecture.py --target <entity_or_api>` to inspect blast radius.
2. **Episodic Check**: Verify this `docs/LEARNINGS.md` file for known quirks related to the target module.
3. **Execution**: Perform targeted edits without full file overwrites.
4. **Post-Tool Audit**: Run `python3 scripts/audit_contracts.py`.
5. **Graph Sync**: Run `python3 scripts/sync_graph_with_code.py` to keep Obsidian Canvas in 100% sync.
