-- =====================================================
-- GlobePilots Passport Migration Tables
-- Run this in Supabase SQL Editor after supabase-user-accounts-schema.sql
-- =====================================================

-- =====================================================
-- 1. PASSPORT STAMPS TABLE
-- =====================================================
CREATE TABLE passport_stamps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  iata TEXT NOT NULL,
  flag TEXT,
  revealed_at BIGINT NOT NULL, -- JS timestamp (ms since epoch)
  depart_date TEXT NOT NULL,
  total_cost NUMERIC(10, 2) DEFAULT 0,
  is_booked BOOLEAN DEFAULT FALSE,
  booked_at BIGINT, -- JS timestamp
  booking_clicks JSONB DEFAULT '[]'::jsonb,
  badge TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_passport_stamps_user_id ON passport_stamps(user_id);
CREATE INDEX idx_passport_stamps_country_code ON passport_stamps(country_code);
CREATE INDEX idx_passport_stamps_created_at ON passport_stamps(created_at DESC);

-- =====================================================
-- 2. PASSPORT BADGES TABLE
-- =====================================================
CREATE TABLE passport_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL, -- e.g. 'first-mystery', 'globe-trotter'
  name TEXT NOT NULL,
  emoji TEXT NOT NULL,
  description TEXT NOT NULL,
  earned_at BIGINT NOT NULL, -- JS timestamp (ms since epoch)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

CREATE INDEX idx_passport_badges_user_id ON passport_badges(user_id);
CREATE INDEX idx_passport_badges_badge_id ON passport_badges(badge_id);
