# 🗄️ Architecture Runbook: Database Schema Migration & Synchronization

**Objective:** Standard Operating Procedure (SOP) for executing zero-downtime PostgreSQL DDL migrations across Supabase and local JSON fallbacks.

---

## 🛡️ Step 1: Non-Destructive DDL Drafting
1. Open `supabase_schema.sql`.
2. Append non-destructive DDL statements:
   ```sql
   ALTER TABLE <target_table> ADD COLUMN IF NOT EXISTS <col_name> <type> DEFAULT <default_val>;
   ```
3. If creating a new table, include:
   - `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
   - `created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL`
   - Explicit `ALTER TABLE <target_table> ENABLE ROW LEVEL SECURITY;`
   - Explicit read/write RLS policies scoped by `auth.jwt() ->> 'email'`.

---

## ⚡ Step 2: Live Database Execution
1. Execute the DDL migration on live Supabase via the Supabase MCP tool `execute_sql` (or Supabase Dashboard SQL Editor).
2. Query `information_schema.columns` to verify column creation:
   ```sql
   SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '<target_table>';
   ```

---

## 🔄 Step 3: Data Contracts & Cache Invalidation
1. Run database schema audit:
   ```bash
   python3 scripts/audit_db.py
   python3 scripts/audit_contracts.py
   ```
2. Revalidate Next.js cache tags if public content tables were altered:
   ```bash
   curl -X POST "https://prateeq.in/api/revalidate?secret="
   ```

---

## 🏛️ Step 4: Architecture Node Creation & Sync
1. Update or create `docs/architecture_nodes/Schema_<target_table>.md`.
2. Run `python3 scripts/sync_graph_with_code.py`.
