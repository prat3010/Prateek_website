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
* **Decision**: Use `createPortal(modal, document.body)` to render modals at the document body level, escaping the `ScrollSection` DOM hierarchy. The modal's `position: fixed` now correctly targets the viewport. Background scroll is locked via `body.style.overflow = 'hidden'` + `lenis.stop()`.
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

# **Acceptance Criteria**
- Registry records cover the core v2 architectural choices.
- Format follows standard ADR structures (Context, Decision, Consequences).
