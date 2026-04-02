/**
 * Client-side tracking helpers.
 *
 * Dual-fires events to:
 * 1. Supabase (POST /api/analytics/event) — custom admin dashboard
 * 2. Vercel Analytics (track()) — Vercel Analytics dashboard custom events
 *
 * Both are fire-and-forget and never block the UI.
 */

import { track as vercelTrack } from '@vercel/analytics'

// ── Supabase helpers (existing) ──────────────────────────────────────────────

function fireSupabase(type: string, data: Record<string, any>) {
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, data }),
  }).catch(() => {})
}

// ── General tracking (dual-fire) ─────────────────────────────────────────────

export function trackClick(category: string, label: string) {
  fireSupabase('nav_click', { category, label })
  vercelTrack('nav_click', { category, label })
}

export function trackInteraction(element: string, action: string, value?: string) {
  fireSupabase('ui_interaction', { element, action, value })
  vercelTrack('ui_interaction', { element, action, value: value ?? '' })
}

export function trackConversion(type: string, data?: Record<string, any>) {
  fireSupabase('conversion', { conversion_type: type, ...data })
  vercelTrack('conversion', { type, ...data })
}

// ── Feature-specific tracking (Vercel Analytics dashboard) ───────────────────

export function trackFeature(feature: string, props?: Record<string, string | number | boolean>) {
  fireSupabase('feature_use', { feature, ...props })
  vercelTrack(feature, props)
}

export function trackMysterySearch(props: { origin: string; budget: number; vibes: string; tripDuration: number }) {
  vercelTrack('mystery_search', props)
  fireSupabase('feature_use', { feature: 'mystery_search', ...props })
}

export function trackFlightSearch(props: { origin: string; destination: string; tripType: string }) {
  vercelTrack('flight_search', props)
  fireSupabase('feature_use', { feature: 'flight_search', ...props })
}

export function trackHotelClick(props: { hotel: string; destination: string; pricePerNight: number }) {
  vercelTrack('hotel_click', props)
  fireSupabase('feature_use', { feature: 'hotel_click', ...props })
}

export function trackBookingClick(props: { type: string; destination: string }) {
  vercelTrack('booking_click', props)
  fireSupabase('feature_use', { feature: 'booking_click', ...props })
}
