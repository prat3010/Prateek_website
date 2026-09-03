---
id: Lib_rateLimit
tier: 5_domain_providers
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/lib/rateLimit.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/rateLimit.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/rateLimit.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/5_domain_providers
  - security/public
  - domain/domain_lib
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../16_Security_and_Privacy
  - API_scoping_parse_intent
  - API_scoping_parse_rfp
  - API_client_copilot
  - API_contact
---

# Lib: `rateLimit.ts` (Universal Edge AI Token Shield)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/lib/rateLimit.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/lib/rateLimit.ts)**

#lib #security #ratelimit #upstash #redis #ddos

> **Universal Dual-Mode Sliding-Window Rate Limiter & Edge AI Token Shield (Milestone 86).**

- **Path:** `src/lib/rateLimit.ts`
- **Engines:**
  1. **Upstash Redis REST Engine:** Pure HTTP atomic pipeline commands (`ZREMRANGEBYSCORE`, `ZCARD`, `ZADD`, `EXPIRE`) when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_URL` / `KV_REST_API_TOKEN`) are present.
  2. **In-Memory LRU Sliding Window Fallback:** High-performance, self-cleaning local store with automatic stale entry garbage collection.
- **Client Identification:** `getClientIdentifier` derives reliable client fingerprints from `x-forwarded-for`, `x-real-ip`, or authenticated session identifiers.
- **Standard 429 RFC Responses:** Returns HTTP 429 with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.

---

## 🔗 Related Architecture & Cross-References
- [16_Security_and_Privacy](../16_Security_and_Privacy.md)
- [API: scoping/parse-intent](API_scoping_parse_intent.md)
- [API: scoping/parse-rfp](API_scoping_parse_rfp.md)
- [API: client/copilot](API_client_copilot.md)
- [API: contact](API_contact.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

