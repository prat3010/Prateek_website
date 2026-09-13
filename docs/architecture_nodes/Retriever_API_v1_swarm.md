---
id: Retriever_API_v1_swarm
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/routers/swarm.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/swarm.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/swarm.py"
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
  - ../../../retriever/docs/decisions/0024-autonomous-edge-fleet-swarm-mesh-p2p-gossip
  - ../99_DECISIONS
---

# Retriever API: `apps/api/src/routers/swarm.py`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/swarm.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/swarm.py)**

#retriever #api #swarm #p2p #gossip #swim #vectorclock #m102

> **Autonomous Edge Fleet Swarm Mesh & P2P Gossip Replication Router (Milestone 102).**

- **Endpoints:**
  - `GET /v1/admin/swarm/topology` — Cluster membership, peer states, RTT metrics & convergence
  - `POST /v1/admin/swarm/join` — Dynamic peer node registration into the swarm mesh
  - `POST /v1/admin/swarm/leave` — Graceful voluntary departure of a peer
  - `POST /v1/admin/swarm/probe` — SWIM failure detector direct ping or indirect ping-req probe
  - `POST /v1/admin/swarm/refute` — Suspicion rumor refutation with advanced incarnation
  - `POST /v1/admin/swarm/gossip` — Epidemic gossip message ingestion
  - `POST /v1/admin/swarm/sync` — Push-pull anti-entropy sequence exchange
  - `POST /v1/admin/swarm/partition-heal` — Causal reconciliation of disconnected network partitions
  - `GET /v1/tenants/{tenantId}/swarm/status` — Tenant-scoped mesh topology & sync health

---

## 🔗 Related Architecture & Cross-References
- [Retriever Decision: ADR-024 Swarm Mesh](../../../retriever/docs/decisions/0024-autonomous-edge-fleet-swarm-mesh-p2p-gossip.md)
- [Website ADR 38](../99_DECISIONS.md#adr-38-autonomous-edge-fleet-swarm-mesh-epidemic-p2p-gossip--causal-vector-clock-partition-reconciliation-milestone-102)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

