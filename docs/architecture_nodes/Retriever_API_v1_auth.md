---
id: Retriever_API_v1_auth
tier: 6_retriever_cognitive
platform: Retriever
status: production
auth_level: public
blast_radius: critical
file_path: apps/api/src/routers/auth.py
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/auth.py"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/auth.py"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/6_retriever_cognitive
  - security/public
  - domain/fastapi
  - platform/retriever
invariants:
  - "All public telemetry IP addresses MUST be hashed daily using salted SHA-256 (GDPR zero-PII)."
  - "Service role key MUST stay strictly server-only and never leak to client bundle."
  - "Session tokens MUST be cryptographically verified via Supabase Auth getUser()."
test_suites:
  - src/lib/__tests__/security.test.ts
downstream:
  - ../../../retriever/docs/architecture
---

# Retriever API: `apps/api/src/routers/auth.py`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/auth.py)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/retriever/apps/api/src/routers/auth.py)**

#retriever #api #auth #jwt

> **Tenant API Key Authentication & Cryptographic Verification.**

- **Endpoints:** `/v1/auth/token`, `/v1/auth/verify`
- **Security:** SHA-256 key hashing with dynamic rate limiting per tier.

---

## 🔗 Related Architecture & Cross-References
- [Retriever: Architecture](../../../retriever/docs/architecture.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `CRITICAL` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **All public telemetry IP addresses MUST be hashed daily using salted SHA-256 (GDPR zero-PII).**
2. **Service role key MUST stay strictly server-only and never leak to client bundle.**
3. **Session tokens MUST be cryptographically verified via Supabase Auth getUser().**

