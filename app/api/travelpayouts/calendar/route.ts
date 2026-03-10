import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const departDate = searchParams.get('depart_date') // Format: YYYY-MM

  console.log('[Calendar API] Request:', { origin, destination, departDate })

  if (!origin || !destination || !departDate) {
    console.error('[Calendar API] Missing parameters')
    return NextResponse.json(
      { error: 'Missing required parameters: origin, destination, depart_date' },
      { status: 400 }
    )
  }

  if (!TOKEN) {
    console.error('[Calendar API] Token not configured')
    return NextResponse.json(
      { error: 'TravelPayouts API token not configured' },
      { status: 500 }
    )
  }

  try {
    const url = `${API_BASE}/v1/prices/calendar?origin=${origin}&destination=${destination}&depart_date=${departDate}&currency=usd&token=${TOKEN}`
    console.log('[Calendar API] Fetching:', url.replace(TOKEN, 'TOKEN_HIDDEN'))

    const response = await fetch(url, {
      next: { revalidate: 21600 }, // Cache for 6 hours
    })

    console.log('[Calendar API] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Calendar API] TravelPayouts error:', response.status, errorText)
      throw new Error(`TravelPayouts API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('[Calendar API] Data keys:', Object.keys(data), 'Data items:', data.data ? Object.keys(data.data).length : 0)

    return NextResponse.json(data)
  } catch (error) {
    console.error('[Calendar API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calendar data. Please try again.' },
      { status: 500 }
    )
  }
}
