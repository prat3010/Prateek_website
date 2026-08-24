---
id: UI_ScopingLab
tier: 2_discovery_commerce
platform: Prateek_Website
status: production
auth_level: public
blast_radius: high
file_path: src/components/Intake/IntakeForm.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/Intake/IntakeForm.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/Intake/IntakeForm.tsx"
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
  - UI_ArchitectureCartDrawer
  - API_scoping_parse_intent
  - API_scoping_parse_rfp
---

# UI: `ScopingLab.tsx` / `IntakeForm.tsx`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/Intake/IntakeForm.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/Intake/IntakeForm.tsx)**

#ui #frontend #discovery #scoping

> **Interactive Discovery Wizard & Instant Estimation Engine.**

- **Path:** `src/components/Intake/IntakeForm.tsx` & `src/app/scoping/page.tsx`
- **Features:** Multimodal prompt input, RFP dropzone, base engine selector, live currency switcher (`INR` / `USD`).

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [API: scoping/parse-intent](API_scoping_parse_intent.md)
- [API: scoping/parse-rfp](API_scoping_parse_rfp.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE](docs/runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md)

1. **All pricing figures MUST source strictly from intakeQuestionnaireDefaults.json via calcQuote().**
2. **Feature dependencies (dependsOn) MUST be transitively resolved before calculating final quote.**
3. **Commercial PDF exports MUST strictly match the interactive Web Scoping Lab totals (0 discrepancy).**

