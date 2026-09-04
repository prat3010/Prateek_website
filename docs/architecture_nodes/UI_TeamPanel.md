---
id: UI_TeamPanel
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

# UI Component: `TeamPanel`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/)**

#ui #team #rbac #invitations #multi_tenancy #compliance #rag

> **Team Management & Role-Based Access Control (RBAC) Panel (`/rag/app?view=team`).**

---

## 1. Overview & Functionality

`TeamPanel` provides multi-tenant team management and security controls for Retriever workspaces:
- **Member Roster Table:** List active users, assigned roles (`owner`, `admin`, `member`), and last active dates.
- **Email Invitation Modal:** Send time-limited team invitation links via `/api/rag/invite` (backed by Resend email service).
- **Role Assignment & Revocation:** Update member permissions or immediately revoke workspace access.

---

## 2. Dependencies & Blast Radius
- **Upstream Router:** `src/app/rag/app/page.tsx` (`Route_rag_app`)
- **Website APIs:** `/api/rag/members` (`API_rag_members`), `/api/rag/invite` (`API_rag_invite`)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

