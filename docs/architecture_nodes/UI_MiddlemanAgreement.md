---
id: UI_MiddlemanAgreement
tier: 2_discovery_commerce
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/components/pdf/MiddlemanAgreementPDF.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/pdf/MiddlemanAgreementPDF.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/pdf/MiddlemanAgreementPDF.tsx"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/2_discovery_commerce
  - security/public
  - domain/scoping
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../MIDDLEMAN_PARTNERSHIP_AGREEMENT
  - Lib_commission
---

# UI: `MiddlemanAgreement.tsx` & `MiddlemanAgreementPDF.tsx`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/pdf/MiddlemanAgreementPDF.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/pdf/MiddlemanAgreementPDF.tsx)**

#ui #partner #legal #commission #pdf

> **Sales Partner Commercial Agreement View & Azure/Noir React-PDF Exporter.**

- **Path:** `src/components/pdf/MiddlemanAgreementPDF.tsx` & `scripts/generate-middleman-pdf.mjs`
- **Features:** Pinned 3-page layout contract, read-only commission band schedule, customizable prose sections.

---

## 🔗 Related Architecture & Cross-References
- [MIDDLEMAN_PARTNERSHIP_AGREEMENT](../MIDDLEMAN_PARTNERSHIP_AGREEMENT.md)
- [Lib: commission.ts](Lib_commission.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

