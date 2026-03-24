import { NextRequest, NextResponse } from 'next/server'
import { searchFlight } from '@/lib/flight-engine'
import { callAI } from '@/lib/ai'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

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
 * Get price for a route leg using the tiered flight engine (free tier only).
 * Uses searchFlight with maxTier: 1 to avoid burning SerpApi/FlightAPI credits
 * since we're checking many permutations.
 */
async function getLegPrice(
  from: string,
  to: string
): Promise<number | null> {
  try {
    const departDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    const result = await searchFlight({
      origin: from,
      destination: to,
      departDate,
      routeType: 'stopover-leg',
      maxTier: 1, // free only — checking many permutations
    })
    return result.price
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)
  const rl = rateLimit(`flight-search:${clientIp}`, 3, 60 * 1000)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } }
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

  try {
    // Build a price cache for all possible legs
    // For N destinations, we need prices for:
    // origin -> each dest, each dest -> each other dest, last dest -> origin
    const allCodes = [origin, ...destinations]
    const priceCache = new Map<string, number | null>()

    // Fetch all possible leg prices in parallel using the tiered engine (free tier only)
    const priceFetches: Promise<void>[] = []
    for (const from of allCodes) {
      for (const to of allCodes) {
        if (from === to) continue
        const key = `${from}-${to}`
        if (!priceCache.has(key)) {
          priceFetches.push(
            getLegPrice(from, to).then(price => {
              priceCache.set(key, price)
            })
          )
        }
      }
    }

    await Promise.all(priceFetches)

    // Evaluate each permutation of destinations
    const allPermutations = permutations(destinations)
    let perms = allPermutations

    // For 4+ cities, use AI to narrow permutations instead of brute-forcing all N!
    if (destinations.length >= 4) {
      try {
        const aiPrompt = `Given these cities to visit on a trip starting and ending at ${origin}:
${destinations.join(', ')}

Suggest the 3 most logical route orders considering geography and typical flight paths.
Respond with JSON array of 3 arrays, e.g.: [["BKK","HAN","SGN"],["SGN","HAN","BKK"],["HAN","BKK","SGN"]]
Only the JSON, nothing else.`

        const aiResponse = await callAI('Route optimizer. Respond with JSON only.', aiPrompt, 0.3, 200)
        const suggestedRoutes = JSON.parse(aiResponse.content.trim())
        if (Array.isArray(suggestedRoutes) && suggestedRoutes.length > 0) {
          // Only check AI-suggested permutations instead of all N!
          perms = suggestedRoutes
          console.log(`[Multi-city] AI narrowed ${allPermutations.length} permutations to ${perms.length}`)
        }
      } catch {
        // AI failed, use all permutations
      }
    }

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
      totalPermutations: allPermutations.length,
    })
  } catch (error) {
    console.error('[Budget Optimizer] Error:', error)
    return NextResponse.json(
      { error: 'Route optimization failed. Please try again.' },
      { status: 502 }
    )
  }
}
