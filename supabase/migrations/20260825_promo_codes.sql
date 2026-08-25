-- Migration: Create promo_codes table for Scoping Cart & Referral Engine
CREATE TABLE IF NOT EXISTS promo_codes (
    code VARCHAR(50) PRIMARY KEY,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value NUMERIC NOT NULL,
    currency VARCHAR(10) DEFAULT 'ALL', -- 'INR', 'USD', or 'ALL'
    max_uses INTEGER DEFAULT NULL,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ DEFAULT NULL,
    partner_id VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for case-insensitive lookup
CREATE INDEX IF NOT EXISTS idx_promo_codes_upper ON promo_codes (UPPER(code));

-- Seed baseline promo codes
INSERT INTO promo_codes (code, discount_type, discount_value, currency, is_active)
VALUES 
  ('PRATEEQ10', 'percentage', 10, 'ALL', TRUE),
  ('GROWTH5', 'percentage', 5, 'ALL', TRUE),
  ('PARTNER20', 'percentage', 20, 'ALL', TRUE),
  ('FOUNDER50', 'fixed', 5000, 'INR', TRUE)
ON CONFLICT (code) DO NOTHING;
