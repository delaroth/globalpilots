/**
 * Date utilities for flight search — centralizes date computation
 * that was previously scattered across multiple route files.
 *
 * IMPORTANT: Never use toISOString().split('T')[0] for date formatting —
 * it converts to UTC which shifts dates backward for users in UTC+ timezones.
 * Always use localDateStr() instead.
 */

/** Format a Date as YYYY-MM-DD using local timezone (not UTC). */
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Given a raw dates string from the mystery planner, compute a concrete
 * departure date for API calls.
 *
 * Handles: "2026-04-02", "2026-04-02 (flexible...)", "flexible:this-month", etc.
 */
export function pickDepartureDate(dates: string, fallbackDaysOut: number = 14): string {
  // Specific date: "2026-04-02" or "2026-04-02 (flexible...)"
  const dateMatch = dates.match(/^(\d{4}-\d{2}-\d{2})/)
  if (dateMatch) return dateMatch[1]

  // Flexible timeframe: "flexible:this-month", "flexible:next-month", etc.
  if (dates.startsWith('flexible:')) {
    const timeframe = dates.replace('flexible:', '').split(' ')[0]
    const range = calculateFlexibleDateRange(timeframe)
    const start = new Date(range.dateFrom + 'T00:00:00')
    const end = new Date(range.dateTo + 'T00:00:00')
    // Sweet spot ~10 days in, with ±3 days of randomness for variety
    const baseOffset = Math.min(10 * 86400000, (end.getTime() - start.getTime()) / 2)
    const jitter = (Math.random() - 0.5) * 6 * 86400000 // ±3 days
    const picked = new Date(Math.max(start.getTime(), Math.min(end.getTime(), start.getTime() + baseOffset + jitter)))
    return localDateStr(picked)
  }

  // Fallback
  const d = new Date()
  d.setDate(d.getDate() + fallbackDaysOut)
  return localDateStr(d)
}

/**
 * Compute return date from departure + trip duration in days.
 */
export function computeReturnDate(departDate: string, tripDuration: number): string {
  const d = new Date(departDate + 'T00:00:00')
  d.setDate(d.getDate() + tripDuration)
  return localDateStr(d)
}

/**
 * Calculate a date range from a flexible timeframe string.
 * Extracted from quick/route.ts for reuse.
 */
export function calculateFlexibleDateRange(timeframe: string): { dateFrom: string; dateTo: string } {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  // Flights departing within 7 days are often unavailable or expensive
  const earliest = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7)

  switch (timeframe) {
    case 'this-month': {
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      if (endOfMonth.getTime() - earliest.getTime() < 3 * 86400000) {
        const endOfNext = new Date(today.getFullYear(), today.getMonth() + 2, 0)
        return { dateFrom: localDateStr(earliest), dateTo: localDateStr(endOfNext) }
      }
      return { dateFrom: localDateStr(earliest), dateTo: localDateStr(endOfMonth) }
    }
    case 'next-month': {
      const firstOfNext = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      const endOfNext = new Date(today.getFullYear(), today.getMonth() + 2, 0)
      const startDate = firstOfNext > earliest ? firstOfNext : earliest
      return { dateFrom: localDateStr(startDate), dateTo: localDateStr(endOfNext) }
    }
    case 'next-3-months': {
      const threeMonths = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())
      return { dateFrom: localDateStr(earliest), dateTo: localDateStr(threeMonths) }
    }
    case 'next-6-months': {
      const sixMonths = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate())
      return { dateFrom: localDateStr(earliest), dateTo: localDateStr(sixMonths) }
    }
    case 'anytime':
    default: {
      const oneYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
      return { dateFrom: localDateStr(earliest), dateTo: localDateStr(oneYear) }
    }
  }
}
