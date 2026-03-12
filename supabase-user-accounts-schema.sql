-- =====================================================
-- GlobePilots User Accounts + Social Proof + Flexible Dates Schema
-- Run this in Supabase SQL Editor after supabase-schema-enhancements.sql
-- =====================================================

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT, -- NULL for OAuth-only users
  name TEXT,
  home_airport TEXT, -- IATA code (e.g., "JFK")
  avatar_url TEXT,
  auth_provider TEXT DEFAULT 'email', -- 'email' or 'google'
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- =====================================================
-- 2. USER PREFERENCES
-- =====================================================
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  min_budget INTEGER DEFAULT 300,
  max_budget INTEGER DEFAULT 1500,
  preferred_travel_style TEXT[], -- ['adventure', 'relaxation', 'culture', etc.]
  preferred_airlines TEXT[], -- IATA codes
  avoid_long_layovers BOOLEAN DEFAULT TRUE,
  max_flight_duration_hours INTEGER, -- NULL = no preference
  preferred_hotel_rating INTEGER, -- 1-5 stars
  dietary_restrictions TEXT[],
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "browser": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- =====================================================
-- 3. MODIFY PRICE_ALERTS TABLE - Add user_id and flexible dates
-- =====================================================
ALTER TABLE price_alerts
  ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  ADD COLUMN flexible_dates BOOLEAN DEFAULT FALSE,
  ADD COLUMN date_range_days INTEGER DEFAULT 0, -- ±N days (0 = exact date only)
  ADD COLUMN best_price_in_range NUMERIC(10, 2), -- Cached best price across date range
  ADD COLUMN best_price_date DATE; -- Date of best price in range

CREATE INDEX idx_price_alerts_user_id ON price_alerts(user_id);
CREATE INDEX idx_price_alerts_flexible_dates ON price_alerts(flexible_dates);

-- Backfill: Link existing alerts to users by email (run after users are created)
-- UPDATE price_alerts pa
-- SET user_id = (SELECT id FROM users WHERE users.email = pa.email LIMIT 1)
-- WHERE user_id IS NULL AND email IN (SELECT email FROM users);

-- =====================================================
-- 4. SAVED TRIPS TABLE
-- =====================================================
CREATE TABLE saved_trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  destination_data JSONB NOT NULL, -- Full mystery destination response
  trip_name TEXT, -- User-defined name for this trip
  notes TEXT, -- User's personal notes
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_saved_trips_user_id ON saved_trips(user_id);
CREATE INDEX idx_saved_trips_created_at ON saved_trips(created_at DESC);
CREATE INDEX idx_saved_trips_is_favorite ON saved_trips(is_favorite);

-- =====================================================
-- 5. ACTIVITY FEED TABLE (for social proof)
-- =====================================================
CREATE TABLE activity_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL, -- 'alert_created', 'deal_found', 'trip_saved', 'destination_revealed'
  data JSONB NOT NULL, -- Activity-specific data
  -- Example data structures:
  -- alert_created: {"route": "JFK-LAX", "user_city": "NYC", "user_first_name": "Sarah"}
  -- deal_found: {"route": "LAX-BKK", "price": 299, "savings": 201}
  -- trip_saved: {"destination": "Bangkok", "budget": 800}
  -- destination_revealed: {"destination": "Lisbon", "country": "Portugal"}
  is_public BOOLEAN DEFAULT TRUE, -- For privacy controls
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_activity_type ON activity_feed(activity_type);
CREATE INDEX idx_activity_feed_is_public ON activity_feed(is_public);

-- =====================================================
-- 6. ROUTE TRACKING (for "X people tracking this route")
-- =====================================================
CREATE TABLE route_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  active_alert_count INTEGER DEFAULT 0,
  total_alert_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(origin, destination)
);

CREATE INDEX idx_route_tracking_route ON route_tracking(origin, destination);
CREATE INDEX idx_route_tracking_active_count ON route_tracking(active_alert_count DESC);

-- =====================================================
-- 7. USER STATISTICS (cached for performance)
-- =====================================================
CREATE TABLE user_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_alerts_created INTEGER DEFAULT 0,
  active_alerts_count INTEGER DEFAULT 0,
  total_trips_saved INTEGER DEFAULT 0,
  total_destinations_revealed INTEGER DEFAULT 0,
  estimated_money_saved NUMERIC(10, 2) DEFAULT 0, -- Based on deal alerts
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_statistics_user_id ON user_statistics(user_id);

