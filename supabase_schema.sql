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

-- Allow anonymous inserts from client middleware/proxy
CREATE POLICY "Allow public insert access" 
  ON page_visits 
  FOR INSERT 
  WITH CHECK (true);

-- Allow public read access to the dashboard for telemetry display
CREATE POLICY "Allow public select access" 
  ON page_visits 
  FOR SELECT 
  USING (true);

-- 3. Database Indexes for Query Optimization (High Priority)
-- Optimized for: cutoff date time filters, bot exclusions, and sorting
CREATE INDEX IF NOT EXISTS idx_page_visits_created_at 
  ON page_visits (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_page_visits_is_bot 
  ON page_visits (is_bot);

-- Optimized for path matching aggregate summaries
CREATE INDEX IF NOT EXISTS idx_page_visits_path 
  ON page_visits (path);
