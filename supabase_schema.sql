-- ============================================================
-- Supabase Telemetry Schema & Query Index Optimization
-- Project: Prateek Sharma Website
-- ============================================================

-- 1. Create page visits log table
CREATE TABLE IF NOT EXISTS page_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  path TEXT NOT NULL,
  country TEXT,
  region TEXT,
  city TEXT,
  browser TEXT,
  os TEXT,
  device TEXT,
  referrer TEXT,
  ip_hash TEXT,
  is_bot BOOLEAN DEFAULT FALSE
);

-- 2. Configure Row Level Security (RLS)
ALTER TABLE page_visits ENABLE ROW LEVEL SECURITY;

-- IMPORTANT SECURITY NOTE:
-- Public write access is disabled. Proxy logging is handled via server-side
-- SUPABASE_SERVICE_ROLE_KEY which bypasses RLS policies automatically.
-- To drop the old policy in your database run:
-- DROP POLICY IF EXISTS "Allow public insert access" ON page_visits;

-- Allow public read access to the dashboard for telemetry display
CREATE POLICY "Allow public select access" 
  ON page_visits 
  FOR SELECT 
  USING (true);

-- 90-day log retention / pruning trigger
-- Deletes page visit logs older than 90 days automatically on new inserts.
CREATE OR REPLACE FUNCTION purge_old_page_visits()
RETURNS trigger AS $$
BEGIN
  DELETE FROM page_visits WHERE created_at < NOW() - INTERVAL '90 days';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_purge_old_visits ON page_visits;
CREATE TRIGGER trg_purge_old_visits
AFTER INSERT ON page_visits
FOR EACH STATEMENT
EXECUTE FUNCTION purge_old_page_visits();

-- 3. Database Indexes for Query Optimization (High Priority)
-- Optimized for: cutoff date time filters, bot exclusions, and sorting
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at 
  ON page_visits (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_visits_is_bot 
  ON page_visits (is_bot);

-- Optimized for path matching aggregate summaries
CREATE INDEX IF NOT EXISTS idx_page_visits_path 
  ON page_visits (path);

-- Composite partial index for the most common dashboard query pattern:
--   WHERE is_bot = FALSE AND created_at >= cutoff ORDER BY created_at DESC
-- Covers both filtering conditions and sort order in one index scan.
CREATE INDEX IF NOT EXISTS idx_page_visits_dashboard 
  ON page_visits (created_at DESC) WHERE is_bot = FALSE;

-- ============================================================
-- Portfolio Content Tables
-- ============================================================

-- Enable pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 4. Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  "longDescription" TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  tags JSONB NOT NULL DEFAULT '[]',
  "liveUrl" TEXT NOT NULL DEFAULT '',
  "githubUrl" TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '#00E676',
  "isLive" BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'soon' CHECK (status IN ('live', 'soon', 'personal')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow service insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow service delete projects" ON projects FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects (slug);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);

-- 5. Skills
CREATE TABLE IF NOT EXISTS skills (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  icon TEXT NOT NULL DEFAULT 'sparkles',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'dynamic' CHECK (category IN ('orchestration', 'logic', 'product', 'dynamic')),
  color TEXT NOT NULL DEFAULT '#00E676',
  level TEXT,
  prereq TEXT,
  status TEXT,
  projects JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select skills" ON skills FOR SELECT USING (true);
CREATE POLICY "Allow service insert skills" ON skills FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update skills" ON skills FOR UPDATE USING (true);
CREATE POLICY "Allow service delete skills" ON skills FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_skills_name ON skills (name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON skills (category);

-- 6. Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  issuer TEXT NOT NULL,
  date TEXT NOT NULL,
  "credentialId" TEXT,
  "verifyUrl" TEXT,
  image TEXT,
  tags JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select certificates" ON certificates FOR SELECT USING (true);
CREATE POLICY "Allow service insert certificates" ON certificates FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update certificates" ON certificates FOR UPDATE USING (true);
CREATE POLICY "Allow service delete certificates" ON certificates FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_certificates_slug ON certificates (slug);

-- 7. Profile (singleton resume row)
CREATE TABLE IF NOT EXISTS profile (
  id INTEGER DEFAULT 1 PRIMARY KEY CHECK (id = 1),
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select profile" ON profile FOR SELECT USING (true);
CREATE POLICY "Allow service insert profile" ON profile FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service update profile" ON profile FOR UPDATE USING (true);
