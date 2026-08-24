---
id: API_client_intake_draft
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: bearer_jwt
file_path: src/app/api/client/intake-draft/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/intake-draft/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/intake-draft/route.ts"
tags:
  - tier/4_api_gateway
  - security/bearer_jwt
  - domain/commerce
  - platform/website
downstream:
  - UI_ScopingLab
  - Schema_client_scopes
---

# API: `POST /api/client/intake-draft`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/intake-draft/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/intake-draft/route.ts)**

#api #scoping #draft #anonymous

> **Anonymous Scoping Questionnaire Auto-Save & Magic Link Resumption.**

- **Endpoint:** `POST /api/client/intake-draft`
- **Path:** `src/app/api/client/intake-draft/route.ts`
- **Function:** Persists partial questionnaire state to allow prospects to resume scoping across browser sessions.

---

## 🔗 Related Architecture & Cross-References
- [UI: ScopingLab](UI_ScopingLab.md)
- [Schema: client_scopes](Schema_client_scopes.md)
