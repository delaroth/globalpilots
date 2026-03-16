import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Rate limiter: 3 requests per minute per IP (compute-heavy)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW = 60_000
const RATE_LIMIT_MAX = 3

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  if (entry.count >= RATE_LIMIT_MAX) return false
  entry.count++
  return true
}

// Clean up stale entries
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }
}, 5 * 60_000)

interface OptimizeRequest {
  origin: string
  destinations: string[]
  totalBudget: number
  tripDays: number
}

interface LegPrice {
  from: string
  to: string
  price: number | null
}

/**
 * Generate all permutations of an array. Max 4 items = 24 permutations.
 */
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr]
  const result: T[][] = []
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]
    for (const perm of permutations(rest)) {
      result.push([arr[i], ...perm])
    }
  }
  return result
}

/**
 * Fetch a TravelPayouts latest price for a route (free, no SerpApi).
 */
async function getTravelPayoutsPrice(
  from: string,
  to: string,
  token: string
): Promise<number | null> {
  try {
    const url = `https://api.travelpayouts.com/v2/prices/latest?origin=${from}&destination=${to}&currency=usd&token=${token}&limit=1`
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.success || !data.data || data.data.length === 0) return null
    return data.data[0].value
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown'

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Budget optimizer is limited to 3 requests per minute.' },
      { status: 429 }
    )
  }

  let body: OptimizeRequest
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { origin, destinations, totalBudget, tripDays } = body

  if (!origin || !/^[A-Z]{3}$/.test(origin)) {
    return NextResponse.json({ error: 'origin must be a 3-letter IATA code' }, { status: 400 })
  }

  if (!destinations || !Array.isArray(destinations) || destinations.length < 2 || destinations.length > 4) {
    return NextResponse.json({ error: 'Provide 2-4 destinations' }, { status: 400 })
  }

  for (const dest of destinations) {
    if (!/^[A-Z]{3}$/.test(dest)) {
      return NextResponse.json({ error: `Invalid destination code: ${dest}` }, { status: 400 })
    }
  }

  if (!totalBudget || totalBudget <= 0) {
    return NextResponse.json({ error: 'totalBudget must be positive' }, { status: 400 })
  }

  if (!tripDays || tripDays <= 0) {
    return NextResponse.json({ error: 'tripDays must be positive' }, { status: 400 })
  }

  const token = process.env.TRAVELPAYOUTS_TOKEN
  if (!token) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  try {
    // Build a price cache for all possible legs
    // For N destinations, we need prices for:
    // origin -> each dest, each dest -> each other dest, last dest -> origin
    const allCodes = [origin, ...destinations]
    const priceCache = new Map<string, number | null>()

    // Fetch all possible leg prices in parallel
    const priceFetches: Promise<void>[] = []
    for (const from of allCodes) {
      for (const to of allCodes) {
        if (from === to) continue
        const key = `${from}-${to}`
        if (!priceCache.has(key)) {
          priceFetches.push(
            getTravelPayoutsPrice(from, to, token).then(price => {
              priceCache.set(key, price)
            })
          )
        }
      }
    }

    await Promise.all(priceFetches)

    // Evaluate each permutation of destinations
    const perms = permutations(destinations)
    let bestRoute: string[] | null = null
    let bestCost = Infinity
    let bestLegs: LegPrice[] = []
    let worstCost = 0

    for (const perm of perms) {
      // Build full route: origin -> perm[0] -> perm[1] -> ... -> perm[N-1] -> origin
      const route = [origin, ...perm, origin]
      let totalCost = 0
      let valid = true
      const legs: LegPrice[] = []

      for (let i = 0; i < route.length - 1; i++) {
        const from = route[i]
        const to = route[i + 1]
        const key = `${from}-${to}`
        const price = priceCache.get(key) ?? null

        legs.push({ from, to, price })

        if (price == null) {
          valid = false
          break
        }
        totalCost += price
      }

      if (!valid) continue

      if (totalCost > worstCost) worstCost = totalCost
      if (totalCost < bestCost) {
        bestCost = totalCost
        bestRoute = perm
        bestLegs = legs
      }
    }

    if (!bestRoute) {
      return NextResponse.json({
        success: false,
        message: 'Could not find prices for enough route combinations. Try different destinations.',
      })
    }

    const savings = worstCost - bestCost

    // Auto-distribute days across cities
    const daysPerCity = Math.floor(tripDays / destinations.length)
    const extraDays = tripDays % destinations.length
    const cityDays = bestRoute.map((_, i) =>
      daysPerCity + (i < extraDays ? 1 : 0)
    )

    return NextResponse.json({
      success: true,
      bestRoute,
      totalCost: bestCost,
      legs: bestLegs,
      savings,
      withinBudget: bestCost <= totalBudget,
      cityDays,
      permutationsChecked: perms.length,
    })
  } catch (error) {
    console.error('[Budget Optimizer] Error:', error)
    return NextResponse.json(
      { error: 'Route optimization failed. Please try again.' },
      { status: 502 }
    )
  }
}
