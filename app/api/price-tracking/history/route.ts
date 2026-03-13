import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const origin = searchParams.get('origin')
    const destination = searchParams.get('destination')
    const months = parseInt(searchParams.get('months') || '3')

    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Missing required parameters: origin, destination' },
        { status: 400 }
      )
    }

    console.log('[Price History] Fetching history for:', { origin, destination, months })

    // Calculate date range
    const now = new Date()
    const cutoffDate = new Date(now)
    cutoffDate.setMonth(cutoffDate.getMonth() - months)

    // Check database first
    const { data: dbHistory, error: dbError } = await (supabase as any)
      .from('price_history')
      .select('*')
      .eq('origin', origin)
      .eq('destination', destination)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })

    if (dbError) {
      console.error('[Price History] Database error:', dbError)
    }

    // If we have sufficient database data (30+ records), return it
    if (dbHistory && dbHistory.length >= 30) {
      console.log(`[Price History] ✅ Found ${dbHistory.length} records in database`)

      const history = dbHistory.map((record: any) => ({
        origin: record.origin,
        destination: record.destination,
        price: parseFloat(record.price),
        departDate: record.depart_date,
        returnDate: record.return_date,
        foundAt: record.found_at,
        recordedAt: record.created_at
      }))

      return NextResponse.json({ success: true, history })
    }

    // Not enough data in database, fetch from TravelPayouts Calendar API
    console.log('[Price History] Insufficient database data, fetching from TravelPayouts...')

    if (!TOKEN) {
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 500 }
      )
    }

    const monthsData: any[] = []

    // Fetch calendar data for last N months
    for (let i = 0; i < months; i++) {
      const date = new Date(now)
      date.setMonth(date.getMonth() - i)
      const monthStr = date.toISOString().slice(0, 7) // YYYY-MM

      const calendarUrl = `${API_BASE}/v1/prices/calendar?origin=${origin}&destination=${destination}&depart_date=${monthStr}&currency=usd&token=${TOKEN}`

      try {
        const response = await fetch(calendarUrl, {
          next: { revalidate: 21600 } // 6 hour cache
        })

        if (response.ok) {
          const data = await response.json()

          if (data.data) {
            // Convert calendar data to history records
            Object.entries(data.data).forEach(([date, info]: [string, any]) => {
              monthsData.push({
                origin,
                destination,
                price: parseFloat(info.value),
                depart_date: date,
                return_date: info.return_date || null,
                found_at: info.found_at || new Date().toISOString(),
                created_at: new Date().toISOString()
              })
            })
          }
        } else {
          console.error(`[Price History] Failed to fetch calendar for ${monthStr}:`, response.status)
        }
      } catch (err) {
        console.error(`[Price History] Error fetching month ${monthStr}:`, err)
      }

      // Small delay to avoid rate limiting
      if (i < months - 1) {
        await new Promise(resolve => setTimeout(resolve, 200))
      }
    }

    console.log(`[Price History] Fetched ${monthsData.length} historical prices from TravelPayouts`)

    // Save to database for future queries (if we have data)
    if (monthsData.length > 0) {
      try {
        await (supabase as any)
          .from('price_history')
          .insert(monthsData)

        console.log('[Price History] ✅ Saved historical data to database')
      } catch (insertError) {
        console.error('[Price History] Failed to save to database:', insertError)
        // Continue anyway, we still have the data
      }
    }

    // Combine database history with new fetched data
    const allHistory = [
      ...(dbHistory || []).map((record: any) => ({
        origin: record.origin,
        destination: record.destination,
        price: parseFloat(record.price),
        departDate: record.depart_date,
        returnDate: record.return_date,
        foundAt: record.found_at,
        recordedAt: record.created_at
      })),
      ...monthsData.map((record: any) => ({
        origin: record.origin,
        destination: record.destination,
        price: record.price,
        departDate: record.depart_date,
        returnDate: record.return_date,
        foundAt: record.found_at,
        recordedAt: record.created_at
      }))
    ]

    // Remove duplicates and sort by date
    const uniqueHistory = Array.from(
      new Map(allHistory.map(item => [`${item.departDate}-${item.price}`, item])).values()
    ).sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())

    return NextResponse.json({
      success: true,
      history: uniqueHistory,
      source: monthsData.length > 0 ? 'travelpayouts' : 'database'
    })

  } catch (error) {
    console.error('[Price History] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price history. Please try again.' },
      { status: 500 }
    )
  }
}
