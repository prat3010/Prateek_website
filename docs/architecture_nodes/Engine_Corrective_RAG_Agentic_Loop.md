---
id: Engine_Corrective_RAG_Agentic_Loop
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

# Engine: Corrective RAG (CRAG) & Agentic Reflection Loop (Milestone 71)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #crag #corrective_rag #agentic #reflection_loop #retriever #m71

> **Autonomous 3-Branch Retrieval Confidence Reflection Loop & Knowledge De-Noising Engine.**

- **Domain Service:** `corrective_retrieval_service.py` in `apps/api/src/domain/retrieval/`
- **Knowledge Refiner:** `document_refiner.py` in `apps/api/src/domain/retrieval/`
- **Cognitive Adapter:** `LLMCorrectiveRetrievalAdapter` in `apps/api/src/adapters/cognitive/corrective_retrieval_adapter.py`
- **3-Branch Deterministic State Machine:**
  1. **`CORRECT` ($\ge 0.75$):** Refines documents into atomic factual sentences, discarding boilerplate noise.
  2. **`AMBIGUOUS` ($0.40 - 0.75$):** Triggers query reformulation and executes parallel external web search (Tavily/Google) to fuse internal and external evidence.
  3. **`INCORRECT` ($< 0.40$):** Suppresses ungrounded internal chunks and executes a web search fallback.

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

