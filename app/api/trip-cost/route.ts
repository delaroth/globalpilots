import { NextRequest, NextResponse } from 'next/server'
import { getDestinationCost, calculateTripCost, type BudgetTier } from '@/lib/destination-costs'

export const dynamic = 'force-dynamic'

const TRAVELPAYOUTS_TOKEN = process.env.TRAVELPAYOUTS_TOKEN

/**
 * Trip Cost Calculator API
 *
 * Query params:
 *   destination  - IATA code (required)
 *   days         - number of days (required, 1-30)
 *   tier         - budget | mid | comfort (required)
 *   origin       - IATA code for flight estimate (optional)
 *   departDate   - YYYY-MM-DD (optional, for flight search)
 */
export async function GET(request: NextRequest) {
  try {
  const searchParams = request.nextUrl.searchParams
  const destination = searchParams.get('destination')?.toUpperCase()
  const daysStr = searchParams.get('days')
  const tier = searchParams.get('tier') as BudgetTier | null
  const origin = searchParams.get('origin')?.toUpperCase()
  const departDate = searchParams.get('departDate')

  // Validation
  if (!destination || !daysStr || !tier) {
    return NextResponse.json(
      { error: 'Missing required parameters: destination, days, tier' },
      { status: 400 }
    )
  }

  const days = parseInt(daysStr, 10)
  if (isNaN(days) || days < 1 || days > 30) {
    return NextResponse.json(
      { error: 'Days must be between 1 and 30' },
      { status: 400 }
    )
  }

  if (!['budget', 'mid', 'comfort'].includes(tier)) {
    return NextResponse.json(
      { error: 'Tier must be budget, mid, or comfort' },
      { status: 400 }
    )
  }

  const destData = getDestinationCost(destination)
  if (!destData) {
    return NextResponse.json(
      { error: `No cost data available for destination: ${destination}` },
      { status: 404 }
    )
  }

  const tripCost = calculateTripCost(destination, days, tier)
  if (!tripCost) {
    return NextResponse.json(
      { error: 'Failed to calculate trip cost' },
      { status: 500 }
    )
  }

  // Optionally fetch flight estimate from TravelPayouts
  let flightEstimate: number | null = null
  let flightSource: string = 'none'

  if (origin && TRAVELPAYOUTS_TOKEN) {
    try {
      let url = `https://api.travelpayouts.com/v2/prices/latest?origin=${origin}&destination=${destination}&currency=usd&one_way=false&token=${TRAVELPAYOUTS_TOKEN}&limit=5`
      if (departDate) {
        url += `&depart_date=${departDate}`
      }

      const response = await fetch(url, {
        next: { revalidate: 21600 }, // cache 6 hours
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data && data.data.length > 0) {
          // Get the cheapest flight price
          const cheapest = data.data.reduce(
            (min: { value: number }, item: { value: number }) =>
              item.value < min.value ? item : min,
            data.data[0]
          )
          flightEstimate = cheapest.value
          flightSource = 'travelpayouts'
        }
      }
    } catch (err) {
      console.error('Flight price fetch failed:', err)
      // Continue without flight data — no big deal
    }
  }

  // Build the response
  const totalWithFlight = tripCost.totalCost + (flightEstimate || 0)

  return NextResponse.json({
    success: true,
    destination: {
      code: destData.code,
      city: destData.city,
      country: destData.country,
      region: destData.region,
      currency: destData.currency,
      bestMonths: destData.bestMonths,
    },
    trip: {
      days,
      tier,
      dailyCosts: tripCost.dailyCosts,
      dailyTotal: tripCost.dailyTotal,
      totalGroundCost: tripCost.totalCost,
      breakdown: tripCost.breakdown,
    },
    flight: flightEstimate
      ? {
          estimated: flightEstimate,
          source: flightSource,
          origin,
        }
      : null,
    totalEstimatedCost: totalWithFlight,
    savingTips: destData.savingTips,
  })
  } catch (error) {
    console.error('[Trip-Cost] Error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate trip cost. Please try again.' },
      { status: 500 }
    )
  }
}
