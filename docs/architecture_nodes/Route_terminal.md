---
id: Route_terminal
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/app/terminal/page.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/terminal/page.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/terminal/page.tsx"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/1_frontend
  - security/public
  - domain/portfolio
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../09_Section_Specifications/10_Terminal
  - UI_Terminal
  - API_terminal_qrcode
  - API_terminal_snake_leaderboard
  - API_git_log
---

# Route: `/terminal` (Interactive Diagnostics Console)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/terminal/page.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/terminal/page.tsx)**

#route #frontend #cli #diagnostics

> **Retro-Futuristic Interactive Diagnostics Terminal Console.**

- **Path:** `src/app/terminal/page.tsx` & `src/components/terminal/`
- **Key Features:**
  - Custom CLI commands: `help`, `git-info`, `qrcode`, `skills`, `projects`, `theme`, `snake`, `clear`
  - Real-time Git commit log inspector via `/api/git-log`
  - Dynamic QR code generator via `/api/terminal/qrcode`
  - Retro Snake Easter egg with global high-score leaderboard

---

## 🔗 Related Architecture & Cross-References
- [09_Section_Specifications/10_Terminal](../09_Section_Specifications/10_Terminal.md)
- [UI: Terminal](UI_Terminal.md)
- [API: terminal/qrcode](API_terminal_qrcode.md)
- [API: terminal/snake-leaderboard](API_terminal_snake_leaderboard.md)
- [API: git-log](API_git_log.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

