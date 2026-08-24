---
id: API_client_delete_scope
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: bearer_jwt
blast_radius: medium
file_path: src/app/api/client/delete-scope/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/delete-scope/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/delete-scope/route.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/4_api_gateway
  - security/bearer_jwt
  - domain/commerce
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - Schema_client_scopes
  - Route_dashboard
---

# API: `POST /api/client/delete-scope`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/delete-scope/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/delete-scope/route.ts)**

#api #persistence #client

> **Draft Scope Cleanup & Cancellation Lifecycle Endpoint.**

- **Endpoint:** `POST /api/client/delete-scope`
- **Path:** `src/app/api/client/delete-scope/route.ts`
- **Guard:** Only allows deleting scopes in `'draft'` status belonging to the authenticated client.

---

## 🔗 Related Architecture & Cross-References
- [Schema: client_scopes](Schema_client_scopes.md)
- [Route: /dashboard](Route_dashboard.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

