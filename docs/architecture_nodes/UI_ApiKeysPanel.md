---
id: UI_ApiKeysPanel
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/components/rag/ApiKeysPanel.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/ApiKeysPanel.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/ApiKeysPanel.tsx"
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
  - Route_rag_app
  - ../24_RAG_App_Studio_PRD
---

# UI: `ApiKeysPanel.tsx`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/ApiKeysPanel.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/rag/ApiKeysPanel.tsx)**

#ui #frontend #apikeys #sdk #developer

> **Dedicated Developer API Keys, cURL Generator & Python/TypeScript SDK Snippets Panel.**

- **Path:** `src/components/rag/ApiKeysPanel.tsx`
- **Function:** Surfaces the tenant's scoped API key (`ret_live_...`), tenant UUID, and copy-pasteable SDK snippets (Python, TypeScript, cURL) directly in `/rag/app`.

---

## 🔗 Related Architecture & Cross-References
- [Route: /rag/app](Route_rag_app.md)
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

