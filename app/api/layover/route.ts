import { NextRequest, NextResponse } from 'next/server'
import { majorHubs } from '@/lib/hubs'
import { searchKiwiMultiCity, isKiwiAvailable } from '@/lib/kiwi'
import { getCheapestRoutePrice } from '@/lib/flight-providers'
import { findCheapestDestinations, getRouteFlights, dateToMonth } from '@/lib/flight-providers/serpapi-explore'
import type { ExploreDestination } from '@/lib/flight-providers/serpapi-explore'
import { getSearchTier } from '@/lib/flight-intelligence'
import type { SearchTier } from '@/lib/flight-intelligence'
import { calculateSideQuestValue, type SideQuestCandidate } from '@/lib/flight-intelligence/side-quest'
import type { BudgetTier } from '@/lib/destination-costs'

export const dynamic = 'force-dynamic'

interface HubRoute {
  hub: string
  hubCity: string
  leg1Price: number
  leg2Price: number
  totalPrice: number
  savings: number | null
  savingsPercent: number | null
}

// Dynamic hub selection based on destination region
function getHubsByRegion(destination: string): string[] {
  // Middle East destinations
  const middleEastAirports = ['TLV', 'AMM', 'CAI', 'BEY', 'BAH', 'KWI', 'MCT']
  // European destinations
  const europeanAirports = ['LHR', 'CDG', 'AMS', 'FRA', 'MAD', 'BCN', 'FCO', 'MXP', 'MUC', 'VIE', 'ZRH', 'CPH', 'OSL', 'ARN', 'BRU', 'DUB', 'LIS', 'ATH', 'PRG', 'WAW']
  // Asian destinations
  const asianAirports = ['BKK', 'SIN', 'KUL', 'HKG', 'NRT', 'ICN', 'PVG', 'PEK', 'DEL', 'BOM', 'CGK', 'MNL', 'HAN', 'SGN', 'TPE']
  // American destinations (North/South America)
  const americanAirports = ['JFK', 'LAX', 'ORD', 'DFW', 'ATL', 'MIA', 'SFO', 'SEA', 'BOS', 'DEN', 'LAS', 'YYZ', 'YVR', 'MEX', 'GRU', 'EZE', 'BOG', 'LIM', 'SCL']

  if (middleEastAirports.includes(destination)) {
    return ['DXB', 'DOH', 'IST', 'CAI', 'AUH']
  } else if (europeanAirports.includes(destination)) {
    return ['LHR', 'CDG', 'AMS', 'FRA', 'IST', 'MUC']
  } else if (asianAirports.includes(destination)) {
    return ['SIN', 'HKG', 'NRT', 'ICN', 'BKK', 'KUL']
  } else if (americanAirports.includes(destination)) {
    return ['LHR', 'CDG', 'FRA', 'AMS', 'IST', 'DXB']
  } else {
    // Default: use top global hubs
    return ['SIN', 'DXB', 'IST', 'DOH', 'LHR', 'CDG', 'AMS', 'FRA', 'HKG', 'NRT']
  }
}

/**
 * Shared multi-provider route lookup used by both browse and live tiers.
 * Fetches direct price + hub route prices via the getCheapestRoutePrice chain
 * (Kiwi single-route → Amadeus → TravelPayouts).
 */
