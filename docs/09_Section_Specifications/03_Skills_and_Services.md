# **Skills & Services Section**

## **Purpose**

The Skills & Services section communicates capability with ultra-premium architectural clarity. In Developer Mode, it displays 14 curated technical power skills, category breakdowns, and competence levels. In Business Mode, it translates these technical capabilities into outcome-focused client services.

---

## **Product Philosophy**

Rather than cluttering the screen with 40+ redundant buzzwords or micro-libraries, this section showcases structured, senior-level competency across 4 core domain quadrants:
1. **AI & Agent Architecture** (Multi-Agent Networks, RAG, Prompt Engineering, AI Workflows)
2. **Full-Stack Systems & Backend** (Next.js 16, Python Async APIs, PostgreSQL/Supabase, TypeScript, Streaming APIs)
3. **Product, UX & Mobile** (Flutter Mobile, UX Strategy, Design Systems & Core Web Vitals, Privacy Sandboxing)
4. **Data & Adaptive Delivery** (Data Science & Numerical Modeling, Adaptive Stack & Rapid Prototyping)

---

## **User Goals**

* **Hiring a Developer**: Evaluate core engineering stack, domain splits, and concrete production proof links.
* **Need a Website / Service**: Discover high-impact service offerings (Custom Web Platforms, AI Integrations, Site Speed Optimization, Mobile Apps).

---

## **Behavior & Design System**

* **Default Active View**: Displays skills organized by category tab quadrant (`I. AI ORCHESTRATION` by default) in a clean, focused grid layout.
* **Domain Filtering**: Category tabs (`I. AI ORCHESTRATION`, `II. SYSTEMS & LOGIC`, `III. PRODUCT & UX`, `IV. DYNAMIC COMMAND`) allow fast single-click domain switching without cluttering the screen with a monolithic view.
* **Shipped Production Proof**: Inline project tags (`FORGED IN:` / `APPLIED IN:`) trigger smooth scrolling to `#projects` with a 2-second focus flash highlight.

---

## **Adaptive Behavior (Dual Identity & Dual Theme)**

* **Developer Mode (Skills)**: Renders technical titles, architecture descriptions, developer status badges (`Level Max`, `Legendary`, `Active Quest`), and `FORGED IN:` project proof.
* **Business Mode (Services)**: Renders outcome-focused service titles (*AI Workflows & RAG Document Intelligence*, *High-Performance Web Applications*), client ROI descriptions, and `APPLIED IN:` project proof.
  
  | Technical Skill Category | Business Service Offering | Client Value Description | Supporting Tech |
  | :--- | :--- | :--- | :--- |
  | **AI Orchestration** | **AI Workflows & RAG Document Intelligence** | Automate repetitive business tasks and build citation-grounded document search models. | `Gemini SDK`, `pgvector`, `Python` |
  | **Systems & Logic** | **High-Performance Web Applications** | Build fast, secure, database-driven web platforms and admin portals. | `Next.js 16`, `Supabase`, `TypeScript` |
  | **Product & UX** | **Customer Journey & Performance** | Improve conversion rates, mobile experience, and Core Web Vitals speed scores. | `Flutter`, `CSS Modules`, `UX Strategy` |
  | **Dynamic Command** | **Adaptive Technical Consultation & MVPs** | Deliver end-to-end technical execution and rapid software prototypes tailored to business goals. | `Streamlit`, `Python`, `REST APIs` |

* **Visual Identity (Azure / Noir)**:
  * **Azure (Light)**: Cold-press linen canvas (`#FAF9F6`), serif typography (`Playfair Display` + `Lora`), soft graphite borders (`rgba(43,43,54,0.12)`), and ambient elevation shadows.
  * **Noir (Dark)**: Translucent obsidian glass panels (`rgba(20,20,24,0.75)` with `backdrop-filter: blur(12px)`), 100% `JetBrains Mono` monospaced code fonts, hairline borders (`rgba(255,255,255,0.08)`), and subtle accent top glows.

---

## **Content Requirements**

* **Skills Object**: Name, name_business, icon, description, description_business, category, color, level, status, projects list.
* **Curated Count**: Exactly 14 high-impact power skills (no filler, no redundant micro-libraries).
* **Excluded Content**: Avoid self-assessed percentage ratings (e.g., "React: 90%").

---

## **CMS Requirements**

Manageable via **Manage Skills** tab in Streamlit Synchronizer (`scripts/sync_tabs/skills.py`):
* Add/delete/edit skills.
* Re-assign categories and project proof links.
* Update Developer and Business mode descriptions.

---

## **Acceptance Criteria**
- Developer Mode shows technical skills categorized correctly.
- Business Mode translates skills into readable services.
- Clean, spacious 2-column grid rendering without crowding or layout shifts.
- 100% pass rate on TypeScript, ESLint, Vitest, and Next.js production builds.
