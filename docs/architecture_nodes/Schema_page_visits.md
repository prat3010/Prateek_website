---
id: Schema_page_visits
tier: 8_persistence
platform: Prateek_Website
status: production
auth_level: public
file_path: supabase_schema.sql
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql"
tags:
  - tier/8_persistence
  - security/public
  - domain/database
  - platform/website
downstream:
  - ../13_Telemetry_and_Analytics
  - API_analytics_summary
  - Route_analytics
---

# Schema: `page_visits` (Visitor Telemetry)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)**

#db #analytics #telemetry #privacy

> **GDPR-Compliant Daily Hashed Telemetry Ledger.**

- **Path:** `supabase_schema.sql` & `src/proxy.ts`
- **Fields:** `ip_hash`, `country_code`, `path`, `user_agent_type`, `visited_at`
- **Pruning:** Automated probabilistic 90-day retention trigger.
- **Fast-Path:** `get_analytics_summary(cutoff_time)` custom SQL RPC function.

---

## 🔗 Related Architecture & Cross-References
- [13_Telemetry_and_Analytics](../13_Telemetry_and_Analytics.md)
- [API: analytics-summary](API_analytics_summary.md)
- [Route: /analytics](Route_analytics.md)
