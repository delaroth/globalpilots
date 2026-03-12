import { NextRequest, NextResponse } from 'next/server'
import { majorHubs } from '@/lib/hubs'
import { AFFILIATE_FLAGS } from '@/lib/affiliate'
import { searchKiwiMultiCity } from '@/lib/kiwi'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const departDate = searchParams.get('depart_date')

  console.log('[Layover API] Request:', { origin, destination, departDate })

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

  if (!TOKEN) {
    console.error('[Layover API] Token not configured')
    return NextResponse.json(
      { error: 'TravelPayouts API token not configured' },
      { status: 500 }
    )
  }

  try {
    // Use Kiwi multi-city search if enabled (real multi-leg data)
    if (AFFILIATE_FLAGS.kiwi && process.env.KIWI_API_KEY) {
      console.log('[Layover API] Using Kiwi multi-city search')
      const kiwiResult = await searchKiwiMultiCity({
        origin,
        destination,
        departDate: departDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
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

      return NextResponse.json({
        directPrice: kiwiResult.direct?.price || null,
        layoverRoutes: hubRoutes,
        bestLayover: hubRoutes.length > 0 ? hubRoutes[0] : null,
      })
    }

    // Fallback: TravelPayouts hub-price approach
    // Fetch direct route price (optional - may not exist)
    const directUrl = `${API_BASE}/v2/prices/latest?origin=${origin}&destination=${destination}&limit=1&currency=usd&token=${TOKEN}`
    console.log('[Layover API] Fetching direct route:', origin, '->', destination)

    let directPrice: number | null = null

    try {
      const directResponse = await fetch(directUrl, {
        next: { revalidate: 21600 }, // Cache for 6 hours
      })

      if (directResponse.ok) {
        const directData = await directResponse.json()
        const directFlights = directData.data || []

        if (directFlights.length > 0) {
          directPrice = directFlights[0].value
          console.log('[Layover API] Direct price:', directPrice)
        } else {
          console.log('[Layover API] No direct flight found - will show stopover options only')
        }
      }
    } catch (directError) {
      console.log('[Layover API] Could not fetch direct price - will show stopover options only:', directError)
    }

    // Get hubs dynamically based on destination region
    const hubCodes = getHubsByRegion(destination)
    const hubsToCheck = majorHubs.filter(h => hubCodes.includes(h.code))
    console.log('[Layover API] Checking hubs:', hubsToCheck.map(h => h.city).join(', '))

    const hubRoutes: HubRoute[] = []

    // Fetch all hub routes in parallel for better performance
    const hubPromises = hubsToCheck.map(async (hub) => {
      try {
        // Skip if hub is same as origin or destination
        if (hub.code === origin || hub.code === destination) {
          return null
        }

        // Fetch leg 1: Origin -> Hub
        const leg1Url = `${API_BASE}/v2/prices/latest?origin=${origin}&destination=${hub.code}&limit=1&currency=usd&token=${TOKEN}`
        const leg1Response = await fetch(leg1Url, {
          next: { revalidate: 21600 },
        })

        if (!leg1Response.ok) return null

        const leg1Data = await leg1Response.json()
        const leg1Flights = leg1Data.data || []
        if (leg1Flights.length === 0) return null

        const leg1Price = leg1Flights[0].value

        // Fetch leg 2: Hub -> Destination
        const leg2Url = `${API_BASE}/v2/prices/latest?origin=${hub.code}&destination=${destination}&limit=1&currency=usd&token=${TOKEN}`
        const leg2Response = await fetch(leg2Url, {
          next: { revalidate: 21600 },
        })

        if (!leg2Response.ok) return null

        const leg2Data = await leg2Response.json()
        const leg2Flights = leg2Data.data || []
        if (leg2Flights.length === 0) return null

        const leg2Price = leg2Flights[0].value
        const totalPrice = leg1Price + leg2Price

        // Calculate savings if direct price exists
        const savings = directPrice !== null ? directPrice - totalPrice : null
        const savingsPercent = directPrice !== null && savings !== null ? Math.round((savings / directPrice) * 100) : null

        console.log(`[Layover API] ${hub.city}: $${leg1Price} + $${leg2Price} = $${totalPrice}${savings !== null ? ` (savings: $${savings})` : ''}`)

        // Return ALL stopover routes, not just those with savings
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

    // Wait for all hub checks to complete
    const hubResults = await Promise.all(hubPromises)

    // Filter out nulls
    hubResults.forEach((result) => {
      if (result) {
        hubRoutes.push(result)
      }
    })

    // Sort by total price (cheapest first) if no direct price, otherwise by savings
    if (directPrice !== null) {
      hubRoutes.sort((a, b) => (b.savings || 0) - (a.savings || 0))
    } else {
      hubRoutes.sort((a, b) => a.totalPrice - b.totalPrice)
    }

    console.log(`[Layover API] Found ${hubRoutes.length} stopover routes`)

    return NextResponse.json({
      directPrice,
      layoverRoutes: hubRoutes,
      bestLayover: hubRoutes.length > 0 ? hubRoutes[0] : null,
    })
  } catch (error) {
    console.error('[Layover API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch layover data. Please try again.'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
