---
id: UI_EdgeSwarmPanel
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: apps/web/src/app/edge/page.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/apps/web/src/app/edge/page.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/apps/web/src/app/edge/page.tsx"
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
downstream:
  - Retriever_API_v1_edge
  - Retriever_API_v1_enclave
  - Engine_Sovereign_Edge_Sync
  - Engine_Confidential_Micro_Enclave
---

# UI: `EdgePanel.tsx` (Sovereign Edge Swarm Studio)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/apps/web/src/app/edge/page.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/apps/web/src/app/edge/page.tsx)**

#ui #edge #crdt #swarm #retriever #m98 #m101

> **Edge Device Swarm Observability, SQLite Snapshots & Enclave Attestation Status.**

- **Path:** `retriever/apps/web/src/app/edge/page.tsx` & `src/components/rag/EdgePanel.tsx`
- **Features:**
  - Real-time display of registered edge peer devices and health status
  - 1-click SQLite replica snapshot distribution and delta sync metrics
  - Hardware KMS remote attestation status and emergency memory sanitization trigger

---

## 🔗 Related Architecture & Cross-References
- [Retriever_API: v1/edge](Retriever_API_v1_edge.md)
- [Retriever_API: v1/enclave](Retriever_API_v1_enclave.md)
- [Engine: Sovereign Edge Sync](Engine_Sovereign_Edge_Sync.md)
- [Engine: Confidential Micro-Enclave](Engine_Confidential_Micro_Enclave.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

