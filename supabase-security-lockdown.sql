-- Database lockdown (Oct 2026): the public anon key gets NO access to any table.
--
-- Why: the anon key ships in the browser bundle. Old policies (USING (true))
-- and tables without RLS let anyone with it read or rewrite users, password
-- reset tokens, subscriber emails, price history, blog posts, etc.
-- All app DB access now goes through the service role on the server
-- (lib/supabase.ts), and authorization is enforced in the API routes.
--
-- PREREQUISITES — run only when ALL are true:
--   1. SUPABASE_SERVICE_ROLE_KEY is set in Vercel (Production + Preview).
--      Without it getSupabaseAdmin() falls back to the anon client and the
--      whole site (login, alerts, price-history cron) silently returns nothing.
--   2. Part 1 of supabase-price-alerts-security.sql has been run.
--   3. The security-hardening branch is deployed.
-- Run in the Supabase SQL Editor.

BEGIN;

-- Drop every RLS policy in the public schema.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- RLS on for every table; with no policies, only the service role gets through.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- Belt and braces: no table/view privileges for the public roles at all
-- (views such as user_events_public don't go through RLS), now or for
-- tables created later.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

-- Alerts created by the old code between price-alerts Part 1 and the deploy
-- have no confirmed_at yet — grandfather them too.
UPDATE price_alerts SET confirmed_at = created_at WHERE confirmed_at IS NULL AND is_active = TRUE;

COMMIT;

-- Verify: both should return zero rows.
SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public';
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND NOT rowsecurity;
