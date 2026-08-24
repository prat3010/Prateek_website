---
id: API_client_get_scopes
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: bearer_jwt
file_path: src/app/api/client/get-scopes/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/get-scopes/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/get-scopes/route.ts"
tags:
  - tier/4_api_gateway
  - security/bearer_jwt
  - domain/commerce
  - platform/website
downstream:
  - Schema_client_scopes
  - Route_dashboard
  - Lib_sessionVerify
---

# API: `GET /api/client/get-scopes`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/get-scopes/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/get-scopes/route.ts)**

#api #persistence #client #session

> **Authenticated Scope Retrieval for Client Dashboard & Scoping History.**

- **Endpoint:** `GET /api/client/get-scopes`
- **Path:** `src/app/api/client/get-scopes/route.ts`
- **Authentication:** Session JWT bearer token via `sessionVerify.ts`

---

## 🔗 Related Architecture & Cross-References
- [Schema: client_scopes](Schema_client_scopes.md)
- [Route: /dashboard](Route_dashboard.md)
- [Lib: sessionVerify.ts](Lib_sessionVerify.md)
