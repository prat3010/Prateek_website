---
id: Engine_ColBERT_MaxSim_Reranker
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

# Engine: Late-Interaction (ColBERT) Token-Level MaxSim Reranker (Milestone 70)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #colbert #maxsim #reranker #late_interaction #retriever #m70

> **Token-Level Late-Interaction MaxSim Reranking Engine delivering cross-encoder precision at sub-15ms latency.**

- **Mathematical Engine:** `colbert_engine.py` in `apps/api/src/domain/retrieval/`
- **Adapter:** `ColBertMaxSimRerankerAdapter` in `apps/api/src/adapters/cognitive/local_reranker_adapter.py`
- **TEI Fallback:** `TeiRerankerAdapter` in `apps/api/src/adapters/cognitive/tei_reranker_adapter.py`
- **Formula:**
  $$\text{MaxSim}(Q, D) = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \max_{j=1}^{|D|} (E_q[i] \cdot E_d[j])$$
- **Role:** Preserves token-level semantic granularity for technical terms, camelCase functions (`calcQuote`), snake_case database columns (`tenant_id`), and alphanumeric hashes, boosting precision where bi-encoders smear token details.

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

