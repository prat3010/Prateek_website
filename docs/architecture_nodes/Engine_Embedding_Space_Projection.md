---
id: Engine_Embedding_Space_Projection
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

# Engine Specification: Scikit-Learn 2D/3D Embedding Space Projection Pipeline & SaaS Studio 3D Vector Explorer (Milestone 82)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/src/)**

## 1. System Metadata & Boundary Classification
- **Domain Subsystem:** Dimensionality Reduction, Latent Space Topography & Interactive 3D WebGL Point Cloud
- **Source Paths:**
  - `retriever/apps/api/src/domain/projection/abstractions.py` (Pure Hexagonal Domain Abstractions)
  - `retriever/apps/api/src/adapters/cognitive/embedding_projection_adapter.py` (PCA / t-SNE / UMAP Multi-Engine Adapter)
  - `retriever/apps/api/src/routers/tenant.py` (`POST /v1/tenants/{tenantId}/embeddings/project`)
  - `Prateek_website/src/lib/rag-types.ts` & `src/lib/rag-client.ts` (`RetrieverClient.projectEmbeddings`)
  - `Prateek_website/src/components/rag/VectorVisualizerPanel.tsx` (Interactive Three.js 3D Visualizer)
  - `Prateek_website/src/app/rag/app/page.tsx` (SaaS Studio Workspace View Tab)
- **Hexagonal Boundary Enforcement:**
  - Mathematical manifold algorithms strictly reside in `src/adapters/cognitive/embedding_projection_adapter.py`.
  - Zero database, ORM, framework, or HTTP dependencies in domain models.
  - Zero mock fallback: uses real Scikit-Learn PCA/t-SNE models over authentic pgvector embeddings.

---

## 2. Mathematical Formulation & Architecture

### High-Dimensional Latent Space
Document chunks are encoded into $768$-dimensional dense vectors $v_i \in \mathbb{R}^{768}$ using local embeddings (`nomic-embed-text`). For a tenant vault with $N$ chunks:
$$X \in \mathbb{R}^{N \times 768}$$

### Dimensionality Reduction Manifolds
1. **Principal Component Analysis (PCA - Linear SVD):**
   Computes orthogonal eigenvectors of covariance matrix $\Sigma = \frac{1}{N} X^\top X$:
   $$X_{3D} = X \cdot W_3 \quad \text{where } W_3 \in \mathbb{R}^{768 \times 3}$$
   Variance explained: $\lambda_k / \sum_j \lambda_j$.

2. **t-Distributed Stochastic Neighbor Embedding (t-SNE - Non-Linear):**
   Minimizes Kullback-Leibler (KL) divergence between high-dimensional joint probabilities $p_{ij}$ and low-dimensional Student-t probabilities $q_{ij}$:
   $$KL(P || Q) = \sum_{i \neq j} p_{ij} \log \frac{p_{ij}}{q_{ij}}$$

3. **Dynamic Query Vector Projection:**
   Projects live user search query vector $q \in \mathbb{R}^{768}$ into existing 3D coordinates:
   - For PCA: $q_{3D} = q \cdot W_3$.
   - For t-SNE/UMAP: Distance-weighted kNN manifold interpolation:
     $$q_{3D} = \sum_{k \in \text{top-K}} w_k \cdot x_k, \quad w_k = \frac{\text{sim}(q, x_k)}{\sum_j \text{sim}(q, x_j)}$$

### Cluster Quality Evaluation
Computes Silhouette Coefficient $S$:
$$s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}, \quad S = \frac{1}{N} \sum_{i=1}^N s(i)$$
where $a(i)$ is mean intra-cluster distance and $b(i)$ is mean nearest-cluster distance.

---

## 3. Security & Safety Invariants
1. **Tenancy Boundary:** Every projection operation fetches vectors strictly matching `tenant_id == UUID(tenantId)` with RLS transaction session contexts.
2. **Resource Throttling:** Capped at 2,000 maximum chunks per projection request to prevent excessive CPU memory consumption on the VPS.

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_RAG_TENANT_ONBOARDING](docs/runbooks/RUNBOOK_RAG_TENANT_ONBOARDING.md)

1. **Every query and database record MUST strictly enforce tenant_id isolation.**
2. **Tenancy breach attempt triggers instant API key revocation and raises TenantIsolationViolationError.**
3. **Vector embeddings MUST strictly use local nomic-embed-text model (never external client LLM keys).**

