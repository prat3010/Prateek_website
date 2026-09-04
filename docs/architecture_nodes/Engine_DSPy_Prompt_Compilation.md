---
id: Engine_DSPy_Prompt_Compilation
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
  - ../UNIFIED_MASTER_ROADMAP
  - ../../../retriever/docs/runbooks/RUNBOOK_DSPY_PROMPT_COMPILATION
---

# Engine: DSPy Declarative Prompt Compilation (Milestone 92)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #dspy #prompt_compilation #teleprompter #m92 #retriever

> **Declarative Prompt Programming & Algorithmic Self-Optimization Engine using Metric-Driven Teleprompters (BootstrapFewShot, MIPROv2).**

- **Domain Core:** `apps/api/src/domain/inference/dspy_abstractions.py` (`FewShotDemonstration`, `CompiledPromptProgram`, `DSPyCompilerProtocol`, `CompiledPromptRepositoryProtocol`).
- **Compiler Adapter:** `apps/api/src/adapters/cognitive/dspy_compiler_adapter.py` (`DSPyCompilerAdapter`).
- **Database Persistence:** `apps/api/src/adapters/database/compiled_prompt_repository.py` (`SqlCompiledPromptRepository`).
- **REST APIs:** `apps/api/src/routers/prompts.py` (`/v1/tenants/{tenantId}/prompts/*`).
- **Frontend Studio:** `Prateek_website/src/components/rag/PromptOptimizationPanel.tsx` & `retriever/apps/web/src/app/(dashboard)/prompts/page.tsx`.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: RAG 2026 Roadmap](../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP.md)
- [Unified Master Roadmap](../UNIFIED_MASTER_ROADMAP.md)
- [Operational Runbook](../../../retriever/docs/runbooks/RUNBOOK_DSPY_PROMPT_COMPILATION.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

