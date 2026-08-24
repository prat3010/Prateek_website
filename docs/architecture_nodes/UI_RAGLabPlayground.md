---
id: UI_RAGLabPlayground
tier: 3_workspace_control
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/components/rag/
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/3_workspace_control
  - security/public
  - domain/workspace
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../24_RAG_App_Studio_PRD
  - Route_rag_app
  - Lib_rag_client
---

# UI: `RAGLabPlayground.tsx` (Retriever SaaS Studio Views)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/)**

#ui #rag #playground #studio

> **Interactive Client Chat Studio, Document Library & Search Inspector Panels.**

- **Path:** `src/components/rag/` (`ChatPanel.tsx`, `UploadPanel.tsx`, `SearchPanel.tsx`, `ConfigPanel.tsx`)

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Route: /rag/app](Route_rag_app.md)
- [Lib: rag-client.ts](Lib_rag_client.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

