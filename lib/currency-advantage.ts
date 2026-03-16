// Currency advantage detection using Frankfurter API
// Compares current exchange rates vs 6 months ago to find favorable destinations

export interface CurrencyAdvantage {
  destination: string
  country: string
  currency: string
  advantagePercent: number
  currentRate: number
  previousRate: number
}

// Map of destination currencies to their IATA codes and countries
const CURRENCY_DESTINATIONS: Record<string, { destinations: string[]; country: string }> = {
  THB: { destinations: ['BKK', 'CNX', 'HKT'], country: 'Thailand' },
  JPY: { destinations: ['NRT', 'HND', 'KIX', 'FUK'], country: 'Japan' },
  KRW: { destinations: ['ICN'], country: 'South Korea' },
  MYR: { destinations: ['KUL'], country: 'Malaysia' },
  IDR: { destinations: ['CGK', 'DPS'], country: 'Indonesia' },
  VND: { destinations: ['SGN', 'HAN'], country: 'Vietnam' },
  PHP: { destinations: ['MNL', 'CEB'], country: 'Philippines' },
  SGD: { destinations: ['SIN'], country: 'Singapore' },
  TWD: { destinations: ['TPE'], country: 'Taiwan' },
  INR: { destinations: ['DEL', 'BOM'], country: 'India' },
  EUR: { destinations: ['CDG', 'AMS', 'FRA', 'BCN', 'FCO', 'MAD', 'MUC', 'VIE', 'ATH', 'LIS', 'PRG'], country: 'Europe' },
  GBP: { destinations: ['LHR'], country: 'United Kingdom' },
  TRY: { destinations: ['IST'], country: 'Turkey' },
  EGP: { destinations: ['CAI'], country: 'Egypt' },
  MAD: { destinations: ['CMN'], country: 'Morocco' },
  COP: { destinations: ['BOG', 'MDE', 'CTG'], country: 'Colombia' },
  MXN: { destinations: ['MEX', 'CUN'], country: 'Mexico' },
  BRL: { destinations: ['GRU'], country: 'Brazil' },
  ARS: { destinations: ['EZE'], country: 'Argentina' },
  HKD: { destinations: ['HKG'], country: 'Hong Kong' },
  CZK: { destinations: ['PRG'], country: 'Czech Republic' },
  PLN: { destinations: ['WAW', 'KRK'], country: 'Poland' },
  HUF: { destinations: ['BUD'], country: 'Hungary' },
  AED: { destinations: ['DXB'], country: 'UAE' },
  ZAR: { destinations: ['CPT', 'JNB'], country: 'South Africa' },
  PEN: { destinations: ['LIM'], country: 'Peru' },
}

// All target currencies we want to compare
const TARGET_CURRENCIES = Object.keys(CURRENCY_DESTINATIONS)

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}

/**
 * Fetches currency advantages: destinations where homeCurrency gained >5% purchasing power
 * compared to 6 months ago.
 */
export async function getCurrencyAdvantages(
  homeCurrency: string = 'USD'
): Promise<CurrencyAdvantage[]> {
  const now = new Date()
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const todayStr = formatDate(now)
  const pastStr = formatDate(sixMonthsAgo)

  // Filter out homeCurrency from targets
  const symbols = TARGET_CURRENCIES.filter(c => c !== homeCurrency).join(',')

  try {
    // Fetch current and historical rates in parallel
    const [currentRes, historicalRes] = await Promise.all([
      fetch(`https://api.frankfurter.dev/v1/${todayStr}?base=${homeCurrency}&symbols=${symbols}`, {
        next: { revalidate: 3600 }, // Cache 1 hour
      }),
      fetch(`https://api.frankfurter.dev/v1/${pastStr}?base=${homeCurrency}&symbols=${symbols}`, {
        next: { revalidate: 86400 }, // Cache 1 day (historical doesn't change)
      }),
    ])

    if (!currentRes.ok || !historicalRes.ok) {
      console.error('[CurrencyAdvantage] API error:', currentRes.status, historicalRes.status)
      return []
    }

    const currentData = await currentRes.json()
    const historicalData = await historicalRes.json()

    const currentRates = currentData.rates || {}
    const historicalRates = historicalData.rates || {}

    const advantages: CurrencyAdvantage[] = []

    for (const currency of Object.keys(currentRates)) {
      const currentRate = currentRates[currency]
      const previousRate = historicalRates[currency]

      if (!currentRate || !previousRate) continue

      // If current rate is higher, your home currency buys more of the foreign currency now
      // advantagePercent > 0 means your money goes further
      const advantagePercent = ((currentRate - previousRate) / previousRate) * 100

      if (advantagePercent > 5) {
        const info = CURRENCY_DESTINATIONS[currency]
        if (info) {
          for (const dest of info.destinations) {
            advantages.push({
              destination: dest,
              country: info.country,
              currency,
              advantagePercent: Math.round(advantagePercent * 10) / 10,
              currentRate,
              previousRate,
            })
          }
        }
      }
    }

    // Sort by biggest advantage first
    return advantages.sort((a, b) => b.advantagePercent - a.advantagePercent)
  } catch (err) {
    console.error('[CurrencyAdvantage] Failed to fetch rates:', err)
    return []
  }
}

/**
 * Check if a specific destination has a currency advantage for the given home currency
 */
export function getCurrencyForDestination(iata: string): string | undefined {
  for (const [currency, info] of Object.entries(CURRENCY_DESTINATIONS)) {
    if (info.destinations.includes(iata.toUpperCase())) {
      return currency
    }
  }
  return undefined
}
