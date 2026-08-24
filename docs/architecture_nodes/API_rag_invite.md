---
id: API_rag_invite
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/app/api/rag/invite/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/rag/invite/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/rag/invite/route.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/4_api_gateway
  - security/public
  - domain/rag
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../24_RAG_App_Studio_PRD
  - Route_rag_app
---

# API: `POST /api/rag/invite`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/rag/invite/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/rag/invite/route.ts)**

#api #rag #auth #invites

> **Workspace Member Invitation & Role-Based Access Control (RBAC).**

- **Endpoint:** `POST /api/rag/invite`
- **Path:** `src/app/api/rag/invite/route.ts`
- **Roles:** `owner`, `admin`, `editor`, `viewer`

---

## 🔗 Related Architecture & Cross-References
- [24_RAG_App_Studio_PRD](../24_RAG_App_Studio_PRD.md)
- [Route: /rag/app](Route_rag_app.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

