---
id: Schema_client_change_orders
tier: 8_persistence
platform: Prateek_Website
status: production
auth_level: public
blast_radius: high
file_path: src/app/api/client/change-orders/route.ts
ide_cursor_uri: "cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/change-orders/route.ts"
ide_vscode_uri: "vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/change-orders/route.ts"
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
  - ../27_Client_Workspace_and_Escrow_Ledger_PRD
  - API_client_change_orders
  - Schema_client_scopes
  - Schema_invoices
  - UI_ClientWorkspaceDashboard
---

# Schema: `client_change_orders`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/change-orders/route.ts)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/src/app/api/client/change-orders/route.ts)**

#db #persistence #commerce #change_orders #phase_2

> **Scope Amendment & Phase 2 Feature Ledger for Active Client Engagements.**

## 📊 PostgreSQL Table Definition
```sql
CREATE TABLE IF NOT EXISTS client_change_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_code TEXT REFERENCES client_scopes(scope_code) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price_inr NUMERIC(12,2) NOT NULL,
    price_usd NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending_approval'
        CHECK (status IN ('pending_approval', 'approved', 'declined', 'invoiced', 'paid')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 🔗 Related Architecture & Cross-References
- [27_Client_Workspace_and_Escrow_Ledger_PRD](../27_Client_Workspace_and_Escrow_Ledger_PRD.md)
- [API: client/change-orders](API_client_change_orders.md)
- [Schema: client_scopes](Schema_client_scopes.md)
- [Schema: invoices](Schema_invoices.md)
- [UI: ClientWorkspaceDashboard](UI_ClientWorkspaceDashboard.md)

## 🛡️ Non-Negotiable Invariants & Safety Constraints
> **Blast Radius:** `HIGH` &nbsp;|&nbsp; 📖 **Runbook:** [RUNBOOK_DATABASE_MIGRATION](docs/runbooks/RUNBOOK_DATABASE_MIGRATION.md)

1. **All column alterations MUST use non-destructive ADD COLUMN IF NOT EXISTS.**
2. **Row-Level Security (RLS) MUST be enabled with explicit tenant or email isolation policies.**
3. **Local JSON fallbacks MUST remain in 100% data contract synchronization with live tables.**

