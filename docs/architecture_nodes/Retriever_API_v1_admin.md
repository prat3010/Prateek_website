---
id: Retriever_API_v1_admin
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: high
file_path: apps/api/src/routers/admin.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/admin.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/admin.py"
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
  - ../../../retriever/docs/ADMIN_DASHBOARD_ROADMAP
  - ../../../retriever/docs/architecture
---

# Retriever API: `apps/api/src/routers/admin.py`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/admin.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/admin.py)**

#retriever #api #admin #quotas

> **Platform Administration, System Health, Prompt Presets & Key Management.**

- **Endpoints:** `/v1/admin/tenants`, `/v1/admin/keys`, `/v1/admin/prompts`, `/v1/admin/quotas`

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Admin Dashboard Roadmap](../../../retriever/docs/ADMIN_DASHBOARD_ROADMAP.md)
- [Retriever: Architecture](../../../retriever/docs/architecture.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

