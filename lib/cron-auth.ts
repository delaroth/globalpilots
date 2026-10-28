/**
 * Shared-secret checks for cron jobs, internal server-to-server calls and the
 * admin dashboard. Fails closed when the secret env var is unset (otherwise
 * `Bearer undefined` would match), and compares in constant time.
 */

import { timingSafeEqual } from 'crypto'

function safeEqual(given: string, expected: string): boolean {
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

function bearer(request: Request): string {
  const header = request.headers.get('authorization') || ''
  return header.startsWith('Bearer ') ? header.slice(7) : ''
}

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
export function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  return Boolean(secret) && safeEqual(bearer(request), secret!)
}

/** Headers for server-side calls into cron-protected routes. */
export function cronAuthHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${process.env.CRON_SECRET || ''}` }
}

/**
 * Admin dashboard: separate ADMIN_SECRET (so leaking it doesn't also unlock the
 * crons), sent as a Bearer header rather than a query string (which ends up in
 * logs and browser history).
 */
export function isAdminAuthorized(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET
  return Boolean(secret) && safeEqual(bearer(request), secret!)
}
