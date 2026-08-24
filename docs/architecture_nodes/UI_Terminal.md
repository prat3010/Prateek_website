---
id: UI_Terminal
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/components/ui/SiteInfoConsole.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/ui/SiteInfoConsole.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/ui/SiteInfoConsole.tsx"
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
  - Route_terminal
  - API_terminal_qrcode
  - API_terminal_snake_leaderboard
---

# UI: `Terminal.tsx` (Interactive CLI Engine)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/components/ui/SiteInfoConsole.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/components/ui/SiteInfoConsole.tsx)**

#ui #terminal #cli #diagnostics

> **Interactive Diagnostics Terminal with Command Autocompletion & CRT Shader.**

- **Path:** `src/components/terminal/Terminal.tsx`
- **Commands:** `help`, `git-info`, `qrcode`, `skills`, `projects`, `theme`, `snake`, `clear`

---

## 🔗 Related Architecture & Cross-References
- [Route: /terminal](Route_terminal.md)
- [API: terminal/qrcode](API_terminal_qrcode.md)
- [API: terminal/snake-leaderboard](API_terminal_snake_leaderboard.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

