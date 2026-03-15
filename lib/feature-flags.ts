/**
 * Feature flags for GlobePilots.
 *
 * Simple compile-time flags for toggling features on/off.
 * Currently all checks are static — no runtime config needed yet.
 *
 * To enable a feature: flip the flag to `true` and redeploy.
 * To add a new flag: add it to FEATURE_FLAGS and it's automatically typed.
 */

export const FEATURE_FLAGS = {
  // ── Currently enabled (free / low cost) ──────────────────────────────
  priceInsights: true,        // Show price level + typical range from Google Flights
  carbonEmissions: true,      // Show CO2 data on flight results
  airlineLogos: true,         // Show airline logos in search results
  bookingComparison: true,    // Compare booking prices across OTAs (on-demand)
  googleHotels: true,         // Real hotel prices via Google Hotels

  // ── Future features (enable when ready) ──────────────────────────────
  priceTracker: false,        // Daily price monitoring + email alerts
  weekendGetaways: false,     // Weekend trip finder page
  trendingDestinations: false, // Homepage trending section (cron-powered)
  regionalMystery: false,     // Region-locked mystery vacation themes
} as const

export type FeatureFlag = keyof typeof FEATURE_FLAGS

/**
 * Check whether a feature flag is enabled.
 *
 * Usage:
 *   if (isFeatureEnabled('bookingComparison')) { ... }
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag]
}

/**
 * Get all currently enabled feature flags.
 * Useful for analytics or debugging.
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return (Object.keys(FEATURE_FLAGS) as FeatureFlag[]).filter(
    flag => FEATURE_FLAGS[flag]
  )
}

/**
 * Get all feature flags with their current status.
 * Useful for admin/debug panels.
 */
export function getAllFeatureFlags(): Record<FeatureFlag, boolean> {
  return { ...FEATURE_FLAGS }
}
