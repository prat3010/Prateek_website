---
id: Retriever_API_v1_chat
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/routers/chat.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/chat.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/chat.py"
runbook: docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md
tags:
  - tier/6_retriever_cognitive
  - security/public
  - domain/fastapi
  - platform/retriever
invariants:
  - "Every query and database record MUST strictly enforce tenant_id isolation."
  - "Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError."
  - "Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys)."
test_suites:
  - apps/api/tests/test_architecture.py
downstream:
  - ../../../retriever/docs/architecture
  - Engine_Dogfooding_Tenant_prateeq_scoping
  - Lib_rag_client
---

# Retriever API: `POST /v1/chat`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/chat.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/chat.py)**

#retriever #api #rag #fastapi #stream

> **FastAPI Streaming RAG Endpoint with SSE, Citations & Semantic Caching.**

- **Path:** `apps/api/src/routers/chat.py`
- **Features:**
  - Token-by-token Server-Sent Events (SSE) streaming
  - Citation injection with bounding boxes & page offsets
  - Redis Semantic Caching (`PgSemanticCacheAdapter`)
  - Llama Guard 3 injection filter

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)
- [Engine: Dogfooding Tenant prateeq_scoping](Engine_Dogfooding_Tenant_prateeq_scoping.md)
- [Lib: rag-client.ts](Lib_rag_client.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

