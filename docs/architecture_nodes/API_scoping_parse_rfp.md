---
id: API_scoping_parse_rfp
tier: 4_api_gateway
platform: Prateek_Website
status: planned
auth_level: public
blast_radius: high
file_path: src/app/api/scoping/parse-rfp/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/scoping/parse-rfp/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/scoping/parse-rfp/route.ts"
runbook: docs/runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md
tags:
  - tier/4_api_gateway
  - security/public
  - domain/commerce
  - platform/website
invariants:
  - "All pricing figures MUST source strictly from intakeQuestionnaireDefaults.json via calcQuote()."
  - "Feature dependencies (dependsOn) MUST be transitively resolved before calculating final quote."
  - "Commercial PDF exports MUST strictly match the interactive Web Scoping Lab totals (0 discrepancy)."
test_suites:
  - src/lib/__tests__/pricing.test.ts
  - src/lib/__tests__/pdf-smoke.test.ts
downstream:
  - ../25_SOTA_Scoping_Engine_PRD
  - Engine_Docling_Layout_OCR
  - UI_ScopingLab
  - UI_ArchitectureCartDrawer
---

# API: `POST /api/scoping/parse-rfp`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/scoping/parse-rfp/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/scoping/parse-rfp/route.ts)**

#api #multimodal #ocr #pdf #phase_g

> **Multimodal RFP & Wireframe Ingestion Stream using Docling Layout OCR (M42).**

- **Endpoint:** `POST /api/scoping/parse-rfp`
- **Gateway:** Next.js 16 Route Handler with `multipart/form-data`
- **Processing Engine:** Docling Layout OCR + PyMuPDF AST Chunker
- **Payload:** `FormData` containing `.pdf`, `.docx`, or image wireframes
- **Output:** Extracted functional specifications, automatically checked cart features, and estimate matrix.

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [Engine: Docling Layout OCR](Engine_Docling_Layout_OCR.md)
- [UI: ScopingLab](UI_ScopingLab.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE](docs/runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md)

1. **All pricing figures MUST source strictly from intakeQuestionnaireDefaults.json via calcQuote().**
2. **Feature dependencies (dependsOn) MUST be transitively resolved before calculating final quote.**
3. **Commercial PDF exports MUST strictly match the interactive Web Scoping Lab totals (0 discrepancy).**

