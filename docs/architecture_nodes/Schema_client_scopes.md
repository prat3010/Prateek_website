---
id: Schema_client_scopes
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
  - ../25_SOTA_Scoping_Engine_PRD
  - API_client_save_scope
  - API_client_create_razorpay_order
  - UI_ArchitectureCartDrawer
  - UI_ClientWorkspaceDashboard
---

# Schema: `client_scopes`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)**

#db #persistence #scoping #phase_g

> **Primary Storage Entity for Scoping Wizard Drafts, Confirmed Packages & SOW Configurations.**

## 📊 PostgreSQL Table Definition
```sql
CREATE TABLE IF NOT EXISTS client_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_email TEXT NOT NULL,
    engine_id TEXT NOT NULL,                -- 'landing' | 'multipage' | 'saas'
    selected_features JSONB NOT NULL,       -- Array of feature module IDs with parameters
    brand_tier TEXT,                        -- 'none' | 'starter' | 'complete' | 'system'
    care_tier TEXT,                         -- 'self' | 'managed' | 'enterprise'
    status TEXT NOT NULL DEFAULT 'draft',   -- 'draft' | 'deposit_paid' | 'active' | 'completed'
    total_price_inr NUMERIC(12, 2) NOT NULL,
    total_price_usd NUMERIC(12, 2) NOT NULL,
    sow_hash TEXT,                          -- SHA-256 hash of immutable agreed scope
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔗 Related Architecture & Cross-References
- [25_SOTA_Scoping_Engine_PRD](../25_SOTA_Scoping_Engine_PRD.md)
- [API: client/save-scope](API_client_save_scope.md)
- [API: client/create-razorpay-order](API_client_create_razorpay_order.md)
- [UI: ArchitectureCartDrawer](UI_ArchitectureCartDrawer.md)
- [UI: ClientWorkspaceDashboard](UI_ClientWorkspaceDashboard.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_DATABASE_MIGRATION](docs/runbooks/RUNBOOK_DATABASE_MIGRATION.md)

1. **All column alterations MUST use non-destructive ADD COLUMN IF NOT EXISTS.**
2. **Row-Level Security (RLS) MUST be enabled with explicit tenant or email isolation policies.**
3. **Local JSON fallbacks MUST remain in 100% data contract synchronization with live tables.**

