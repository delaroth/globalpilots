// Static timezone lookup for IATA airport codes
// Uses the airport-coordinates data file — no API call needed
// Returns null if the airport is not in our database

import { getTimezone as getAirportTimezone } from '@/data/airport-coordinates'

export interface TimezoneInfo {
  timezone: string
  utcOffset: string
  currentTime: string
}

/**
 * Get timezone info for an IATA airport code.
 * Purely static — uses the airport-coordinates data file.
 * Returns null if the airport is unknown.
 */
export function fetchTimezone(iata: string): TimezoneInfo | null {
  const tz = getAirportTimezone(iata)
  if (!tz) return null

  try {
    // Compute current time in the destination timezone
    const now = new Date()

    // Format current time in destination timezone
    const currentTime = now.toLocaleString('en-US', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      weekday: 'short',
    })

    // Compute UTC offset
    // We create a date formatter that includes the timezone offset
    const offsetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    })
    const parts = offsetFormatter.formatToParts(now)
    const offsetPart = parts.find((p) => p.type === 'timeZoneName')
    const utcOffset = offsetPart?.value || 'UTC'

    return {
      timezone: tz,
      utcOffset,
      currentTime,
    }
  } catch {
    // If Intl fails for some reason, still return the timezone name
    return {
      timezone: tz,
      utcOffset: 'UTC',
      currentTime: '',
    }
  }
}
