---
id: Retriever_API_v1_documents
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
file_path: apps/api/src/routers/document.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/document.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/document.py"
tags:
  - tier/6_retriever_cognitive
  - security/public
  - domain/fastapi
  - platform/retriever
downstream:
  - ../../../retriever/docs/architecture
  - Engine_Celery_RabbitMQ
---

# Retriever API: `POST /v1/documents`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/document.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/document.py)**

#retriever #api #ingestion #storage

> **Multi-Format Document Upload, Background Chunking & Presigned S3 Storage.**

- **Path:** `apps/api/src/routers/document.py`
- **Processing:** Celery async worker queue for AST token chunking & vector embedding.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [Engine: Celery RabbitMQ](Engine_Celery_RabbitMQ.md)
