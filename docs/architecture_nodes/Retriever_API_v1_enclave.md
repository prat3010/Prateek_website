---
id: Retriever_API_v1_enclave
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/routers/enclave.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/enclave.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/enclave.py"
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
  - ../../../retriever/docs/api/enclave
  - Engine_Confidential_Micro_Enclave
---

# Retriever API: `apps/api/src/routers/enclave.py`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/enclave.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/enclave.py)**

#retriever #api #enclave #kms #attestation #confidential #m101

> **Micro-Enclave KMS & Remote Attestation Router (Milestone 101).**

- **Endpoints:**
  - `GET /v1/admin/edge/attestation/nonce` — Issue anti-replay attestation challenge
  - `POST /v1/admin/edge/attestation/verify` — Validate PCR0 hardware evidence & signature
  - `POST /v1/tenants/{tenantId}/edge/seal` — AES-256-GCM memory sealing with HKDF key derivation
  - `POST /v1/tenants/{tenantId}/edge/unseal` — Authenticated payload decryption
  - `POST /v1/admin/edge/enclave/wipe` — Zero-knowledge volatile memory wipe

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API enclave.md](../../../retriever/docs/api/enclave.md)
- [Engine: Confidential Micro-Enclave](Engine_Confidential_Micro_Enclave.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

