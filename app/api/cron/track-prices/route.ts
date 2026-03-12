import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron Track Prices] Starting price tracking job...')

    // Get all unique routes from active alerts
    const { data: alerts, error: alertsError } = await (supabase as any)
      .from('price_alerts')
      .select('origin, destination')
      .eq('is_active', true)

    if (alertsError) {
      console.error('[Cron Track Prices] Error fetching alerts:', alertsError)
      throw alertsError
    }

    // Extract unique routes
    const uniqueRoutes = Array.from(
      new Set(alerts.map((a: any) => `${a.origin}-${a.destination}`))
    ).map(route => {
      const [origin, destination] = route.split('-')
      return { origin, destination }
    })

    console.log(`[Cron Track Prices] Found ${uniqueRoutes.length} unique routes to track`)

    if (!TOKEN) {
      throw new Error('TRAVELPAYOUTS_TOKEN not configured')
    }

    let trackedCount = 0
    const errors: string[] = []

    // Fetch and store current prices for each route
    for (const route of uniqueRoutes) {
      try {
        const { origin, destination } = route

        const priceUrl = `${API_BASE}/v2/prices/latest?origin=${origin}&destination=${destination}&limit=1&currency=usd&token=${TOKEN}`
        const response = await fetch(priceUrl, { next: { revalidate: 0 } })

        if (!response.ok) {
          console.error(`[Cron Track Prices] Failed to fetch price for ${origin}-${destination}: ${response.status}`)
          errors.push(`Failed to fetch ${origin}-${destination}`)
          continue
        }

        const data = await response.json()
        const flights = data.data || []

        if (flights.length > 0) {
          const flight = flights[0]

          // Insert price into history
          await (supabase as any)
            .from('price_history')
            .insert({
              origin,
              destination,
              price: flight.value,
              depart_date: flight.depart_date || new Date().toISOString().split('T')[0],
              return_date: flight.return_date || null,
              found_at: flight.found_at || new Date().toISOString()
            })

          trackedCount++
          console.log(`[Cron Track Prices] Tracked ${origin}-${destination}: $${flight.value}`)
        } else {
          console.log(`[Cron Track Prices] No flights found for ${origin}-${destination}`)
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.error(`[Cron Track Prices] Error tracking route:`, error)
        errors.push(`Error tracking ${route.origin}-${route.destination}`)
      }
    }

    console.log(`[Cron Track Prices] ✅ Completed: Tracked ${trackedCount}/${uniqueRoutes.length} routes`)

    return NextResponse.json({
      success: true,
      totalRoutes: uniqueRoutes.length,
      trackedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('[Cron Track Prices] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
