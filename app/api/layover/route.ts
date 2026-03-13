import { NextRequest, NextResponse } from 'next/server'
import { majorHubs } from '@/lib/hubs'
import { searchKiwiMultiCity, isKiwiAvailable } from '@/lib/kiwi'
import { getCheapestRoutePrice } from '@/lib/flight-providers'
import { getSearchTier } from '@/lib/flight-intelligence'
import type { SearchTier } from '@/lib/flight-intelligence'

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
  const priceSource = providerUsed === 'amadeus' ? 'amadeus-live'
    : providerUsed === 'kiwi' ? 'kiwi-live'
    : providerUsed === 'travelpayouts' ? 'travelpayouts-cached'
    : 'unknown'

  return { directPrice, hubRoutes, priceSource }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const departDate = searchParams.get('depart_date')

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
    // Triggered explicitly by user action (e.g. "Get Live Price" button)
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

      // Live fallback: full multi-provider chain (Kiwi → Amadeus → TravelPayouts)
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
    // Tier 1 (Browse) — default, cached/cheap sources only
    // No expensive Kiwi multi-city search; relies on TravelPayouts
    // cached data via the multi-provider fallback chain.
    // ═══════════════════════════════════════════════════════════════════
    console.log('[Layover API] [browse] Using cached/cheap provider lookup')
    const { directPrice, hubRoutes, priceSource } = await fetchMultiProviderRoutes(origin, destination, searchDate)

    // Determine confidence based on the provider that actually returned data
    const confidence = priceSource === 'travelpayouts-cached' ? 'cached' as const
      : priceSource === 'unknown' ? 'estimated' as const
      : 'cached' as const

    console.log(`[Layover API] [browse] Found ${hubRoutes.length} stopover routes (source: ${priceSource}, confidence: ${confidence})`)

    return NextResponse.json({
      directPrice,
      layoverRoutes: hubRoutes,
      bestLayover: hubRoutes.length > 0 ? hubRoutes[0] : null,
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
