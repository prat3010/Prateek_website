---
id: Schema_rag_tenants
tier: 8_persistence
platform: Prateek_Website
status: production
auth_level: public
file_path: supabase_schema.sql
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql"
tags:
  - tier/8_persistence
  - security/public
  - domain/database
  - platform/website
downstream:
  - ../24_RAG_App_Studio_PRD
  - ../../../retriever/docs/architecture
  - API_rag_tenant
---

# Schema: `rag_tenants` (Multi-Tenant Workspaces)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)**

#db #rag #multitenancy #retriever

> **Workspace Isolation, Dynamic Dimension Partitioning & Quota Allocation.**

- **Fields:** `tenant_id`, `name`, `plan`, `monthly_token_quota`, `embedding_model`, `created_at`

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [API: rag/tenant](API_rag_tenant.md)
