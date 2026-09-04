---
id: UI_IntegrationsPanel
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/"
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
---

# UI Component: `IntegrationsPanel`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#ui #integrations #slack #chrome_extension #gdrive #webhooks #rag

> **Ecosystem Plugins & Third-Party Integrations Panel (`/rag/app?view=integrations`).**

---

## 1. Overview & Functionality

`IntegrationsPanel` enables users to connect external apps directly to their tenant's knowledge store:
- **Slack Workspace Bot:** Interactive guide to configure `/ask-retriever` slash command, view copyable webhook URLs, and test verification pings.
- **1-Click Chrome Ingestion Extension:** 1-click ZIP download button with side-loading instructions for browser tab ingestion.
- **Google Drive 2-Way Sync:** Configure service account credentials and select target folders for automated vector synchronization.

---

## 2. Dependencies & Blast Radius
- **Upstream Router:** `src/app/rag/app/page.tsx` (`Route_rag_app`)
- **Backend API:** `/v1/integrations/*` (`Retriever_API_v1_integrations`)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

