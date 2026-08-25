---
id: Retriever_API_v1_security_compression
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/routers/security_compression.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/security_compression.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/security_compression.py"
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
  - Engine_LongLLMLingua_Compression
  - Engine_Envelope_Encryption
---

# Retriever API: `apps/api/src/routers/security_compression.py`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/security_compression.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/security_compression.py)**

#retriever #api #security #compression #encryption #m49

> **Context Window Token Compression & Zero-Trust Field Envelope Encryption Router (Milestone 49).**

- **Endpoints:**
  - `POST /v1/tenants/{tenantId}/context/compress` — LongLLMLingua prompt token compression
  - `POST /v1/tenants/{tenantId}/security/encrypt` — AES-256-GCM field encryption
  - `POST /v1/tenants/{tenantId}/security/decrypt` — AES-256-GCM field decryption

---

## 🔗 Related Architecture & Cross-References
- [Engine: LongLLMLingua Compression](Engine_LongLLMLingua_Compression.md)
- [Engine: Envelope Encryption](Engine_Envelope_Encryption.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

