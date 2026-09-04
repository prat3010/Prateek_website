---
id: API_scoping_estimate_timeline
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
blast_radius: high
file_path: src/app/api/scoping/estimate-timeline/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/scoping/estimate-timeline/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/scoping/estimate-timeline/route.ts"
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
---

# API: `POST /api/scoping/estimate-timeline`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/scoping/estimate-timeline/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/scoping/estimate-timeline/route.ts)**

#api #scoping #timeline #estimation #pricing

> **Scoping Engine Project Effort & Delivery Sprint Timeline Estimation Proxy.**

- **Endpoint:** `POST /api/scoping/estimate-timeline`
- **Path:** `src/app/api/scoping/estimate-timeline/route.ts`
- **Authentication:** Public (Rate limited: 60 req/min)
- **Upstream Engine:** Retriever Cognitive Engine (`POST /v1/scoping/estimate-timeline`) with local fallback (`estimateScopeTimeline`).

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE](docs/runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md)

1. **All pricing figures MUST source strictly from intakeQuestionnaireDefaults.json via calcQuote().**
2. **Feature dependencies (dependsOn) MUST be transitively resolved before calculating final quote.**
3. **Commercial PDF exports MUST strictly match the interactive Web Scoping Lab totals (0 discrepancy).**

