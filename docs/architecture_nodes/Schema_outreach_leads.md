---
id: Schema_outreach_leads
tier: 8_persistence
platform: Prateek_Website
status: production
auth_level: public
blast_radius: high
file_path: supabase_schema.sql
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql"
runbook: docs/runbooks/RUNBOOK_DATABASE_MIGRATION.md
tags:
  - tier/8_persistence
  - security/public
  - domain/database
  - platform/website
invariants:
  - "All column alterations MUST use non-destructive ADD COLUMN IF NOT EXISTS."
  - "Row-Level Security (RLS) MUST be enabled with explicit tenant or email isolation policies."
  - "Local JSON fallbacks MUST remain in 100% data contract synchronization with live tables."
test_suites:
  - scripts/audit_contracts.py
  - scripts/audit_db.py
downstream:
  - ../AI_OUTREACH_AGENT_ROADMAP
  - UI_AdminPortal
  - API_outreach_dispatch
---

# Schema: `outreach_leads` (Autonomous CRM)

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)**

#db #outreach #crm #leads

> **Autonomous AI Prospect Ingestion, ICP Scores & Outreach Status Ledger.**

- **Fields:** `prospect_name`, `company`, `email`, `linkedin_url`, `icp_score`, `custom_pitch`, `status`, `sent_at`

---

## 🔗 Related Architecture & Cross-References
- [AI_OUTREACH_AGENT_ROADMAP](../AI_OUTREACH_AGENT_ROADMAP.md)
- [UI: AdminPortal](UI_AdminPortal.md)
- [API: outreach/dispatch](API_outreach_dispatch.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_DATABASE_MIGRATION](docs/runbooks/RUNBOOK_DATABASE_MIGRATION.md)

1. **All column alterations MUST use non-destructive ADD COLUMN IF NOT EXISTS.**
2. **Row-Level Security (RLS) MUST be enabled with explicit tenant or email isolation policies.**
3. **Local JSON fallbacks MUST remain in 100% data contract synchronization with live tables.**