async function fetchMultiProviderRoutes(origin: string, destination: string, searchDate: string) {
  // Fetch direct route price via the provider chain
  const directResult = await getCheapestRoutePrice(origin, destination, searchDate)
  const directPrice = directResult.price
  console.log(`[Layover API] Direct price: $${directPrice ?? 'N/A'} (via ${directResult.provider})`)

  // Get hubs dynamically based on destination region
  const hubCodes = getHubsByRegion(destination)
  const hubsToCheck = majorHubs.filter(h => hubCodes.includes(h.code))
  console.log('[Layover API] Checking hubs:', hubsToCheck.map(h => h.city).join(', '))

  const hubRoutes: HubRoute[] = []

  // Fetch all hub routes in parallel via the provider chain
  const hubPromises = hubsToCheck.map(async (hub) => {
    try {
      if (hub.code === origin || hub.code === destination) return null

      const [leg1Result, leg2Result] = await Promise.all([
        getCheapestRoutePrice(origin, hub.code, searchDate),
        getCheapestRoutePrice(hub.code, destination, searchDate),
      ])

      const leg1Price = leg1Result.price
      const leg2Price = leg2Result.price

      if (leg1Price === null || leg2Price === null) return null

      const totalPrice = leg1Price + leg2Price
      const savings = directPrice !== null ? directPrice - totalPrice : null
      const savingsPercent = directPrice !== null && savings !== null ? Math.round((savings / directPrice) * 100) : null

      console.log(`[Layover API] ${hub.city}: $${leg1Price} + $${leg2Price} = $${totalPrice}${savings !== null ? ` (savings: $${savings})` : ''}`)

      return {
        hub: hub.code,
        hubCity: hub.city,
        leg1Price,
        leg2Price,
        totalPrice,
        savings,
        savingsPercent,
      }
    } catch (error) {
      console.error(`[Layover API] Error checking hub ${hub.city}:`, error)
      return null
    }
  })

  const hubResults = await Promise.all(hubPromises)

  hubResults.forEach((result) => {
    if (result) hubRoutes.push(result)
  })

  // Sort by total price (cheapest first) if no direct price, otherwise by savings
  if (directPrice !== null) {
    hubRoutes.sort((a, b) => (b.savings || 0) - (a.savings || 0))
  } else {
    hubRoutes.sort((a, b) => a.totalPrice - b.totalPrice)
  }

  // Determine which provider powered the results for the response metadata
  const providerUsed = directResult.provider !== 'none' ? directResult.provider : 'unknown'
  const priceSource = providerUsed === 'SerpApi Google Flights' ? 'serpapi-live'
    : providerUsed === 'Kiwi' ? 'kiwi-live'
    : providerUsed === 'FlightAPI.io' ? 'flightapi-live'
    : providerUsed === 'TravelPayouts' ? 'travelpayouts-cached'
    // Legacy lowercase matching
    : providerUsed === 'kiwi' ? 'kiwi-live'
    : providerUsed === 'flightapi' ? 'flightapi-live'
    : providerUsed === 'travelpayouts' ? 'travelpayouts-cached'
    : 'unknown'

  return { directPrice, hubRoutes, priceSource }
}

/**
 * Browse-tier route lookup using SerpApi Explore for hub discovery.
 *
 * Strategy (4-5 API calls max instead of 13+):
 * 1. findCheapestDestinations(origin) → get all reachable destinations with prices (1 call)
 * 2. getRouteFlights(origin, destination) → direct price baseline (1 call)
 * 3. For top 3 hub candidates that appear in Explore results, we already have origin→hub prices
 * 4. Only call getCheapestRoutePrice() for hub→destination legs of top 3 hubs (up to 3 calls)
 */
