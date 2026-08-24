---
id: Context_AuthContext
tier: 5_domain_providers
platform: Prateek_Website
status: production
auth_level: bearer_jwt
blast_radius: critical
file_path: src/context/AuthContext.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/context/AuthContext.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/context/AuthContext.tsx"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/5_domain_providers
  - security/bearer_jwt
  - domain/domain_lib
  - platform/website
invariants:
  - "All public telemetry IP addresses MUST be hashed daily using salted SHA-256 (GDPR zero-PII)."
  - "Service role key MUST stay strictly server-only and never leak to client bundle."
  - "Session tokens MUST be cryptographically verified via Supabase Auth getUser()."
test_suites:
  - src/lib/__tests__/security.test.ts
downstream:
  - ../16_Security_and_Privacy
  - Route_dashboard
  - Route_auth_callback
  - Lib_sessionVerify
---

# Context: `AuthContext.tsx` (Universal Supabase Auth)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/context/AuthContext.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/context/AuthContext.tsx)**

#context #auth #pkce #session #security

> **Universal Client Auth State, Dual-Storage Persistence & Hash Token Parser.**

- **Path:** `src/context/AuthContext.tsx` & `src/lib/auth.ts`
- **Features:**
  - Syncs Supabase session with both `localStorage` and `prateeq_active_user` cookie
  - Directly extracts and persists access tokens on OAuth redirects
  - Provides `user`, `session`, `loginWithGoogle`, and `logout` hooks to all client routes

---

## 🔗 Related Architecture & Cross-References
- [16_Security_and_Privacy](../16_Security_and_Privacy.md)
- [Route: /dashboard](Route_dashboard.md)
- [Route: /auth/callback](Route_auth_callback.md)
- [Lib: sessionVerify.ts](Lib_sessionVerify.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `CRITICAL` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **All public telemetry IP addresses MUST be hashed daily using salted SHA-256 (GDPR zero-PII).**
2. **Service role key MUST stay strictly server-only and never leak to client bundle.**
3. **Session tokens MUST be cryptographically verified via Supabase Auth getUser().**

