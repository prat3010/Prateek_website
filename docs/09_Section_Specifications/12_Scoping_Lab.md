# **12. Project Scoping Lab & Instant Quote Wizard (`/scoping`)**

## **Purpose**

> 📌 **Master Product Requirements & v2 Architecture:** For the forward-looking SOTA Scoping Engine and Client Workspace PRD, see [`docs/25_SOTA_Scoping_Engine_PRD.md`](file:///Users/prateeksharma/Developer/Prateek_website/docs/25_SOTA_Scoping_Engine_PRD.md).

The **Project Scoping Lab** (`/scoping`) provides an interactive, client-driven scoping wizard where potential clients can configure web engineering projects, select base architecture engines, customize feature modules, choose brand identity assets, pick maintenance care plans, and generate instant region-aware commercial proposals (INR/USD) with client-side PDF export (`ScopingBriefPDF`).

---

## **Key Features & Capabilities**

1. **Base Engine Tiers**:
   - **High-Conversion Landing Page**: 1-page modern web experience (Fast SLA, standard SEO, custom UI components).
   - **Multi-Page Web Platform**: Full marketing website or corporate site with routing, CMS integration, and dynamic layouts.
   - **SaaS / Web App Studio**: Production-grade full-stack Web Application with authentication, API design, database schemas, and analytics.

2. **Add-on Feature Modules (14 Specialized Modules)**:
   - Dynamic modules: `auth`, `db`, `cms`, `search`, `analytics`, `payments`, `ai`, `pwa`, `i18n`, `integrations`, `video`, `admin`, `pdf`, `realtime`.
   - **Transitive Dependency Resolution (`dependsOn`)**: Selecting advanced features automatically resolves and includes required prerequisite modules (e.g., `admin` requires `auth`, `payments` requires `auth` & `db`). Resolvers are implemented in `src/lib/pricing.ts` (`resolveFeatureDependencies`).

3. **Goal Archetypes & Compulsory Features**:
   - Archetypes (e.g., *Startup MVP*, *SaaS Platform*, *Enterprise Revamp*) pre-select recommended base engines and mandate compulsory modules.

4. **Brand Asset & Maintenance Care Plans**:
   - **Brand Asset Tiers**: None, Standard Brand Kit, Premium Design System.
   - **Care & Maintenance Plans**: None, SLA Essential Support, Priority Growth Maintenance.

5. **Region-Aware Dynamic Pricing Engine**:
   - Pricing logic resides strictly in [`src/lib/pricing.ts`](file:///Users/prateeksharma/Developer/Prateek_website/src/lib/pricing.ts).
   - Resolves currency (`INR` vs `USD`) via geo-IP detection (`region` cookie).
   - Package totals and itemized pricing are calculated dynamically (`calcQuote`).

6. **Deep-Linking Support**:
   - Deep-link query parameters allow direct navigation to specific wizard states:
     - `?engine=landing|multipage|saas`
     - `?goal=<archetype_id>`

7. **Client-Side PDF Exporter**:
   - Generates and downloads a custom commercial proposal PDF ([`ScopingBriefPDF.tsx`](file:///Users/prateeksharma/Developer/Prateek_website/src/components/pdf/ScopingBriefPDF.tsx)) client-side using `@react-pdf/renderer` and shared brand design tokens (`pdfTheme.ts`).

8. **Direct Save & Scope Confirmation**:
   - Authenticated clients can save their configured scope directly to Supabase (`client_scopes` table) via `/api/client/save-scope`, which automatically surfaces the scope in their Client Workspace Dashboard (`/dashboard`).

---

## **Data Flow Architecture**

```
 [User Configures Scope] ──► [src/lib/pricing.ts] ──► [Calculates Quote (INR/USD)]
          │                                                   │
          ├───────────────────────────────────────────────────┤
          ▼                                                   ▼
 [/api/client/save-scope]                             [ScopingBriefPDF]
          │                                           (Instant PDF Download)
          ▼
 [Supabase: client_scopes]
          │
          ▼
 [Client Workspace Dashboard: /dashboard]
```

---

## **Acceptance Criteria**

- Base engine selection updates project scope estimate instantly.
- Feature module toggles dynamically calculate transitive dependencies (`dependsOn`).
- Currency automatically defaults to INR or USD based on visitor geo-location cookie.
- Clicking "Download Proposal PDF" generates a multi-page styled PDF matching active brand identity tokens (Azure / Noir).
- Scope brief saves seamlessly to client profile when authenticated via Google OAuth.
