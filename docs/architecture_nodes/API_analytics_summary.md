---
id: API_analytics_summary
tier: 4_api_gateway
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/app/api/analytics-summary/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/analytics-summary/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/analytics-summary/route.ts"
runbook: docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md
tags:
  - tier/4_api_gateway
  - security/public
  - domain/content_api
  - platform/website
invariants:
  - "Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks."
  - "Component / handler MUST handle missing Supabase connections gracefully via local fallback."
test_suites:
  - src/lib/__tests__/data.test.ts
downstream:
  - ../13_Telemetry_and_Analytics
  - Schema_page_visits
  - Route_analytics
---

# API: `GET /api/analytics-summary`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/analytics-summary/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/analytics-summary/route.ts)**

#api #analytics #rpc #telemetry

> **Fast-Path Visitor Metrics API backed by PostgreSQL RPC Function.**

- **Path:** `src/app/api/analytics-summary/route.ts`
- **SQL Fast-Path:** `get_analytics_summary(cutoff_time)`

---

## 🔗 Related Architecture & Cross-References
- [13_Telemetry_and_Analytics](../13_Telemetry_and_Analytics.md)
- [Schema: page_visits](Schema_page_visits.md)
- [Route: /analytics](Route_analytics.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

