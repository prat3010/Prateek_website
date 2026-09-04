---
id: Engine_LLM_Gateway_Smart_Router
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
  - ../../../retriever/docs/runbooks/RUNBOOK_LLM_GATEWAY_SMART_ROUTER
---

# Engine: Enterprise LLM Gateway & Smart Router (Milestone 93)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #gateway #smart_router #litellm #budget_ledger #m93 #retriever

> **Enterprise Multi-Model LLM Gateway & Smart Router featuring Dynamic Fallback Cascades, Circuit-Breaker Cooldowns, Latency SLA Monitoring, and Virtual Tenant Budget Ledgers.**

- **Domain Core:** `apps/api/src/domain/abstractions/gateway.py` (`GatewayModelInfo`, `ModelRoutingConfig`, `VirtualTenantBudget`, `BudgetExceededError`, `GatewayRouterProtocol`, `BudgetRepositoryProtocol`).
- **Router Adapter:** `apps/api/src/adapters/cognitive/gateway_router.py` (`GatewayRouterAdapter`).
- **Budget Ledger & Database:** `apps/api/src/adapters/database/budget_repository.py` (`SqlBudgetRepository`) & `InferenceLogDb` synonyms.
- **REST APIs:** `apps/api/src/routers/gateway.py` (`/v1/gateway/models`, `/v1/gateway/probe`, `/v1/tenants/{tenantId}/gateway/*`).
- **Frontend Studio & Cockpits:** `Prateek_website/src/components/rag/GatewayPanel.tsx` & `retriever/apps/web/src/app/(dashboard)/gateway/page.tsx`.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: RAG 2026 Roadmap](../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP.md)
- [Unified Master Roadmap](../UNIFIED_MASTER_ROADMAP.md)
- [Operational Runbook](../../../retriever/docs/runbooks/RUNBOOK_LLM_GATEWAY_SMART_ROUTER.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

