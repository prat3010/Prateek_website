---
id: Retriever_API_v1_health
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
file_path: apps/api/src/routers/health.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/health.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/health.py"
tags:
  - tier/6_retriever_cognitive
  - security/public
  - domain/fastapi
  - platform/retriever
downstream:
  - ../../../retriever/docs/architecture
---

# Retriever API: `apps/api/src/routers/health.py`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/health.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/health.py)**

#retriever #api #health #monitoring

> **Liveness, Readiness & Dependency Health Check Endpoint.**

- **Checks:** PostgreSQL, pgvector extension, Redis cache, RabbitMQ broker.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
