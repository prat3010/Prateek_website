# **Footer Section**

## **Purpose**

The Footer provides site navigation, links to social profiles, copyright notices, and build diagnostics. It acts as the closing note of the visitor's journey.

---

## **Product Philosophy**

The Footer should not be cluttered. It should serve as a clean directory, helping visitors find social links and quick site tools without visual noise.

---

## **User Goals**

* **All Audiences**: Find social links (GitHub, LinkedIn, Email), review copyright notices, and check site availability.
* **Developer Audience**: Discover diagnostic tools, review commit summaries, and check the latest deployment commit details.

---

## **Adaptive Behavior**

* **Developer Mode**:
  * Prioritizes links to: GitHub profile, developer utilities, and commit log listings.
  * Displays the build hash of the latest Git deploy.
* **Business Mode**:
  * Prioritizes links to: LinkedIn profile, standard email address, freelance terms of service, and pricing guides.
  * Displays quick contact shortcuts.
* **Visual Theme (Azure/Noir)**:
  * Azure: Uses creative animations, animated vector accents, and bright hover shifts.
  * Noir: Uses precise black-and-white grids, flat icons, and simple text underlines.

---

## **Layout Specifications**

The layout uses a three-column CSS Grid:
1. **Column 1: Brand & Status**: Copyright notices and a live workload availability badge.
2. **Column 2: Navigation**: Context-aware links mapping internal sections.
3. **Column 3: Social & Tools**: Links to GitHub, LinkedIn, and development reference utilities.

---

## **Acceptance Criteria**
- Footer is responsive across all screen widths.
- Navigation links change based on the active Communication Identity.
- Social links point to active, correct URLs.
- Developer Mode exposes build commits.
