---
id: Engine_NeMo_Conversational_Guardrails
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
  - ../../../retriever/docs/runbooks/RUNBOOK_GUARDRAILS_OPS
  - ../../../retriever/docs/decisions/016-nemo-conversational-guardrails
---

# Engine: Programmable Rule & Colang-Style Guardrails (Milestone 94)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/)**

#engine #guardrails #colang #safety #anti_jailbreak #factual_grounding #m94 #retriever

> **Programmable Rule & Colang-Style Guardrails Domain Service featuring rule/regex fast-path input filtering, competitor shielding, brand tone enforcement, and post-inference grounding checks (does not bundle NVIDIA `nemoguardrails`).**

- **Domain Core:** `apps/api/src/domain/abstractions/guardrails.py` (`GuardrailExecutionMode`, `ColangFlowDefinition`, `GuardrailRule`, `GuardrailViolation`, `GuardrailCheckResult`, `TenantGuardrailsConfig`, `IGuardrailsAdapter`).
- **Domain Service:** `apps/api/src/domain/guardrails/guardrail_policy_service.py` (`GuardrailPolicyService`).
- **Adapter Engine:** `apps/api/src/adapters/guardrails/guardrails_engine_adapter.py` (`GuardrailsEngineAdapter`).
- **REST APIs:** `apps/api/src/routers/guardrails.py` (`/v1/guardrails/templates`, `/v1/guardrails/overview`, `/v1/tenants/{tenantId}/guardrails/*`).
- **Battery Registration:** `apps/api/src/domain/batteries/battery_service.py` (Battery #13 under `SAFETY_DEFENSE`).
- **Frontend Studio:** `Prateek_website/src/components/rag/GuardrailsPanel.tsx` in `/rag/app`.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: RAG 2026 Roadmap](../../../Prateek_Ecosystem_Vault/internal_archives/retriever/RAG_2026_PRODUCT_ROADMAP.md)
- [Unified Master Roadmap](../UNIFIED_MASTER_ROADMAP.md)
- [Operational Runbook](../../../retriever/docs/runbooks/RUNBOOK_GUARDRAILS_OPS.md)
- [ADR-016: NeMo Conversational Guardrails](../../../retriever/docs/decisions/016-nemo-conversational-guardrails.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](../runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

