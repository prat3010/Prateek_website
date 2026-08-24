---
id: Schema_pgvector_store
tier: 8_persistence
platform: Prateek_Website
status: production
auth_level: public
file_path: apps/api/alembic/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/apps/api/alembic/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/apps/api/alembic/"
tags:
  - tier/8_persistence
  - security/public
  - domain/database
  - platform/website
downstream:
  - ../../../retriever/docs/architecture
  - Retriever_API_v1_search
---

# Schema: `pgvector_embeddings` (HNSW Vector Index)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/apps/api/alembic/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/apps/api/alembic/)**

#db #vector #hnsw #pgvector #retriever

> **High-Performance Dense Embedding Storage partitioned by tenant.**

- **Path:** `apps/api/alembic/` in `retriever`
- **Indexes:** Cosine distance `vector_cosine_ops` with HNSW `m=16, ef_construction=64`.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [Retriever_API: v1/search](Retriever_API_v1_search.md)
