-- Price Alerts Table for GlobePilot
-- Run this SQL in your Supabase SQL Editor to create the table

CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  target_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMP WITH TIME ZONE,
  last_notified_at TIMESTAMP WITH TIME ZONE,
  -- Double opt-in: NULL until the owner clicks the confirmation email
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_price_alerts_email ON price_alerts(email);

-- Create index on is_active for cron job queries
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active) WHERE is_active = TRUE;

-- Enable Row Level Security (RLS)
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: all access goes through server routes using
-- the service role key (lib/price-tracker.ts). Ownership is proven by signed
-- email tokens (lib/alert-tokens.ts), not RLS.
-- See supabase-price-alerts-security.sql for the migration that removed the
-- old public USING (true) policies.