async function fetchExploreRoutes(origin: string, destination: string, searchDate: string) {
  const month = dateToMonth(searchDate)

  // Step 1 + 2 in parallel: explore destinations from origin + get direct route price
  const [exploreDests, routeFlights] = await Promise.all([
    findCheapestDestinations({ origin, month }),
    getRouteFlights({ origin, destination, month }),
  ])

  // Direct price: prefer route flights data, fallback to getCheapestRoutePrice
  let directPrice: number | null = null
  let priceSource = 'serpapi-explore'

  if (routeFlights.length > 0) {
    const cheapest = routeFlights.find(f => f.isCheapest) || routeFlights[0]
    directPrice = cheapest.price
    console.log(`[Layover API] [explore] Direct price: $${directPrice} (via SerpApi Explore route)`)
  } else {
    // Fallback: single getCheapestRoutePrice call for direct price
    const directResult = await getCheapestRoutePrice(origin, destination, searchDate)
    directPrice = directResult.price
    priceSource = directResult.provider !== 'none' ? 'serpapi-explore+fallback' : 'serpapi-explore'
    console.log(`[Layover API] [explore] Direct price fallback: $${directPrice ?? 'N/A'} (via ${directResult.provider})`)
  }

  // Step 3: Build a price map from Explore results for origin→hub prices
  const explorePriceMap = new Map<string, ExploreDestination>()
  for (const dest of exploreDests) {
    if (dest.airportCode) {
      explorePriceMap.set(dest.airportCode, dest)
    }
  }

  // Identify hub candidates: hubs that appear in Explore results (we already have origin→hub price)
  const hubCodes = getHubsByRegion(destination)
  const hubCandidates: { code: string; city: string; leg1Price: number }[] = []

  for (const hubCode of hubCodes) {
    if (hubCode === origin || hubCode === destination) continue
    const exploreData = explorePriceMap.get(hubCode)
    if (exploreData && exploreData.flightPrice > 0) {
      const hubInfo = majorHubs.find(h => h.code === hubCode)
      hubCandidates.push({
        code: hubCode,
        city: hubInfo?.city || exploreData.name || hubCode,
        leg1Price: exploreData.flightPrice,
      })
    }
  }

  // Sort by leg1 price (cheapest first), take top 3
  hubCandidates.sort((a, b) => a.leg1Price - b.leg1Price)
  const top3 = hubCandidates.slice(0, 3)

  console.log(`[Layover API] [explore] ${exploreDests.length} explore destinations, ${hubCandidates.length} hub matches, checking top ${top3.length}`)

  // Step 4: Only fetch hub→destination prices for top 3 hubs (up to 3 API calls)
  const hubRoutes: HubRoute[] = []

  if (top3.length > 0) {
    const leg2Promises = top3.map(async (hub) => {
      try {
        const leg2Result = await getCheapestRoutePrice(hub.code, destination, searchDate)
        const leg2Price = leg2Result.price
        if (leg2Price === null) return null

        const totalPrice = hub.leg1Price + leg2Price
        const savings = directPrice !== null ? directPrice - totalPrice : null
        const savingsPercent = directPrice !== null && savings !== null ? Math.round((savings / directPrice) * 100) : null

        console.log(`[Layover API] [explore] ${hub.city}: $${hub.leg1Price} + $${leg2Price} = $${totalPrice}${savings !== null ? ` (savings: $${savings})` : ''}`)

        return {
          hub: hub.code,
          hubCity: hub.city,
          leg1Price: hub.leg1Price,
          leg2Price,
          totalPrice,
          savings,
          savingsPercent,
        }
      } catch (error) {
        console.error(`[Layover API] [explore] Error checking hub ${hub.city}:`, error)
        return null
      }
    })

    const hubResults = await Promise.all(leg2Promises)
    hubResults.forEach((result) => {
      if (result) hubRoutes.push(result)
    })
  }

  // Sort by savings (best first) or total price
  if (directPrice !== null) {
    hubRoutes.sort((a, b) => (b.savings || 0) - (a.savings || 0))
  } else {
    hubRoutes.sort((a, b) => a.totalPrice - b.totalPrice)
  }

  return { directPrice, hubRoutes, priceSource }
}

/**
 * Enrich hub routes with Side Quest value data when direct price is available.
 * Returns routes with optional sideQuest field containing verdict, pitch, costs.
 */
