-- Migration: 20261106_enable_missing_rls.sql
-- Description: Enable RLS on unshielded tables, create rag_tenant_credentials, create contact_submissions, add notes to clients

-- 1. Secure promo_codes table
-- Zero public SELECT policies: promo validation is handled strictly server-side via /api/scoping/validate-promo
CREATE TABLE IF NOT EXISTS promo_codes (
    code VARCHAR(50) PRIMARY KEY,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL,
    currency VARCHAR(10) DEFAULT 'ALL',
    max_uses INTEGER DEFAULT NULL,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    partner_id VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow service role full access promo_codes" ON promo_codes;
CREATE POLICY "Allow service role full access promo_codes" ON promo_codes
    TO service_role USING (true) WITH CHECK (true);

-- 2. Secure legacy/cross-workspace tables
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenants') THEN
        ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Service role manages tenants" ON tenants;
        CREATE POLICY "Service role manages tenants" ON tenants TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
        ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Service role manages documents" ON documents;
        CREATE POLICY "Service role manages documents" ON documents TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'document_chunks') THEN
        ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Service role manages document_chunks" ON document_chunks;
        CREATE POLICY "Service role manages document_chunks" ON document_chunks TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vector_records') THEN
        ALTER TABLE vector_records ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Service role manages vector_records" ON vector_records;
        CREATE POLICY "Service role manages vector_records" ON vector_records TO service_role USING (true) WITH CHECK (true);
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'social_drafts') THEN
        ALTER TABLE social_drafts ENABLE ROW LEVEL SECURITY;
        DROP POLICY IF EXISTS "Service role manages social_drafts" ON social_drafts;
        CREATE POLICY "Service role manages social_drafts" ON social_drafts TO service_role USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 3. Dedicated Credentials Table for Multi-Tenant Workspaces (RSK-06)
-- Protects master administrative API keys from standard workspace members
CREATE TABLE IF NOT EXISTS rag_tenant_credentials (
    tenant_id UUID PRIMARY KEY REFERENCES rag_tenants(tenant_id) ON DELETE CASCADE,
    api_key TEXT NOT NULL,
    api_key_hash TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE rag_tenant_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only owners can select credentials" ON rag_tenant_credentials;
CREATE POLICY "Only owners can select credentials" ON rag_tenant_credentials FOR SELECT
    USING (
        tenant_id IN (
            SELECT tenant_id FROM rag_tenant_members
            WHERE (user_id = auth.uid() OR email = auth.jwt() ->> 'email')
            AND role = 'owner'
        )
    );

DROP POLICY IF EXISTS "Service role manages credentials" ON rag_tenant_credentials;
CREATE POLICY "Service role manages credentials" ON rag_tenant_credentials
    TO service_role USING (true) WITH CHECK (true);

-- 4. Dedicated Contact Form Submissions Table (RSK-02)
-- Guarantees persistence of all inbound contact signals before external email dispatch
CREATE TABLE IF NOT EXISTS contact_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT DEFAULT '',
    message TEXT NOT NULL,
    has_intake BOOLEAN DEFAULT false,
    intake_data JSONB DEFAULT NULL,
    status TEXT DEFAULT 'received' CHECK (status IN ('received', 'emailed', 'failed')),
    ip_hash TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages contact submissions" ON contact_submissions;
CREATE POLICY "Service role manages contact submissions" ON contact_submissions
    TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON contact_submissions (email);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created ON contact_submissions (created_at DESC);

-- 5. Extend clients table with CRM notes column (RSK-04)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- 6. Email Delivery Audit Ledger
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    template_name TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    subject TEXT DEFAULT '',
    status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
    error_message TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages email logs" ON email_logs;
CREATE POLICY "Service role manages email logs" ON email_logs TO service_role USING (true) WITH CHECK (true);

