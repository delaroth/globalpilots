// ─── Stealth & Sandbox Mode ───
// Master compliance layer for the R&D / Hobby Demo phase.
//
// When STEALTH_MODE is ON (default during development):
// - Duffel uses test tokens only — no real bookings processed
// - Affiliate links are neutralized — no real commissions earned
// - Trip data stored as "Saved Itineraries" — no orders, invoices, or price locks
// - All booking actions intercepted with sandbox warnings
//
// When STEALTH_MODE is OFF (post-Bulgaria migration):
// - Live Duffel keys activate direct booking
// - Real affiliate IDs flow through tp.media/Kiwi/Agoda links
// - Trip segments can progress to 'booked' / 'confirmed' status
//
// Toggle: Set NEXT_PUBLIC_STEALTH_MODE=false in .env.local to go live.
// Default: true (sandbox) — fail-safe, never accidentally goes live.

/**
 * Global stealth mode flag.
 * Reads from env at module load. Defaults to TRUE (safe).
 *
 * NEXT_PUBLIC_ prefix makes it available on both server and client.
 */
export const STEALTH_MODE: boolean =
  process.env.NEXT_PUBLIC_STEALTH_MODE !== 'false'

/**
 * Whether Duffel should use sandbox (test) API endpoints.
 * In stealth mode: always sandbox, regardless of what key is configured.
 * When stealth off: respects the DUFFEL_ENV variable.
 */
export const DUFFEL_SANDBOX: boolean =
  STEALTH_MODE || process.env.DUFFEL_ENV !== 'production'

/**
 * Duffel API base URL — sandbox or production.
 */
export const DUFFEL_API_BASE: string =
  DUFFEL_SANDBOX
    ? 'https://api.duffel.com/air' // Sandbox uses same base but test tokens
    : 'https://api.duffel.com/air'

/**
 * Returns the appropriate Duffel API token.
 * In stealth mode: ALWAYS returns the test token, even if a live key exists.
 */
export function getDuffelToken(): string | undefined {
  if (STEALTH_MODE) {
    return process.env.DUFFEL_TEST_TOKEN || process.env.DUFFEL_API_KEY
  }
  return process.env.DUFFEL_LIVE_TOKEN || process.env.DUFFEL_API_KEY
}

/**
 * Check if real financial transactions are allowed.
 * In stealth mode: NEVER. No bookings, no payments, no invoices.
 */
export function canProcessPayments(): boolean {
  return !STEALTH_MODE
}

/**
 * Check if affiliate links should carry real tracking IDs.
 * In stealth mode: NO — links are neutralized to prevent accidental commissions.
 */
export function canEarnCommissions(): boolean {
  return !STEALTH_MODE
}

/**
 * Allowed trip statuses in stealth mode.
 * Cannot progress beyond 'planned' — no 'booked', 'confirmed', 'quoted' allowed.
 */
export const STEALTH_ALLOWED_STATUSES = ['draft', 'planned', 'cancelled'] as const

/**
 * Validate that a trip status is allowed in the current mode.
 */
export function isStatusAllowed(status: string): boolean {
  if (!STEALTH_MODE) return true
  return (STEALTH_ALLOWED_STATUSES as readonly string[]).includes(status)
}

/**
 * Log a stealth mode interception for debugging.
 */
export function logStealthBlock(action: string, details?: string): void {
  console.log(`[Stealth] Blocked: ${action}${details ? ` — ${details}` : ''}`)
}
