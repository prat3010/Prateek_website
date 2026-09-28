---
id: UI_FloatingChatWidget
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/components/rag/FloatingChatWidget.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/FloatingChatWidget.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/FloatingChatWidget.tsx"
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
  - Route_rag
  - ../24_RAG_App_Studio_PRD
---

# UI: `FloatingChatWidget.tsx`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/FloatingChatWidget.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/FloatingChatWidget.tsx)**

#ui #frontend #widget #embed #dogfooding

> **Live Dogfooding Embed Chat Widget Component for Marketing Landing Page (`/rag`).**

- **Path:** `src/components/rag/FloatingChatWidget.tsx`
- **Function:** Dynamically mounts `public/widget.js` on `/rag` so prospects experience the real embeddable widget launcher, demonstrating live dogfooding of the Retriever engine.

---

## 🔗 Related Architecture & Cross-References
- [Route: /rag](Route_rag.md)
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

