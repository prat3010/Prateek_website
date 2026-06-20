# Project Agent Guide

This is Prateek Sharma's personal portfolio, built with Next.js 16 App Router, React 19, TypeScript, CSS Modules, Supabase analytics, Resend contact email, Lenis scrolling, Framer Motion, and selective Three.js effects.

## Read First

- This project uses Next.js 16. Do not assume older Next.js behavior (e.g., middleware has been deprecated/renamed to proxy). Before changing routing, layouts, metadata, proxy/middleware, server components, or route handlers, read the relevant local docs in `node_modules/next/dist/docs/`.
- Prefer the existing App Router structure under `src/app/`.
- Keep server-only code server-only. `src/data/supabase.ts` intentionally imports `server-only` and must not be pulled into client components.
- Do not make broad refactors unless the task explicitly asks for them.

## Project Shape

- `src/app/` contains routes, layouts, metadata, API routes, sitemap, robots, and the app shell.
- `src/proxy.ts` is the Next.js 16 proxy (formerly middleware) file that intercepts requests for telemetry logging.
- `src/components/` contains portfolio sections, shared UI, visual effects, and the playground.
- `src/data/` contains type definitions, Supabase client setup, and taglines (data values live in Supabase).
- `src/lib/data.ts` is the server-side data layer that fetches projects, skills, resume, and certificates from Supabase.
- `src/data/git-log.json` contains generated commit logs and should not be modified manually.
- `src/content/posts/` contains markdown blog posts read by `src/lib/markdown.ts`.
- `src/context/` contains global client providers for theme and Lenis scroll state.
- `src/hooks/` contains shared client hooks (e.g., typewriter effects).
- `src/lib/` contains markdown parsers and application constants.
- `src/app/api/` contains REST API routes for reading/writing portfolio data to Supabase.
- `src/utils/pdfGenerator.ts` generates the downloadable resume PDF client-side.
- `scripts/generate-git-log.js` writes generated commit data before builds.
- `scripts/synchronizer.py` is a local content-management helper. Treat it as tooling, not runtime app code.
- `scripts/seed_supabase.py` populates Supabase tables from the TypeScript data files (one-time bootstrap or re-seed).
- `scripts/sync_supabase.py` shared REST API module used by the synchronizer to write to Supabase.

## Telemetry and Analytics

- Analytics are tracked via `src/proxy.ts` using GDPR-compliant daily IP hashing and logged to Supabase `page_visits`.
- Database structure, policies, and indexes are defined in `supabase_schema.sql`.

## The Synchronizer (Content-Management Helper)

A Streamlit-based local dashboard (`scripts/synchronizer.py`) for resume, portfolio, and content updates.
- **Running locally:** Execute `streamlit run scripts/synchronizer.py`. Requires `pip install streamlit` and `PIL/Pillow`.
- **AI Integration:** Uses `GEMINI_API_KEY` from `.env.local` to call `gemini-2.5-flash` for scanning missing skills and analyzing certificates.
- **Core Tabs:**
  - **Edit Resume Manually:** Writes resume data to Supabase (plus file fallback).
  - **Sync Projects:** Syncs GitHub projects to Supabase (plus file fallback).
  - **Sync Certificates:** Saves files to `public/certificates/` and metadata to Supabase (plus file fallback).
  - **Manage Skills:** Updates skills in Supabase (plus file fallback) and displays pending auto-scanned tags.
  - **Update Photos:** Manages profile and project images (azure vs. noir variants) in `public/images/`.
  - **Blog Editor:** Writes markdown posts directly to `src/content/posts/`.
- **Sidebar Monitors:**
  - **CI/CD Deployment Status:** Automatically tracks Vercel build status via GitHub API, displaying status updates in IST (Indian Standard Time).
  - **Pending Skill Approvals:** Lists queue of AI-extracted skills for immediate addition.


## Design And Content Principles

- This site is a portfolio first. Changes should improve trust, clarity, performance, or the quality of the showcased work.
- Preserve the comic/noir visual identity, but do not add decorative effects at the cost of readability, accessibility, or load performance.
- Portfolio copy must be credible. Avoid inflated claims, unverifiable metrics, or absolute privacy/security/compliance language unless the implementation proves it.
- Project status, links, and descriptions must stay internally consistent. If a project is marked `soon`, do not present it as live.

## Privacy And Security

- Treat analytics data as sensitive. Do not publicly expose raw visitor activity, detailed referrers, location, browser, OS, or device data without an explicit product decision.
- Do not weaken `server-only` protections around Supabase service-role access.
- Contact form changes must preserve input validation and HTML escaping.
- Do not introduce runtime shell execution or filesystem writes in public request paths unless there is a strong reason and the behavior is bounded.
- Be careful with comments that claim compliance. Describe what the code does, not what laws it satisfies.

## Performance Expectations

- The app already has a heavy visual layer. Avoid adding default client-side work to the global shell unless necessary.
- Prefer server components for static content and client components only where interactivity/theme state requires them.
- Dynamic import heavyweight effects or optional widgets.
- Respect `prefers-reduced-motion` and keep animation work off the main user path when possible.
- Use `next/image` for images and keep `sizes`, dimensions, and priority choices intentional.

## Styling

- Use CSS Modules for component styles and `src/app/globals.css` only for global tokens/utilities.
- Reuse existing CSS variables and visual language before adding new palettes or systems.
- Keep focus states and keyboard access intact.
- Avoid inline styles unless they are already part of a local pattern or are needed for CSS custom properties.

## Testing And Verification

- Run `npx tsc --noEmit` after TypeScript changes.
- Run `npm run lint` when practical, but note that the repository may contain pre-existing lint failures. Report whether failures are new or existing.
- Be cautious with `npm run build`: it runs `scripts/generate-git-log.js`, which writes generated data under `src/data/`.
- For visual or interactive changes, run the dev server and inspect desktop and mobile behavior when feasible.

## Git And Generated Files

- Do not overwrite user changes. Check `git status --short` before editing.
- Do not commit unless explicitly asked.
- Do not edit generated outputs unless the task is specifically about generation behavior.
- Avoid touching `package-lock.json` unless dependencies actually changed.

## Comment Policy

- Comments may be stale. Verify them against implementation before relying on them.
- Add comments only where they clarify non-obvious behavior, lifecycle constraints, privacy reasoning, or performance tradeoffs.
- Remove or update comments that overclaim, repeat the code, or describe behavior that is no longer true.
