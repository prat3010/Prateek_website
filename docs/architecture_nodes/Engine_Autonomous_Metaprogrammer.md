---
id: Engine_Autonomous_Metaprogrammer
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/domain/abstractions/scaffold.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/scaffold.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/scaffold.py"
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
  - ../../../retriever/docs/api/scaffold
  - Retriever_API_v1_scaffold
  - UI_CapabilityStudioPanel
  - ../99_DECISIONS
---

# Engine: Autonomous Metaprogrammer & Capability Studio (Milestone 97)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/scaffold.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/domain/abstractions/scaffold.py)**

#engine #metaprogramming #ast #scaffold #retriever #m97

> **Deterministic Python AST Code Synthesis, Architectural Linter Validation & Capability Scaffolding.**

- **Domain Core:** `apps/api/src/domain/abstractions/scaffold.py` (`AstCapabilitySpec`, `ScaffoldGeneratedFile`, `AstValidationReport`)
- **Adapters:** `apps/api/src/adapters/scaffold/python_ast_generator.py`
- **Role:** Dynamically synthesizes clean hexagonal domain protocols, FastAPI routers, mock adapters, and Pytest suites from high-level capability specifications.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API scaffold.md](../../../retriever/docs/api/scaffold.md)
- [Retriever_API: v1/scaffold](Retriever_API_v1_scaffold.md)
- [UI: CapabilityStudioPanel](UI_CapabilityStudioPanel.md)
- [99_DECISIONS (ADR 34)](../99_DECISIONS.md#adr-34-autonomous-metaprogramming-and-self-scaffolding-capability-engine)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

