---
id: Engine_Sovereign_Edge_Sync
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/domain/abstractions/edge.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/edge.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/edge.py"
runbook: docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md
tags:
  - tier/6_retriever_cognitive
  - security/public
  - domain/cognitive_engine
  - platform/retriever
invariants:
  - "Every query and database record MUST strictly enforce tenant_id isolation."
  - "Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError."
  - "Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys)."
test_suites:
  - apps/api/tests/test_architecture.py
downstream:
  - ../../../retriever/docs/api/edge
  - Retriever_API_v1_edge
  - UI_EdgeSwarmPanel
  - ../99_DECISIONS
---

# Engine: Sovereign Edge Vector Sync & CRDT SQLite Swarm (Milestone 98)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/edge.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/edge.py)**

#engine #edge #crdt #sqlite #swarm #m98

> **Peer-to-Peer Edge Vector Synchronization, SQLite Replica Snapshots & CRDT State Merging.**

- **Domain Core:** `apps/api/src/domain/abstractions/edge.py` (`EdgePeer`, `CrdtVectorClock`, `EdgeSnapshotDelta`)
- **Adapters:** `apps/api/src/adapters/edge/sqlite_sync_adapter.py`
- **Role:** Enables mobile, embedded, and remote edge runtimes to query local vector stores offline and synchronize deltas with the central pgvector primary upon reconnection.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API edge.md](../../../retriever/docs/api/edge.md)
- [Retriever_API: v1/edge](Retriever_API_v1_edge.md)
- [UI: EdgeSwarmPanel](UI_EdgeSwarmPanel.md)
- [99_DECISIONS (ADR 35)](../99_DECISIONS.md#adr-35-sovereign-edge-vector-synchronization-offline-first-sqlite-crdt-swarms)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

