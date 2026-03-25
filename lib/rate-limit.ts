/**
 * Rate limiter with Upstash Redis persistence (optional).
 *
 * When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set,
 * uses distributed Redis-backed rate limiting that survives deploys
 * and works across all serverless instances.
 *
 * Falls back to in-memory sliding window when Redis is not configured.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ---------------------------------------------------------------------------
// Redis rate limiter (persistent, distributed)
// ---------------------------------------------------------------------------

let redisRatelimiters: Map<string, Ratelimit> | null = null

function getRedisLimiter(limit: number, windowMs: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  // Cache limiters by config to avoid re-creating
  const key = `${limit}:${windowMs}`
  if (!redisRatelimiters) redisRatelimiters = new Map()

  let limiter = redisRatelimiters.get(key)
  if (!limiter) {
    const redis = new Redis({ url, token })
    const windowSec = Math.ceil(windowMs / 1000)
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      analytics: false, // disable to save Redis calls
      prefix: 'gp_rl',
    })
    redisRatelimiters.set(key, limiter)
  }

  return limiter
}

// ---------------------------------------------------------------------------
// In-memory fallback (per-process, resets on cold start)
// ---------------------------------------------------------------------------

interface WindowEntry {
  timestamps: number[]
}

const windows = new Map<string, WindowEntry>()
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

function inMemoryRateLimit(identifier: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const windowStart = now - windowMs

  cleanup(windowMs)

  let entry = windows.get(identifier)
  if (!entry) {
    entry = { timestamps: [] }
    windows.set(identifier, entry)
  }

  entry.timestamps = entry.timestamps.filter(t => t > windowStart)

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0]
    const resetMs = oldestInWindow + windowMs - now
    return { success: false, remaining: 0, limit, resetMs: Math.max(0, resetMs) }
  }

  entry.timestamps.push(now)
  return { success: true, remaining: limit - entry.timestamps.length, limit, resetMs: windowMs }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  success: boolean
  remaining: number
  limit: number
  resetMs: number
}

/**
 * Check and consume a rate limit token.
 * Uses Redis when available, in-memory fallback otherwise.
 */
export function rateLimit(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const redisLimiter = getRedisLimiter(limit, windowMs)

  if (redisLimiter) {
    // Redis path: fire-and-forget async check.
    // We use the sync in-memory limiter as the source of truth for THIS request
    // and let Redis track globally in the background.
    // This avoids making the request await Redis latency.
    redisLimiter.limit(identifier).catch(() => {
      // Redis failed — in-memory is still protecting us
    })
  }

  return inMemoryRateLimit(identifier, limit, windowMs)
}

/**
 * Async rate limit check — uses Redis when available for distributed accuracy.
 * Use this for expensive operations (AI calls) where distributed protection matters.
 */
export async function rateLimitAsync(
  identifier: string,
  limit: number = 30,
  windowMs: number = 60 * 1000
): Promise<RateLimitResult> {
  const redisLimiter = getRedisLimiter(limit, windowMs)

  if (redisLimiter) {
    try {
      const result = await redisLimiter.limit(identifier)
      return {
        success: result.success,
        remaining: result.remaining,
        limit: result.limit,
        resetMs: result.reset - Date.now(),
      }
    } catch {
      // Redis failed — fall back to in-memory
    }
  }

  return inMemoryRateLimit(identifier, limit, windowMs)
}

/**
 * Extract client IP from request headers.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}
