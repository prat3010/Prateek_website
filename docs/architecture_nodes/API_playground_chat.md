---
id: API_playground_chat
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: bearer_jwt
blast_radius: medium
file_path: src/app/api/playground/chat/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/playground/chat/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/playground/chat/route.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/4_api_gateway
  - security/bearer_jwt
  - domain/content_api
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../48_The_Playground_Universal_Creation_Showcase_PRD
  - Route_playground
  - Lib_rateLimit
  - Retriever_API_v1_chat
---

# API: `POST /api/playground/chat` (Playground Cognitive Proxy)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/playground/chat/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/playground/chat/route.ts)**

#api #retriever #rate_limit #proxy #oracle_vps

> **Sliding-Window Rate-Limited Bridge to Retriever Cognitive Intelligence on Oracle Cloud VPS.**

- **Path:** `src/app/api/playground/chat/route.ts`
- **Key Features:**
  - In-memory / Upstash Redis sliding-window rate limiter (`20 req/min` via `src/lib/rateLimit.ts`).
  - Server-side Bearer authentication injection targeting `${RETRIEVER_API_URL}/v1/tenants/${PORTFOLIO_TENANT_ID}/chat/completions`.
  - Upstream latency tracking and sub-10ms semantic cache detection (`x-cache-lookup`).
  - Graceful fallback with human-readable error diagnostics if VPS engine is restarting.

---

## 🔗 Related Architecture & Cross-References
- [48_The_Playground_Universal_Creation_Showcase_PRD](../48_The_Playground_Universal_Creation_Showcase_PRD.md)
- [Route: playground](Route_playground.md)
- [Lib: rateLimit.ts](Lib_rateLimit.md)
- [Retriever: API v1 chat](Retriever_API_v1_chat.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

