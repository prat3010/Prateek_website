---
id: UI_ArchitectureCartDrawer
tier: 2_discovery_commerce
platform: Prateek_Website
status: production
auth_level: public
blast_radius: high
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/"
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
  - UI_TopologyMap
  - UI_PreDepositBridge
  - Schema_client_scopes
---

# UI: `ArchitectureCartDrawer.tsx`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#ui #frontend #cpq #cart #ecommerce

> **Productized E-Commerce Drawer with Real-Time CPQ Pricing & Topology Map.**

- **Features:**
  - Sticky bottom action bar (`⚡ Instant Estimate: ₹3,75,000 / $4,500`)
  - Transitive feature dependency enforcement (`resolveFeatureDependencies`)
  - Compulsory vs optional module toggles
  - Embedded `TopologyMap.tsx` live SVG circuit
  - Dynamic promo code re-computation

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [UI: TopologyMap](UI_TopologyMap.md)
- [UI: PreDepositBridge](UI_PreDepositBridge.md)
- [Schema: client_scopes](Schema_client_scopes.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE](docs/runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md)

1. **All pricing figures MUST source strictly from intakeQuestionnaireDefaults.json via calcQuote().**
2. **Feature dependencies (dependsOn) MUST be transitively resolved before calculating final quote.**
3. **Commercial PDF exports MUST strictly match the interactive Web Scoping Lab totals (0 discrepancy).**

