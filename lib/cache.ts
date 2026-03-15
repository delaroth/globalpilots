// In-memory cache for API responses

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number // Time to live in milliseconds
}

const cache = new Map<string, CacheEntry>()

/**
 * Get cached data if it exists and hasn't expired
 */
export function getCached<T>(key: string): T | null {
  const entry = cache.get(key)

  if (!entry) return null

  const now = Date.now()
  if (now - entry.timestamp > entry.ttl) {
    cache.delete(key)
    return null
  }

  return entry.data as T
}

/**
 * Set cache with TTL in milliseconds
 */
export function setCache(key: string, data: any, ttl: number): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  })
}

/**
 * Clear all cache
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * Clear expired entries
 */
export function cleanExpiredCache(): void {
  const now = Date.now()
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key)
    }
  }
}

/**
 * Get cache statistics for admin dashboard
 */
export function getCacheStats(): { totalEntries: number; activeEntries: number; expiredEntries: number } {
  const now = Date.now()
  let active = 0
  let expired = 0
  for (const [, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      expired++
    } else {
      active++
    }
  }
  return { totalEntries: cache.size, activeEntries: active, expiredEntries: expired }
}

// Clean expired cache every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanExpiredCache, 10 * 60 * 1000)
}
