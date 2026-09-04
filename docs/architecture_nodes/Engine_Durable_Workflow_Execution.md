---
id: Engine_Durable_Workflow_Execution
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
  - ../../../retriever/docs/api/DURABLE_WORKFLOWS_REST_API
  - ../../../retriever/docs/runbooks/RUNBOOK_DURABLE_WORKFLOWS
  - ../../../retriever/docs/decisions/017-durable-asynchronous-execution
---

# Engine: Durable Asynchronous Execution & Background AI Workflow Engine (Milestone 95)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #durable_execution #workflows #checkpoints #memoization #m95 #retriever

> **Event-driven, fault-tolerant background execution engine featuring step-level memoization, resilient automatic retry backoff, and idempotent checkpoint state machines across distributed AI pipelines (Platform Battery #15).**

- **Domain Core:** `apps/api/src/domain/abstractions/durable_workflow.py` (`WorkflowStatus`, `StepStatus`, `WorkflowStepRecord`, `WorkflowExecution`, `WorkflowDefinition`, `IWorkflowRepository`, `IDurableWorkflowAdapter`) & `apps/api/src/domain/workflow/durable_engine.py` (`DurableWorkflowEngine`).
- **Adapter & Runner:** `apps/api/src/adapters/workflow/durable_workflow_adapter.py` (`DurableWorkflowAdapter`).
- **Postgres RLS Persistence:** `apps/api/src/adapters/database/workflow_repository.py` (`SqlWorkflowRepository`, `WorkflowExecutionDb`, `WorkflowStepCheckpointDb`).
- **REST APIs:** `apps/api/src/routers/durable_workflow.py` (`/v1/tenants/{tenant_id}/workflows/*`, `/v1/admin/workflows/overview`).
- **Frontend SaaS Studio:** `Prateek_website/src/components/rag/WorkflowsPanel.tsx` in `/rag/app`, Client SDK methods in `src/lib/rag-client.ts`, webhook handler in `src/app/api/rag/workflow-webhook/route.ts`.
- **Admin Dashboard:** `retriever/apps/web/src/components/tenant-workflow.tsx` & `retriever/apps/web/src/app/(dashboard)/batteries/page.tsx`.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: RAG 2026 Roadmap](../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP.md)
- [Unified Master Roadmap](../UNIFIED_MASTER_ROADMAP.md)
- [REST API Specification](../../../retriever/docs/api/DURABLE_WORKFLOWS_REST_API.md)
- [Operational Runbook](../../../retriever/docs/runbooks/RUNBOOK_DURABLE_WORKFLOWS.md)
- [Architecture Decision Record (ADR-017)](../../../retriever/docs/decisions/017-durable-asynchronous-execution.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

