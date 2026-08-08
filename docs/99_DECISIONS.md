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
* [ADR 10: Full-Panorama Mobile Skyline with Desktop-Parity Parallax](#adr-10-full-panorama-mobile-skyline-with-desktop-parity-parallax)

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

# **ADR 10: Full-Panorama Mobile Skyline with Desktop-Parity Parallax**

* **Status**: Approved
* **Context**: The skyline backdrop renders six 1920×1080 SVG layers (sky, background, far-midground, midground, bridge, foreground) fixed behind all sections, with per-layer scroll parallax (scale up to 1.4, y down to 75px) and mouse-parallax springs. Originally `reducedMotion` was forced `true` on every phone (`width ≤ 768 || coarse pointer`), freezing all parallax and CSS animations and unmounting every character, leaving a static center-cropped `slice` of the panorama (scene x≈[719,1201] on a 390px phone) — the fun perimeter (billboard pigeon x≈135, cat x≈325, clock x≈1275, gargoyle x≈1426, fire pigeon x≈1675) was permanently cropped out.
* **Decision**: Give mobile a full-panorama composition with desktop-parity motion instead of a cropped slice, and no horizontal panning:
  * **State split**: `isMobile` (width ≤ 768 or coarse pointer) is tracked separately from `reducedMotion` (OS `prefers-reduced-motion` or `hardwareConcurrency < 4`). Phones regain the desktop scroll parallax, CSS animations, and characters; OS-level reduced motion still freezes everything.
  * **Whole-scene composition**: on mobile every layer switches its SVG `preserveAspectRatio` from `xMidYMax slice` to `xMidYMax meet` — the entire 1920-wide scene is letterboxed and bottom-anchored in the tall portrait viewport. Desktop keeps `slice` (byte-identical behavior).
  * **Sky extension**: the area above the letterboxed band is painted by `.mobileSkyline { background: var(--skyline-sky-bg); }` — `#e5f6fd` in popart, `transparent` in noir (page bg shows through) — so the extension is seamless with the band's own flat sky fill. No extra decorative layers.
  * **Parallax parity**: the layer stack uses the exact desktop scroll transforms (scale/y per layer); only the mouse-parallax springs remain desktop-only (no mouse on phones). No panning — the parallax zoom (bottom-anchored, scale ~1.4 at page bottom) is the only motion.
  * **Characters & animations**: all characters (cat, gargoyle, billboard/fire pigeon, realtime clock) and CSS animations render on mobile whenever `reducedMotion` is false — the full panorama means everything is always on screen, matching desktop.
* **Consequences**:
  * **Pros**: The whole panorama (billboard, cat, clock, gargoyle, laundry) is visible at once on phones; mobile motion is exactly desktop-parity; the sky extension is a one-line theme-var background, seamless in both themes; zero horizontal-crop weirdness.
  * **Cons**: On narrow portrait phones the 16:9 scene renders as a ~250px band (≈90px of buildings) at the bottom — small; full desktop life means ~40 CSS animations plus 5 character tick loops run on phone CPUs (the old mobile path skipped all of it); character positions now depend on the whole scene being visible.
  * **Implementation gotchas (found via mobile-simulator QA)**:
    1. **Reduced-motion decoupling**: `reducedMotion` must NOT include the mobile check — the previous design folded `isMobileDevice` into it, which silently froze everything on phones.
    2. **Preserve-aspect-ratio flip**: the `meet`/`slice` switch must be applied to both SVGs in each layer file (the main scene SVG and the pointer-events-none flicker/neon overlay SVG), or the animated overlay desyncs from the buildings.

---

# **ADR 11: Single-Source Pricing & Commission Modules**

* **Status**: Approved
* **Context**: Engine, add-on feature, brand asset, care plan, and goal-archetype prices were edited in three parallel places (the Scoping wizard's TS constant arrays, `resume.json` `intake.*`, and the commercial PDFs), while the Middleman agreement's commission tiers were a hard-coded 3-row table with hand-written band ranges and cut percentages in two renderers plus `SiteInfoConsole` and the agreement modal. Every price retune required hunting down duplicated numbers, and the rates drifted (e.g. stale ₹25k–45k tiers after the 2026-08 price revision).
* **Decision**: Centralize all commercial pricing into two read-only source-of-truth modules consumed by the wizard, resume cards, PDFs, modal, and console:
  * `src/lib/pricing.ts` — `Currency` (`'INR' | 'USD'`), `ESTIMATE_DISCLAIMER`, `CARE_OVERAGE_DEFAULT`, `formatMoney`/`formatPricePair`/`resolveDefaultCurrency` (geo-IP `region` cookie `'india'` → INR, otherwise USD), `calcQuote` (engine + features + brand + care with per-line INR/USD totals), `resolveFeatureDependencies` (transitive `dependsOn` resolution), and `packageTotalForArchetype`/`packageTotals` (recommended engine + compulsory feature labels → verified package totals). Prices themselves live in `src/data/intakeQuestionnaireDefaults.json` (engines/features/goals/brandAssets/maintenancePlans), never in TS.
  * `src/data/commissionConfig.json` + `src/lib/commission.ts` — non-overlapping bands A/B/C (₹1–75,000/$1–1,000 → 10%; ₹75,001–2,49,999/$1,001–3,299 → 12%; ₹2,50,000+/$3,300+ → 15%), `recurringRate` 10%, `depositSplit` 0.5, `disbursementWindow` "48 business hours", and the illustrative SaaS example (₹3,20,000 → Band C → ₹48,000 → ₹24,000 per half). `getCommissionBand` and `calculateCommission` resolve a contract value to its band and payout.
  * Consumers: `IntakeForm` (wizard + currency toggle), `Resume.tsx` package/care cards, `ScopingBriefPDF` (config-derived fallback totals), `ServicesAndPricingPDF`, `MiddlemanAgreementPDF` + `scripts/generate-middleman-pdf.mjs` (band-derived table, worked example, config window), `MiddlemanAgreementModal`, and `SiteInfoConsole`. The Synchronizer's middleman form now shows the band schedule read-only instead of free-text tier percentages, and the Scoping Questionnaire tab edits `dependsOn` and care-plan SLA fields.
* **Consequences**:
  * **Pros**: One price edit in the defaults JSON (or `commissionConfig.json`) propagates everywhere; both renderers now derive the cut percentages from the config bands instead of hard-coded `'10%'`/`'12%'`/`'15%'` strings; boundary behavior (₹75,000 vs ₹75,001, $1,000 vs $1,001, $3,299 vs $3,300) is unit-tested in `src/lib/__tests__/pricing.test.ts` and `commission.test.ts`; all 8 goal archetypes assert their approved totals.
  * **Cons**: The legacy `tier1Commission`/`tier2Commission`/`tier3Commission`/`recurringCommission` fields remain in profile data as deprecated fallbacks (the PDFs still honour them when set, preferring the config); anyone editing band thresholds must edit `commissionConfig.json` directly; `intakeQuestionnaireDefaults.json` must stay in sync with `resume.json` `intake.*` and the Synchronizer's defaults.
* **2026-08 Addendum**: (1) The feature roster grew from 10 to 14 modules with `pwa` (₹35k/$450), `i18n` (₹30k/$400), `integrations` (₹40k/$550), and `video` (₹65k/$850), all optional add-ons (none wired as compulsory archetype features) — the guide PDF moved the brand section to its own page to absorb them (see ADR 12). (2) `packageTotalForArchetype` now resolves transitive `dependsOn` into the package total (and the guide's goal table prints the same resolved list), so package cards always match the wizard quote — the booking archetype's total includes the `auth` module it depends on (₹1,90,000 not ₹1,65,000). (3) Zero-priced rows in `ServicesAndPricingPDF` render `INCLUDED`/`Complimentary` again, care-plan SLA rows fall back to generic copy when live profile data lacks the new fields, and `formatPricePair` groups USD with thousands separators.

---

# **ADR 12: Theme-Density Font Scaling for Fixed-Page-Count Commercial PDFs**

* **Status**: Approved
* **Context**: The commercial PDF trio uses two theme fonts — azure renders body copy in Lora (proportional) while noir uses JetBrains Mono (monospace, visibly wider). For identical content and font sizes the noir render of `ServicesAndPricingPDF` spilled from 4 to 6 pages and `MiddlemanAgreementPDF` from 3 to 4, pushing orphan pages (a lone brand-asset row, the CTA box, or a split signature heading).
* **Decision**: Add `pdfFontScale(theme)` / `scaleBodyFont(theme, size)` to `src/components/pdf/pdfTheme.ts`. Noir scales body font sizes to 88% of azure so both themes produce identical page counts (pricing 5, scoping 3, middleman 3) while keeping the noir brand lockup (header/title sizes) untouched. `MiddlemanAgreementPDF` keeps its `wrap={false}` signature grid so the signature block never splits across pages. In 2026-08 the Services & Pricing guide grew from 4 to 5 pages (feature table expanded to 14 modules and the brand/content section moved to its own page); `pdf-smoke.test.ts` asserts 5/3/3.
* **Consequences**:
  * **Pros**: Noir PDFs fit the same fixed page counts as azure with no orphan pages; body text remains readable (only ~12% smaller); a single multiplier controls density.
  * **Cons**: Noir body text is slightly smaller than azure by design; if the defaults JSON adds content the fixed page counts must be re-verified (the pdf-smoke tests assert the exact counts in both themes).

---


---

# **ADR 13: Client Workspace Dashboard & Safari-Compliant Universal Auth Architecture**

* **Status**: Approved
* **Context**: Clients generating commercial quotes on `prateeq.in/scoping` needed a workspace dashboard (`/dashboard`) to review active project scopes, customize features live, export PDF proposal briefs, track development milestone stages (`Architecture` → `Engineering` → `Staging` → `Production`), and access managed RAG services. Authentication required seamless Google OAuth integration with Supabase Auth, but Safari's Intelligent Tracking Prevention (ITP) blocked cross-site `localStorage` writes during OAuth redirects, causing sessions to drop on return.
* **Decision**:
  1. **Client Workspace Dashboard (`/dashboard`)**: Built `src/app/dashboard/page.tsx` with Google profile confirmation, interactive feature customizer, commercial PDF exporter, milestone delivery tracker, invoice ledger, and Retriever AI studio workspace links.
  2. **Universal Dual-Storage Adapter**: Configured `@supabase/supabase-js` with a custom storage adapter (`src/lib/auth.ts`) that writes authentication tokens to both `SameSite=Lax` HTTP cookies (`prateeq_active_user`) and `localStorage`. If Safari clears `localStorage` during an external redirect, the cookie fallback preserves the token 100%.
  3. **Direct JWT Hash Parser**: Created a direct JWT parser inside `AuthProvider` (`src/context/AuthContext.tsx`) that reads `#access_token=...` from `window.location.hash` upon returning from Supabase Auth. It decodes the authentic JWT payload (`email`, `user_metadata`), sets state synchronously, saves the session, and cleans up the address bar via `window.history.replaceState`.
  4. **Backend & Tooling Integration**: Created `/api/client/save-scope` REST route and Supabase `client_orders` table definition (`supabase_schema.sql`). Added a dedicated Client & Delivery Command Center tab in the Streamlit Synchronizer (`scripts/sync_tabs/clients.py`) for live milestone management.
* **Consequences**:
  - **Pros**: 100% session persistence on Safari across macOS and iOS; zero page layout shifts or state flashes; clean address bar URLs.
  - **Cons**: Requires `https://prateeq.in/dashboard` and `https://prateeq.in/**` to be explicitly added to Supabase Auth's Redirect URLs whitelist.

---

# **ADR 14: Client Scope API Session Gating & Client-Editable Field Isolation**

* **Status**: Approved
* **Context**: The client scope endpoints (`/api/client/get-scopes`, `/api/client/save-scope`) accepted any caller-supplied email, so anyone could read another client's quote details or upsert arbitrary scopes. Additionally, the save endpoint's unconditional `upsert` always rewrote `status: 'Draft Proposal'`, clobbering synchronizer-managed delivery state whenever a client edited features or profile details. Dead Razorpay-era columns (`payment_id`, `gateway_order_id`) were still declared in the schema and surfaced as a hardcoded `DIRECT / WIRE` gateway badge in the invoice ledger.
* **Decision**:
  1. **Server-Side Session Verification**: New `src/lib/sessionVerify.ts` (server-only) extracts the `Authorization: Bearer <access_token>` header and resolves the verified session email via `supabase.auth.getUser(token)`. Both client scope routes derive the canonical `client_email` exclusively from that verified email and ignore email params/bodies. Requests without a valid token get `401`.
  2. **Field Isolation on Save**: `save-scope` now checks for an existing `scope_code`; existing orders are updated with client-editable columns only (`company_name`, `client_phone`, `base_engine`, `features`, `brand_asset`, `maintenance_plan`, totals, `currency`, `timeline`, `updated_at`) so server-managed fields (`status`, `delivery_stage`, `deposit_paid`) set by `scripts/sync_tabs/clients.py` survive client edits.
  3. **Dashboard Re-Auth UX**: The dashboard sends the session token on both scope calls and surfaces an inline "Sign In Again" banner on `401`.
  4. **Dead-Column Cleanup**: Removed `payment_id`/`gateway_order_id` from `supabase_schema.sql` and dropped the invoice ledger's Gateway column plus the synchronizer's Payment Ref display.
  5. **Degraded Mode Preserved**: When Supabase env vars are absent (dev/CI), both routes keep the legacy no-op behavior (empty scopes / acknowledged save) without enforcement.
* **Consequences**:
  - **Pros**: No client can read or write another client's scopes; server-managed delivery state is never clobbered by client edits.
  - **Cons**: The live Supabase `client_orders` table had the dropped columns applied at deployment time (the columns no longer exist on the live table, matching `supabase_schema.sql`; no migration drift). Restored sessions without a refreshable access token hit the 401 banner until re-login.

---

# **ADR 15: Client Dashboard Hardening — RLS Scoping, Fresh-Token Resolution, and RAG Tab Removal**

* **Status**: Approved
* **Context**: Three follow-ups from the ADR 14 hardening pass: (1) `client_orders` still carried a public-read RLS policy, leaving a hole if any future code path touched Supabase directly from the client; (2) the dashboard sent `session.access_token` captured in React state, which could go stale on long-lived tabs and trigger avoidable `401` banners after token expiry; (3) the dashboard's "Managed RAG Services" tab claimed an active retriever tenant and linked to `/rag/app`, but the retriever backend (external repo, `apps/api/src/routers/auth.py`) still expects its own auth/tenant flow — cross-site SSO (retriever ROADMAP M51) is still planned, so the tab made unverified claims about a product that is not yet integrated.
* **Decision**:
  1. **Session-Scoped RLS**: Replaced the `Allow public select client_orders` policy in `supabase_schema.sql` with `Clients can select own scopes` (`auth.jwt() ->> 'email' = client_email`). Writes remain service-role only; API routes and synchronizer tooling are unaffected.
  2. **Fresh-Token Resolution**: Added `getAccessToken()` to `AuthContext` — it reads the current session via `supabaseAuth.auth.getSession()`, returns the token when unexpired (JWT `exp` check), otherwise refreshes via `auth.refreshSession(refresh_token)`. Dashboard fetches (`save-scope`, `get-scopes`) and the IntakeForm save path now resolve the token at call time instead of borrowing the stale React-state token; `null` triggers the existing re-auth banner. The `401`-then-banner path remains the final fallback.
  3. **RAG Tab Removal**: Deleted the "Managed RAG Services" tab (state union, tab button, content block) and its CSS from the Client Workspace Dashboard. Reintroduce only when the retriever SSO/tenant integration is completed.
* **Consequences**:
  - **Pros**: Defense-in-depth on `client_orders` reads even with a client-side key; scope calls always carry a live JWT (fewer spurious 401s); dashboard no longer claims a RAG tenant that does not exist.
  - **Cons**: The new RLS policy requires a manual SQL apply on the live Supabase instance (same workflow as ADR 14). `getAccessToken()` consumers are async, so any future dashboard action must await it before fetching. **Live-DB drift discovered**: the live `client_orders` table was still the legacy Razorpay-era shape (`user_email`, `selected_features`, `total_cost`, `base_engine_id/title`, `gateway`, `payment_status`, `development_status`, `receipt_url`, `pdf_brief_key`) because `CREATE TABLE IF NOT EXISTS` in `supabase_schema.sql` silently skips existing tables — the ADR-13 definition was never applied live (table was empty, so drop+recreate was the clean fix). `client_subscriptions` is a similarly orphaned legacy table not referenced in the portfolio codebase.

---

# **Acceptance Criteria**
- Registry records cover the core v2 architectural choices.
- Format follows standard ADR structures (Context, Decision, Consequences).

