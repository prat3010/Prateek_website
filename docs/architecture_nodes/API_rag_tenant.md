---
id: API_rag_tenant
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
file_path: src/app/api/rag/tenant/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/rag/tenant/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/rag/tenant/route.ts"
tags:
  - tier/4_api_gateway
  - security/public
  - domain/rag
  - platform/website
downstream:
  - ../24_RAG_App_Studio_PRD
  - Schema_rag_tenants
  - Route_rag_app
---

# API: `POST /api/rag/tenant`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/rag/tenant/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/rag/tenant/route.ts)**

#api #rag #multitenancy #saas

> **Retriever SaaS Multi-Tenant Provisioning & Configuration Manager.**

- **Endpoint:** `POST /api/rag/tenant` & `GET /api/rag/tenant`
- **Path:** `src/app/api/rag/tenant/route.ts`
- **Function:** Creates isolated tenant workspaces, assigns embedding models, and provisions API keys.

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Schema: rag_tenants](Schema_rag_tenants.md)
- [Route: /rag/app](Route_rag_app.md)
