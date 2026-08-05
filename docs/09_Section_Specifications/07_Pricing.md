# **Pricing Section — REMOVED (2026-08)**

> **Status: Removed.** The standalone `#pricing` section (Consulting Rates in Developer Mode,
> Service Packages in Business Mode) was deleted because the static package cards duplicated the
> pricing built into the interactive Project Scoping wizard (`IntakeForm`), and the consulting-rate
> offers were not ones the owner wanted to fulfil. The scoping questionnaire is now the only pricing path.
> This document is retained for historical reference only.
>
> **2026-08 Update:** Package/care pricing is now a single source of truth in
> `src/data/intakeQuestionnaireDefaults.json` (engines, add-on feature modules, goal archetypes with
> compulsory features, brand asset tiers, care plans), consumed by the Project Scoping wizard at
> `/scoping`, the config-derived package cards in `src/components/Resume/Resume.tsx`, and the
> commercial PDFs (`ServicesAndPricingPDF`, `ScopingBriefPDF`). Commission bands for the Middleman
> agreement live separately in `src/data/commissionConfig.json` / `src/lib/commission.ts`. All prices
> are region-aware (INR vs USD) via the geo-IP `region` cookie.
>
> **2026-08 later update:** The add-on roster grew to 14 modules (`pwa`, `i18n`, `integrations`,
> `video` added as optional modules), goal-package totals resolve `dependsOn` dependencies so cards
> match the wizard quote, and the Services & Pricing guide is a 5-page document (feature table +
> standalone brand section; see ADR 11/12).

## **Original Purpose**

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
