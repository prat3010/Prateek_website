---
id: Lib_commission
tier: 5_domain_providers
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/lib/commission.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/commission.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/commission.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/5_domain_providers
  - security/public
  - domain/domain_lib
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../MIDDLEMAN_PARTNERSHIP_AGREEMENT
  - UI_MiddlemanAgreement
  - ../REVENUE_EXECUTION_PLAN
---

# Lib: `commission.ts` (Sales Partner Commission SSoT)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/commission.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/commission.ts)**

#lib #domain #commission #middleman #legal

> **Single Source of Truth for Middleman Sales Partner Commission Calculations.**

- **Path:** `src/lib/commission.ts` & `src/data/commissionConfig.json`
- **Tiers:** Band A (10% on < ₹1.5L / $2k), Band B (12.5% on ₹1.5L–₹3L / $2k–$4k), Band C (15% on > ₹3L / $4k), Recurring Retainer (10%).

---

## 🔗 Related Architecture & Cross-References
- [MIDDLEMAN_PARTNERSHIP_AGREEMENT](../MIDDLEMAN_PARTNERSHIP_AGREEMENT.md)
- [UI: MiddlemanAgreement](UI_MiddlemanAgreement.md)
- [REVENUE_EXECUTION_PLAN](../REVENUE_EXECUTION_PLAN.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

