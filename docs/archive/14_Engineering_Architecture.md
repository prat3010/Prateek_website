# **14. Engineering Architecture**

## **Purpose**

The Engineering Architecture outlines the technical stack, codebase organization, state propagation patterns, and execution flow of Adaptive Portfolio. It enforces coding standards that ensure the application remains modular, type-safe, and highly performant.

---

# **The Technology Stack**

Adaptive Portfolio is built on a modern, robust web stack:
* **Core Framework**: **Next.js 16 (App Router)** & **React 19**.
* **Language**: **TypeScript** (Strict mode enabled).
* **Styling**: **CSS Modules** (`*.module.css`) for complete component-level style isolation.
* **Scroll Engine**: **Lenis** client-side smooth scrolling.
* **Animations**: **Framer Motion** for state transitions and micro-animations; **Three.js** (WebGL) for playground effects.
* **Database & Auth**: **Supabase** (server-side only via service-role authentication).
* **Transactional Email**: **Resend API**.

---

# **Codebase Organization**

The repository is structured logically to separate business logic, assets, and presentation layers:

```text
  ├── .github/workflows/      # CI/CD deployment and DB sync actions
  ├── docs/                   # Product & Engineering documentation
  ├── public/                 # Static assets (images, fonts, vector SVGs)
  ├── scripts/                # Local automation helpers (Synchronizer, tests, seeders)
  └── src/
      ├── app/                # App router layouts, route components, and API handlers
      ├── components/         # Modular sections and UI component library
      ├── content/            # Markdown posts for the blog
      ├── context/            # React global state providers (Theme, Scroll)
      ├── data/               # Local fallback data and static TS type definitions
      ├── hooks/              # Reusable custom React hooks
      ├── lib/                # Data access utilities and markdown parsers
      ├── proxy.ts            # Proxy middleware for request logging
      └── utils/              # Client-side utility functions (PDF generation)
```

---

# **Identity State Propagation**

The selected audience profile and visual theme are propagated across the application through server-side cookie checks and React context:

```text
       [Root Layout (Server)]  ◄── Parses Cookies (theme, audience)
             │
             ▼
     ┌────────────────┐
     │  ThemeProvider │  ── Tracks: Visual Theme (Azure/Noir)
     └───────┬────────┘            Communication Identity (Dev/Business)
             ▼
     ┌────────────────┐
     │  LenisProvider │  ── Initializes client-side smooth scroll container
     └───────┬────────┘
             ▼
       [Page Content]
```

### **Theme & Identity Context Rules**
* **Server-First Preference**: Theme and audience state are extracted from HTTP cookies on the server to prevent layout jumps or flashing (CLS).
* **Lazy Client Sync**: Initialize state in the ThemeProvider using server-propagated cookie values. Synchronize `localStorage` values client-side on mount.
* **Independent States**: Setting the theme must not alter the active communication identity, and vice versa.

---

# **CSS Modularity & Styling Pattern**

To avoid styling pollution:
1. **Globals Limit**: `src/app/globals.css` is restricted to global theme variables, root resets, and typography setups.
2. **CSS Modules**: Every UI component must define its styles in a matching `.module.css` file.
3. **No Utility Frameworks**: The codebase relies on standard, encapsulated CSS modules. TailwindCSS or external utility classes should not be mixed in unless requested.

---

# **Routing & Middleware (Proxy)**

* **App Router Navigation**: The directory `src/app/` serves pages statically or dynamically. 
* **Proxy Middleware**: `src/proxy.ts` executes server-side, intercepting requests to log anonymous analytics visits in Supabase. It uses edge-compatible service configurations and handles geolocation injection.

---

# **Acceptance Criteria**
- Code organization strictly adheres to the folder directory structure.
- Client state propagation relies on server-initialized cookie metrics to prevent visual shifts.
- Component styles are managed exclusively via CSS modules; inline styles are prohibited.
- Next.js proxy middleware intercepts request patterns without blocking static page delivery.
