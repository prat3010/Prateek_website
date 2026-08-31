---
id: Engine_Visual_Grounding_Observability
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

# Engine: Visual Claim-by-Claim Grounding Diff & Retriever Admin Observability Cockpit (Milestone 78)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #evaluation #grounding #observability #telemetry #nli #retriever

> **Delivers sentence-by-sentence Natural Language Inference (NLI) visual grounding highlights (green = entailed, yellow = neutral, red = contradiction) and an enterprise deep observability cockpit natively within the Retriever Admin Dashboard and RAG App Studio.**

---

## 1. Architectural Highlights

1. **Claim Extraction & Calibrated NLI Persistence:** Atomic sentences are extracted from inference outputs and classified against retrieved context premises into directional entailment, contradiction, and neutral probabilities.
2. **Interactive Grounding Visualizer (`grounding-diff.tsx`):** Renders color-coded sentence tokens with interactive side popovers exposing exact NLI confidence scores and source premise citations.
3. **Enterprise Observability Cockpit (`tenant-telemetry.tsx`):** Real-time monitoring of P99 Latency SLAs, Hallucination Trends, CSAT User Feedback, Semantic Cache Cost & Latency Savings, and Quota Burn Rates.

---

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

