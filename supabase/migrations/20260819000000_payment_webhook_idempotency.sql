-- Payment webhook replay protection. This is a standalone migration because
-- production applies files from supabase/migrations rather than the legacy
-- supabase_schema.sql bootstrap file.
CREATE TABLE IF NOT EXISTS processed_webhooks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE processed_webhooks ENABLE ROW LEVEL SECURITY;
