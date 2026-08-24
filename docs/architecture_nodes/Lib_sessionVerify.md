---
id: Lib_sessionVerify
tier: 5_domain_providers
platform: Prateek_Website
status: production
auth_level: bearer_jwt
blast_radius: critical
file_path: src/lib/sessionVerify.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/sessionVerify.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/sessionVerify.ts"
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
  - API_client_save_scope
  - API_client_create_razorpay_order
  - Schema_client_scopes
---

# Lib: `sessionVerify.ts` (Universal PKCE Session Guard)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/sessionVerify.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/sessionVerify.ts)**

#lib #security #auth #pkce #session

> **Server-Side Session Verification extracting verified identities from JWTs.**

- **Path:** `src/lib/sessionVerify.ts`
- **Security Invariant:** Client email and tenant UUID are derived strictly from cryptographically verified Supabase tokens—NEVER from user request query parameters.
- **Support:** Handles both `Authorization: Bearer <token>` headers and `prateeq_active_user` HTTP-only cookies.

---

## 🔗 Related Architecture & Cross-References
- [16_Security_and_Privacy](../16_Security_and_Privacy.md)
- [API: client/save-scope](API_client_save_scope.md)
- [API: client/create-razorpay-order](API_client_create_razorpay_order.md)
- [Schema: client_scopes](Schema_client_scopes.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `CRITICAL` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **All public telemetry IP addresses MUST be hashed daily using salted SHA-256 (GDPR zero-PII).**
2. **Service role key MUST stay strictly server-only and never leak to client bundle.**
3. **Session tokens MUST be cryptographically verified via Supabase Auth getUser().**

