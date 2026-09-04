---
id: UI_RlmStudioPanel
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

# UI Component: `RlmStudioPanel`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#ui #rlm #python_repl #sandboxed_execution #recursion #rag

> **Recursive Language Model (RLM) Python REPL Studio (`/rag/app?view=rlm`).**

---

## 1. Overview & Functionality

`RlmStudioPanel` provides an interactive IDE and evaluation environment for sandboxed Python AST REPL code execution over long document contexts:
- **Python REPL Code Editor:** Syntax-highlighted code editor for composing document-filtering logic.
- **AST Execution Trace:** Live output cards showing stdout, return variables, and execution duration.
- **Context Minimization Metrics:** Displays token reduction curves and compression ratios achieved by code-based pre-filtering.

---

## 2. Dependencies & Blast Radius
- **Upstream Router:** `src/app/rag/app/page.tsx` (`Route_rag_app`)
- **Backend API:** `/v1/rlm/*` (`Retriever_API_v1_rlm`)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

