---
id: Retriever_API_v1_search
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
file_path: apps/api/src/routers/search.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/search.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/search.py"
tags:
  - tier/6_retriever_cognitive
  - security/public
  - domain/fastapi
  - platform/retriever
downstream:
  - ../../../retriever/docs/architecture
  - Schema_pgvector_store
---

# Retriever API: `POST /v1/search`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/search.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/search.py)**

#retriever #api #search #hybrid #fastapi

> **High-Performance Hybrid Dense + Sparse Search Gateway.**

- **Path:** `apps/api/src/routers/search.py`
- **Features:** Dense HNSW pgvector + Sparse SPLADE / BM25 with Reciprocal Rank Fusion (RRF).

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [Schema: pgvector_embeddings](Schema_pgvector_store.md)
