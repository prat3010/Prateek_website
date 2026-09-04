---
id: UI_AgentStudioPanel
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

# UI Component: `AgentStudioPanel`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#ui #agentic #langgraph #hitl #checkpoints #timetravel #rag

> **Agentic Orchestration Studio Workspace Panel (`/rag/app?view=agentic`).**

---

## 1. Overview & Functionality

`AgentStudioPanel` provides an enterprise-grade graphical studio for autonomous multi-turn agent execution with LangGraph state machines:
- **Prompt Launchpad:** Configurable analytical goals with adjustable step limit sliders and tool capability checkboxes.
- **Live Cyclic Trace:** Visual rendering of reasoning thoughts, tool execution inputs, and observations.
- **Human-in-the-Loop (HITL) Approval Drawer:** High-risk tool interceptor rendered inside `<Portal>` escaping `ScrollSection` containing block trap.
- **Time-Travel Checkpoint Scrubber:** Visual timeline of execution history with 1-click state rollback.

---

## 2. Dependencies & Blast Radius
- **Upstream Router:** `src/app/rag/app/page.tsx` (`Route_rag_app`)
- **Client SDK:** `src/lib/rag-client.ts` (`Lib_rag_client`)
- **Backend API:** `/v1/tenants/{tenantId}/agentic/*` (`Retriever_API_v1_agentic`)

---

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

