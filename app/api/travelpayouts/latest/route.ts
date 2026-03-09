import { NextRequest, NextResponse } from 'next/server'

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
    const url = `${API_BASE}/v2/prices/latest?origin=${origin}&period_type=${periodType}&limit=${limit}&currency=usd&token=${TOKEN}`

    const response = await fetch(url, {
      next: { revalidate: 21600 }, // Cache for 6 hours
    })

    if (!response.ok) {
      throw new Error(`TravelPayouts API error: ${response.status}`)
    }

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Latest prices API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch latest prices' },
      { status: 500 }
    )
  }
}
