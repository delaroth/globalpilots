import { NextRequest, NextResponse } from 'next/server'
import { majorAirports } from '@/lib/geolocation'
import { searchCheapestDestinations, isKiwiAvailable } from '@/lib/kiwi'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

function getCityName(code: string): string {
  const airport = majorAirports.find(a => a.code === code)
  return airport ? airport.city : code
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const origin = params.get('origin')
  const departDate = params.get('depart_date') // YYYY-MM-DD or YYYY-MM
  const limit = parseInt(params.get('limit') || '5')

  if (!origin) {
    return NextResponse.json({ error: 'Missing required parameter: origin' }, { status: 400 })
  }

  if (!/^[A-Z]{3}$/.test(origin)) {
    return NextResponse.json({ error: 'origin must be a 3-letter IATA code' }, { status: 400 })
  }

  try {
    // ── Priority 1: Kiwi "fly_to=anywhere" (real-time, includes LCCs) ──
    if (isKiwiAvailable()) {
      try {
        const searchDate = departDate && departDate.length === 10
          ? departDate
          : departDate
            ? `${departDate}-15` // mid-month if only YYYY-MM
            : new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

        console.log(`[Discover API] Trying Kiwi fly_to=anywhere from ${origin} on ${searchDate}`)

        const kiwiResults = await searchCheapestDestinations({
          origin,
          departDate: searchDate,
          limit: Math.max(limit, 20), // fetch extra for dedup
        })

        if (kiwiResults.length > 0) {
          // Deduplicate by destination code (keep cheapest per city)
          const seen = new Set<string>()
          const unique: typeof kiwiResults = []
          for (const r of kiwiResults) {
            if (!seen.has(r.destinationCode) && r.destinationCode !== origin) {
              seen.add(r.destinationCode)
              unique.push(r)
            }
            if (unique.length >= limit) break
          }

          const results = unique.map(r => ({
            destination: r.destinationCode,
            city: r.cityName || getCityName(r.destinationCode),
            price: r.price,
            departDate: r.departureTime ? r.departureTime.split('T')[0] : searchDate,
            returnDate: r.arrivalTime ? r.arrivalTime.split('T')[0] : null,
            airline: r.airlines.length > 0 ? r.airlines[0] : null,
            deepLink: r.deepLink,
          }))

          console.log(`[Discover API] Kiwi returned ${results.length} destinations from ${origin}`)

          return NextResponse.json({
            origin,
            results,
            count: results.length,
            priceSource: 'kiwi-live',
            priceNote: 'Prices from Kiwi.com — click to check and book.',
          })
        }

        console.log('[Discover API] Kiwi returned 0 results, falling back to TravelPayouts')
      } catch (kiwiErr) {
        console.warn('[Discover API] Kiwi failed, falling back to TravelPayouts:', kiwiErr instanceof Error ? kiwiErr.message : kiwiErr)
      }
    }

    // ── Priority 2: TravelPayouts cached prices ──
    if (!TOKEN) {
      return NextResponse.json({ error: 'No API providers available' }, { status: 500 })
    }

    const url = `${API_BASE}/v2/prices/latest?origin=${origin}&limit=200&currency=usd&token=${TOKEN}`
    console.log('[Discover API] Fetching cheapest destinations from TravelPayouts for', origin)

    const response = await fetch(url, { next: { revalidate: 21600 } })

    if (!response.ok) {
      throw new Error(`TravelPayouts returned ${response.status}`)
    }

    const data = await response.json()
    let deals = data.data || []

    // Filter by departure date if provided
    if (departDate) {
      if (departDate.length === 10) {
        // Exact date YYYY-MM-DD: match within +/-3 days
        const target = new Date(departDate)
        deals = deals.filter((d: any) => {
          const depart = new Date(d.depart_date)
          const diff = Math.abs(depart.getTime() - target.getTime()) / (1000 * 60 * 60 * 24)
          return diff <= 3
        })
      } else if (departDate.length === 7) {
        // Month YYYY-MM: match within that month
        deals = deals.filter((d: any) => d.depart_date.startsWith(departDate))
      }
    }

    // Filter out past dates
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    deals = deals.filter((d: any) => new Date(d.depart_date) >= now)

    // Sort by price
    deals.sort((a: any, b: any) => a.value - b.value)

    // Deduplicate by destination (keep cheapest per city)
    const seen = new Set<string>()
    const unique: any[] = []
    for (const deal of deals) {
      if (!seen.has(deal.destination) && deal.destination !== origin) {
        seen.add(deal.destination)
        unique.push(deal)
      }
      if (unique.length >= limit) break
    }

    // Enrich with city names
    const results = unique.map((deal: any) => ({
      destination: deal.destination,
      city: getCityName(deal.destination),
      price: deal.value,
      departDate: deal.depart_date,
      returnDate: deal.return_date,
      airline: deal.airline || null,
    }))

    console.log(`[Discover API] Found ${results.length} cheapest destinations from ${origin}`)

    return NextResponse.json({
      origin,
      results,
      count: results.length,
      priceSource: 'travelpayouts-cached',
      priceNote: 'Prices are cached estimates. Click to check current prices on Aviasales.',
    })
  } catch (err) {
    console.error('[Discover API] Error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch destinations. Please try again.' },
      { status: 502 }
    )
  }
}
