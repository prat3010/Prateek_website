---
id: Engine_GraphRAG_Topology
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/src/"
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
  - ../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP
  - UI_TopologyMap
  - ../25_SOTA_Scoping_Engine_PRD
---

# Engine: GraphRAG Knowledge Graph & Dynamic Topology

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #graph #graphrag #retriever #m46

> **Entity-Relation Extraction & Dynamic Architecture Graph Generation.**

- **Implementation:** `PgGraphRepository` & Neo4j Cypher Adapters in `apps/api/src/adapters/graph/`
- **Role:** Maps high-level functional features into concrete architectural nodes (Postgres, Redis, Celery, Vector Store, CDN) for the live `TopologyMap.tsx`.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: RAG 2026 Roadmap](../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP.md)
- [UI: TopologyMap](UI_TopologyMap.md)
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

