---
id: API_client_save_scope
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: bearer_jwt
blast_radius: medium
file_path: src/app/api/client/save-scope/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/save-scope/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/save-scope/route.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/4_api_gateway
  - security/bearer_jwt
  - domain/commerce
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - Schema_client_scopes
  - UI_ClientWorkspaceDashboard
  - UI_ArchitectureCartDrawer
  - ../CLIENT_DASHBOARD_ROADMAP
---

# API: `POST /api/client/save-scope`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/save-scope/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/save-scope/route.ts)**

#api #persistence #client #session

> **Session-Gated Client Scope Revision & Draft State Persistence.**

- **Endpoint:** `POST /api/client/save-scope`
- **Path:** `src/app/api/client/save-scope/route.ts`
- **Authentication:** `Authorization: Bearer <supabase_access_token>`
- **Identity Derivation:** Client email derived strictly from verified JWT claims.
- **Database Target:** Supabase table `client_scopes`.

---

## 🔗 Related Architecture & Cross-References
- [Schema: client_scopes](Schema_client_scopes.md)
- [UI: ClientWorkspaceDashboard](UI_ClientWorkspaceDashboard.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [CLIENT_DASHBOARD_ROADMAP](../CLIENT_DASHBOARD_ROADMAP.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

