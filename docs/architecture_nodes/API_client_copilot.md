---
id: API_client_copilot
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: bearer_jwt
file_path: src/app/api/client/copilot/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/copilot/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/copilot/route.ts"
tags:
  - tier/4_api_gateway
  - security/bearer_jwt
  - domain/content_api
  - platform/website
downstream:
  - ../CLIENT_DASHBOARD_ROADMAP
  - Route_dashboard
  - Schema_client_scopes
  - Lib_sessionVerify
---

# API: `POST /api/client/copilot`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/copilot/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/copilot/route.ts)**

#api #copilot #rag #client #ai

> **Context-Aware Client Project Assistant grounded in verified active project scopes.**

- **Endpoint:** `POST /api/client/copilot`
- **Path:** `src/app/api/client/copilot/route.ts`
- **Authentication:** `getVerifiedSessionEmail` via Bearer Token or HTTP cookie
- **Function:** Queries client's active `client_scopes` record and synthesizes answers regarding features, timeline, maintenance, and payment schedules.

---

## 🔗 Related Architecture & Cross-References
- [CLIENT_DASHBOARD_ROADMAP](../CLIENT_DASHBOARD_ROADMAP.md)
- [Route: /dashboard](Route_dashboard.md)
- [Schema: client_scopes](Schema_client_scopes.md)
- [Lib: sessionVerify.ts](Lib_sessionVerify.md)
