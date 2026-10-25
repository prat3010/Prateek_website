-- ============================================================
-- Migration: Scoping Chat Traces & Cognitive Observability Telemetry
-- Description:
--   1. Ensures chat_session_id & chat_transcript exist on intake_leads.
--   2. Creates scoping_chat_traces table for granular turn-level telemetry.
--   3. Enables Row-Level Security with service-role full access policy.
--   4. Adds performance indexes for session, scope_code, email, created_at, country.
-- ============================================================

ALTER TABLE public.intake_leads ADD COLUMN IF NOT EXISTS chat_session_id TEXT;
ALTER TABLE public.intake_leads ADD COLUMN IF NOT EXISTS chat_transcript JSONB DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS public.scoping_chat_traces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  scope_code TEXT DEFAULT '',
  turn_index INTEGER NOT NULL DEFAULT 1,
  user_query TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  agent_intent TEXT DEFAULT '',
  agent_reasoning TEXT DEFAULT '',
  retrieved_chunks JSONB DEFAULT '[]'::jsonb,
  model_used TEXT DEFAULT 'retriever',
  latency_ms INTEGER DEFAULT 0,
  tokens_prompt INTEGER DEFAULT 0,
  tokens_completion INTEGER DEFAULT 0,
  is_fallback BOOLEAN DEFAULT false,
  currency TEXT DEFAULT 'INR',
  current_engine TEXT DEFAULT '',
  selected_features JSONB DEFAULT '[]'::jsonb,
  quote_inr NUMERIC DEFAULT 0,
  quote_usd NUMERIC DEFAULT 0,
  visitor_ip_hash TEXT DEFAULT '',
  visitor_country TEXT DEFAULT '',
  visitor_user_agent TEXT DEFAULT '',
  user_email TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.scoping_chat_traces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow service role full access scoping_chat_traces" ON public.scoping_chat_traces;
CREATE POLICY "Allow service role full access scoping_chat_traces" ON public.scoping_chat_traces TO service_role USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_scoping_traces_session ON public.scoping_chat_traces (session_id, turn_index);
CREATE INDEX IF NOT EXISTS idx_scoping_traces_scope ON public.scoping_chat_traces (scope_code);
CREATE INDEX IF NOT EXISTS idx_scoping_traces_email ON public.scoping_chat_traces (user_email);
CREATE INDEX IF NOT EXISTS idx_scoping_traces_created ON public.scoping_chat_traces (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scoping_traces_country ON public.scoping_chat_traces (visitor_country);
