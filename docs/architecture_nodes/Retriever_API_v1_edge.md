---
id: Retriever_API_v1_edge
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/routers/edge.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/edge.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/edge.py"
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
  - ../../../retriever/docs/api/edge
  - Engine_Sovereign_Edge_Sync
  - UI_EdgeSwarmPanel
---

# Retriever API: `apps/api/src/routers/edge.py`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/edge.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/edge.py)**

#retriever #api #edge #crdt #sqlite #m98

> **Sovereign Edge Vector Sync & CRDT SQLite Swarm Router (Milestone 98).**

- **Endpoints:**
  - `POST /v1/edge/peers/register` — Register edge peer device
  - `GET /v1/edge/tenants/{tenantId}/snapshot` — Download SQLite replica snapshot
  - `POST /v1/edge/tenants/{tenantId}/delta` — Push / pull CRDT change vectors
  - `GET /v1/edge/tenants/{tenantId}/status` — Peer sync health & vector clock status

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API edge.md](../../../retriever/docs/api/edge.md)
- [Engine: Sovereign Edge Sync](Engine_Sovereign_Edge_Sync.md)
- [UI: EdgeSwarmPanel](UI_EdgeSwarmPanel.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

