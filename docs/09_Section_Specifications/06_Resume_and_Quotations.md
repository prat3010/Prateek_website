# **Resume & Quotations Section**

## **Purpose**

The Resume & Quotations section delivers professional document assets tailored to the visitor's goal. Developers download a technical resume, while business clients download a detailed service quotation.

---

## **Product Philosophy**

Documents represent the final stage of professional verification. Resumes confirm engineering credentials, while quotations summarize business engagements. Both should be easy to read, professionally presented, and accurate.

---

## **User Goals**

* **Hiring a Developer**: Inspect employment history, education details, verified certifications, and download an ATS-friendly technical resume.
* **Need a Website**: Inspect service packages, review standard development deliverables, and download a customized service quotation outlining rates and timelines.

---

## **Adaptive Behavior**

* **Developer Mode (Resume UI)**:
  * Renders an interactive work experience timeline.
  * Shows education, certifications, and programming languages.
  * Primary Action: **Download Resume PDF**.
* **Business Mode (Quotation UI)**:
  * Renders itemized service grids.
  * Displays typical project timelines (discovery, design, dev, test, launch).
  * Primary Action: **Download Service Quotation PDF**.
* **Theme Styling**:
  * Visual previews of the documents adapt their typography, surface backgrounds, and accent lines to match the active theme:
    * **Azure Theme**: Cold-press `#FAF9F6` paper background, `#FFFFFF` document card, warm graphite `#2B2B36` typography, slate blue and terracotta accents.
    * **Noir Theme**: Dark obsidian `#0e0e12` surface background, cyber monochrome `#e0e0e3` text, high-contrast `#ffffff` headings, glowing neon cyan (`#00f0ff`) subtitle & action accents, neon yellow (`#ffe600`) rate badges, and neon green (`#39ff14`) SLA care indicators (100% WCAG 2.1 AA compliant).

---

## **Document Generation Pipeline**

Both PDF outputs are generated client-side:
* **Generator Utility**: Located under `src/utils/pdfGenerator.ts`.
  * Both `generateResumePDF()` and `generateQuotationPDF()` are implemented and exported. The shared `Persona` type and `getSkillsHighlight` helper are imported from `src/lib/skills.ts`.
* **Dynamic Data Source**: Data is fetched from the Supabase singleton `profile` table fallback. Changes saved in the CMS reflect in the PDFs without code changes.
* **PDF Output Design**:
  * Resume: Brand-aligned PDF (`DeveloperResumePDF.tsx`) utilizing `pdfTheme.ts` tokens (Azure cream paper & Noir cyber themes), `PdfBrandHeader` hero banner with the navbar gremlin mark, custom Playfair/Lora/JetBrains Mono typography, skill chip badges, and `PdfFooter` page numbering.
  * Quotation: Professional invoice-style billing structure listing services, estimates, and contract terms.

---

## **CMS Requirements**

Keep updated via **Edit Resume Manually** tab in the CMS:
* Update work history (company, role, timeline, bullet points).
* Adjust quotation rate guidelines, standard deliverables list, and payment terms.

---

## **Analytics**

* Anonymous log counts of "Download Resume" clicks.
* Anonymous log counts of "Download Quotation" clicks.

---

## **Acceptance Criteria**
- Developer Mode shows resume timeline with a continuous vertical ink line and pulsing milestone nodes, and triggers resume PDF download.
- Business Mode shows quotation sheet with perforated dashed voucher rate cards and triggers quotation PDF download.
- Generated PDFs parse correctly and match the data stored in the database.
- Document previews render cleanly across all device widths.

---

## **Related Architecture & Cross-References**

- [Previous Section: Playground](05_Playground.md)
- [Interactive Scoping Lab](12_Scoping_Lab.md)
- [Sales Partner Agreement](../MIDDLEMAN_PARTNERSHIP_AGREEMENT.md)
- [Next Section: Contact](08_Contact.md)
- [Architecture Node: Commercial PDF Suite](../architecture_nodes/UI_CommercialPDFSuite.md)