---
id: Engine_Durable_Workflow_Execution
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/"
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
  - ../../../Prateek_Ecosystem_Vault/internal_archives/retriever/RAG_2026_PRODUCT_ROADMAP
  - ../UNIFIED_MASTER_ROADMAP
  - ../../../retriever/docs/api/durable_workflow
  - ../../../retriever/docs/runbooks/RUNBOOK_DURABLE_WORKFLOWS
  - ../../../retriever/docs/decisions/017-durable-asynchronous-execution
---

# Engine: Durable Asynchronous Execution & Background AI Workflow Engine (ARCHIVED — Purged in Remediation R2.7)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/)**

> [!WARNING] Archived / Purged Subsystem
> Replaced by honest Celery + RabbitMQ task queueing (`workers/`) and `DagExecutor` (`apps/api/src/routers/workflow.py`, `apps/api/src/routers/workflow_dag.py`). The `durable_workflow.py` router and `WorkflowsPanel.tsx` UI were removed in Remediation `R2.7`.

- **Domain Core:** `apps/api/src/domain/abstractions/durable_workflow.py` (`WorkflowStatus`, `StepStatus`, `WorkflowStepRecord`, `WorkflowExecution`, `WorkflowDefinition`, `IWorkflowRepository`, `IDurableWorkflowAdapter`) & `apps/api/src/domain/workflow/durable_engine.py` (`DurableWorkflowEngine`).
- **Adapter & Runner:** `apps/api/src/adapters/workflow/durable_workflow_adapter.py` (`DurableWorkflowAdapter`).
- **Postgres RLS Persistence:** `apps/api/src/adapters/database/workflow_repository.py` (`SqlWorkflowRepository`, `WorkflowExecutionDb`, `WorkflowStepCheckpointDb`).
- **REST APIs:** `apps/api/src/routers/durable_workflow.py` (`/v1/tenants/{tenant_id}/workflows/*`, `/v1/admin/workflows/overview`).
- **Frontend SaaS Studio:** `Prateek_website/src/components/rag/WorkflowsPanel.tsx` in `/rag/app`, Client SDK methods in `src/lib/rag-client.ts`, webhook handler in `src/app/api/rag/workflow-webhook/route.ts`.
- **Admin Dashboard:** `retriever/apps/web/src/components/tenant-workflow.tsx` & `retriever/apps/web/src/app/(dashboard)/batteries/page.tsx`.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: RAG 2026 Roadmap](../../../Prateek_Ecosystem_Vault/internal_archives/retriever/RAG_2026_PRODUCT_ROADMAP.md)
- [Unified Master Roadmap](../UNIFIED_MASTER_ROADMAP.md)
- [REST API Specification](../../../retriever/docs/api/durable_workflow.md)
- [Operational Runbook](../../../retriever/docs/runbooks/RUNBOOK_DURABLE_WORKFLOWS.md)
- [Architecture Decision Record (ADR-017)](../../../retriever/docs/decisions/017-durable-asynchronous-execution.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](../runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

