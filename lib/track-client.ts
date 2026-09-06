/**
 * Client-side tracking helpers.
 *
 * Sends events to:
 * 1. Supabase (POST /api/analytics/event) — custom admin dashboard
 * 2. Vercel Analytics (track()) — Vercel Analytics dashboard custom events
 * 3. PostHog — consented product analytics and session replay
 *
 * Both are fire-and-forget and never block the UI.
 */

import { track as vercelTrack } from '@vercel/analytics'
import { capturePostHog } from '@/lib/posthog-client'
import { getAnalyticsConsent } from '@/lib/analytics-consent'

// ── Internal (founder) traffic detection ─────────────────────────────────────
// Browsers that have authenticated to /admin get a persistent gp_internal flag.
// Their events are tagged internal:true (excluded from admin analytics via the
// user_events_public view) and skipped entirely for Vercel Analytics.

export function isInternalUser(): boolean {
  try {
    return localStorage.getItem('gp_internal') === '1'
  } catch {
    return false
  }
}

// ── Supabase helpers (existing) ──────────────────────────────────────────────

function fireSupabase(type: string, data: Record<string, any>) {
  if (getAnalyticsConsent() !== 'analytics') return
  const payload = isInternalUser() ? { ...data, internal: true } : data
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data: payload }),
  }).catch(() => {})
}

function fireVercel(name: string, props?: Record<string, any>) {
  if (isInternalUser()) return
  vercelTrack(name, props)
}

function firePostHog(name: string, props?: Record<string, any>) {
  if (isInternalUser()) return
  capturePostHog(name, props)
}

// ── General tracking ─────────────────────────────────────────────────────────

export function trackClick(category: string, label: string) {
  fireSupabase('nav_click', { category, label })
  fireVercel('nav_click', { category, label })
  firePostHog('nav_click', { category, label })
}

export function trackInteraction(element: string, action: string, value?: string) {
  fireSupabase('ui_interaction', { element, action, value })
  fireVercel('ui_interaction', { element, action, value: value ?? '' })
  firePostHog('ui_interaction', { element, action, value: value ?? '' })
}

export function trackConversion(type: string, data?: Record<string, any>) {
  fireSupabase('conversion', { conversion_type: type, ...data })
  fireVercel('conversion', { type, ...data })
  firePostHog('conversion', { type, ...data })
}

// ── Feature-specific tracking (Vercel Analytics dashboard) ───────────────────

export function trackFeature(feature: string, props?: Record<string, string | number | boolean>) {
  fireSupabase('feature_use', { feature, ...props })
  fireVercel(feature, props)
  firePostHog(feature, props)
}

export function trackMysterySearch(props: { origin: string; budget: number; vibes: string; tripDuration: number }) {
  fireVercel('mystery_search', props)
  fireSupabase('feature_use', { feature: 'mystery_search', ...props })
  firePostHog('mystery_search', props)
}

export function trackFlightSearch(props: { origin: string; destination: string; tripType: string }) {
  fireVercel('flight_search', props)
  fireSupabase('feature_use', { feature: 'flight_search', ...props })
  firePostHog('flight_search', props)
}

export function trackHotelClick(props: { hotel: string; destination: string; pricePerNight: number }) {
  fireVercel('hotel_click', props)
  fireSupabase('feature_use', { feature: 'hotel_click', ...props })
  firePostHog('hotel_click', props)
}

export function trackBookingClick(props: { type: string; destination: string }) {
  fireVercel('booking_click', props)
  fireSupabase('feature_use', { feature: 'booking_click', ...props })
  firePostHog('booking_click', props)
}
