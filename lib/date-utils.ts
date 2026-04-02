/**
 * Date utilities for flight search — centralizes date computation
 * that was previously scattered across multiple route files.
 */

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
    const start = new Date(range.dateFrom)
    const end = new Date(range.dateTo)
    // Sweet spot ~10 days in, with ±3 days of randomness for variety
    const baseOffset = Math.min(10 * 86400000, (end.getTime() - start.getTime()) / 2)
    const jitter = (Math.random() - 0.5) * 6 * 86400000 // ±3 days
    const picked = new Date(Math.max(start.getTime(), Math.min(end.getTime(), start.getTime() + baseOffset + jitter)))
    return picked.toISOString().split('T')[0]
  }

  // Fallback
  return new Date(Date.now() + fallbackDaysOut * 86400000).toISOString().split('T')[0]
}

/**
 * Compute return date from departure + trip duration in days.
 */
export function computeReturnDate(departDate: string, tripDuration: number): string {
  const d = new Date(departDate + 'T00:00:00')
  d.setDate(d.getDate() + tripDuration)
  return d.toISOString().split('T')[0]
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
  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  switch (timeframe) {
    case 'this-month': {
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      if (endOfMonth.getTime() - earliest.getTime() < 3 * 86400000) {
        const endOfNext = new Date(today.getFullYear(), today.getMonth() + 2, 0)
        return { dateFrom: formatDate(earliest), dateTo: formatDate(endOfNext) }
      }
      return { dateFrom: formatDate(earliest), dateTo: formatDate(endOfMonth) }
    }
    case 'next-month': {
      const firstOfNext = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      const endOfNext = new Date(today.getFullYear(), today.getMonth() + 2, 0)
      const startDate = firstOfNext > earliest ? firstOfNext : earliest
      return { dateFrom: formatDate(startDate), dateTo: formatDate(endOfNext) }
    }
    case 'next-3-months': {
      const threeMonths = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate())
      return { dateFrom: formatDate(earliest), dateTo: formatDate(threeMonths) }
    }
    case 'next-6-months': {
      const sixMonths = new Date(today.getFullYear(), today.getMonth() + 6, today.getDate())
      return { dateFrom: formatDate(earliest), dateTo: formatDate(sixMonths) }
    }
    case 'anytime':
    default: {
      const oneYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate())
      return { dateFrom: formatDate(earliest), dateTo: formatDate(oneYear) }
    }
  }
}
