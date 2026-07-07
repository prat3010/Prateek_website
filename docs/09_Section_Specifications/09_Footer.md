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

* **Communication Identity**:
  * Audience adaptation is limited to a single label toggle: the Resume link displays as "Resume" in Developer Mode and "Quotation" in Business Mode. The rest of the footer content (social links, navigation structure, copyright) remains the same regardless of audience.
* **Visual Theme (Azure/Noir)**:
  * Azure: Creative comic-book layout with animated vector accents and bright hover shifts.
  * Noir: Precise black-and-white grid layout with flat icons and simple text underlines.
  * The theme adaptation is the primary visual differentiation — the footer renders two distinct visual layouts based on the active theme.

---

## **Layout Specifications**

The layout uses a three-column CSS Grid:
1. **Column 1: Brand & Status**: Copyright notices and a live workload availability badge.
2. **Column 2: Navigation**: Context-aware links mapping internal sections.
3. **Column 3: Social & Tools**: Links to GitHub, LinkedIn, and development reference utilities.

---

## **Acceptance Criteria**
- Footer is responsive across all screen widths.
- The Resume/Quotation label toggles based on the active Communication Identity.
- Social links point to active, correct URLs.
- Theme-specific layouts render correctly for both Azure and Noir modes.
