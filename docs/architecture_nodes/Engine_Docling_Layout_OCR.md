---
id: Engine_Docling_Layout_OCR
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
  - API_scoping_parse_rfp
  - ../../../retriever/docs/architecture
---

# Engine: Docling Layout OCR & Multimodal Ingestion (Milestone 42)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #ocr #multimodal #pdf #retriever #m42

> **High-Fidelity Document Layout Parsing & Visual Element Extraction.**

- **Role:** Parses uploaded RFP PDFs, invoices, and wireframes into structured markdown AST tokens.

---

## 🔗 Related Architecture & Cross-References
- [API: scoping/parse-rfp](API_scoping_parse_rfp.md)
- [Retriever: Architecture](../../../retriever/docs/architecture.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

