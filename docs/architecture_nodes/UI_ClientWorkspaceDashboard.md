---
id: UI_ClientWorkspaceDashboard
tier: 3_workspace_control
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/3_workspace_control
  - security/public
  - domain/workspace
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../CLIENT_DASHBOARD_ROADMAP
  - Schema_client_scopes
  - Schema_invoices
  - API_client_save_scope
---

# UI: `ClientWorkspaceDashboard.tsx`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#ui #frontend #dashboard #client #workspace

> **Client Command Center (`prateeq.in/dashboard`).**

---

## 🔗 Related Architecture & Cross-References
- [CLIENT_DASHBOARD_ROADMAP](../CLIENT_DASHBOARD_ROADMAP.md)
- [Schema: client_scopes](Schema_client_scopes.md)
- [Schema: invoices](Schema_invoices.md)
- [API: client/save-scope](API_client_save_scope.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

