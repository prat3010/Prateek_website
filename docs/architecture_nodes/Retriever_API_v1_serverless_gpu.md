---
id: Retriever_API_v1_serverless_gpu
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/routers/serverless_gpu.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/serverless_gpu.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/serverless_gpu.py"
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
  - ../../../retriever/docs/api/serverless_gpu
  - Engine_Serverless_GPU_vLLM_Serving
---

# Retriever API: `apps/api/src/routers/serverless_gpu.py`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/serverless_gpu.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/serverless_gpu.py)**

#retriever #api #serverless #gpu #vllm #lora #m96

> **Serverless Dedicated GPU & Dynamic Multi-LoRA Serving Router (Milestone 96).**

- **Endpoints:**
  - `GET /v1/admin/serverless/status` — Cluster scale, active containers, GPU memory
  - `POST /v1/admin/serverless/probe` — Measure cold-start vs warm-boot TTFT latencies
  - `POST /v1/tenants/{tenantId}/lora-adapters` — Register dynamic low-rank weights

---

## 🔗 Related Architecture & Cross-References
- [Retriever: REST API serverless_gpu.md](../../../retriever/docs/api/serverless_gpu.md)
- [Engine: Serverless GPU vLLM Serving](Engine_Serverless_GPU_vLLM_Serving.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

