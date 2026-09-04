---
id: UI_VectorVisualizerPanel
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/1_frontend
  - security/public
  - domain/ui
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
---

# UI Component: `VectorVisualizerPanel`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#ui #vector_space #umap #pca #3d_visualizer #webgl #rag

> **3D High-Dimensional Vector Space Explorer (`/rag/app?view=visualizer`).**

---

## 1. Overview & Functionality

`VectorVisualizerPanel` renders an interactive Three.js / WebGL 3D point cloud of tenant document embeddings:
- **Dimensionality Reduction Toggles:** Switch between PCA (fast variance), t-SNE, and UMAP (local manifold topology).
- **Cluster Quality Metrics:** Real-time Silhouette Separation Score ($S$) and Explained Variance Ratio gauges.
- **Dynamic Query Vector Projection:** Type any search query to watch it embed in real time and draw connection lines to nearest retrieved neighbor chunks.
- **Point Inspection Tooltip:** Click any vector point to view underlying document text snippet, metadata, and chunk ID.

---

## 2. Dependencies & Blast Radius
- **Upstream Router:** `src/app/rag/app/page.tsx` (`Route_rag_app`)
- **Backend API:** `/v1/tenants/{tenantId}/projections` (`Engine_Embedding_Space_Projection`)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

