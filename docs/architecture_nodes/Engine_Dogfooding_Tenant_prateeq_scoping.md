---
id: Engine_Dogfooding_Tenant_prateeq_scoping
tier: 7_async_security
platform: Prateek_Website
status: production
auth_level: public
blast_radius: high
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/"
runbook: docs/runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md
tags:
  - tier/7_async_security
  - security/public
  - domain/async_infra
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
  - API_scoping_parse_intent
  - API_scoping_parse_rfp
  - Schema_rag_tenants
---

# Engine: Dogfooding Tenant (`prateeq_scoping`)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#engine #tenant #dogfooding #retriever #phase_g

> **Public System Cognitive Tenant in Retriever hosting full portfolio knowledge.**

- **Tenant UUID:** `prateeq_scoping`
- **Knowledge Base:** All 37 PRDs, technical specs, past client project metrics, and architecture patterns.
- **Function:** Powers the real-time AI Scoping Lab, chat assistant, and RFP PDF parser on `prateeq.in`.

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [API: scoping/parse-intent](API_scoping_parse_intent.md)
- [API: scoping/parse-rfp](API_scoping_parse_rfp.md)
- [Schema: rag_tenants](Schema_rag_tenants.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE](docs/runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md)

1. **All pricing figures MUST source strictly from intakeQuestionnaireDefaults.json via calcQuote().**
2. **Feature dependencies (dependsOn) MUST be transitively resolved before calculating final quote.**
3. **Commercial PDF exports MUST strictly match the interactive Web Scoping Lab totals (0 discrepancy).**

