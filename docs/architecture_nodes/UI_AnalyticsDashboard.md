---
id: UI_AnalyticsDashboard
tier: 1_frontend
platform: Prateek_Website
status: production
auth_level: public
blast_radius: medium
file_path: src/app/analytics/page.tsx
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/analytics/page.tsx"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/analytics/page.tsx"
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
  - ../13_Telemetry_and_Analytics
  - Route_analytics
  - API_analytics_summary
  - Schema_page_visits
---

# UI: `AnalyticsDashboard.tsx`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/analytics/page.tsx)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/analytics/page.tsx)**

#ui #frontend #analytics #telemetry

> **Interactive Visitor Geolocation & Path Metric Telemetry Cockpit.**

- **Path:** `src/app/analytics/page.tsx` & `src/components/analytics/`
- **Features:** Real-time visitor counts, country distribution charts, hourly traffic graphs, and bot vs human filters.

---

## 🔗 Related Architecture & Cross-References
- [13_Telemetry_and_Analytics](../13_Telemetry_and_Analytics.md)
- [Route: /analytics](Route_analytics.md)
- [API: analytics-summary](API_analytics_summary.md)
- [Schema: page_visits](Schema_page_visits.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `MEDIUM` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_NEW_API_ENDPOINT](docs/runbooks/RUNBOOK_NEW_API_ENDPOINT.md)

1. **Interactive modals inside ScrollSection MUST use <Portal> to escape CSS containing blocks.**
2. **Component / handler MUST handle missing Supabase connections gracefully via local fallback.**

