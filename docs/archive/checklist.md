# **Adaptive Portfolio V2 - Implementation Checklist**

This document tracks the progress of the transition from Adaptive Portfolio v1 to v2.

---

## **Phase 1: Data Layer & Sync**
- [Completed] **Update Supabase Schema (`supabase_schema.sql`)**: Add adaptive columns (`description_business`, `longDescription_business`) to the `projects` and `skills` tables.
  - *Status*: Finished. The ALTER TABLE queries have been successfully run in the live Supabase database and verified by the schema audit.
- [Completed] **Update Local JSON Fallbacks**: Add draft business content to `src/data/projects.json` and `src/data/skills.json`.
  - *Status*: Finished. Added client-focused value descriptions for projects, skills, and profile billing terms.
- [Completed] **Extend Supabase Seeder (`scripts/seed_supabase.py`)**: Update the Python seeding script to write these new columns to Supabase.
  - *Status*: Finished. Added default parameters for the new columns in the seeding loops.
- [Completed] **Extend Database Backup (`scripts/backup_db.py`)**: Ensure database backups retrieve and write v2 business fields back to local JSON fallbacks.
  - *Status*: Checked. The backup script fetches dynamic entries via GET and preserves the new columns automatically.

## **Phase 2: State & Context**
- [Completed] **Extend Theme Context (`src/context/ThemeContext.tsx`)**: Support `audience` (`developer` | `business`) state, dynamic cookie persistence (1-year expiration), and lazy initialization.
  - *Status*: Finished. Extended the context and provider with lazy prop initialization and localStorage/cookie persistence.
- [Completed] **Configure Proxy Middleware (`src/proxy.ts`)**: Read the `audience` and `theme` cookies server-side to set layout defaults and headers.
  - *Status*: Finished. Parsed cookies and User-Agent in proxy.ts, injecting them as request headers.
- [Completed] **Bot & Crawler Fallback**: Ensure search bots get a balanced, SEO-optimized layout default when cookies are absent.
  - *Status*: Finished. If visitor is a bot, proxy.ts automatically forces the `x-audience` header to `'developer'` to prevent layout shifts and display standard indexed content.

## **Phase 3: Shell & Switchers**
- [Completed] **Welcome Onboarding Selector**: Design and build a premium, visual-identity-aware overlay to select "Hiring a Developer" or "Need a Website" on first-time visits.
  - *Status*: Finished. Created OnboardingSelector.tsx & css module, conditionally rendering inside ClientLayoutContent when audience is null.
- [Completed] **Navbar Toggle Control**: Mount a premium toggle control directly inside `src/components/ui/Navbar.tsx` next to the existing Theme Toggle.
  - *Status*: Finished. Added audienceToggle next to themeToggle, styled for both Azure (vibrant) and Noir (outline, monospaced) modes.
- [Completed] **Ensure Core Scenery & Diagnostics Are Untouched**: Verify that Zen Mode, terminal commands (`/terminal`), `NoirSkyline`, and canvas animations remain active and unmodified.
  - *Status*: Checked. Verified that /terminal path, site diagnostics, ZenMode toggles, background scenery vector rendering, and CursorTrail are active and untouched.

## **Phase 4: Component Upgrades**
- [Pending] **Hero Section (`src/components/sections/Hero.tsx` or similar)**: Enable title, description, and CTA adaptations.
  - *Status*: Pending.
- [Pending] **About Me Section**: Adapt developer details (learning, mindset) into business/freelance value propositions.
  - *Status*: Pending.
- [Pending] **Skills & Services Section**: Translate categorized tech skills (Orchestration, Logic, Product, Dynamic) into customer-friendly services.
  - *Status*: Pending.
- [Pending] **Projects Grid Section**: Toggle project card copy between architecture/engineering details and business outcome/metrics.
  - *Status*: Pending.
- [Pending] **Blog / Writings Section**: Set up adaptive title headings ("LATEST WRITINGS" vs. "LOG_ENTRIES") and cards.
  - *Status*: Pending.
- [Pending] **Resume / Quotations Section & pdfGenerator.ts**:
  - Render work experience timeline (Developer) vs. itemized service grids (Business).
  - Implement `generateQuotationPDF()` inside `src/utils/pdfGenerator.ts` to output professional service quotations.
  - Add download toggles.
  - *Status*: Pending.
- [Pending] **Pricing Section**: Render pricing plans/tiers from Supabase metadata, pre-populating contact form package selectors on selection.
  - *Status*: Pending.
- [Pending] **Contact Form Section**: Enable package pre-population and keep validation/escaping robust.
  - *Status*: Pending.

## **Phase 5: CMS Updates**
- [Pending] **Update Streamlit Resume Tab**: Enable editing of quotation billing, standard deliverables, and payment terms side-by-side with resume items.
  - *Status*: Pending.
- [Pending] **Update Streamlit Projects Tab**: Support side-by-side editing of Developer and Business project descriptions.
  - *Status*: Pending.
- [Pending] **Update Streamlit Skills Tab**: Allow editing of business service value propositions for each skill.
  - *Status*: Pending.

## **Phase 6: Validation**
- [Pending] **Codebase Pruning**: Clean up unused CSS files, outdated components, or deprecated dependencies.
  - *Status*: Pending.
- [Pending] **Database Audit**: Run `scripts/audit_db.py` to compare live Supabase schema against `supabase_schema.sql`.
  - *Status*: Pending.
- [Pending] **Build and Verification**: Run `./scripts/verify.sh` to clean compiler caches (`rm -rf .next`), run lints, check TypeScript types, and execute a verification build.
  - *Status*: Pending.
