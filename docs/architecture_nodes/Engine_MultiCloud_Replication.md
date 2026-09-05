---
id: Engine_MultiCloud_Replication
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/domain/abstractions/multicloud.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/multicloud.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/multicloud.py"
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
  - ../../../retriever/docs/api/multicloud
  - Retriever_API_v1_multicloud
  - ../99_DECISIONS
---

# Engine: Multi-Cloud Active-Active LibSQL Failover (Milestone 99)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/multicloud.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/multicloud.py)**

#engine #multicloud #libsql #failover #disaster_recovery #m99

> **Zero-Downtime Distributed Database Replication & Autonomous Raft Leader Election.**

- **Domain Core:** `apps/api/src/domain/abstractions/multicloud.py` (`CloudRegion`, `LibsqlReplicaStatus`, `RaftClusterState`)
- **Adapters:** `apps/api/src/adapters/multicloud/libsql_failover_adapter.py`
- **Role:** Synchronizes transactions across Oracle Cloud VPS, Fly.io, and AWS edge nodes with automatic sub-5-second failover.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API multicloud.md](../../../retriever/docs/api/multicloud.md)
- [Retriever_API: v1/multicloud](Retriever_API_v1_multicloud.md)
- [99_DECISIONS (ADR 36)](../99_DECISIONS.md#adr-36-multi-cloud-distributed-libsql-active-active-replication-and-automated-failover)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

