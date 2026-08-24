---
id: Proxy_telemetry
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: service_role
blast_radius: critical
file_path: src/proxy.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/proxy.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/proxy.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/4_api_gateway
  - security/service_role
  - domain/telemetry
  - platform/website
invariants:
  - "All public telemetry IP addresses MUST be hashed daily using salted SHA-256 (GDPR zero-PII)."
  - "Service role key MUST stay strictly server-only and never leak to client bundle."
  - "Session tokens MUST be cryptographically verified via Supabase Auth getUser()."
test_suites:
  - src/lib/__tests__/security.test.ts
downstream:
  - ../13_Telemetry_and_Analytics
  - ../16_Security_and_Privacy
  - Schema_page_visits
  - Route_analytics
---

# Proxy: `src/proxy.ts` (Next.js 16 Edge Proxy & Telemetry)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/proxy.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/proxy.ts)**

#proxy #edge #security #telemetry #middleware

> **Edge Request Interceptor, Bot Spam Filter & Daily Hashed Visitor Telemetry.**

- **Path:** `src/proxy.ts`
- **Key Features:**
  - Next.js 16 Proxy intercepting all incoming HTTP traffic
  - Extracts Vercel Geo-IP country header (`x-vercel-ip-country`)
  - Filters crawler bots and malicious vulnerability probes (`.php`, `wp-admin`, `.env`)
  - Hashes client IP with daily rotating salt for GDPR compliance

---

## 🔗 Related Architecture & Cross-References
- [13_Telemetry_and_Analytics](../13_Telemetry_and_Analytics.md)
- [16_Security_and_Privacy](../16_Security_and_Privacy.md)
- [Schema: page_visits](Schema_page_visits.md)
- [Route: /analytics](Route_analytics.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `CRITICAL` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **All public telemetry IP addresses MUST be hashed daily using salted SHA-256 (GDPR zero-PII).**
2. **Service role key MUST stay strictly server-only and never leak to client bundle.**
3. **Session tokens MUST be cryptographically verified via Supabase Auth getUser().**

