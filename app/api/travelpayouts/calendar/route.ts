import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const departDate = searchParams.get('depart_date') // Format: YYYY-MM

  if (!origin || !destination || !departDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, depart_date' },
      { status: 400 }
    )
  }

  if (!TOKEN) {
    return NextResponse.json(
      { error: 'TravelPayouts API token not configured' },
      { status: 500 }
    )
  }

  try {
    const url = `${API_BASE}/v1/prices/calendar?origin=${origin}&destination=${destination}&depart_date=${departDate}&currency=usd&token=${TOKEN}`

    const response = await fetch(url, {
      next: { revalidate: 21600 }, // Cache for 6 hours
    })

    if (!response.ok) {
      throw new Error(`TravelPayouts API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Calendar API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar data' },
      { status: 500 }
    )
  }
}
