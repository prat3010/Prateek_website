# Project Agent Guide

This is Prateek Sharma's personal portfolio, built with Next.js 16 App Router, React 19, TypeScript, CSS Modules, Supabase analytics, Resend contact email, Lenis scrolling, Framer Motion, and selective Three.js effects.

## Read First

- This project uses Next.js 16. Do not assume older Next.js behavior (e.g., middleware has been deprecated/renamed to proxy). Before changing routing, layouts, metadata, proxy/middleware, server components, or route handlers, read the relevant local docs in `node_modules/next/dist/docs/`.
- Prefer the existing App Router structure under `src/app/`.
- Keep server-only code server-only. `src/data/supabase.ts` intentionally imports `server-only` and must not be pulled into client components.
- Do not make broad refactors unless the task explicitly asks for them.

### React 19 & Next.js 16 Best Practices
- **Synchronous Effects:** Do not call `setState` synchronously within a `useEffect` body (e.g., initializing state from array items or resetting error states on mount). This triggers cascading renders. Instead, calculate initial values lazily during state initialization or use callbacks/event handlers.
- **Client-Side Data Loading:** Prefer Server Components for static/dynamic database fetching. For interactive client components, prefer passing initial data as props or using React 19 Suspense patterns.

### Agent Behavior & Communication
- **Explicit Manual Actions:** The agent must explicitly call out any manual configuration tasks (e.g., executing SQL migrations in the Supabase Dashboard, registering environment variables, or clearing deployment caches) directly in the final chat response. Do not hide manual action steps solely inside walkthroughs or implementation plans.
- **Environment & DB Safety:** Always verify if database schema updates require manual script execution or if they affect local JSON fallback synchronization before applying code changes.
- **Workspace Hygiene:** Do not make any code modifications or run tests without first checking `git status` to ensure you are not conflicting with uncommitted developer work.

## Deployment and Domain

- **Hosting & Platform:** Fully deployed and hosted on Vercel.
- **Custom Domain:** Mapped to the custom domain `prateeq.in` (purchased via GoDaddy and configured with DNS records pointing to Vercel).
- **Proxy & Geolocation:** Geolocation detection in `src/proxy.ts` relies on Vercel-specific country header (`x-vercel-ip-country`). Region and city tracking headers (`x-vercel-ip-country-region`, `x-vercel-ip-city`) are intentionally ignored and logged as `null` to avoid inaccurate city geolocating from ISP routing. Do not alter or strip the `x-vercel-ip-country` header.

## Environment Variables

The project uses the following environment variables (stored in `.env.local` locally and configured in Vercel settings for production):
- `NEXT_PUBLIC_SUPABASE_URL`: The API endpoint URL for the Supabase instance.
- `SUPABASE_SERVICE_ROLE_KEY`: Secret service-role key for Supabase. **WARNING:** Never expose this key in client-side code; it bypasses Row-Level Security (RLS) to allow proxy telemetry writes and synchronization scripts.
- `RESEND_API_KEY`: API key for Resend email service, used to send emails from the contact form.
- `CONTACT_EMAIL_TO`: The email address that receives notifications from the contact form (default is `3010prateeksharma@gmail.com`).
- `GEMINI_API_KEY`: Google AI Gemini API key (version `gemini-2.5-flash`), used by the local Synchronizer dashboard for certificate analysis and skill scanning.
- `SYNC_API_KEY`: Shared secret key used to authenticate requests to the Next.js API revalidation endpoint (`/api/revalidate`) and ensure secure cache purging.
- `GITHUB_TOKEN` (or `GITHUB_PAT` / `GH_TOKEN`): Optional GitHub personal access token, used by the local Synchronizer dashboard to raise the rate limit on deployment status checks.

## Caching & Cache Revalidation

