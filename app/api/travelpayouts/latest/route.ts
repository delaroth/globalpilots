import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const periodType = searchParams.get('period_type') || 'week'
  const limit = searchParams.get('limit') || '6'

  if (!origin) {
    return NextResponse.json(
      { error: 'Missing required parameter: origin' },
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
    // Use correct TravelPayouts endpoint - v2/prices/latest doesn't need period_type
    const url = `${API_BASE}/v2/prices/latest?origin=${origin}&limit=${limit}&currency=usd&token=${TOKEN}`

    console.log('[Latest API] Fetching:', url.replace(TOKEN || '', 'TOKEN_HIDDEN'))

    const response = await fetch(url, {
      next: { revalidate: 21600 }, // Cache for 6 hours
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Latest API] TravelPayouts error:', response.status, errorText)
      throw new Error(`TravelPayouts API error: ${response.status}`)
    }

    const data = await response.json()
    console.log('[Latest API] Success, found', data.data?.length || 0, 'deals')

    return NextResponse.json(data)
  } catch (error) {
    console.error('[Latest API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch latest prices' },
      { status: 500 }
    )
  }
}
