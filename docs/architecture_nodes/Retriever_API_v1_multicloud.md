---
id: Retriever_API_v1_multicloud
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/routers/multicloud.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/multicloud.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/multicloud.py"
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
  - ../../../retriever/docs/api/multicloud
  - Engine_MultiCloud_Replication
---

# Retriever API: `apps/api/src/routers/multicloud.py`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/multicloud.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/multicloud.py)**

#retriever #api #multicloud #libsql #failover #m99

> **Multi-Cloud Failover & Distributed LibSQL Active-Active Replication Router (Milestone 99).**

- **Endpoints:**
  - `GET /v1/admin/multicloud/status` — Cluster replication health & primary region
  - `POST /v1/admin/multicloud/failover` — Trigger manual or automated Raft failover
  - `POST /v1/admin/multicloud/probe` — Latency ping probe across cloud regions

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API multicloud.md](../../../retriever/docs/api/multicloud.md)
- [Engine: MultiCloud Replication](Engine_MultiCloud_Replication.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

