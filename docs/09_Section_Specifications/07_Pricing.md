# **Pricing Section**

## **Purpose**

The Pricing section provides clear pricing guidelines for freelance engagements. It establishes trust by replacing "pricing mystery" with structured rates and clear project deliverables.

---

## **Product Philosophy**

Transparency builds confidence. Presenting pricing tiers and project rates early simplifies the client's decision-making process and ensures that inquiries align with our availability.

---

## **User Goals**

* **Hiring a Developer**: Inspect general freelance/consulting hourly rates, day rates, and code review consulting fees.
* **Need a Website**: Review project packages (e.g. Landing Page, Custom Web Application, Performance Audits) and choose the appropriate tier.

---

## **Behavior**

* Pricing is rendered in a responsive, side-by-side tier grid.
* Selecting a tier opens the contact form with the chosen tier pre-populated, making the booking process seamless.

---

## **Adaptive Behavior**

* **Developer Mode**:
  * Displays consulting packages: hourly mentorship rates, architecture review rates, and codebase audit rates.
  * Emphasizes technical deliverables (e.g., performance audits, accessibility checks).
* **Business Mode**:
  * Displays website packages: Landing Page package, Custom Web Application package, and Monthly Support plans.
  * Emphasizes business outcomes (e.g., custom administration panels, conversion optimization).
* **Visual Theme (Azure/Noir)**:
  * Azure: Pricing cards feature colorful gradients, highlighted features, and animated hover effects.
  * Noir: Pricing cards feature simple black-and-white grids, flat icons, and text underlines.

---

## **Content Requirements**

* Pricing details (tier title, price range, description, list of features, primary CTA link) are stored in the Supabase `profile` table metadata.
* This dynamic setup allows the developer to adjust rates and package features via the CMS without committing code.

---

## **Analytics**

* Anonymous clicks on pricing tier CTA keys.
* Distribution of selected tiers in submitted contact forms.

---

## **Acceptance Criteria**
- Pricing cards display accurate, current rates from the database.
- Pricing details adapt dynamically to the active Communication Identity.
- Selecting a package pre-populates the corresponding field in the contact form.
- The layout remains responsive and fits well on mobile viewports.
