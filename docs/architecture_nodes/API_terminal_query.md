---
id: API_terminal_query
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
file_path: src/app/api/terminal/query/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/terminal/query/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/terminal/query/route.ts"
tags:
  - tier/4_api_gateway
  - security/public
  - domain/content_api
  - platform/website
downstream:
  - Route_terminal
  - UI_Terminal
  - Schema_pgvector_store
---

# API: `POST /api/terminal/query`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/terminal/query/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/terminal/query/route.ts)**

#api #terminal #rag #diagnostics

> **Role-Gated In-Terminal RAG Knowledge Base Search Handler.**

- **Endpoint:** `POST /api/terminal/query`
- **Path:** `src/app/api/terminal/query/route.ts`
- **Tenant Partitioning:** Maps authenticated admin sessions to `system_master` and anonymous terminal visitors to `demo_public_docs`.
- **Functionality:** Searches indexed document chunks in Supabase using keyword relevance scoring and returns top 5 matching code snippets and architecture references.

---

## 🔗 Related Architecture & Cross-References
- [Route: /terminal](Route_terminal.md)
- [UI: SiteInfoConsole](UI_Terminal.md)
- [Schema: pgvector_store](Schema_pgvector_store.md)
