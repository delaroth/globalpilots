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

  // Validate origin and destination are 3-letter IATA codes
  if (!/^[A-Z]{3}$/.test(origin)) {
    console.error('[Calendar API] Invalid origin format:', origin)
    return NextResponse.json(
      { error: 'origin must be a 3-letter IATA airport code (e.g., BKK, JFK, LAX)' },
      { status: 400 }
    )
  }

  if (!/^[A-Z]{3}$/.test(destination)) {
    console.error('[Calendar API] Invalid destination format:', destination)
    return NextResponse.json(
      { error: 'destination must be a 3-letter IATA airport code (e.g., BKK, JFK, LAX)' },
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
      throw new Error(`TravelPayouts API returned ${response.status}: ${errorText.substring(0, 200)}`)
    }

    const data = await response.json()
    console.log('[Calendar API] Data keys:', Object.keys(data))

    if (data.data) {
      console.log('[Calendar API] Data.data items:', Object.keys(data.data).length)
      // Log first few date keys to see the format
      const sampleKeys = Object.keys(data.data).slice(0, 5)
      console.log('[Calendar API] Sample date keys:', sampleKeys)
      if (sampleKeys.length > 0) {
        console.log('[Calendar API] Sample entry:', data.data[sampleKeys[0]])
      }
    } else {
      console.log('[Calendar API] No data.data property, full response:', JSON.stringify(data).substring(0, 500))
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('[Calendar API] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch calendar data. Please try again.'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
