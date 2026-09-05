---
id: UI_CapabilityStudioPanel
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: apps/web/src/app/scaffold/page.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/apps/web/src/app/scaffold/page.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/apps/web/src/app/scaffold/page.tsx"
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
  - Retriever_API_v1_scaffold
  - Engine_Autonomous_Metaprogrammer
---

# UI: `ScaffoldPanel.tsx` (Capability Studio & Metaprogrammer)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/apps/web/src/app/scaffold/page.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/apps/web/src/app/scaffold/page.tsx)**

#ui #scaffold #metaprogramming #ast #retriever #m97

> **Autonomous AST Capability Scaffolding Studio & Hot-Reload Playground.**

- **Path:** `retriever/apps/web/src/app/scaffold/page.tsx` & `src/components/rag/ScaffoldPanel.tsx`
- **Features:**
  - Natural language specification input for new cognitive capabilities
  - AST preview of synthesized FastAPI routers, domain abstractions, and Pytest suites
  - Non-destructive dry-run syntax verification and 1-click hot-reloaded disk application

---

## 🔗 Related Architecture & Cross-References
- [Retriever_API: v1/scaffold](Retriever_API_v1_scaffold.md)
- [Engine: Autonomous Metaprogrammer](Engine_Autonomous_Metaprogrammer.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

