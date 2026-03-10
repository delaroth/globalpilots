import { NextRequest, NextResponse } from 'next/server'
import { majorHubs } from '@/lib/hubs'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

interface HubRoute {
  hub: string
  hubCity: string
  leg1Price: number
  leg2Price: number
  totalPrice: number
  savings: number
  savingsPercent: number
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
    // Fetch direct route price
    const directUrl = `${API_BASE}/v2/prices/latest?origin=${origin}&destination=${destination}&limit=1&currency=usd&token=${TOKEN}`
    console.log('[Layover API] Fetching direct route:', origin, '->', destination)

    const directResponse = await fetch(directUrl, {
      next: { revalidate: 21600 }, // Cache for 6 hours
    })

    if (!directResponse.ok) {
      throw new Error(`Direct route API error: ${directResponse.status}`)
    }

    const directData = await directResponse.json()
    const directFlights = directData.data || []

    if (directFlights.length === 0) {
      return NextResponse.json({
        error: 'No direct flights found for this route',
        directPrice: null,
        layoverRoutes: [],
      })
    }

    const directPrice = directFlights[0].value
    console.log('[Layover API] Direct price:', directPrice)

    // Check top 5 hubs (prioritizing SIN, DXB, IST, DOH, KUL)
    const hubsToCheck = majorHubs.slice(0, 5)
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
        const savings = directPrice - totalPrice

        console.log(`[Layover API] ${hub.city}: $${leg1Price} + $${leg2Price} = $${totalPrice} (savings: $${savings})`)

        // Only include if there are actual savings
        if (savings > 0) {
          return {
            hub: hub.code,
            hubCity: hub.city,
            leg1Price,
            leg2Price,
            totalPrice,
            savings,
            savingsPercent: Math.round((savings / directPrice) * 100),
          }
        }

        return null
      } catch (error) {
        console.error(`[Layover API] Error checking hub ${hub.city}:`, error)
        return null
      }
    })

    // Wait for all hub checks to complete
    const hubResults = await Promise.all(hubPromises)

    // Filter out nulls and sort by savings
    hubResults.forEach((result) => {
      if (result) {
        hubRoutes.push(result)
      }
    })

    hubRoutes.sort((a, b) => b.savings - a.savings)

    console.log(`[Layover API] Found ${hubRoutes.length} routes with savings`)

    return NextResponse.json({
      directPrice,
      layoverRoutes: hubRoutes,
      bestLayover: hubRoutes.length > 0 ? hubRoutes[0] : null,
    })
  } catch (error) {
    console.error('[Layover API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch layover data. Please try again.' },
      { status: 500 }
    )
  }
}
