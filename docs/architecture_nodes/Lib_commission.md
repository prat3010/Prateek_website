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
  - ../commercial/MIDDLEMAN_PARTNERSHIP_AGREEMENT
  - UI_MiddlemanAgreement
  - ../commercial/REVENUE_EXECUTION_PLAN
---

# Lib: `commission.ts` (Sales Partner Commission SSoT)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/commission.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/commission.ts)**

#lib #domain #commission #middleman #legal

> **Single Source of Truth for Middleman Sales Partner Commission Calculations.**

- **Path:** `src/lib/commission.ts` & `src/data/commissionConfig.json`
- **Tiers:** Band A (10% up to ₹75,000 / $1,000), Band B (12% on ₹75,001–₹2,49,999 / $1,001–$3,299), Band C (15% on ₹2,50,000+ / $3,300+), Recurring Retainer (10%).

---

## 🔗 Related Architecture & Cross-References
- [MIDDLEMAN_PARTNERSHIP_AGREEMENT](../commercial/MIDDLEMAN_PARTNERSHIP_AGREEMENT.md)
- [UI: MiddlemanAgreement](UI_MiddlemanAgreement.md)
- [REVENUE_EXECUTION_PLAN](../commercial/REVENUE_EXECUTION_PLAN.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](../runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

