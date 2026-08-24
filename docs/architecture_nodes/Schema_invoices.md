---
id: Schema_invoices
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
  - ../14_Razorpay_Payments_and_Invoicing
  - Schema_client_scopes
  - API_client_verify_razorpay_payment
  - Engine_Digital_SOW_Escrow_Freeze
---

# Schema: `invoices`

> [!NOTE] Quick IDE Jump
> ⚡ **[Open in Cursor](cursor://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)** &nbsp;|&nbsp; 💻 **[Open in VS Code](vscode://file/Users/prateeksharma/Developer/Prateek_website/supabase_schema.sql)**

#db #payments #razorpay #financial

> **Financial Transaction Ledger for Escrow Milestone Payments & Retainers.**

## 📊 PostgreSQL Table Definition
```sql
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope_id UUID REFERENCES client_scopes(id),
    client_email TEXT NOT NULL,
    razorpay_order_id TEXT NOT NULL UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    amount_paid NUMERIC(12, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',   -- 'INR' | 'USD'
    payment_status TEXT NOT NULL,           -- 'created' | 'paid' | 'failed'
    milestone_type TEXT NOT NULL,          -- 'deposit_50' | 'final_50' | 'change_order' | 'retainer'
    pdf_receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔗 Related Architecture & Cross-References
- [14_Razorpay_Payments_and_Invoicing](../14_Razorpay_Payments_and_Invoicing.md)
- [Schema: client_scopes](Schema_client_scopes.md)
- [API: client/verify-razorpay-payment](API_client_verify_razorpay_payment.md)
- [Engine: Digital SOW Escrow Freeze](Engine_Digital_SOW_Escrow_Freeze.md)
