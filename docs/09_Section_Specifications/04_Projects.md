# **Projects Section**

## **Purpose**

The Projects section is the core evidence library of the portfolio. It showcases previous work, demonstrating practical expertise through finished software products and case studies.

---

## **Product Philosophy**

Projects prove capability. Rather than telling visitors I can build software, this section shows what was built, how it was approached, and what outcomes were achieved.

---

## **User Goals**

* **Hiring a Developer**: Evaluate code quality, technical choices, structural architecture, engineering hurdles, and GitHub repositories.
* **Need a Website**: Review design polish, user flow solutions, business outcomes, and client value.

---

## **Behavior**

* Projects are rendered in a responsive card grid.
* Selecting a project opens a detailed case study sub-page or modal.

---

## **Adaptive Behavior**

* **Developer Mode (Engineering Case Studies)**:
  * Prioritizes technical architecture descriptions.
  * Displays repository status, code patterns, and direct links to GitHub.
  * Lists detailed technology logs and implementation lessons.
* **Business Mode (Client Case Studies)**:
  * Prioritizes the business problem and the final solution.
  * Highlights outcomes, user-experience decisions, and project metrics.
  * Displays layout screenshots and links to the live website.
* **Visual Identity (Azure/Noir)**:
  * Azure: Projects feature bright color gradients, interactive tag overlays, and smooth hover scales.
  * Noir: Projects are styled as comic-noir panels with thick borders and high-contrast lines.

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
- External links satisfy screen reader accessible labeling.
- Image assets use correct optimized web dimensions.