- **Caching Layer:** Database data fetched via `src/lib/data.ts` (projects, skills, certificates, resume profile) is cached aggressively using Next.js `unstable_cache`.
- **Cache Tags:** All cache entries share the query tag `portfolio-data`, with specific tags like `projects`, `skills`, `certificates`, and `profile`.
- **Cache Invalidation:** Content write API routes revalidate relevant Next.js cache tags after successful mutations. When database data is modified outside those routes (for example directly in Supabase Dashboard or via one-off SQL), revalidate by sending a `POST` or `GET` request to `/api/revalidate?secret=YOUR_SYNC_API_KEY`.
- **Content Write Security:** Public content tables are public-read only. Writes are performed by server routes or local tooling with `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS. Do not add anonymous insert/update/delete policies for portfolio content tables.

## Project Shape

- `.github/workflows/` contains CI/CD workflows (e.g. `db_sync.yml` to auto-sync JSON content to Supabase on push).
- `src/app/` contains routes, layouts, metadata, API routes, sitemap, robots, and the app shell.
- `src/proxy.ts` is the Next.js 16 proxy (formerly middleware) file that intercepts requests for telemetry logging.
- `src/components/` contains portfolio sections, shared UI (like the interactive diagnostics terminal console at `/terminal` which supports commands such as `git-info` and `qrcode`), visual effects, and the playground.
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
- `scripts/sync_supabase.py` shared REST API module used by the synchronizer to read, upsert, and explicitly delete Supabase records.
- `scripts/sync_json.py` provides atomic local JSON/text fallback writes for the synchronizer.
- `scripts/sync_validation.py` validates Gemini-generated project, certificate, and blog payloads before persistence.
- `scripts/sync_assets.py` stages synchronizer asset moves/deletes so public files are not mutated before data writes succeed.
- `scripts/sync_git.py` scopes synchronizer Git commits to intended paths and rejects unrelated staged changes.
- `scripts/backup_db.py` pulls live database data from Supabase and updates local JSON fallback files.
- `scripts/verify.sh` runs a single-command test verification (clears cache, checks types, checks linting, runs test build).
- `scripts/audit_db.py` runs a database schema audit comparing the local schema file against live Supabase tables.

## Telemetry and Analytics

- Analytics are tracked via `src/proxy.ts` using GDPR-compliant daily IP hashing and logged to Supabase `page_visits`.
- **Security Hardening:** Direct public anonymous database inserts to `page_visits` are blocked at the RLS level. Writes are securely processed server-side by the proxy middleware using the `SUPABASE_SERVICE_ROLE_KEY`.
- **Spam & Bot Filtering:** Automated crawler/bot user-agents and common honeypot scanning patterns (e.g., `.php`, `wp-admin`, `.env`) are discarded at the proxy level before any database write is initiated.
- **Data Retention:** An automated database function and trigger prunes logs older than 90 days probabilistically (on average ~1% of inserts to reduce CPU & locking write overhead) to limit database storage growth.
- **Aggregations & RPC Fast-Path**: The dashboard uses a custom SQL database function `get_analytics_summary(cutoff_time)` defined in `supabase_schema.sql`. This runs the aggregation on the database side in a single query pass.
- **Backwards-Compatible Fallback**: If the `get_analytics_summary` function is missing (e.g., before database migrations are run), the application automatically catches the database error and falls back to client-side aggregation (fetching up to 2,000 records).
- Database structure, policies, indexes, and stored procedures are defined in `supabase_schema.sql`.

## The Synchronizer (Content-Management Helper)

A Streamlit-based local dashboard (`scripts/synchronizer.py`) for resume, portfolio, and content updates.
- **Running locally:** Execute `streamlit run scripts/synchronizer.py`. Requires `pip install streamlit` and `PIL/Pillow`.
- **AI Integration:** Uses `GEMINI_API_KEY` from `.env.local` to call `gemini-2.5-flash` for scanning missing skills and analyzing certificates.
- **Core Tabs:**
  - **Edit Resume Manually:** Writes resume data to Supabase (plus file fallback). Includes biography details, freelance quotation rates, and pricing packages editing for both Developer and Business modes.
  - **Sync Projects:** Syncs GitHub projects to Supabase (plus file fallback) and supports side-by-side editing of Developer and Business project copy.
  - **Sync Certificates:** Saves files to `public/certificates/` and metadata to Supabase (plus file fallback).
  - **Manage Skills:** Updates skills in Supabase (plus file fallback, including business outcome narratives) and displays pending auto-scanned tags.
  - **Update Photos:** Manages profile and project images (azure vs. noir variants) in `public/images/`. Includes Git integration to automatically stage, commit, and push updated images to GitHub when Dry-Run Mode is disabled.
  - **Blog Editor:** Writes markdown posts directly to `src/content/posts/`.
- **Sidebar Monitors:**
  - **CI/CD Deployment Status:** Automatically tracks Vercel build status via GitHub API, displaying status updates in IST (Indian Standard Time).
  - **Pending Skill Approvals:** Lists queue of AI-extracted skills for immediate addition.
- **Fallback Synchronization & Offline Mode:** The dashboard writes to both the database and the local JSON fallbacks in `src/data/` (e.g., `projects.json`, `skills.json`). To ensure consistency, the dashboard commits to the database *first* and uses atomic local writes after database success. Deletes must call explicit Supabase delete helpers before local fallback files are changed. AI-generated content must pass `scripts/sync_validation.py` validation before persistence. Asset imports should stage files before finalizing public paths, and Git publishing must use `scripts/sync_git.py` so unrelated staged changes are rejected. Check the **Offline Mode (Local JSON Only)** toggle in the Streamlit sidebar to disable database synchronization and force local-only modifications. If database connections fail at runtime in Next.js, the web app automatically falls back to reading these local JSON files. Future content features must maintain this dual JSON/database fallback contract.
- **Python / JS Decoupling:** Keep Python tools strictly as local content-management scripts. Do not attempt to invoke Python scripts or require Python dependencies (`streamlit`, `Pillow`) in any runtime web app paths or public API routes.


## Design And Content Principles

- This site is a portfolio first. Changes should improve trust, clarity, performance, or the quality of the showcased work.
- Preserve the comic/noir visual identity, but do not add decorative effects at the cost of readability, accessibility, or load performance.
- Portfolio copy must be credible. Avoid inflated claims, unverifiable metrics, or absolute privacy/security/compliance language unless the implementation proves it.
- Project status, links, and descriptions must stay internally consistent. If a project is marked `soon`, do not present it as live.

## Privacy And Security

- Treat analytics data as sensitive. Do not publicly expose raw visitor activity, detailed referrers, location, browser, OS, or device data without an explicit product decision.
- Do not weaken `server-only` protections around Supabase service-role access.
- **Row-Level Security (RLS):** All Supabase tables (`page_visits`, `projects`, `skills`, `certificates`, `profile`, `posts`) must have Row-Level Security enabled. Public write access must remain disabled. Telemetry and content updates should only be performed server-side or via local scripts using the `SUPABASE_SERVICE_ROLE_KEY`. Do not introduce public write policies.
- Contact form changes must preserve input validation and HTML escaping.
- Do not introduce runtime shell execution or filesystem writes in public request paths unless there is a reason and the behavior is bounded.
- Be careful with comments that claim compliance. Describe what the code does, not what laws it satisfies.
- **Degraded Service States:** If third-party integrations (e.g., Resend, Gemini) fail or their environment keys are absent, fallback gracefully to informative debug messages or dummy success states. The core website layout/visitor page must never crash.

## Performance Expectations

- The app already has a heavy visual layer. Avoid adding default client-side work to the global shell unless necessary.
- Prefer server components for static content and client components only where interactivity/theme state requires them.
- Dynamic import heavyweight effects or optional widgets.
- Respect `prefers-reduced-motion` and keep animation work off the main user path when possible.
- Use `next/image` for images and keep `sizes`, dimensions, and priority choices intentional.

## Styling

- Use CSS Modules for component styles and `src/app/globals.css` only for global tokens/utilities.
- **CSS Modularity:** Keep all styling component-specific. Always use CSS Modules (`.module.css`) for new or modified components. Do not append ad-hoc utility classes to `globals.css` or write inline React styles unless dynamically necessary.
- Reuse existing CSS variables and visual language before adding new palettes or systems.
- Keep focus states and keyboard access intact.
- Avoid inline styles unless they are already part of a local pattern or are needed for CSS custom properties.

## Testing And Verification

- **Workspace Verification:** Run `./scripts/verify.sh` to execute full workspace validation (cleaning caches, checking types, running lints, and test builds).
- **Database Verification:** Run `./scripts/audit_db.py` to compare your live database tables against the local `supabase_schema.sql` file and identify any missing schemas.
- **Database Backup:** Run `./scripts/backup_db.py` to pull down live database records and update your local fallback JSON files in `src/data/`.
- Run `npx tsc --noEmit` after TypeScript changes.
- **Troubleshooting stale TypeScript types:** If type checking (`tsc`) fails with stale cache references to deleted or renamed routes (e.g., in `.next/types/...`), clear the cache directory first: `rm -rf .next && npx tsc --noEmit`.
- **Lint Verification:** Ensure the linter (`./scripts/verify.sh` or `npm run lint`) passes cleanly (0 errors and warnings). All lint errors must be resolved before committing code.
- Be cautious with `npm run build`: it runs `scripts/generate-git-log.js`, which writes generated data under `src/data/`.
- For visual or interactive changes, run the dev server and inspect desktop and mobile behavior when feasible.

## Git And Generated Files

- Do not overwrite user changes. Check `git status --short` before editing.
- Do not commit unless explicitly asked.
- **Documentation Integrity:** Whenever introducing new features, scripts, database tables, local helpers, CLI commands, or key configuration parameters, the agent **must** update both `README.md` and `AGENTS.md` (specifically sections like Project Shape, setup steps, or verification guides) to reflect the new state of the project.
- Do not edit generated outputs unless the task is specifically about generation behavior.
- Avoid touching `package-lock.json` unless dependencies actually changed.

## Comment Policy

- Comments may be stale. Verify them against implementation before relying on them.
- Add comments only where they clarify non-obvious behavior, lifecycle constraints, privacy reasoning, or performance tradeoffs.
- Remove or update comments that overclaim, repeat the code, or describe behavior that is no longer true.
