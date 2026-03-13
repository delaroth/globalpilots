/**
 * Simple in-memory rate limiter using sliding window.
 * Default: 30 requests per minute per identifier (typically IP).
 *
 * Note: This is per-process. In a serverless environment each cold start
 * gets its own window, which is acceptable for cost-protection on AI routes.
 */

interface WindowEntry {
  timestamps: number[]
}

const windows = new Map<string, WindowEntry>()

// Cleanup stale entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  const cutoff = now - windowMs * 2
  for (const [key, entry] of windows.entries()) {
    if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < cutoff) {
      windows.delete(key)
    }
  }
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  limit: number
  resetMs: number
}

/**
 * Check and consume a rate limit token for the given identifier.
 *
 * @param identifier - Unique key, typically the client IP address
 * @param limit - Max requests allowed in the window (default: 30)
 * @param windowMs - Window size in milliseconds (default: 60000 = 1 minute)
 * @returns { success, remaining, limit, resetMs }
 */
export function rateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs

  cleanup(windowMs)

  let entry = windows.get(identifier)
  if (!entry) {
    entry = { timestamps: [] }
    windows.set(identifier, entry)
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter(t => t > windowStart)

  if (entry.timestamps.length >= limit) {
    // Rate limited
    const oldestInWindow = entry.timestamps[0]
    const resetMs = oldestInWindow + windowMs - now

    return {
      success: false,
      remaining: 0,
      limit,
      resetMs: Math.max(0, resetMs),
    }
  }

  // Allow the request
  entry.timestamps.push(now)

  return {
    success: true,
    remaining: limit - entry.timestamps.length,
    limit,
    resetMs: windowMs,
  }
}

/**
 * Helper to extract a client identifier from a NextRequest.
 * Uses x-forwarded-for, x-real-ip, or falls back to a generic key.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return 'unknown'
}
