-- ============================================================
-- Migration: RAG Tenants Plan Tier Check & Persistent API Key
-- Description:
--   1. Expands rag_tenants_plan_tier_check to include 'pro' and 'business'.
--   2. Adds api_key column to rag_tenants to persist workspace ret_live_... keys across sessions.
--   3. Adds ON UPDATE CASCADE to rag_tenant_members_tenant_id_fkey so OCI tenant UUID reconciliation cascades cleanly.
-- ============================================================

ALTER TABLE public.rag_tenants
  DROP CONSTRAINT IF EXISTS rag_tenants_plan_tier_check;

ALTER TABLE public.rag_tenants
  ADD CONSTRAINT rag_tenants_plan_tier_check
  CHECK (plan_tier IN ('starter', 'pro', 'business', 'growth', 'enterprise', 'free'));

ALTER TABLE public.rag_tenants
  ADD COLUMN IF NOT EXISTS api_key TEXT DEFAULT '';

ALTER TABLE public.rag_tenant_members
  DROP CONSTRAINT IF EXISTS rag_tenant_members_tenant_id_fkey;

ALTER TABLE public.rag_tenant_members
  ADD CONSTRAINT rag_tenant_members_tenant_id_fkey
  FOREIGN KEY (tenant_id) REFERENCES public.rag_tenants(tenant_id)
  ON UPDATE CASCADE ON DELETE CASCADE;
