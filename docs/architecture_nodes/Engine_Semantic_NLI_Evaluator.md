---
id: Engine_Semantic_NLI_Evaluator
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

# Engine: Semantic NLI & SLM-as-a-Judge Online Hallucination Engine (Milestone 74)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

#engine #evaluation #nli #hallucination #slm #retriever

> **Replaces heuristic keyword overlap with a dual-tier semantic Natural Language Inference (DeBERTa cross-encoder) and async Small Language Model (SLM) judge.**

---

## 1. Architectural Design

```mermaid
flowchart TD
    ChatResponse[Streamed LLM Answer] --> ClaimExtractor[Sentence Claim Extractor]
    ClaimExtractor --> ClaimList[Atomic Claims C1, C2, ...]
    
    subgraph Tier 1: Fast Cross-Encoder (Local)
        ClaimList --> DeBERTa[cross-encoder/nli-deberta-v3-small]
        DeBERTa --> EntailmentScore[Entailment vs Contradiction Probabilities]
    end

    subgraph Tier 2: Deep SLM Judge (Async Celery)
        ClaimList & RetrievedChunks --> CeleryTask[tasks.evaluate_inference_nli]
        CeleryTask --> OllamaJudge[Local Ollama: qwen2.5:3b / llama3.2:3b]
        OllamaJudge --> StructuredVerdict[JSON: Claim Grounding Spans & Rationales]
    end

    EntailmentScore & StructuredVerdict --> HallucinationIndex[Real-Time Hallucination Index]
    HallucinationIndex --> AlertEngine{Index > Threshold?}
    AlertEngine -->|Yes| WebhookAlert[Trigger SLA Alert & Webhook]
    AlertEngine -->|No| StoreLog[(online_evaluations)]
```

---

## 2. Invariants & Guardrails

1. **Zero-Latency Penalty:** Online evaluation MUST execute after the response stream completes (via FastAPI background tasks or Celery worker queues).
2. **Deterministic Fallbacks:** If NLI model weights fail to load, gracefully fall back to sentence-level cosine similarity before heuristic degradation.

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

