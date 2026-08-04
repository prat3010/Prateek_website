# **99. Architectural Decision Records (ADRs)**

## **Purpose**

This document serves as the registry of critical architectural design decisions made during the development of Adaptive Portfolio v2. Each record describes the context, decision details, alternatives, and consequences of a design choice.

---

# **Registry Index**

* [ADR 01: CSS Modules for Modular Styling](#adr-01-css-modules-for-modular-styling)
* [ADR 02: On-Demand Cache Revalidation](#adr-02-on-demand-cache-revalidation)
* [ADR 03: GDPR Telemetry via Daily IP Hashing](#adr-03-gdpr-telemetry-via-daily-ip-hashing)
* [ADR 04: Dual-Write Content Platform with JSON Fallbacks](#adr-04-dual-write-content-platform-with-json-fallbacks)
* [ADR 05: Portal Modals to Escape ScrollSection Containing Block](#adr-05-portal-modals-to-escape-scrollsection-containing-block)
* [ADR 06: Visual Redesign from Legacy Zine to Modern Card Aesthetic](#adr-06-visual-redesign-from-legacy-zine-to-modern-card-aesthetic)
* [ADR 07: Config-Driven Sales Partner Agreement with Single Prose Source](#adr-07-config-driven-sales-partner-agreement-with-single-prose-source)
* [ADR 08: Config-Driven Scoping Questionnaire with Shared Defaults JSON](#adr-08-config-driven-scoping-questionnaire-with-shared-defaults-json)
* [ADR 09: Brand-Themed PDFs with Embedded Site Fonts](#adr-09-brand-themed-pdfs-with-embedded-site-fonts)

---

# **ADR 01: CSS Modules for Modular Styling**

* **Status**: Approved
* **Context**: The site requires independent style configurations for multiple visual identities (Azure, Noir) across modular sections. Using global stylesheets risks styling leakage and class name collisions.
* **Decision**: We chose to implement CSS Modules (`.module.css`) for all component styling, keeping `globals.css` minimal.
* **Consequences**:
  * **Pros**: Styles are fully scoped to their components; prevents styling leaks.
  * **Cons**: Dynamic styles must rely on CSS variables or conditional class name composition.

---

# **ADR 02: On-Demand Cache Revalidation**

* **Status**: Approved
* **Context**: Fetching data from Supabase on every request degrades page performance. However, traditional build-time static generation requires full redeploys to display content updates.
* **Decision**: Implement Next.js `unstable_cache` with tag-based invalidations. The cache is purged on-demand when the Streamlit CMS calls `/api/revalidate?secret=SYNC_API_KEY`.
* **Consequences**:
  * **Pros**: Pages load instantly; content updates reflect instantly without rebuilds.
  * **Cons**: Requires keeping api secret keys in sync.

---

# **ADR 03: GDPR Telemetry via Daily IP Hashing**

* **Status**: Approved
* **Context**: Visitor metrics must be logged to understand engagement without storing PII (IP addresses) or violating GDPR guidelines.
* **Decision**: Perform daily IP hashing in the server-side proxy middleware. We hash the IP address, User-Agent, and a daily rotating salt using SHA-256.
* **Consequences**:
  * **Pros**: GDPR compliant; unique visitors can be counted daily without storing personal data.
  * **Cons**: Visitor sessions cannot be linked across multiple days.

---

# **ADR 04: Dual-Write Content Platform with JSON Fallbacks**

* **Status**: Approved
* **Context**: If Supabase is unreachable or env keys are missing (such as in offline development), the website must not crash.
* **Decision**: Implement a dual-write transaction contract inside the local CMS. It updates Supabase first, and writes to local fallback JSON files in the repo only upon database success. Next.js falls back to reading these JSON files if database queries fail.
* **Consequences**:
  * **Pros**: High resilience; the site works offline; local code fallbacks act as a backup.
  * **Cons**: Local repository files must be staged and committed to keep git and database schemas in sync.

---

# **ADR 05: Portal Modals to Escape ScrollSection Containing Block**

* **Status**: Approved
* **Context**: `ScrollSection` wraps every page section in an `m.div` with `will-change: transform` (CSS) and a dynamic Framer Motion `transform: translateY(...)`. Per the CSS spec, both properties establish a new containing block for all `position: fixed` descendants. Any modal rendered inside a `ScrollSection` (e.g., the project detail modal) has its `position: fixed; inset: 0` resolved relative to the `m.div`, not the viewport. Combined with `.projects { overflow: hidden }`, the modal gets clipped to the section boundaries and cannot scroll.
* **Decision**: Use a reusable `<Portal>` component (`src/components/ui/Portal.tsx`) wrapping React's `createPortal` to render modals at the document body level, escaping the `ScrollSection` DOM hierarchy. The modal's `position: fixed` now correctly targets the viewport. Background scroll is locked via `body.style.overflow = 'hidden'` + `lenis.stop()`.
* **Consequences**:
  * **Pros**: Modals work correctly with viewport-relative positioning and native overflow scroll; no need to modify `ScrollSection` or Framer Motion scroll animations.
  * **Cons**: Modals are detached from their React tree (focus management, event bubbling must be handled explicitly). Any new fullscreen overlays in the codebase must also use portals.


# **ADR 06: Visual Redesign from Legacy Zine to Modern Card Aesthetic**

* **Status**: Approved
* **Context**: The original vintage zine style (thick borders, hard block shadows, offset translations on active click) was highly distinctive but introduced visual clutter on pages with data (analytics dashboard, Visualizer stats) and projected an overly informal tone for professional recruiters or business clients.
* **Decision**: We migrated the entire UI across all components and administrative sections (Playground, SiteInfoConsole, OnboardingSelector) to a unified card aesthetic:
  * Replaced thick borders (3px-5px) with thin borders (`1px solid var(--color-border)`).
  * Replaced hard block shadows with soft, modern drop shadows (`box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04)`).
  * Rounded corners globally using `border-radius: 12px` (or `8px` for compact controls).
  * Standardized hover effects to use subtle vertical translations (`transform: translateY(-2px)` + soft elevated shadows) and active states to lay flat (`transform: translateY(0)`).
  * Preserved the signature high-contrast outline in Cyber-Noir mode by substituting flat shadows with vibrant glowing neon accents (`box-shadow: 0 0 15px <accent-color>`).
* **Consequences**:
  * **Pros**: Visually clean, premium layout; excellent scanability and readability in dashboards; consistent state transitions across all buttons/toggles.
  * **Cons**: Marginally less visual eccentricity compared to the original raw zine styling.

---

# **ADR 07: Config-Driven Sales Partner Agreement with Single Prose Source**

* **Status**: Approved
* **Context**: The Middleman Partnership Agreement was hard-coded as a fixed 2-page document duplicated across `src/components/pdf/MiddlemanAgreementPDF.tsx`, `scripts/generate-middleman-pdf.mjs`, and `SiteInfoConsole`, with editable rule arrays (`disbursementRules`/`confidentialityRules`) that the PDF renderers ignored. Editing prose required code changes in three places.
* **Decision**: The agreement became a flowing, fully config-driven document:
  * `src/data/middlemanAgreementDefaults.json` is the single source of default prose (13 numbered sections + signature + "Agreed Electronically" clause), with `{{token}}` placeholders (`partnerName`, `developerName`, etc.) substituted at render time.
  * `middlemanAgreement.sections` in the profile data (Supabase + local fallback) overrides defaults per partner; both PDF renderers fall back to the defaults JSON when sections are absent (no schema migration).
  * Both renderers now use a single flowing `<Page>` with live `Page N of Y` footers via `@react-pdf/renderer` v4 `Text.render` (index.d.ts:241-248), removing the hard-coded 2-page assumption.
  * The synchronizer's Partner & Scoping tab exposes per-section heading/line editors and a "Reset Agreement Prose to Defaults" button.
* **Consequences**:
  * **Pros**: Whole agreement editable from the CMS without code changes; commission/recurring rows and signature block stay consistent; prose lives in one canonical JSON.
  * **Cons**: The two renderers (TSX + mjs) must remain manually in sync (a header comment enforces this); legal text is not versioned per-partner beyond the profile JSON.

---

# **ADR 08: Config-Driven Scoping Questionnaire with Shared Defaults JSON**

* **Status**: Approved
* **Context**: The Project Scoping Lab wizard (`IntakeForm.tsx`) hard-coded its pricing config (base engines, feature modules, goal archetypes, brand asset tiers, care plans) as five exported TypeScript constant arrays, and the scoping page renders the wizard with profile data (`intake.*`). Editing prices or archetypes required code changes; the synchronizer had no way to adjust the questionnaire.
* **Decision**: The wizard config became data-driven with a three-tier fallback:
  * `src/data/intakeQuestionnaireDefaults.json` is the single source of default config, shared by `IntakeForm.tsx`, the synchronizer's **🧾 Scoping Questionnaire** tab, and `seed_supabase.py` (which merges defaults into freshly seeded `profile.data.intake`).
  * The wizard resolves each section in this order: `intake.<section>` from profile data (Supabase, with local fallback) → JSON defaults → nothing. No TS-side duplication of the config.
  * The five item interfaces moved to `src/data/resume.ts` and `IntakeConfig` gained optional `engines/features/goals/brandAssets/maintenancePlans` arrays (no schema migration needed — optional keys).
  * `IntakeForm.tsx` keeps compatibility re-exports (`BASE_ENGINES`, `FEATURE_MODULES`, `GOAL_ARCHETYPES`, `BRAND_ASSET_OPTIONS`, `MAINTENANCE_PLANS`) backed by the defaults JSON.
  * The synchronizer tab edits all five sections plus timeline options via `st.data_editor` grids (nested list fields comma-encoded), runs `validate_questionnaire()` in `scripts/sync_validation.py` before persisting (duplicate IDs, unknown engine references, unknown feature labels, non-negative prices), saves through the standard `write_resume_file()` pipeline (Supabase → `src/data/resume.json` → revalidation), and offers a "Reset to Defaults" button.
  * The Services & Pricing Guide PDF (`ServicesAndPricingPDF.tsx`) renders its base-engine and care-plan tables from the same `intake.engines` / `intake.maintenancePlans` config (exact prices), so synchronizer price edits propagate to the downloaded guide; the guide keeps a static "Tier 4: Enterprise AI RAG" bespoke-quote row that has no engine-pricing source.
* **Consequences**:
  * **Pros**: Pricing tiers and archetype mapping editable from the CMS without code changes; single canonical JSON keeps site, synchronizer, and seed script in sync; validation catches broken references before they reach production.
  * **Cons**: Deep-link presets (`?engine=…`, `?goal=…`) silently fall back to `goals[0]` if an edited config removes a referenced id; the defaults JSON must be kept in sync with any future TS consumers.

---

# **ADR 09: Brand-Themed PDFs with Embedded Site Fonts**

* **Status**: Approved
* **Context**: The commercial PDF trio (Scoping Brief, Services & Pricing Guide, Middleman Agreement) rendered in plain Helvetica with a generic blue line-art "skyline" header, sharing a flat single-palette `pdfTheme.ts`. They looked detached from the website's azure/noir identity (hero "PRATEEQ" in Playfair Display / JetBrains Mono, gremlin logo, pop-art palette).
* **Decision**: Give the commercial trio the website's visual identity while keeping a restrained, print-friendly execution:
  * **Brand fonts**: Static TTFs (Playfair Display 400/700, Lora 400, JetBrains Mono 400/700) live in `public/fonts/`, instantiated from the Google variable fonts via `fonttools varLib.instancer` (a one-off offline operation — never re-run on the site). `src/components/pdf/pdfFonts.ts` holds family constants; registration is split by environment because react-pdf v4's `FontSource` only accepts: absolute URLs (browser, `is-url` rejects relative paths) or `data:font/ttf;base64,…` strings (Node, where a raw Buffer hits `isDataUrl` and crashes on `substring`). `pdfFontsClient.ts` registers absolute `/fonts/…` URLs; `pdfFontsServer.ts` registers base64 data URLs read from disk once per process.
  * **Theme tokens**: `pdfTheme.ts` now exports `PDF_THEMES.azure` (warm cream paper, ink text, pop-red accent, ochre chips, Playfair Display headlines, Lora body, mono labels) and `PDF_THEMES.noir` (near-black paper, neon pink accent, neon yellow chips, all-JetBrains Mono), selected via `getPdfTheme(isNoir)`.
  * **Shared brand header**: `PdfBrandHeader.tsx` renders "PRATEEQ.IN" in the hero brand font with wide tracking and a slight `rotate(-1.5deg)` on a dark banner, closing with `PdfGremlinLogo.tsx` — the navbar gremlin SVG ported to react-pdf `<Svg>` primitives with theme-aware colors. Replaces the skyline line-art in all three docs. `PdfFooter.tsx` adds the gremlin mark beside live page numbers.
  * **Theme propagation**: `isNoir` flows from the calling context — `useTheme()` in `Resume.tsx`/`IntakeForm.tsx`, the modal's own azure/noir preview toggle in `MiddlemanAgreementModal.tsx` — through `pdfGenerator.ts` into each PDF component. The server-rendered agreement route (`/Middleman_Partnership_Agreement.pdf`) reads the visitor's theme via the proxy-stamped `x-theme` header (falling back to the `theme` cookie) so the PDF matches the active azure/noir theme.
* **Consequences**:
  * **Pros**: Downloaded docs match the visitor's active theme; brand fonts and gremlin mark create consistent identity; single shared header/footer/theme modules removed triple-duplicated header code.
  * **Cons**: ~755 KB of TTFs added to `public/`; react-pdf v4's font loading quirks require the split client/server registration (documented in code); dev servers that ran older registration code must be restarted once (react-pdf's `FontStore` is a process-wide singleton that only appends sources). The synchronizer's local `generate-middleman-pdf.mjs` renderer mirrors the same theme tokens and embedded fonts (with an azure/noir `--theme` flag and dashboard radio) so the dashboard-built agreement matches the site's brand design.

---

# **Acceptance Criteria**
- Registry records cover the core v2 architectural choices.
- Format follows standard ADR structures (Context, Decision, Consequences).
