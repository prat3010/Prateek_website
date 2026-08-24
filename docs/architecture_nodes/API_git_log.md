---
id: API_git_log
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/app/api/git-log/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/git-log/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/git-log/route.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/4_api_gateway
  - security/public
  - domain/content_api
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - Route_terminal
  - UI_Terminal
---

# API: `GET /api/git-log`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/git-log/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/git-log/route.ts)**

#api #git #terminal #diagnostics

> **Pre-baked Git Commit History & Build Telemetry Endpoint.**

- **Path:** `src/app/api/git-log/route.ts`
- **Data Source:** `src/data/git-log.json` generated at build time.

---

## 🔗 Related Architecture & Cross-References
- [Route: /terminal](Route_terminal.md)
- [UI: Terminal](UI_Terminal.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

