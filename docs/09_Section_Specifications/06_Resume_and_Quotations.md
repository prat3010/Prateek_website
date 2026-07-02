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
  * Visual previews of the documents adapt their typography and accent lines to match the active theme (Azure gradients or Noir monochrome lines).

---

## **Document Generation Pipeline**

Both PDF outputs are generated client-side:
* **Generator Utility**: Located under `src/utils/pdfGenerator.ts`.
  * *Note: The current build supports `generateResumePDF()` with active personas. The `generateQuotationPDF()` pipeline is a key V2 implementation target.*
* **Dynamic Data Source**: Data is fetched from the Supabase singleton `profile` table fallback. Changes saved in the CMS reflect in the PDFs without code changes.
* **PDF Output Design**:
  * Resume: ATS-friendly, clean single-column structure.
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
- Developer Mode shows resume timeline and triggers resume PDF download.
- Business Mode shows quotation sheet and triggers quotation PDF download.
- Generated PDFs parse correctly and match the data stored in the database.
- Document previews render cleanly across all device widths.
