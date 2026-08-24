---
id: API_scoping_parse_intent
tier: 4_api_gateway
platform: Prateek_Website
status: planned
auth_level: public
blast_radius: high
file_path: src/app/api/scoping/parse-intent/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/scoping/parse-intent/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/scoping/parse-intent/route.ts"
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
  - Engine_Dogfooding_Tenant_prateeq_scoping
  - Engine_RLM_Python_REPL
  - UI_ScopingLab
  - UI_ArchitectureCartDrawer
---

# API: `POST /api/scoping/parse-intent`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/scoping/parse-intent/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/scoping/parse-intent/route.ts)**

#api #edge #nlp #intent #phase_g

> **Edge Intent Classifier streaming Natural Language queries to Retriever Cognitive Core.**

- **Endpoint:** `POST /api/scoping/parse-intent`
- **Gateway:** Next.js 16 App Router Route Handler (`src/app/api/scoping/parse-intent/route.ts`)
- **Backend Target:** FastAPI `https://rag.prateeq.in/v1/chat` (Tenant: `prateeq_scoping`)
- **Payload:** `{ prompt: string, currency: "INR" | "USD" }`
- **Output:** `{ engineId, selectedFeatures: string[], suggestedAddons: string[], confidence: number, mathVerification: string }`

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [Engine: Dogfooding Tenant prateeq_scoping](Engine_Dogfooding_Tenant_prateeq_scoping.md)
- [Engine: RLM Python REPL Sandbox](Engine_RLM_Python_REPL.md)
- [UI: ScopingLab](UI_ScopingLab.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE](docs/runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md)

1. **All pricing figures MUST source strictly from intakeQuestionnaireDefaults.json via calcQuote().**
2. **Feature dependencies (dependsOn) MUST be transitively resolved before calculating final quote.**
3. **Commercial PDF exports MUST strictly match the interactive Web Scoping Lab totals (0 discrepancy).**

