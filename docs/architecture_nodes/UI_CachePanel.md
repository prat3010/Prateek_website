---
id: UI_CachePanel
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

# UI Component: `CachePanel`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#ui #semantic_cache #redis #latency_speedup #token_shield #rag

> **Semantic Cache Observability & Purge Control Panel (`/rag/app?view=cache`).**

---

## 1. Overview & Functionality

`CachePanel` exposes real-time telemetry and management controls for Retriever's semantic caching tier:
- **Hit-Rate & Latency Speedup Cards:** Real-time metrics showing total cache hits, tokens saved, and average latency reduction (sub-25ms vs ~1200ms roundtrip).
- **Similarity Threshold Slider:** Fine-tune the cosine distance threshold $\tau \in [0.70, 0.99]$ for fuzzy semantic cache matching.
- **Atomic Cache Purge Button:** 1-click administrative action to flush stale cached responses.

---

## 2. Dependencies & Blast Radius
- **Upstream Router:** `src/app/rag/app/page.tsx` (`Route_rag_app`)
- **Backend API:** `/v1/admin/cache`

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

