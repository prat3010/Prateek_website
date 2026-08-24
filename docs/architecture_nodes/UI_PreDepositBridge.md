---
id: UI_PreDepositBridge
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
  - UI_ArchitectureCartDrawer
  - API_client_create_razorpay_order
  - Engine_Digital_SOW_Escrow_Freeze
---

# UI: `PreDepositBridge.tsx` & `DigitalSOWPreview.tsx`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#ui #frontend #auth #pkce #sow

> **Pre-Deposit Client Workspace Provisioning & Digital SOW Modal.**

---

## 🔗 Related Architecture & Cross-References
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [API: client/create-razorpay-order](API_client_create_razorpay_order.md)
- [Engine: Digital SOW Escrow Freeze](Engine_Digital_SOW_Escrow_Freeze.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE](docs/runbooks/RUNBOOK_NEW_CPQ_FEATURE_OR_ENGINE.md)

1. **All pricing figures MUST source strictly from intakeQuestionnaireDefaults.json via calcQuote().**
2. **Feature dependencies (dependsOn) MUST be transitively resolved before calculating final quote.**
3. **Commercial PDF exports MUST strictly match the interactive Web Scoping Lab totals (0 discrepancy).**

