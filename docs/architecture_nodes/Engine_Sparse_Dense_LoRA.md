---
id: Engine_Sparse_Dense_LoRA
tier: 6_retriever_cognitive
platform: Prateek_Website
status: production
auth_level: public
blast_radius: high
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/"
runbook: docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md
tags:
  - tier/6_retriever_cognitive
  - security/public
  - domain/cognitive_engine
  - platform/website
invariants:
  - "Every query and database record MUST strictly enforce tenant_id isolation."
  - "Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError."
  - "Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys)."
test_suites:
  - apps/api/tests/test_architecture.py
---

# Sparse-Dense Hybrid Engine & Contrastive LoRA Domain Adapters

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

## 1. Overview
The Sparse-Dense Hybrid Engine in Milestone 79 provides a two-legged retrieval architecture:
1. **Sublinear BM25 Sparse Vectorizer**: Preserves software architecture tokens, code symbols, camelCase, snake_case, and file paths with sublinear term-frequency scaling.
2. **Contrastive LoRA Domain Adapter**: A low-rank residual projection matrix $h_{\text{adapted}} = h + \frac{\alpha_{\text{lora}}}{r} (h \cdot B) \cdot A$ that shifts base local embedding representations (e.g. `nomic-embed-text`) toward technical SOW and system design domains.
3. **Calibrated Convex Hybrid Combination**: Dynamically balances dense and sparse scores with parameter $\alpha \in [0.0, 1.0]$:
   $$\text{Score}(d) = \alpha \cdot \text{DenseNorm}(d) + (1 - \alpha) \cdot \text{SparseNorm}(d)$$

```text
               ┌──────────────────────────┐
               │    Incoming Query (Q)    │
               └─────────────┬────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
    ┌───────────────────┐         ┌───────────────────┐
    │  LoRA Embedding   │         │  Sublinear BM25   │
    │ Adapter (h + B·A) │         │ Sparse Vectorizer │
    └─────────┬─────────┘         └─────────┬─────────┘
              │ (Dense Leg)                 │ (Sparse Leg)
              ▼                             ▼
    ┌───────────────────┐         ┌───────────────────┐
    │   Dense Vectors   │         │   BM25 Postings   │
    │  (pgvector / HNSW)│         │ (Code & Lexical)  │
    └─────────┬─────────┘         └─────────┬─────────┘
              └──────────────┬──────────────┘
                             ▼
              ┌─────────────────────────────┐
              │  Convex Combination Fusion  │
              │  α·Dense + (1-α)·Sparse     │
              └──────────────┬──────────────┘
                             ▼
              ┌─────────────────────────────┐
              │  Fused & Ranked Candidates  │
              └─────────────────────────────┘
```

## 2. Mathematical Formalization

### Sublinear BM25
$$\text{Score}(D, Q) = \sum_{q \in Q} \text{IDF}(q) \cdot \frac{(1 + \ln(\text{tf})) \cdot (k_1 + 1)}{(1 + \ln(\text{tf})) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$

### LoRA Residual Transformation
$$h_{\text{adapted}} = h + \frac{\alpha_{\text{lora}}}{r} (h \cdot B) \cdot A, \quad B \in \mathbb{R}^{d \times r}, A \in \mathbb{R}^{r \times d}$$

### InfoNCE Loss (MultipleNegativesRankingLoss)
$$\mathcal{L} = -\sum_{i=1}^B \log \frac{\exp(\text{sim}(q_i, d_i^+) / \tau)}{\sum_{j=1}^B \exp(\text{sim}(q_i, d_j^+) / \tau)}$$

## 3. Database Schema
- `tenant_configs.hybrid_alpha`: Float column (default 0.70)
- `tenant_configs.active_lora_adapter`: String column referencing active adapter ID
- `tenant_lora_adapters`: Dedicated table storing `adapter_id`, `tenant_id`, `name`, `domain_tag`, `rank`, `loss_score`, and `weights_json`

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

