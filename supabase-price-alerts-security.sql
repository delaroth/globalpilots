-- Price alerts security hardening (Oct 2026)
-- Run in the Supabase SQL Editor, in two steps.

-- =====================================================================
-- PART 1 — run BEFORE deploying the double opt-in code
-- =====================================================================

-- Double opt-in: NULL = waiting for the owner to click the confirmation email.
ALTER TABLE price_alerts ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMP WITH TIME ZONE;

-- Grandfather alerts created before double opt-in existed.
UPDATE price_alerts SET confirmed_at = created_at WHERE confirmed_at IS NULL;

-- Signed alert tokens are issued per lowercased email; make stored emails match.
UPDATE price_alerts SET email = lower(trim(email)) WHERE email <> lower(trim(email));

-- =====================================================================
-- PART 2 — superseded: after deploying, run supabase-security-lockdown.sql,
-- which removes the public price_alerts policies along with every other
-- table's and re-runs the confirmed_at backfill.
-- =====================================================================
