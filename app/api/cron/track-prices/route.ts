import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { getTrackedRoutes, TrackedRoute } from '@/lib/tracked-routes'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

interface PriceRow {
  origin: string
  destination: string
  price: number
  source: string
  checked_at: string
}

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron Track Prices] Starting price tracking job...')

    if (!TOKEN) {
      throw new Error('TRAVELPAYOUTS_TOKEN not configured')
    }

    const supabase = getSupabaseAdmin()

    // 1. The curated matrix — tracked every day regardless of alerts.
    //    This is the accumulating dataset; gaps are unrecoverable.
    const matrixRoutes = getTrackedRoutes()
    const matrixKeys = new Set(matrixRoutes.map(r => `${r.origin}-${r.destination}`))

    // 2. Routes from active user alerts (deduped against the matrix)
    const { data: alerts, error: alertsError } = await (supabase as any)
      .from('price_alerts')
      .select('origin, destination')
      .eq('is_active', true)

    if (alertsError) {
      console.error('[Cron Track Prices] Error fetching alerts:', alertsError)
    }

    const alertRoutes: TrackedRoute[] = Array.from(
      new Set<string>((alerts || []).map((a: any) => `${a.origin}-${a.destination}`))
    )
      .filter(key => !matrixKeys.has(key))
      .map(key => {
        const [origin, destination] = key.split('-')
        return { origin, destination }
      })

    const allRoutes: { route: TrackedRoute; source: string }[] = [
      ...matrixRoutes.map(route => ({ route, source: 'matrix' })),
      ...alertRoutes.map(route => ({ route, source: 'alert' })),
    ]

    console.log(`[Cron Track Prices] Tracking ${matrixRoutes.length} matrix + ${alertRoutes.length} alert routes`)

    const rows: PriceRow[] = []
    const errors: string[] = []
    const checkedAt = new Date().toISOString()

    for (const { route, source } of allRoutes) {
      const { origin, destination } = route
      try {
        const priceUrl = `${API_BASE}/v2/prices/latest?origin=${origin}&destination=${destination}&limit=1&currency=usd&token=${TOKEN}`
        const response = await fetch(priceUrl, { next: { revalidate: 0 } })

        if (!response.ok) {
          errors.push(`${origin}-${destination}: HTTP ${response.status}`)
          continue
        }

        const data = await response.json()
        const flight = (data.data || [])[0]

        // Empty TravelPayouts cache for a thin route is normal — skip, don't record
        if (flight?.value > 0) {
          rows.push({
            origin,
            destination,
            price: flight.value,
            source,
            checked_at: checkedAt,
          })
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150))
      } catch (error) {
        errors.push(`${origin}-${destination}: ${error instanceof Error ? error.message : 'unknown'}`)
      }
    }

    // Batched insert — and unlike the old version, FAIL LOUDLY on error
    // (the previous schema-mismatched inserts failed silently for months).
    let inserted = 0
    for (let i = 0; i < rows.length; i += 100) {
      const chunk = rows.slice(i, i + 100)
      const { error: insertError } = await (supabase as any)
        .from('price_history')
        .insert(chunk)
      if (insertError) {
        console.error('[Cron Track Prices] INSERT FAILED:', insertError)
        errors.push(`insert: ${insertError.message}`)
      } else {
        inserted += chunk.length
      }
    }

    console.log(`[Cron Track Prices] ✅ ${inserted} prices stored across ${allRoutes.length} routes (${errors.length} errors)`)

    return NextResponse.json({
      success: true,
      totalRoutes: allRoutes.length,
      pricesFound: rows.length,
      inserted,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
    })
  } catch (error) {
    console.error('[Cron Track Prices] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
