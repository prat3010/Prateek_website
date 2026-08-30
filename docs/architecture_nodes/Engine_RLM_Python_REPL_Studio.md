---
id: Engine_RLM_Python_REPL_Studio
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
  - ../24_RAG_App_Studio_PRD
  - ../00_ARCHITECTURE_INDEX
---

# Engine: Interactive RLM Python REPL Sandbox Studio (Milestone 72)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #rlm #python_repl #sandbox #studio #multi_turn #m72 #retriever

> **Interactive Recursive Language Model (RLM) Developer Studio allowing users to execute multi-turn, programmatic Python scripts inside a secure AST sandbox over document vaults.**

- **Backend Engine:** `RlmExecutionEngine` in `retriever/apps/api/src/domain/rlm/engine.py`
- **Sandbox Provider:** `RestrictedPythonSandboxAdapter` in `retriever/apps/api/src/adapters/sandbox/python_sandbox_adapter.py`
- **Router Endpoint:** `POST /v1/tenants/{tenantId}/rlm/analyze` in `retriever/apps/api/src/routers/rlm.py`
- **Frontend Studio:** `RlmStudioPanel.tsx` in `Prateek_website/src/components/rag/`
- **Multi-Turn Adaptive Execution:** Automatically routes requests with `max_depth > 1` to `analyze_repl_loop()`, capturing per-turn execution traces, stdout output, and self-correcting logic.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: RAG 2026 Roadmap](../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP.md)
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [00_ARCHITECTURE_INDEX](../00_ARCHITECTURE_INDEX.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

