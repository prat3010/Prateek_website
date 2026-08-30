---
id: Engine_Contextual_Retrieval
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
  - ../24_RAG_App_Studio_PRD
  - ../00_ARCHITECTURE_INDEX
---

# Engine: Pre-Chunk Contextual Retrieval Ingestion Engine (Milestone 69)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #contextual #retrieval #anthropic #retriever #m69

> **Asynchronous LLM-Powered Pre-Chunk Context Generation situating document chunks for 49% retrieval accuracy boost.**

- **Domain Port:** `ContextualHeaderGeneratorPort` in `apps/api/src/domain/abstractions/contextual_retrieval.py`
- **Adapter:** `ContextualHeaderGeneratorAdapter` in `apps/api/src/adapters/cognitive/contextual_header_adapter.py`
- **Worker Integration:** `_run_process_document` in `workers/src/tasks/__init__.py`
- **Method:** Anthropic Contextual Retrieval technique prepending 50–80 word document situational summaries to each chunk before dense HNSW pgvector embedding and sparse BM25 indexing.
- **Dual-Field Citation Integrity:** Raw unpolluted text preserved in `raw_content` metadata for pristine Chat Studio and PDF citation rendering.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: RAG 2026 Roadmap](../../../retriever/docs/RAG_2026_PRODUCT_ROADMAP.md)
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [00_ARCHITECTURE_INDEX](../00_ARCHITECTURE_INDEX.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