function enrichWithSideQuest(
  hubRoutes: HubRoute[],
  directPrice: number | null,
  budgetTier: BudgetTier,
  layoverDays: number
): (HubRoute & { sideQuest?: SideQuestCandidate })[] {
  if (directPrice === null) return hubRoutes
  return hubRoutes.map(route => {
    const sq = calculateSideQuestValue({
      hub: route.hub,
      hubCity: route.hubCity,
      directPrice,
      leg1Price: route.leg1Price,
      leg2Price: route.leg2Price,
      layoverDays,
      budgetTier,
    })
    return sq ? { ...route, sideQuest: sq } : route
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const departDate = searchParams.get('depart_date')
  const budgetTier = (searchParams.get('budget') || 'mid') as BudgetTier
  const layoverDays = parseInt(searchParams.get('layover_days') || '2', 10)

  const tierParam = searchParams.get('tier') as SearchTier | null
  const tier: SearchTier = tierParam === 'live' ? 'live' : 'browse'
  const tierConfig = getSearchTier(tier)

  console.log('[Layover API] Request:', { origin, destination, departDate, tier, allowedSources: tierConfig.allowedSources })

  if (!origin || !destination) {
    console.error('[Layover API] Missing parameters')
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination' },
      { status: 400 }
    )
  }

  // Validate origin and destination are 3-letter IATA codes
  if (!/^[A-Z]{3}$/.test(origin)) {
    console.error('[Layover API] Invalid origin format:', origin)
    return NextResponse.json(
      { error: 'origin must be a 3-letter IATA airport code (e.g., BKK, JFK, LAX)' },
      { status: 400 }
    )
  }

  if (!/^[A-Z]{3}$/.test(destination)) {
    console.error('[Layover API] Invalid destination format:', destination)
    return NextResponse.json(
      { error: 'destination must be a 3-letter IATA airport code (e.g., BKK, JFK, LAX)' },
      { status: 400 }
    )
  }

  if (origin === destination) {
    return NextResponse.json(
      { error: 'Origin and destination must be different' },
      { status: 400 }
    )
  }

  try {
    const searchDate = departDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

    // ═══════════════════════════════════════════════════════════════════
    // Tier 2 (Live) — full Kiwi multi-city → multi-provider fallback
    // Triggered explicitly by user action (e.g. "Check on Aviasales" button)
    // ═══════════════════════════════════════════════════════════════════
    if (tier === 'live') {
      // Try Kiwi multi-city first (real multi-leg data, includes LCCs)
      if (isKiwiAvailable()) {
        try {
          console.log('[Layover API] [live] Trying Kiwi multi-city search')
          const kiwiResult = await searchKiwiMultiCity({
            origin,
            destination,
            departDate: searchDate,
          })

          const hubRoutes = kiwiResult.viaHub.map(v => ({
            hub: v.hub,
            hubCity: v.hubCity,
            leg1Price: v.leg1.price,
            leg2Price: v.leg2.price,
            totalPrice: v.totalPrice,
            savings: v.savings,
            savingsPercent: v.savingsPercent,
          }))

          console.log(`[Layover API] [live] Kiwi returned ${hubRoutes.length} hub routes`)

          return NextResponse.json({
            directPrice: kiwiResult.direct?.price || null,
            layoverRoutes: hubRoutes,
            bestLayover: hubRoutes.length > 0 ? hubRoutes[0] : null,
            priceSource: 'kiwi-live',
            searchTier: 'live' as const,
            fetchedAt: Date.now(),
            showLivePriceCta: false,
            confidence: 'live' as const,
          })
        } catch (kiwiErr) {
          console.warn('[Layover API] [live] Kiwi failed, falling back:', kiwiErr instanceof Error ? kiwiErr.message : kiwiErr)
        }
      }

      // Live fallback: full multi-provider chain (Kiwi → FlightAPI → TravelPayouts)
      console.log('[Layover API] [live] Using multi-provider price lookup')
      const { directPrice, hubRoutes, priceSource } = await fetchMultiProviderRoutes(origin, destination, searchDate)

      console.log(`[Layover API] [live] Found ${hubRoutes.length} stopover routes (source: ${priceSource})`)

      return NextResponse.json({
        directPrice,
        layoverRoutes: hubRoutes,
        bestLayover: hubRoutes.length > 0 ? hubRoutes[0] : null,
        priceSource,
        searchTier: 'live' as const,
        fetchedAt: Date.now(),
        showLivePriceCta: false,
        confidence: 'live' as const,
      })
    }

    // ═══════════════════════════════════════════════════════════════════
    // Tier 1 (Browse) — SerpApi Explore primary (4-5 calls max),
    // falls back to multi-provider chain if Explore returns nothing.
    // ═══════════════════════════════════════════════════════════════════
    console.log('[Layover API] [browse] Trying SerpApi Explore for hub discovery')
    let browseResult = await fetchExploreRoutes(origin, destination, searchDate)

    // Fallback: if Explore found no hub routes, use the old multi-provider chain
    if (browseResult.hubRoutes.length === 0) {
      console.log('[Layover API] [browse] Explore found no hubs, falling back to multi-provider chain')
      browseResult = await fetchMultiProviderRoutes(origin, destination, searchDate)
    }

    const { directPrice, hubRoutes, priceSource } = browseResult

    // Determine confidence based on the provider that actually returned data
    const confidence = priceSource === 'serpapi-live' ? 'live' as const
      : priceSource === 'kiwi-live' ? 'live' as const
      : priceSource === 'flightapi-live' ? 'live' as const
      : priceSource === 'travelpayouts-cached' ? 'cached' as const
      : priceSource === 'unknown' ? 'estimated' as const
      : 'cached' as const

    // Enrich with Side Quest value calculations
    const enrichedRoutes = enrichWithSideQuest(hubRoutes, directPrice, budgetTier, layoverDays)

    console.log(`[Layover API] [browse] Found ${hubRoutes.length} stopover routes (source: ${priceSource}, confidence: ${confidence})`)

    return NextResponse.json({
      directPrice,
      layoverRoutes: enrichedRoutes,
      bestLayover: enrichedRoutes.length > 0 ? enrichedRoutes[0] : null,
      priceSource,
      searchTier: 'browse' as const,
      fetchedAt: Date.now(),
      showLivePriceCta: true,
      confidence,
    })
  } catch (error) {
    console.error('[Layover API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch layover data. Please try again.' },
      { status: 502 }
    )
  }
}
