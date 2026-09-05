---
id: PRD_29_Commercial_PDF_Generation_Engine
title: "PRD: Commercial PDF Generation Engine (src/components/pdf/*)"
tier: 5_content_platform
platform: Prateek_website
status: production
auth_level: public_and_client
blast_radius: MEDIUM
file_path: src/components/pdf/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/pdf/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/pdf/"
runbook: docs/runbooks/RUNBOOK_PDF_GENERATION.md
tags:
  - prd/pdf
  - tier/5_content_platform
  - react_pdf
  - design_system_2
  - platform/prateek_website
invariants:
  - "Commercial document page budgets MUST strictly adhere to pinned page counts (Pricing: 6, Scoping: 3, Proposal: 1, Agreement: 3)."
  - "Server-side font registration MUST use base64 data URLs to satisfy react-pdf v4 buffer constraints."
  - "Every commercial PDF MUST support complete dual-theme rendering (Azure editorial and Noir obsidian)."
  - "PDF generators MUST use local JSON defaults (intakeQuestionnaireDefaults.json) as resilient fallbacks."
test_suites:
  - src/lib/__tests__/pdf-smoke.test.ts
downstream:
  - docs/UNIFIED_MASTER_ROADMAP.md
  - docs/99_DECISIONS.md#adr-11
  - docs/99_DECISIONS.md#adr-12
  - docs/ARCHITECTURE_DEPENDENCY_MAP.md
---

# 29. Product Requirements Document: Commercial PDF Generation Engine

#prd #pdf #react_pdf #typography #design_system #commercial_guides #prateeq_website

> **Comprehensive system specification for the `@react-pdf/renderer` v4 Commercial Document Suite, Dual-Theme Color Architecture, Fonttools Variable Typography Pipeline, Pinned Page Budgets, and Automated Smoke Test Verification.**

---

## 1. Executive Summary & Design Vision

In high-ticket commercial software consulting, deliverable presentations dictate perceived competence. Generic, unformatted PDFs degrade trust, while manual Figma exports for every client quote waste precious engineering bandwidth.

The **Commercial PDF Generation Engine** provides a code-first, pixel-perfect document rendering pipeline built on `@react-pdf/renderer` v4:
1. **Dynamic Client & Server Dual Rendering:** Documents render client-side in the browser for instant 1-click downloads or server-side in Node.js for automated email attachments and contract snapshotting.
2. **Design System 2.0 Dual-Theme Parity:** Documents feature full typographic and color parity across **Azure** (editorial graphic novel, cold-press `#FAF9F6` paper, dark graphite `#2B2B36`, terracotta `#E06D53`, slate blue `#3F6E91`) and **Noir** (cyber-monospace, `#0B0C10` obsidian, glowing cyan `#00F0FF`, neon green `#39FF14`).
3. **Engineered Typography Pipeline:** High-elegance editorial typography using Playfair Display, Lora, and JetBrains Mono instantiated directly from Google variable fonts via `fonttools varLib.instancer`.
4. **Strict Pinned Page Budgets:** Rigid physical layout budgets prevent awkward orphaned section headers and overflow pages.

---

## 2. Architecture & Typography Pipeline

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      1. FONT PRE-BAKING PIPELINE                            │
 │  • Google Variable TTFs (Playfair Display, Lora, JetBrains Mono)            │
 │  • fonttools varLib.instancer ➔ Instantiates static TTFs in public/fonts/   │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      2. DUAL ENVIRONMENT REGISTRATION                       │
 │  • Client (pdfFontsClient.ts): Registers absolute URLs (/fonts/...)         │
 │  • Server (pdfFontsServer.ts): Reads disk & encodes base64 data URLs        │
 │    (Satisfies @react-pdf/renderer v4 raw-buffer rejection invariant)        │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      3. DUAL-THEME COLOR TOKENS                             │
 │  • src/components/pdf/pdfTheme.ts (getPdfTheme(isNoir))                     │
 │  • Colors: bg, surface, cardBg, textPrimary, textMuted, accent, border      │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      4. REUSABLE BRAND ATOMS & TEMPLATES                    │
 │  • PdfBrandHeader.tsx & PdfGremlinLogo.tsx (Signature Gremlin Mark)         │
 │  • PdfFooter.tsx (Dynamic page numbering via render={({page, total})})      │
 │  • Document Renderers: Pricing, Scoping, Proposal, Middleman, Invoice       │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                      5. AUTOMATED SMOKE TEST SUITE                          │
 │  • src/lib/__tests__/pdf-smoke.test.ts (Vitest)                             │
 │  • Asserts: Buffer header '%PDF-', exact page count match, zero font errors │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Pinned Page Budget Contracts & Document Roster

To maintain pristine aesthetic balance, all commercial documents operate under rigid, test-enforced page budget constraints:

