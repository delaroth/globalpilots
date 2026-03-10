import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

// Helper to convert day name to day number
function dayNameToNumber(dayName: string): number {
  const days: { [key: string]: number } = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }
  return days[dayName.toLowerCase()] ?? -1
}

// Check if a date matches the target day of week (with optional flexibility)
function matchesDayOfWeek(dateStr: string, targetDay: string, flexibleDays: number = 0): boolean {
  const parts = dateStr.split('-')
  const date = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])))
  const dayNum = date.getUTCDay()
  const targetNum = dayNameToNumber(targetDay)

  // Exact match if no flexibility
  if (flexibleDays === 0) {
    return dayNum === targetNum
  }

  // Check if within flexibility range (±flexibleDays)
  for (let i = -flexibleDays; i <= flexibleDays; i++) {
    const checkDay = (targetNum + i + 7) % 7
    if (dayNum === checkDay) return true
  }
  return false
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const origin = searchParams.get('origin')
  const limit = searchParams.get('limit') || '100'
  const departDay = searchParams.get('depart_day')
  const returnDay = searchParams.get('return_day')
  const timeframe = searchParams.get('timeframe')
  const flexibleDays = parseInt(searchParams.get('flexible_days') || '0')

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
    // Use correct TravelPayouts endpoint
    const url = `${API_BASE}/v2/prices/latest?origin=${origin}&limit=${limit}&currency=usd&token=${TOKEN}`

    console.log('[Latest API] Fetching:', url.replace(TOKEN || '', 'TOKEN_HIDDEN'))
    console.log('[Latest API] Filters: depart_day=', departDay, 'return_day=', returnDay, 'flexible_days=', flexibleDays, 'timeframe=', timeframe)

    const response = await fetch(url, {
      next: { revalidate: 21600 }, // Cache for 6 hours
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Latest API] TravelPayouts error:', response.status, errorText)
      throw new Error(`TravelPayouts API error: ${response.status}`)
    }

    const data = await response.json()
    let deals = data.data || []
    console.log('[Latest API] Fetched', deals.length, 'deals from TravelPayouts')

    // Filter by day of week if specified
    if (departDay && returnDay) {
      deals = deals.filter((deal: any) => {
        const departMatches = matchesDayOfWeek(deal.depart_date, departDay, flexibleDays)
        const returnMatches = matchesDayOfWeek(deal.return_date, returnDay, flexibleDays)
        return departMatches && returnMatches
      })
      const flexText = flexibleDays > 0 ? ` (±${flexibleDays} days)` : ''
      console.log('[Latest API] Filtered to', deals.length, 'deals matching', departDay, 'to', returnDay + flexText)
    }

    // Filter by timeframe if specified
    if (timeframe) {
      const now = new Date()
      let timeframeLimit: Date

      switch (timeframe) {
        case 'thisweek':
          timeframeLimit = new Date(now)
          timeframeLimit.setDate(now.getDate() + (7 - now.getDay()))
          break
        case 'thismonth':
          timeframeLimit = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          break
        case '3months':
          timeframeLimit = new Date(now)
          timeframeLimit.setMonth(now.getMonth() + 3)
          break
        case '6months':
          timeframeLimit = new Date(now)
          timeframeLimit.setMonth(now.getMonth() + 6)
          break
        case 'thisyear':
          timeframeLimit = new Date(now.getFullYear(), 11, 31)
          break
        default:
          timeframeLimit = new Date(now)
          timeframeLimit.setMonth(now.getMonth() + 3)
      }

      deals = deals.filter((deal: any) => {
        const departDate = new Date(deal.depart_date)
        return departDate <= timeframeLimit
      })
      console.log('[Latest API] Filtered to', deals.length, 'deals within timeframe')
    }

    // Sort by price
    deals.sort((a: any, b: any) => a.value - b.value)

    return NextResponse.json({ ...data, data: deals })
  } catch (error) {
    console.error('[Latest API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch latest prices' },
      { status: 500 }
    )
  }
}
