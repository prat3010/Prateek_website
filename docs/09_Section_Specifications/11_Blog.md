# **Blog Section**

## **Purpose**

The Blog Section (Writings & Log Entries) displays published posts, tutorials, and case reviews. It establishes authority and shows depth of thinking by sharing written articles on engineering challenges and business processes.

---

## **Product Philosophy**

Writing reflects thinking. The blog should provide a clean, distraction-free reading layout that emphasizes text clarity and structure over loud design elements.

---

## **User Goals**

* **Developer Audience**: Read detailed tutorials, coding articles, systems design breakdowns, and technical git histories.
* **Business Audience**: Read design workflows, project management case reviews, and digital strategy guides.

---

## **Behavior**

* Renders a 3-card preview row on the main index page.
* Navigates to `/blog` for a complete paginated index of posts.
* Clicking any card loads the detailed post page at `/blog/[slug]`.

---

## **Adaptive Behavior**

* **Label Adaptation (Developer vs. Business & Azure vs. Noir)**:
  * **Azure Visual Theme**:
    * Section Title: "LATEST WRITINGS"
    * View Button: "VIEW ALL"
  * **Noir Visual Theme**:
    * Section Title: "LOG_ENTRIES"
    * View Button: "ALL_LOGS"
* **Storytelling Variants**:
  * If a post declares audience tags, the blog list filters or highlights entries matching the visitor's active Communication Identity (e.g. prioritizing engineering topics in Developer Mode).
* **Card Rendering (Azure/Noir)**:
  * Azure: Uses rounded comic cards, micro hover scale effects, and accent colored borders.
  * Noir: Renders cards using ComicPanels with alternating skew angles (`tilt={index % 2 === 0 ? 0.5 : -0.5}`).

---

## **Content & Compilation Architecture**

* **Markdown Storage**: Post articles are written in markdown format and saved directly under `src/content/posts/[slug].md`.
* **Markdown Parser**: The Next.js page reads files server-side using Node filesystem APIs and compiles frontmatter parameters (title, date, excerpt, tags) and markdown bodies.
* **Metadata fallback**: Post lists are compiled dynamically at build-time to construct the static website sitemap.

---

## **CMS Requirements**

Manageable via **Blog Editor** tab:
* Provides a text composer that creates and saves markdown files to the local `src/content/posts/` folder directly.
* Configures metadata frontmatter inputs (Slug, Title, Date, Excerpt, Tags).

---

## **Acceptance Criteria**
- Section preview renders up to 3 recent posts.
- Header text matches the visual theme and identity variables.
- Individual post pages display safe, sanitized HTML compiled from markdown.
- Clicking posts links to correct `/blog/[slug]` route paths.
