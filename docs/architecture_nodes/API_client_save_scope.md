---
id: API_client_save_scope
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: bearer_jwt
file_path: src/app/api/client/save-scope/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/save-scope/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/save-scope/route.ts"
tags:
  - tier/4_api_gateway
  - security/bearer_jwt
  - domain/commerce
  - platform/website
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
