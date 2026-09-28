---
id: UI_QuickLaunchWizardModal
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/components/rag/QuickLaunchWizardModal.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/QuickLaunchWizardModal.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/QuickLaunchWizardModal.tsx"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/1_frontend
  - security/public
  - domain/ui
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - Route_rag_app
  - ../24_RAG_App_Studio_PRD
---

# UI: `QuickLaunchWizardModal.tsx`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/QuickLaunchWizardModal.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/QuickLaunchWizardModal.tsx)**

#ui #frontend #onboarding #modal #wizard

> **Interactive 3-Step Quick Launch Onboarding Wizard for Retriever SaaS Studio.**

- **Path:** `src/components/rag/QuickLaunchWizardModal.tsx`
- **Function:** Guides new workspace subscribers through:
  1. Instant Document Ingestion (Upload PDF / TXT / Markdown).
  2. Live Semantic Search Validation (Testing chunk citations in real time).
  3. 1-Click Code Embed & API Integration (Copying widget script tag).

---

## 🔗 Related Architecture & Cross-References
- [Route: /rag/app](Route_rag_app.md)
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

