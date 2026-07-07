# **Skills & Services Section**

## **Purpose**

The Skills & Services section communicates capability. In Developer Mode, it displays technical skills, categories, and competence levels. In Business Mode, it translates these technical capabilities into client-focused services.

---

## **Product Philosophy**

Rather than simply listing buzzwords, this section demonstrates structured competency. It highlights that technology is a tool to solve problems. It bridges technical capability with business outcomes.

---

## **User Goals**

* **Hiring a Developer**: Evaluate the developer's tech stack, category splits (orchestration, logic, product, dynamic), and prerequisites.
* **Need a Website**: Discover available freelance service offerings (Custom Web Apps, Site Optimization, Consultation).

---

## **Behavior**

* The section displays cards or tags in a modular grid.
* Selecting tabs or hovering over elements triggers smooth CSS transitions and category highlight overlays.

---

## **Adaptive Behavior**

* **Developer Mode (Skills)**: Renders skills sorted by categories:
  * **Orchestration**: Cloud, CI/CD, database structures.
  * **Logic**: TypeScript, React core, Node logic.
  * **Product**: CSS styling, UI designs, performance metrics.
  * **Dynamic**: Client integration engines, runtime configurations.
* **Business Mode (Services)**: Renders a list of client services. It translates the technical skill categories into outcome-focused business offerings:
  
  | Technical Skill Category | Business Service Offering | Client Value Description | Supporting Tech Tags |
  | :--- | :--- | :--- | :--- |
  | **AI Orchestration** | **AI Agent Workflows & Automation** | Automate repetitive business tasks, integrate custom LLM assistants, and configure structured database extraction. | `Gemini SDK`, `Python`, `Prompt Engineering` |
  | **Systems & Logic** | **Custom Web Applications** | Build secure, scalable database-driven apps with dedicated administration control panels. | `Next.js`, `Supabase`, `TypeScript` |
  | **Product & UX** | **Performance & UX Optimization** | Fix slow load speeds (LCP/INP) to improve search ranking (SEO) and user conversions. | `CSS Modules`, `Core Web Vitals`, `SEO` |
  | **Dynamic Command** | **Interactive Tools & Diagnostics** | Implement custom CLI diagnostic terminals, QR payment portals, and dynamic client features. | `Three.js`, `Canvas APIs`, `Resend` |

* **Visual Identity (Azure/Noir)**:
  * Azure: Uses creative tag descriptions, colorful borders, and hover micro-animations.
  * Noir: Uses precise, refined monospaced text layouts and grayscale outline styling.

---

## **Content Requirements**

* **Skills Object**: Name, category, description, level (learning/intermediate/advanced), icon name, projects list.
* **Services Object**: Title, client value description, supporting technical tags.
* **Excluded Content**: Avoid self-assessed percentage ratings (e.g., "React: 90%").

---

## **CMS Requirements**

Manageable via **Manage Skills** tab:
* Add/delete/edit skills.
* Re-assign categories and prerequisites.
* Update business service descriptions.

---

## **Analytics**

* Anonymous hover counts on categories.
* Click events on projects associated with a skill.

---

## **Accessibility**

* High contrast focus indicators.
* Screen readers describe category relationships.
* Respects `prefers-reduced-motion`.

---

## **Performance**

* Uses lightweight SVG icons instead of raster images.
* Grid rendering uses CSS Grid for zero layout shift.

---

## **Future Expansion**

* Auto-linking certification badges.
* Interactive skill tree mappings.

---

## **Acceptance Criteria**
- Developer Mode shows technical skills categorized correctly.
- Business Mode translates skills into readable services.
- Hover animations align with the active visual identity (Azure/Noir).
- Content edits reflect updates without source code modifications.
