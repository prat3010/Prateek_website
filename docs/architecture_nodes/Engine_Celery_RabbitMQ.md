---
id: Engine_Celery_RabbitMQ
tier: 7_async_security
platform: Retriever
status: production
auth_level: public
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/src/"
tags:
  - tier/7_async_security
  - security/public
  - domain/async_infra
  - platform/retriever
downstream:
  - ../../../retriever/docs/architecture
  - Retriever_API_v1_documents
---

# Engine: Celery & RabbitMQ Distributed Async Queue

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #workers #rabbitmq #celery #async

> **Background Document Ingestion, Token Chunking & Vector Embedding Worker Pool.**

- **Broker:** RabbitMQ AMQP message broker
- **Worker Daemon:** Celery multiprocessing worker queue for asynchronous OCR & dense embedding.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [Retriever_API: v1/documents](Retriever_API_v1_documents.md)
