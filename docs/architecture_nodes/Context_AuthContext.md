---
id: Context_AuthContext
tier: 5_domain_providers
platform: Prateek_Website
status: production
auth_level: bearer_jwt
file_path: src/context/AuthContext.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/context/AuthContext.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/context/AuthContext.tsx"
tags:
  - tier/5_domain_providers
  - security/bearer_jwt
  - domain/domain_lib
  - platform/website
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
