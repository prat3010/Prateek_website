---
id: Retriever_API_v1_workflow
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/routers/workflow.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/workflow.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/workflow.py"
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
  - Engine_MultiAgent_Consensus
---

# Retriever API: `apps/api/src/routers/workflow.py`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/workflow.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/workflow.py)**

#retriever #api #agentic #workflow

> **Multi-Step Agentic Graph Execution & Stateful Planning.**

- **Endpoints:** `/v1/workflow/execute`, `/v1/workflow/status`

---

## 🔗 Related Architecture & Cross-References
- [Engine: MultiAgent Consensus](Engine_MultiAgent_Consensus.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

