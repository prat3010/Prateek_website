---
id: Route_scoping
tier: 2_discovery_commerce
platform: Prateek_Website
status: production
auth_level: public
blast_radius: high
file_path: src/app/scoping/page.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/scoping/page.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/scoping/page.tsx"
runbook: docs/runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md
tags:
  - tier/2_discovery_commerce
  - security/public
  - domain/scoping
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
  - ../09_Section_Specifications/12_Scoping_Lab
  - UI_ScopingLab
  - UI_ArchitectureCartDrawer
  - API_scoping_parse_intent
  - API_scoping_parse_rfp
  - Lib_pricing
---

# Route: `/scoping` (Project Scoping Lab)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/scoping/page.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/scoping/page.tsx)**

#route #frontend #scoping #cpq #phase_g

> **Interactive Discovery Wizard, Multimodal RFP Dropzone & Instant CPQ Estimate.**

- **Path:** `src/app/scoping/page.tsx` & `src/components/Intake/IntakeForm.tsx`
- **Key Features:**
  - Deep-linkable via `?engine=landing|multipage|saas` or `?goal=<archetype_id>`
  - Sticky Cart Drawer with real-time currency conversion (`INR` / `USD`)
  - Transitive feature dependency resolution (`pricing.ts`)
  - PDF proposal & SOW export (`ScopingBriefPDF.tsx`)
  - Live Retriever proof badge (`⚡ Powered by Retriever Engine`)

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [09_Section_Specifications/12_Scoping_Lab](../09_Section_Specifications/12_Scoping_Lab.md)
- [UI: ScopingLab](UI_ScopingLab.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [API: scoping/parse-intent](API_scoping_parse_intent.md)
- [API: scoping/parse-rfp](API_scoping_parse_rfp.md)
- [Lib: pricing.ts](Lib_pricing.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE](docs/runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md)

1. **All pricing figures MUST source strictly from intakeQuestionnaireDefaults.json via calcQuote().**
2. **Feature dependencies (dependsOn) MUST be transitively resolved before calculating final quote.**
3. **Commercial PDF exports MUST strictly match the interactive Web Scoping Lab totals (0 discrepancy).**