| Document Renderer | File Path | Pinned Page Budget | Primary Purpose & Contents |
| :--- | :--- | :--- | :--- |
| **`ServicesAndPricingPDF`** | [`src/components/pdf/ServicesAndPricingPDF.tsx`](../src/components/pdf/ServicesAndPricingPDF.tsx) | **6 Pages** (Pinned) | Comprehensive commercial guide: Executive vision, core service tiers, interactive feature module pricing, brand add-ons, maintenance care plans, and terms. |
| **`ScopingBriefPDF`** | [`src/components/pdf/ScopingBriefPDF.tsx`](../src/components/pdf/ScopingBriefPDF.tsx) | **3 Pages** (Pinned) | Client project specification generated from `/scoping`: Selected base engine, enabled feature modules, architecture topology, and payment schedules. |
| **`MiddlemanAgreementPDF`** | [`src/components/pdf/MiddlemanAgreementPDF.tsx`](../src/components/pdf/MiddlemanAgreementPDF.tsx) | **3 Pages** (Pinned) | Legal sales partnership agreement: Commission bands (A/B/C rates), recurring revenue splits, non-circumvention, and worked examples. |
| **`ProposalExecutiveBriefPDF`** | [`src/components/pdf/ProposalExecutiveBriefPDF.tsx`](../src/components/pdf/ProposalExecutiveBriefPDF.tsx) | **1 Page** (Pinned) | 1-page C-suite summary: Project scope code, executive overview, total investment, milestone schedule, and direct sign-off signature blocks. |
| **`InvoicePDF`** | [`src/components/pdf/InvoicePDF.tsx`](../src/components/pdf/InvoicePDF.tsx) | **1 Page** (Dynamic) | Commercial tax invoice: Seller legal entity details (`seller.json`), client email, Razorpay order/payment IDs, and milestone itemization. |
| **`DeveloperResumePDF`** | [`src/components/pdf/DeveloperResumePDF.tsx`](../src/components/pdf/DeveloperResumePDF.tsx) | **1 Page** (Pinned) | Standardized technical CV rendered in plain Helvetica for ATS parsing and corporate recruiters. |

---

## 4. Typography & Font Registration Infrastructure

### Font Instantiation Rules
Standard variable fonts crash `@react-pdf/renderer` v4. All fonts in `public/fonts/` are pre-instantiated using `fonttools`:
```bash
python3 -m fonttools varLib.instancer public/fonts/PlayfairDisplay-VariableFont_wght.ttf wght=700 -o public/fonts/PlayfairDisplay-Bold.ttf
python3 -m fonttools varLib.instancer public/fonts/Lora-VariableFont_wght.ttf wght=400 -o public/fonts/Lora-Regular.ttf
```

### Server vs. Client Registration Contracts
- **Server (`pdfFontsServer.ts`):** In Node.js environments (API routes, CLI sync scripts, Vitest), `@react-pdf` fails on relative paths and raw Buffers. Fonts must be read synchronously and registered as base64 data URLs:
  ```typescript
  const fontBase64 = fs.readFileSync(fontPath).toString('base64');
  Font.register({ family, src: `data:font/truetype;base64,${fontBase64}` });
  ```
- **Client (`pdfFontsClient.ts`):** In browser execution, fonts are fetched via absolute web URLs:
  ```typescript
  Font.register({ family, src: `${window.location.origin}/fonts/${fontName}.ttf` });
  ```

---

## 5. Non-Negotiable Invariants & Safety Constraints

| Invariant ID | Rule Description | Enforcement Mechanism |
| :--- | :--- | :--- |
| **INV-PDF-01** | **Strict Page Count Pinning** | `pdf-smoke.test.ts` asserts `pageCount(pdf) === PINNED_COUNT`. Commits that accidentally spill content onto extra pages fail CI. |
| **INV-PDF-02** | **Base64 Server Data URLs** | `pdfFontsServer.ts` strictly encodes fonts as base64 data URLs to prevent Node.js runtime segfaults. |
| **INV-PDF-03** | **Zero Hardcoded Colors** | All style objects must import `getPdfTheme(isNoir)` tokens (`theme.bg`, `theme.textPrimary`, `theme.accent`). |
| **INV-PDF-04** | **Offline Resilient Defaults** | When live Supabase data is unavailable, PDF renderers gracefully fall back to `intakeQuestionnaireDefaults.json` and `seller.json`. |

---

## 6. Automated Verification & Smoke Tests

Automated regression coverage in [`src/lib/__tests__/pdf-smoke.test.ts`](../src/lib/__tests__/pdf-smoke.test.ts):
```typescript
describe('commercial PDF render smoke tests', () => {
  it.each([['azure', false], ['noir', true]])('ServicesAndPricingPDF renders 6 pages in %s', async (_t, isNoir) => {
    const pdf = await renderToPdf(<ServicesAndPricingPDF isNoir={isNoir} />);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(6);
  });

  it.each([['azure', false], ['noir', true]])('ScopingBriefPDF renders 3 pages in %s', async (_t, isNoir) => {
    const pdf = await renderToPdf(<ScopingBriefPDF isNoir={isNoir} />);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(3);
  });

  it.each([['azure', false], ['noir', true]])('ProposalExecutiveBriefPDF renders 1 page in %s', async (_t, isNoir) => {
    const pdf = await renderToPdf(<ProposalExecutiveBriefPDF isNoir={isNoir} />);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pageCount(pdf)).toBe(1);
  });
});
```
