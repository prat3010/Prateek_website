---
id: API_terminal_snake_leaderboard
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/app/api/terminal/snake-leaderboard/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/terminal/snake-leaderboard/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/terminal/snake-leaderboard/route.ts"
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

# API: `GET /api/terminal/snake-leaderboard`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/terminal/snake-leaderboard/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/terminal/snake-leaderboard/route.ts)**

#api #terminal #easteregg #gaming

> **Global High-Score Leaderboard for Retro Terminal Snake Easter Egg.**

- **Path:** `src/app/api/terminal/snake-leaderboard/route.ts`
- **Features:** Rate-limited score submissions with cryptographic anti-tamper hash.

---

## 🔗 Related Architecture & Cross-References
- [Route: /terminal](Route_terminal.md)
- [UI: Terminal](UI_Terminal.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

