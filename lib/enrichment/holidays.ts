// Fetches public holidays from Nager.Date API (free, no key)
// https://date.nager.at/api/v3/PublicHolidays/{year}/{countryCode}

export interface Holiday {
  date: string
  name: string
  localName: string
}

/**
 * Get public holidays that fall within a trip date range.
 * Returns only holidays between startDate and endDate (inclusive).
 * Returns empty array if the API fails or no holidays match.
 *
 * @param countryCode - ISO 3166-1 alpha-2 code (e.g. 'TH', 'JP')
 * @param startDate - Trip start date in YYYY-MM-DD format
 * @param endDate - Trip end date in YYYY-MM-DD format
 */
export async function getHolidaysDuringTrip(
  countryCode: string,
  startDate: string,
  endDate: string
): Promise<Holiday[]> {
  const code = countryCode.toUpperCase().trim()

  // Parse years from the date range — we may need to fetch two years
  // if the trip spans a year boundary
  const startYear = parseInt(startDate.substring(0, 4), 10)
  const endYear = parseInt(endDate.substring(0, 4), 10)

  if (isNaN(startYear) || isNaN(endYear)) return []

  const years = [startYear]
  if (endYear > startYear) years.push(endYear)

  // Fetch holidays for each year in parallel
  const allHolidays: NagerHoliday[] = []

  const results = await Promise.allSettled(
    years.map((year) => fetchYearHolidays(code, year))
  )

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      allHolidays.push(...result.value)
    }
  }

  // Filter to only holidays within the trip date range
  const start = startDate
  const end = endDate

  return allHolidays
    .filter((h) => h.date >= start && h.date <= end)
    .map((h) => ({
      date: h.date,
      name: h.name,
      localName: h.localName || h.name,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

async function fetchYearHolidays(
  countryCode: string,
  year: number
): Promise<NagerHoliday[] | null> {
  const url = `https://date.nager.at/api/v3/PublicHolidays/${year}/${countryCode}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null

    const data = await res.json()
    if (!Array.isArray(data)) return null

    return data as NagerHoliday[]
  } catch {
    return null
  } finally {
    clearTimeout(timeout)
  }
}

// Nager.Date API response type (minimal)
interface NagerHoliday {
  date: string
  localName: string
  name: string
  countryCode: string
  fixed: boolean
  global: boolean
  types: string[]
}
