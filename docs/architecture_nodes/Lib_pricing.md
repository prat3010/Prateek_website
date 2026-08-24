---
id: Lib_pricing
tier: 5_domain_providers
platform: Prateek_Website
status: production
auth_level: public
blast_radius: high
file_path: src/lib/pricing.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/pricing.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/pricing.ts"
runbook: docs/runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md
tags:
  - tier/5_domain_providers
  - security/public
  - domain/domain_lib
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
  - Route_scoping
  - UI_ArchitectureCartDrawer
  - API_client_create_razorpay_order
---

# Lib: `pricing.ts` (Commercial Pricing SSoT)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/pricing.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/pricing.ts)**

#lib #domain #pricing #cpq #ecommerce

> **Single Source of Truth for Client Estimations, Math Formulas & Dependency Trees.**

- **Path:** `src/lib/pricing.ts`
- **Core Functions:**
  - `calcQuote(engineId, featureIds, brandTier, careTier, currency)`
  - `resolveFeatureDependencies(featureIds, allFeatures)`: Recursive topological resolution of prerequisite modules.
  - `resolveDefaultCurrency(regionCookie)`: Geo-IP currency resolver (`INR` vs `USD`).
  - `formatMoney(amount, currency)`: Locale-aware price formatting.

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [Route: /scoping](Route_scoping.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [API: client/create-razorpay-order](API_client_create_razorpay_order.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE](docs/runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md)

1. **All pricing figures MUST source strictly from intakeQuestionnaireDefaults.json via calcQuote().**
2. **Feature dependencies (dependsOn) MUST be transitively resolved before calculating final quote.**
3. **Commercial PDF exports MUST strictly match the interactive Web Scoping Lab totals (0 discrepancy).**

