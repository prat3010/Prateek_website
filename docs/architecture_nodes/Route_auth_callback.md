---
id: Route_auth_callback
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: bearer_jwt
file_path: src/app/auth/callback/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/auth/callback/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/auth/callback/route.ts"
tags:
  - tier/4_api_gateway
  - security/bearer_jwt
  - domain/auth
  - platform/website
downstream:
  - ../16_Security_and_Privacy
  - Context_AuthContext
  - Lib_sessionVerify
  - Route_dashboard
---

# Route: `/auth/callback` (PKCE OAuth Handler)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/auth/callback/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/auth/callback/route.ts)**

#route #security #auth #pkce #oauth

> **Server-Side PKCE OAuth Authorization Code Exchange & Session Cookie Gate.**

- **Path:** `src/app/auth/callback/route.ts` & `src/lib/supabase/server.ts`
- **Key Features:**
  - Exchanges PKCE code for Supabase JWT session via `exchangeCodeForSession`
  - Sets HTTP-only `prateeq_active_user` session cookies for Safari ITP compliance
  - Canonicalizes redirects back to `/dashboard` or intended deep-link target

---

## 🔗 Related Architecture & Cross-References
- [16_Security_and_Privacy](../16_Security_and_Privacy.md)
- [Context: AuthContext](Context_AuthContext.md)
- [Lib: sessionVerify.ts](Lib_sessionVerify.md)
- [Route: /dashboard](Route_dashboard.md)