-- =====================================================
-- 8. PASSWORD RESET TOKENS
-- =====================================================
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- =====================================================
-- 9. SESSIONS (for NextAuth.js)
-- =====================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_session_token ON sessions(session_token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);

-- =====================================================
-- 10. VERIFICATION TOKENS (for email verification)
-- =====================================================
CREATE TABLE verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update route_tracking counts
CREATE OR REPLACE FUNCTION update_route_tracking()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update route tracking
  INSERT INTO route_tracking (origin, destination, active_alert_count, total_alert_count)
  VALUES (
    NEW.origin,
    NEW.destination,
    (SELECT COUNT(*) FROM price_alerts WHERE origin = NEW.origin AND destination = NEW.destination AND is_active = TRUE),
    (SELECT COUNT(*) FROM price_alerts WHERE origin = NEW.origin AND destination = NEW.destination)
  )
  ON CONFLICT (origin, destination)
  DO UPDATE SET
    active_alert_count = (SELECT COUNT(*) FROM price_alerts WHERE origin = NEW.origin AND destination = NEW.destination AND is_active = TRUE),
    total_alert_count = (SELECT COUNT(*) FROM price_alerts WHERE origin = NEW.origin AND destination = NEW.destination),
    last_updated = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update route_tracking when alerts are created/updated/deleted
CREATE TRIGGER trigger_update_route_tracking_insert
AFTER INSERT ON price_alerts
FOR EACH ROW
EXECUTE FUNCTION update_route_tracking();

CREATE TRIGGER trigger_update_route_tracking_update
AFTER UPDATE ON price_alerts
FOR EACH ROW
EXECUTE FUNCTION update_route_tracking();

CREATE TRIGGER trigger_update_route_tracking_delete
AFTER DELETE ON price_alerts
FOR EACH ROW
EXECUTE FUNCTION update_route_tracking();

-- Function to update user statistics
CREATE OR REPLACE FUNCTION update_user_statistics(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_statistics (
    user_id,
    total_alerts_created,
    active_alerts_count,
    total_trips_saved,
    total_destinations_revealed,
    last_calculated
  )
  VALUES (
    p_user_id,
    (SELECT COUNT(*) FROM price_alerts WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM price_alerts WHERE user_id = p_user_id AND is_active = TRUE),
    (SELECT COUNT(*) FROM saved_trips WHERE user_id = p_user_id),
    0, -- Will be updated when we track destination reveals
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_alerts_created = (SELECT COUNT(*) FROM price_alerts WHERE user_id = p_user_id),
    active_alerts_count = (SELECT COUNT(*) FROM price_alerts WHERE user_id = p_user_id AND is_active = TRUE),
    total_trips_saved = (SELECT COUNT(*) FROM saved_trips WHERE user_id = p_user_id),
    last_calculated = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA (for testing social proof)
-- =====================================================
-- Uncomment to insert sample activity feed data
/*
INSERT INTO activity_feed (activity_type, data) VALUES
  ('alert_created', '{"route": "JFK-LAX", "user_city": "NYC", "user_first_name": "Sarah"}'::jsonb),
  ('deal_found', '{"route": "LAX-BKK", "price": 299, "savings": 201, "destination": "Bangkok"}'::jsonb),
  ('trip_saved', '{"destination": "Lisbon", "country": "Portugal", "budget": 800}'::jsonb),
  ('destination_revealed', '{"destination": "Prague", "country": "Czech Republic"}'::jsonb),
  ('alert_created', '{"route": "ORD-CDG", "user_city": "Chicago", "user_first_name": "Michael"}'::jsonb);
*/

-- =====================================================
-- NOTES FOR IMPLEMENTATION
-- =====================================================
-- 1. After creating users, run the backfill query to link existing alerts
-- 2. Use the update_user_statistics() function whenever user actions happen
-- 3. Activity feed should be populated by API endpoints (not triggers for performance)
-- 4. Route tracking is automatically maintained by triggers
-- 5. For social proof, query activity_feed with ORDER BY created_at DESC LIMIT 10
-- 6. For "X people tracking", query route_tracking.active_alert_count
