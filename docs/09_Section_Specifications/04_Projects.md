# **Deployed Systems (Mission Infrastructure)**

## **Purpose**

The Deployed Systems section (`#deployments`, backwards-compatible with `#projects`) is the primary operational proof-of-work library for the portfolio. It showcases production-deployed platforms, commercial scoping engines, cognitive AI architectures, and observability tooling engineered across the full Forward Deployed Engineer (FDE) lifecycle.

---

## **Product Philosophy**

Deployed Systems prove authentic FDE execution. Rather than listing disconnected student apps or toy prototypes, this section demonstrates a unified 5-pillar operating ecosystem:
1. **Retriever AI** (`/rag`): Enterprise Cognitive Retrieval & Multi-Tenant RAG
2. **Scoping Studio** (`/scoping`): Autonomous Client Discovery & SOW Compiler
3. **Client Workspace** (`/dashboard`): Commercial Mission Control & Automated Tenant Provisioning
4. **PrateekSync AI** (`scripts/synchronizer.py`): Local Streamlit CMS & AST Architecture Knowledge Engine
5. **Systems Terminal** (`/terminal`): Interactive Web CLI & Realtime Diagnostics Shell

---

## **User Goals**

* **Enterprise Clients & Founders**: Test live systems, evaluate commercial scoping rigor, and verify closed-loop delivery capabilities.
* **Engineering Leaders**: Audit architectural topologies (Hexagonal, pgvector, AST graphs, local Ollama on VPS), code quality, and security boundaries.

---

## **Behavior**

* Systems are rendered in a responsive Bento Grid (flagship hero card spanning the top row, with a 2×2 grid of systems below) with retro browser window chrome, system role tags (`SYS-01` through `SYS-05`), and live telemetry pulse badges (`● LIVE ON ORACLE VPS`, `● REALTIME PRICING ENGINE`, `● PKCE SESSION GATE`, `● LOCAL STREAMLIT COCKPIT`, `● LIVE WEB TELEMETRY`).
* Selecting a card opens an in-depth case study modal featuring Mission & Overview, Architecture & Stack, and Engineering Challenges & Solutions.
* Direct action buttons allow instant navigation to live applications and source code inspection.

---

## **Adaptive Behavior**

* **Developer Mode**:
  * Title: `DEPLOYED SYSTEMS`
  * Prioritizes technical architecture descriptions, infrastructure topologies, and GitHub repositories.
* **Business Mode**:
  * Title: `SYSTEM ARCHITECTURE & DEPLOYMENTS`
  * Prioritizes business pain points, ROI, requirement modeling, and commercial delivery transparency.
* **Visual Identity (Azure/Noir)**:
  * Azure: Cold-press paper cards, terracotta & slate blue accents, crisp borders.
  * Noir: Obsidian glass panels, glowing cyan and neon green telemetry pulse badges, cyber-monospace typography.

---

## **Content Requirements**

* **Database Columns**: `slug`, `title`, `description`, `longDescription` (markdown), `description_business`, `longDescription_business` (markdown), `image`, `tags` (JSONB), `liveUrl`, `githubUrl`, `color`, `status` (live/soon/personal).
* **Excluded Content**: Avoid listing unfinished mock templates without explaining their sandbox status.

---

## **CMS Requirements**

Manageable via **Sync Projects** tab:
* Connects to GitHub API to pull repository properties.
* Saves project descriptions, tags, and variants to the database.

---

## **Analytics**

* Anonymous clicks on "Visit GitHub" or "View Live Demo".
* Count of case study reads and read duration.

---

## **Accessibility**

* Card elements are fully focusable.
* Link targets indicate external routing details (e.g. `aria-label="Visit project live site (opens in new tab)"`).

---

## **Performance**

* Project screenshots are lazy-loaded and optimized using Next.js Image settings.
* Dynamic import used for markdown parsers inside case study displays.

---

## **Future Expansion**

* Video demonstration walkthroughs.
* Direct interactive code sandboxes for key features.

---

## **Acceptance Criteria**
- Project details are fetched dynamically from the database.
- Case study text adapts to the selected Communication Identity.
- Each project card features a retro minimalist browser window header (`● ● ●` controls and monospace URL bar).
- Hovering or focusing a project card triggers the floating `"EXPLORE CASE STUDY ↗"` badge.
- External links satisfy screen reader accessible labeling.
- Image assets use correct optimized web dimensions.

---

## **Related Architecture & Cross-References**

- [Previous Section: Skills](03_Skills_and_Services.md)
- [Project Case Studies & Deep Links](../BLOG_DEEP_LINKING_MAP.md)
- [Next Section: Playground](05_Playground.md)
- [Architecture Node: Projects Schema](../architecture_nodes/Schema_projects.md)