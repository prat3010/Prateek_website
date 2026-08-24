---
id: Route_rag_app
tier: 3_workspace_control
platform: Prateek_Website
status: production
auth_level: bearer_jwt
blast_radius: medium
file_path: src/app/rag/app/page.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/rag/app/page.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/rag/app/page.tsx"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/3_workspace_control
  - security/bearer_jwt
  - domain/workspace
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../24_RAG_App_Studio_PRD
  - UI_RAGLabPlayground
  - Lib_rag_client
  - Retriever_API_v1_chat
  - Retriever_API_v1_search
---

# Route: `/rag` & `/rag/app` (Retriever SaaS Studio)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/rag/app/page.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/rag/app/page.tsx)**

#route #frontend #rag #saas #retriever

> **Commercial RAG SaaS Product Landing Page & Multi-Tenant Studio Workspace.**

- **Paths:** `src/app/rag/page.tsx` & `src/app/rag/app/page.tsx`
- **Key Features:**
  - Mini-RAG live interactive sandbox (`ChatPanel.tsx`, `UploadPanel.tsx`, `SearchPanel.tsx`)
  - Geo-IP pricing calculator (INR/USD)
  - 1-line script embed configurator (`<script src=".../widget.js">`)
  - SaaS Studio sub-views: Chat Studio, Document Library, Search Inspector, Embed Configurator

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [UI: RAGLabPlayground](UI_RAGLabPlayground.md)
- [Lib: rag-client.ts](Lib_rag_client.md)
- [Retriever_API: v1/chat](Retriever_API_v1_chat.md)
- [Retriever_API: v1/search](Retriever_API_v1_search.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

