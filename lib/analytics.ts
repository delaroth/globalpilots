/**
 * Lightweight event tracking — logs to Supabase `user_events` table.
 *
 * All functions are fire-and-forget: they never block the response.
 * If Supabase is not configured, events are silently dropped.
 */

import { getSupabase } from '@/lib/supabase'

// ---------------------------------------------------------------------------
// Core tracker
// ---------------------------------------------------------------------------

/**
 * Track an event by inserting into the `user_events` table.
 * Fire-and-forget — does NOT throw or block the caller.
 */
export function trackEvent(
  type: string,
  data?: Record<string, any>,
  opts?: { pageUrl?: string; userId?: string; sessionId?: string },
) {
  try {
    const supabase = getSupabase()
    ;(supabase.from('user_events') as any)
      .insert([
        {
          event_type: type,
          event_data: data ?? {},
          page_url: opts?.pageUrl ?? null,
          user_id: opts?.userId ?? null,
          session_id: opts?.sessionId ?? null,
        },
      ])
      .then(() => {
        // success — nothing to do
      })
      .catch((err: unknown) => {
        console.error('[analytics] trackEvent failed:', err)
      })
  } catch {
    // Supabase not configured — silently skip
  }
}

// ---------------------------------------------------------------------------
// Convenience wrappers
// ---------------------------------------------------------------------------

/** Track a page view. */
export function trackPageView(url: string, userId?: string, sessionId?: string) {
  trackEvent('page_view', { url }, { pageUrl: url, userId, sessionId })
}

/** Track a feature interaction. */
export function trackFeatureUse(feature: string, params?: Record<string, any>) {
  trackEvent('feature_use', { feature, ...params })
}

/** Track a search event with origin, budget, vibes etc. */
export function trackSearch(feature: string, params: Record<string, any>) {
  trackEvent('search', { feature, ...params })
}

// ---------------------------------------------------------------------------
// Enhanced tracking
// ---------------------------------------------------------------------------

/** Track navigation clicks (which nav category/link users click). */
export function trackNavClick(category: string, link: string) {
  trackEvent('nav_click', { category, label: link })
}

/** Track feature engagement (how long users spend on a feature). */
export function trackFeatureEngagement(feature: string, durationMs: number, completed: boolean) {
  trackEvent('feature_engagement', { feature, durationMs, completed })
}

/**
 * Track conversion events (user took a meaningful action).
 * Types: 'mystery_revealed', 'flight_found', 'booking_clicked',
 *        'trip_saved', 'account_created', 'alert_created'
 */
export function trackConversion(type: string, data?: Record<string, any>) {
  trackEvent('conversion', { conversion_type: type, ...data })
}

/** Track UI interactions (button clicks, tab switches, filter changes). */
export function trackUIInteraction(element: string, action: string, value?: string) {
  trackEvent('ui_interaction', { element, action, value })
}
