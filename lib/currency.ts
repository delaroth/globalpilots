/**
 * Multi-currency support powered by Frankfurter API (free, no key required).
 *
 * Strategy:
 * - All APIs internally use USD (SerpApi, TravelPayouts, etc.)
 * - User selects display currency; we convert on display
 * - Budget input in user currency → converted to USD for API calls
 * - 1 bulk Frankfurter call fetches ALL rates, cached 6 hours
 */

// ── Supported currencies ──────────────────────────────────────────────────

export interface CurrencyInfo {
  code: string
  symbol: string
  name: string
  flag: string
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', flag: '🇸🇪' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', flag: '🇳🇴' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', flag: '🇩🇰' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', flag: '🇮🇱' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰' },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', flag: '🇹🇼' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', flag: '🇵🇱' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', flag: '🇨🇿' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', flag: '🇭🇺' },
]

// ── Rate cache (bulk fetch, 6-hour TTL) ───────────────────────────────────

interface RateCache {
  rates: Record<string, number> // USD → X rates
  fetchedAt: number
}

let bulkCache: RateCache | null = null
const CACHE_TTL = 6 * 60 * 60 * 1000 // 6 hours

/**
 * Fetch all exchange rates from USD in a single API call.
 * Cached for 6 hours. Returns null on failure.
 */
export async function fetchAllRates(): Promise<Record<string, number> | null> {
  // Check cache
  if (bulkCache && Date.now() - bulkCache.fetchedAt < CACHE_TTL) {
    return bulkCache.rates
  }

  const symbols = SUPPORTED_CURRENCIES
    .filter(c => c.code !== 'USD')
    .map(c => c.code)
    .join(',')

  try {
    const res = await fetch(
      `https://api.frankfurter.dev/v1/latest?base=USD&symbols=${symbols}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return bulkCache?.rates || null

    const data = await res.json()
    const rates: Record<string, number> = { USD: 1, ...data.rates }

    bulkCache = { rates, fetchedAt: Date.now() }
    return rates
  } catch {
    // Return stale cache on error
    return bulkCache?.rates || null
  }
}

/**
 * Get the exchange rate from USD to a specific currency.
 * Uses the bulk cache (1 API call for all currencies).
 */
export async function getRate(currencyCode: string): Promise<number | null> {
  if (currencyCode === 'USD') return 1
  const rates = await fetchAllRates()
  return rates?.[currencyCode] ?? null
}

// ── Conversion helpers ────────────────────────────────────────────────────

/**
 * Convert an amount from USD to the target currency.
 * Returns the original amount if conversion fails.
 */
export function convertFromUSD(amountUSD: number, rate: number): number {
  return Math.round(amountUSD * rate)
}

/**
 * Convert an amount from the user's currency to USD.
 * Returns the original amount if conversion fails.
 */
export function convertToUSD(amountLocal: number, rate: number): number {
  if (rate === 0) return amountLocal
  return Math.round(amountLocal / rate)
}

/**
 * Format a price with the appropriate currency symbol.
 * Handles large numbers (JPY, KRW, VND, IDR) without decimals.
 */
export function formatPrice(amount: number, currencyCode: string): string {
  const info = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)
  if (!info) return `$${amount}`

  // Currencies with large values — no decimals, use commas
  const noDecimalCurrencies = ['JPY', 'KRW', 'VND', 'IDR', 'HUF', 'CZK']
  const formatted = noDecimalCurrencies.includes(currencyCode)
    ? Math.round(amount).toLocaleString('en-US')
    : amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return `${info.symbol}${formatted}`
}

/**
 * Get currency info by code.
 */
export function getCurrencyInfo(code: string): CurrencyInfo {
  return SUPPORTED_CURRENCIES.find(c => c.code === code) || SUPPORTED_CURRENCIES[0]
}

// ── API route helper ──────────────────────────────────────────────────────

/**
 * For API routes: convert a user-provided budget from their currency to USD.
 * If currency is USD or rate fetch fails, returns the original amount.
 */
export async function budgetToUSD(amount: number, fromCurrency: string): Promise<number> {
  if (fromCurrency === 'USD') return amount
  const rate = await getRate(fromCurrency)
  if (!rate) return amount
  return convertToUSD(amount, rate)
}
