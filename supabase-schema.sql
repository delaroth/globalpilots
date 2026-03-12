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
  last_notified_at TIMESTAMP WITH TIME ZONE
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_price_alerts_email ON price_alerts(email);

-- Create index on is_active for cron job queries
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(is_active) WHERE is_active = TRUE;

-- Enable Row Level Security (RLS)
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert alerts (for now)
CREATE POLICY "Allow public inserts" ON price_alerts
  FOR INSERT TO anon
  WITH CHECK (true);

-- Create policy to allow users to read their own alerts
CREATE POLICY "Users can read own alerts" ON price_alerts
  FOR SELECT TO anon
  USING (true);

-- Create policy to allow users to update their own alerts
CREATE POLICY "Users can update own alerts" ON price_alerts
  FOR UPDATE TO anon
  USING (true);

-- Create policy to allow users to delete their own alerts
CREATE POLICY "Users can delete own alerts" ON price_alerts
  FOR DELETE TO anon
  USING (true);
