// Fetches exchange rates from Frankfurter API (free, no key)
// https://api.frankfurter.dev/v1/latest?base=USD&symbols={currencyCode}
// Cached in-memory for 6 hours

export interface ExchangeRateResult {
  rate: number
  formatted: string
}

// Simple in-memory cache: currency code -> { rate, fetchedAt }
const rateCache = new Map<string, { rate: number; fetchedAt: number }>()
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

/**
 * Get the exchange rate from USD to the given currency code.
 * Returns null if the API fails or the currency is not supported.
 * Results are cached for 6 hours.
 */
export async function getExchangeRate(
  currencyCode: string
): Promise<ExchangeRateResult | null> {
  const code = currencyCode.toUpperCase().trim()

  // USD to USD
  if (code === 'USD') {
    return { rate: 1, formatted: '$1 USD = $1 USD' }
  }

  // Check cache
  const cached = rateCache.get(code)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return formatRate(code, cached.rate)
  }

  const url = `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${code}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null

    const data = await res.json() as FrankfurterResponse
    const rate = data.rates?.[code]
    if (typeof rate !== 'number') return null

    // Update cache
    rateCache.set(code, { rate, fetchedAt: Date.now() })

    return formatRate(code, rate)
  } catch {
    // If we have stale cache data, return it rather than nothing
    if (cached) {
      return formatRate(code, cached.rate)
    }
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function formatRate(code: string, rate: number): ExchangeRateResult {
  // Format the rate nicely based on magnitude
  let formatted: string
  if (rate >= 100) {
    formatted = `$1 USD = ${rate.toFixed(0)} ${code}`
  } else if (rate >= 1) {
    formatted = `$1 USD = ${rate.toFixed(2)} ${code}`
  } else {
    formatted = `$1 USD = ${rate.toFixed(4)} ${code}`
  }

  return { rate, formatted }
}

interface FrankfurterResponse {
  base: string
  date: string
  rates: Record<string, number>
}
