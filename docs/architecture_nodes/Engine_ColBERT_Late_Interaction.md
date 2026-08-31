---
id: Engine_ColBERT_Late_Interaction
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

# Engine Specification: PyTorch Late-Interaction ColBERT Token-Level MaxSim Engine (Milestone 80)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

## 1. System Metadata & Boundary Classification
- **Domain Subsystem:** Multi-Vector Retrieval & Hardware-Accelerated Token Reranking
- **Source Paths:**
  - `retriever/apps/api/src/domain/retrieval/colbert_engine.py` (Pure Hexagonal Mathematical Domain)
  - `retriever/apps/api/src/domain/abstractions/retrieval.py` (`SearchQuery`, `SearchResult`)
  - `retriever/apps/api/src/domain/retrieval/search_service.py` (`SearchService._apply_reranking`)
  - `retriever/apps/api/src/routers/search.py` & `src/schemas/search.py` (FastAPI Search Endpoint)
  - `retriever/apps/web/src/components/tenant-config.tsx` (Retriever Admin Reranker Engine Selector)
  - `Prateek_website/src/components/rag/SearchPanel.tsx` (Portfolio SaaS Studio Reranker Inspector)
- **Hexagonal Boundary Enforcement:**
  - Mathematical multi-vector late-interaction operators reside strictly in `src/domain/retrieval/colbert_engine.py`.
  - Zero database, ORM, framework, or HTTP dependencies in domain algorithms.
  - Graceful fallback: When `torch` is not available in lightweight environments, vectorized NumPy tensor math executes seamlessly.

---

## 2. Mathematical Formulation & Architecture

### Token-Level Multi-Vector Representation
Standard dense retrieval compresses an entire document into a single vector $v \in \mathbb{R}^D$, causing information bottlenecking for specific code symbols, method names, and fine-grained queries. ColBERT retains individual token representations:
- Query $Q = \{q_1, q_2, \dots, q_{|Q|}\} \implies E_Q \in \mathbb{R}^{|Q| \times D}$
- Document Chunk $D = \{d_1, d_2, \dots, d_{|D|}\} \implies E_D \in \mathbb{R}^{|D| \times D}$

### Late-Interaction MaxSim Operator
For each token in the query $q_i \in Q$, compute its maximum cosine similarity across all tokens in document $D$, then sum over query tokens and normalize:

$$\text{MaxSim}(Q, D) = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \max_{j=1}^{|D|} \left( E_Q[i] \cdot E_D[j]^\top \right)$$

### Batch Matrix Formulation
For candidate pool $B = \{D_1, D_2, \dots, D_K\}$:
$$S_{b, i, j} = Q_i \cdot D_{b, j}^\top \quad \in \mathbb{R}^{K \times |Q| \times |D|}$$
$$\text{MaxPerQuery}_{b, i} = \max_{j} S_{b, i, j}$$
$$\text{MaxSimScore}(Q, D_b) = \frac{1}{|Q|} \sum_{i=1}^{|Q|} \text{MaxPerQuery}_{b, i}$$

### Calibrated Fused Score
$$\text{FinalScore} = \text{round}(w_{\text{initial}} \cdot \text{Score}_{\text{hybrid}} + w_{\text{maxsim}} \cdot \text{MaxSim}, 6)$$
Where default weights are $w_{\text{initial}} = 0.4$ and $w_{\text{maxsim}} = 0.6$.

---

## 3. Database Schema & Alembic Migration Lock
- **Table:** `tenant_configs`
- **Column:** `reranker_engine VARCHAR(50) NOT NULL DEFAULT 'cohere'`
- **Migration ID:** `9b0c1d2e3f4a_add_reranker_engine.py` (down_revision: `8a0b1c2d3e4f`)

---

## 4. UI/UX Conformance & Design System 2.0
- **Semantic CSS Token Alignment:**
  - Strategy indicator: `var(--badge-active-bg, rgba(0,230,118,0.15))` & `var(--badge-active-color, #00E676)`
  - Elevated containers: `var(--surface-elevated)` & `var(--surface-glass-border)`
  - Action buttons: Dual-state active selection pills

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

