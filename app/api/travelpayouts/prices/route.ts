import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const departDate = searchParams.get('depart_date')

  if (!origin || !destination) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination' },
      { status: 400 }
    )
  }

  if (!/^[A-Z]{3}$/i.test(origin) || !/^[A-Z]{3}$/i.test(destination)) {
    return NextResponse.json(
      { error: 'origin and destination must be 3-letter IATA codes' },
      { status: 400 }
    )
  }

  if (!TOKEN) {
    console.error('[Prices API] TravelPayouts token not configured')
    return NextResponse.json(
      { error: 'Service not configured' },
      { status: 500 }
    )
  }

  try {
    // Use the cheap endpoint for direct routes
    let url = `${API_BASE}/v2/prices/latest?origin=${origin}&destination=${destination}&currency=usd&token=${TOKEN}`

    if (departDate) {
      url += `&depart_date=${departDate}`
    }

    const response = await fetch(url, {
      next: { revalidate: 21600 }, // Cache for 6 hours
    })

    if (!response.ok) {
      console.error('[Prices API] TravelPayouts error:', response.status)
      throw new Error(`TravelPayouts API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('[Prices API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price data. Please try again.' },
      { status: 502 }
    )
  }
}
