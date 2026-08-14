-- ============================================================
-- Migration: RAG SaaS Multi-Tenant Tables & RLS Policies
-- Description: Defines rag_tenants and rag_tenant_members schemas
-- ============================================================

-- 1. Create rag_tenants table
CREATE TABLE IF NOT EXISTS rag_tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'My Workspace',
  plan_tier TEXT DEFAULT 'starter' CHECK (plan_tier IN ('starter', 'growth', 'enterprise', 'free')),
  api_key_hash TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on rag_tenants
ALTER TABLE rag_tenants ENABLE ROW LEVEL SECURITY;

-- 2. Create rag_tenant_members table
CREATE TABLE IF NOT EXISTS rag_tenant_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES rag_tenants(tenant_id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_tenant_user UNIQUE (tenant_id, user_id),
  CONSTRAINT unique_tenant_email UNIQUE (tenant_id, email)
);

-- Enable RLS on rag_tenant_members
ALTER TABLE rag_tenant_members ENABLE ROW LEVEL SECURITY;

-- 3. Row Level Security Policies

-- rag_tenant_members RLS:
-- Authenticated users can view their own membership rows (by auth.uid() or verified JWT email)
DROP POLICY IF EXISTS "Users can select own memberships" ON rag_tenant_members;
CREATE POLICY "Users can select own memberships" ON rag_tenant_members FOR SELECT
  USING (
    user_id = auth.uid() 
    OR email = auth.jwt() ->> 'email'
  );

-- rag_tenants RLS:
-- Authenticated users can view tenants where they hold active membership
DROP POLICY IF EXISTS "Members can select matching rag_tenants" ON rag_tenants;
CREATE POLICY "Members can select matching rag_tenants" ON rag_tenants FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM rag_tenant_members
      WHERE user_id = auth.uid() OR email = auth.jwt() ->> 'email'
    )
  );

-- Note: Writes (INSERT, UPDATE, DELETE) are restricted to service role keys (SUPABASE_SERVICE_ROLE_KEY)
-- which bypass RLS policies automatically.

-- 4. Database Indexes
CREATE INDEX IF NOT EXISTS idx_rag_tenants_tenant_id ON rag_tenants (tenant_id);
CREATE INDEX IF NOT EXISTS idx_rag_tenants_client_id ON rag_tenants (client_id);
CREATE INDEX IF NOT EXISTS idx_rag_tenant_members_tenant ON rag_tenant_members (tenant_id);
CREATE INDEX IF NOT EXISTS idx_rag_tenant_members_user ON rag_tenant_members (user_id);
CREATE INDEX IF NOT EXISTS idx_rag_tenant_members_email ON rag_tenant_members (email);
