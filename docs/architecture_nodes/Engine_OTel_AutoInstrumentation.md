---
id: Engine_OTel_AutoInstrumentation
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
---

# Engine: Full-Stack OpenTelemetry Auto-Instrumentation (Milestone 75)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #telemetry #opentelemetry #tracing #retriever

> **Enables end-to-end distributed tracing across FastAPI routes, SQLAlchemy database queries, pgvector distance operations, external HTTPX LLM requests, and Celery async workers.**

---

## 1. Architectural Scope

- **SQLAlchemy:** `SQLAlchemyInstrumentor().instrument(engine=engine)` capturing per-statement query duration and transaction locks.
- **HTTPX:** `HTTPXClientInstrumentor().instrument()` tracing outbound API calls to Ollama, Gemini, Groq, Tavily, and Resend.
- **Celery:** `CeleryInstrumentor().instrument()` propagating span contexts to background tasks.
- **W3C TraceContext:** Propagates `traceparent` headers between Next.js Edge proxy and FastAPI.

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

