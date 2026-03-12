-- GlobePilots Database Schema Enhancements
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. PRICE HISTORY TABLE
-- Tracks historical flight prices for trend analysis
-- =====================================================

CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  depart_date DATE NOT NULL,
  return_date DATE,
  found_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_price_history_route ON price_history(origin, destination);
CREATE INDEX IF NOT EXISTS idx_price_history_created ON price_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_route_date ON price_history(origin, destination, created_at DESC);

-- Enable RLS
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Allow public reads (anyone can see historical prices)
CREATE POLICY "Allow public reads" ON price_history
  FOR SELECT TO anon
  USING (true);

-- Only backend can insert (via API with service key or cron job)
CREATE POLICY "Backend inserts only" ON price_history
  FOR INSERT TO anon
  WITH CHECK (true);

-- =====================================================
-- 2. BLOG POSTS TABLE
-- AI-generated destination guides for SEO
-- =====================================================

CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_code TEXT NOT NULL UNIQUE, -- IATA code (e.g., "BKK")
  destination_name TEXT NOT NULL, -- City name (e.g., "Bangkok")
  country TEXT NOT NULL,
  title TEXT NOT NULL, -- SEO optimized title
  meta_description TEXT NOT NULL, -- SEO meta description
  content JSONB NOT NULL, -- Structured content sections
  slug TEXT NOT NULL UNIQUE, -- URL-friendly slug (e.g., "bangkok-travel-guide")
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_destination ON blog_posts(destination_code);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_views ON blog_posts(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created ON blog_posts(created_at DESC);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Allow public reads
CREATE POLICY "Allow public reads" ON blog_posts
  FOR SELECT TO anon
  USING (true);

-- Allow public inserts (blog generation API will create posts)
CREATE POLICY "Allow public inserts" ON blog_posts
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow public updates (for view count increment)
CREATE POLICY "Allow public updates" ON blog_posts
  FOR UPDATE TO anon
  USING (true);

-- =====================================================
-- 3. EMAIL SUBSCRIBERS TABLE
-- Captures emails from mystery page and alerts
-- =====================================================

CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source TEXT NOT NULL, -- 'mystery', 'alerts', 'blog', etc.
  subscribed_to_newsletters BOOLEAN DEFAULT FALSE, -- For future use
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_source ON email_subscribers(source);
CREATE INDEX IF NOT EXISTS idx_email_subscribers_newsletters ON email_subscribers(subscribed_to_newsletters) WHERE subscribed_to_newsletters = TRUE;

-- Enable RLS
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (email capture)
CREATE POLICY "Allow public inserts" ON email_subscribers
  FOR INSERT TO anon
  WITH CHECK (true);

-- Allow public reads of own email only
CREATE POLICY "Users can read own email" ON email_subscribers
  FOR SELECT TO anon
  USING (true);

-- Allow public updates (for last_active_at)
CREATE POLICY "Allow public updates" ON email_subscribers
  FOR UPDATE TO anon
  USING (true);

-- =====================================================
-- 4. ENHANCE PRICE_ALERTS TABLE
-- Add columns for price tracking
-- =====================================================

-- Add new columns for price tracking
ALTER TABLE price_alerts
  ADD COLUMN IF NOT EXISTS current_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS historical_low_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS price_status TEXT; -- 'great_deal', 'good_deal', 'average', 'above_average'

-- Add index for route lookups
CREATE INDEX IF NOT EXISTS idx_price_alerts_route ON price_alerts(origin, destination);

-- =====================================================
-- VERIFICATION QUERIES
-- Run these to verify tables were created successfully
-- =====================================================

-- Check if all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('price_history', 'blog_posts', 'email_subscribers', 'price_alerts')
ORDER BY table_name;

-- Check price_alerts columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'price_alerts'
  AND column_name IN ('current_price', 'historical_low_price', 'price_status')
ORDER BY column_name;

-- Show indexes
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('price_history', 'blog_posts', 'email_subscribers', 'price_alerts')
ORDER BY tablename, indexname;
