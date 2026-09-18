---
id: Engine_Hierarchical_Memory_GoT
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
  - Retriever_API_v1_got
  - UI_GotPlanningPanel
  - ../44_Hierarchical_Memory_Graph_of_Thoughts_PRD
---

# Engine: Hierarchical Memory Augmentation with Graph-of-Thoughts (GoT) Planning (Platform Battery #38)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #got #graphofthoughts #hierarchicalmemory #ebbinghaus #battery38 #m123

> **Non-Linear Directed Acyclic Graph (DAG) Reasoning & 3-Tier Cognitive Memory.**

- **Implementation:** `GoTPlannerAdapter` in `apps/api/src/adapters/cognitive/got_planner_adapter.py`
- **Role:** Executes non-linear reasoning transformations ($1 \to N$ generation, $M \to 1$ aggregation, $1 \to 1$ refinement, branch pruning), evaluates optimal paths using Kahn's topological sort and memoized dynamic programming, and manages partitioned 3-tier memory (L1 Scratchpad, decaying L2 Episodic via Ebbinghaus forgetting curve, and consolidated L3 Semantic knowledge graphs).

---

## 🔗 Related Architecture & Cross-References
- [Retriever_API: v1/got](Retriever_API_v1_got.md)
- [UI: GotPlanningPanel](UI_GotPlanningPanel.md)
- [44_Hierarchical_Memory_Graph_of_Thoughts_PRD](../44_Hierarchical_Memory_Graph_of_Thoughts_PRD.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

