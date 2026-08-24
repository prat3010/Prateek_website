---
id: Route_admin
tier: 3_workspace_control
platform: Prateek_Website
status: production
auth_level: bearer_jwt
blast_radius: medium
file_path: src/app/admin/page.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/admin/page.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/admin/page.tsx"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/3_workspace_control
  - security/bearer_jwt
  - domain/workspace
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../AI_OUTREACH_AGENT_ROADMAP
  - ../CLIENT_DASHBOARD_ROADMAP
  - UI_AdminPortal
  - API_outreach_dispatch
  - Schema_outreach_leads
  - Schema_client_scopes
---

# Route: `/admin` (Master Admin Control Center)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/admin/page.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/admin/page.tsx)**

#route #frontend #admin #leads #scopes

> **Operator Command Center for Autonomous Outreach Queue & Client Scopes.**

- **Path:** `src/app/admin/page.tsx` & `src/components/admin/`
- **Key Features:**
  - Google OAuth admin auth gate
  - Autonomous AI Outreach lead approval queue
  - Master client scope revisions & invoice ledger
  - One-click outreach dispatch trigger (`/api/outreach/dispatch`)

---

## 🔗 Related Architecture & Cross-References
- [AI_OUTREACH_AGENT_ROADMAP](../AI_OUTREACH_AGENT_ROADMAP.md)
- [CLIENT_DASHBOARD_ROADMAP](../CLIENT_DASHBOARD_ROADMAP.md)
- [UI: AdminPortal](UI_AdminPortal.md)
- [API: outreach/dispatch](API_outreach_dispatch.md)
- [Schema: outreach_leads](Schema_outreach_leads.md)
- [Schema: client_scopes](Schema_client_scopes.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

