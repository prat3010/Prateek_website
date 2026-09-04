---
id: Engine_Serverless_GPU_vLLM_Serving
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
  - ../../../retriever/docs/api/SERVERLESS_GPU_REST_API
  - ../../../retriever/docs/runbooks/RUNBOOK_SERVERLESS_GPU_VLLM_LORA
  - ../../../retriever/docs/decisions/018-serverless-gpu-vllm-lora-pipeline
---

# Engine: Serverless Dedicated GPU Serving & Dynamic vLLM / LoRA Pipeline (Milestone 96)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #serverless_gpu #vllm #lora #modal #bentoml #scale_to_zero #m96 #retriever

> **Scale-to-zero serverless GPU compute pipeline featuring container warm-boot acceleration (<3s TTFT), persistent volume caching, and multi-tenant dynamic LoRA tensor swapping without container restarts (Platform Battery #16).**

- **Domain Core:** `apps/api/src/domain/abstractions/serverless_gpu.py` (`ServerlessProviderType`, `ServerlessGpuTier`, `LoraAdapterMetadata`, `WarmBootMetrics`, `ServerlessCostComparison`, `ServerlessGpuClientProtocol`, `TenantLoraRegistryProtocol`).
- **Serverless Recipes:** `deploy/modal/vllm_server.py` (Modal vLLM A10G with `--enable-lora` and scale-to-zero) & `deploy/bentoml/service.py` (BentoML containerized vLLM service).
- **Client & Adapters:** `apps/api/src/adapters/cognitive/modal_client.py` (`ServerlessGpuClientAdapter`) & `apps/api/src/adapters/database/tenant_lora_repository.py` (`SqlTenantLoraRepository`).
- **Smart Cascade Integration:** `apps/api/src/adapters/cognitive/gateway_router.py` (`modal/vllm-llama-3.1-8b`, `bentoml/vllm-qwen-2.5-7b`).
- **Battery Registration:** `apps/api/src/domain/batteries/battery_service.py` (Battery #16: `serverless_gpu_vllm`).
- **REST APIs:** `apps/api/src/routers/serverless_gpu.py` (`/v1/admin/serverless/*`, `/v1/tenants/{tenantId}/lora-adapters/*`).
- **Frontend SaaS Studio:** `Prateek_website/src/components/rag/GatewayPanel.tsx` in `/rag/app`, Client SDK methods in `src/lib/rag-client.ts`, Types in `src/lib/rag-types.ts`.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: RAG 2026 Roadmap](../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP.md)
- [Unified Master Roadmap](../UNIFIED_MASTER_ROADMAP.md)
- [REST API Specification](../../../retriever/docs/api/SERVERLESS_GPU_REST_API.md)
- [Operational Runbook](../../../retriever/docs/runbooks/RUNBOOK_SERVERLESS_GPU_VLLM_LORA.md)
- [Architecture Decision Record (ADR-018)](../../../retriever/docs/decisions/018-serverless-gpu-vllm-lora-pipeline.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

