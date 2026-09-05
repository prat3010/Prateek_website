---
id: Retriever_API_v1_scaffold
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/routers/scaffold.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/scaffold.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/scaffold.py"
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
  - ../../../retriever/docs/api/scaffold
  - Engine_Autonomous_Metaprogrammer
  - UI_CapabilityStudioPanel
---

# Retriever API: `apps/api/src/routers/scaffold.py`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/scaffold.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/scaffold.py)**

#retriever #api #scaffold #metaprogramming #ast #m97

> **Autonomous Metaprogrammer & Capability Studio Router (Milestone 97).**

- **Endpoints:**
  - `POST /v1/scaffold/generate` — Synthesize AST router, adapter, and test files
  - `POST /v1/scaffold/validate` — AST syntax & forbidden import validation
  - `POST /v1/scaffold/apply` — Atomic disk write & hot-reload injection

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API scaffold.md](../../../retriever/docs/api/scaffold.md)
- [Engine: Autonomous Metaprogrammer](Engine_Autonomous_Metaprogrammer.md)
- [UI: CapabilityStudioPanel](UI_CapabilityStudioPanel.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

