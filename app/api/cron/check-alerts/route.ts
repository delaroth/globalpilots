import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'
import { calculatePriceStatus } from '@/lib/price-analysis'
import { trackActivity } from '@/lib/activity-feed'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

// Lazy initialize Resend to avoid build-time errors
function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(apiKey)
}

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron] Starting price alert check...')

    // Fetch all active alerts
    const { data: alerts, error: fetchError } = await (supabase as any)
      .from('price_alerts')
      .select('*')
      .eq('is_active', true)

    if (fetchError) {
      console.error('[Cron] Error fetching alerts:', fetchError)
      throw fetchError
    }

    console.log('[Cron] Found', alerts.length, 'active alerts to check')

    let checkedCount = 0
    let notifiedCount = 0
    const errors: string[] = []

    // Process a single alert: fetch price, update DB, notify if triggered
    async function processAlert(alert: any): Promise<{ checked: boolean; notified: boolean }> {
      // Fetch current price from TravelPayouts
      const priceUrl = `${API_BASE}/v2/prices/latest?origin=${alert.origin}&destination=${alert.destination}&limit=1&currency=usd&token=${TOKEN}`
      const priceResponse = await fetch(priceUrl, { next: { revalidate: 0 }, signal: AbortSignal.timeout(8000) })

      if (!priceResponse.ok) {
        console.error(`[Cron] Failed to fetch price for ${alert.origin}-${alert.destination}`)
        return { checked: false, notified: false }
      }

      const priceData = await priceResponse.json()
      const flights = priceData.data || []

      if (flights.length === 0) {
        console.log(`[Cron] No flights found for ${alert.origin}-${alert.destination}`)
        return { checked: false, notified: false }
      }

      let currentPrice = flights[0].value
      let bestPrice = currentPrice
      let bestPriceDate = null

      console.log(`[Cron] ${alert.origin}-${alert.destination}: $${currentPrice} (target: $${alert.target_price})`)

      // If flexible dates, check additional dates
      if (alert.flexible_dates && alert.date_range_days > 0) {
        console.log(`[Cron] Checking flexible dates (±${alert.date_range_days} days)`)

        // Note: In production, you'd check multiple specific dates
        // For now, we use the current price as the best price
        // TODO: Implement date range checking with calendar API
        bestPrice = currentPrice
      }

      // Update historical low if current price is lower
      const historicalLow = alert.historical_low_price
        ? Math.min(alert.historical_low_price, bestPrice)
        : bestPrice

      // Calculate price status
      const priceStatus = calculatePriceStatus(currentPrice, historicalLow)

      // Update price tracking fields
      await (supabase as any)
        .from('price_alerts')
        .update({
          current_price: currentPrice,
          historical_low_price: historicalLow,
          price_status: priceStatus,
          best_price_in_range: alert.flexible_dates ? bestPrice : null,
          best_price_date: alert.flexible_dates ? bestPriceDate : null,
          last_checked_at: new Date().toISOString()
        })
        .eq('id', alert.id)

      // Check if price is below target (use best price if flexible dates)
      const priceToCheck = alert.flexible_dates ? bestPrice : currentPrice
      if (priceToCheck <= alert.target_price) {
        // Check if we've already notified recently (within last 24 hours)
        const lastNotified = alert.last_notified_at ? new Date(alert.last_notified_at) : null
        const now = new Date()
        const hoursSinceLastNotification = lastNotified
          ? (now.getTime() - lastNotified.getTime()) / (1000 * 60 * 60)
          : 999

        if (hoursSinceLastNotification < 24) {
          console.log(`[Cron] Skipping notification for ${alert.id} - already notified ${hoursSinceLastNotification.toFixed(1)}h ago`)
          return { checked: true, notified: false }
        }

        console.log(`[Cron] 🎯 Price alert triggered for ${alert.origin}-${alert.destination}: $${priceToCheck} <= $${alert.target_price}`)

        // Track deal found activity
        await trackActivity('deal_found', {
          route: `${alert.origin}-${alert.destination}`,
          price: priceToCheck,
          savings: alert.target_price - priceToCheck,
          destination: alert.destination,
        })

        // Send email notification via Resend
        const flexibleDatesInfo = alert.flexible_dates
          ? `<li><strong>Date Flexibility:</strong> ±${alert.date_range_days} days</li>`
          : ''

        const emailHtml = `
          <h1>🎉 Price Alert: Your flight price dropped!</h1>
          <p>Great news! The flight you're tracking has dropped below your target price.</p>

          <h2>Flight Details:</h2>
          <ul>
            <li><strong>Route:</strong> ${alert.origin} → ${alert.destination}</li>
            <li><strong>Current Price:</strong> $${priceToCheck}</li>
            <li><strong>Your Target:</strong> $${alert.target_price}</li>
            <li><strong>You Save:</strong> $${(alert.target_price - priceToCheck).toFixed(2)}</li>
            ${flexibleDatesInfo}
          </ul>

          <p>
            <a href="https://globepilots.vercel.app" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Book Now
            </a>
          </p>

          <p style="color: #666; font-size: 14px; margin-top: 24px;">
            This is an automated price alert from GlobePilot. You're receiving this because you set up a price alert for this route.
          </p>
        `

        const resend = getResend()
        await resend.emails.send({
          from: 'GlobePilot <alerts@globepilots.com>',
          to: alert.email,
          subject: `✈️ Price Drop Alert: ${alert.origin} → ${alert.destination} now $${currentPrice}!`,
          html: emailHtml,
        })

        // Update last_notified_at
        await (supabase as any)
          .from('price_alerts')
          .update({ last_notified_at: now.toISOString() })
          .eq('id', alert.id)

        console.log(`[Cron] ✅ Email sent to ${alert.email}`)
        return { checked: true, notified: true }
      }

      return { checked: true, notified: false }
    }

    // Process all alerts in parallel
    const results = await Promise.allSettled(alerts.map((alert: any) => processAlert(alert)))

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      if (result.status === 'fulfilled') {
        if (result.value.checked) checkedCount++
        if (result.value.notified) notifiedCount++
      } else {
        console.error(`[Cron] Error checking alert ${alerts[i].id}:`, result.reason)
        errors.push(`Error checking alert ${alerts[i].id}`)
      }
    }

    console.log(`[Cron] ✅ Completed: Checked ${checkedCount} alerts, sent ${notifiedCount} notifications`)

    return NextResponse.json({
      success: true,
      totalAlerts: alerts.length,
      checkedCount,
      notifiedCount,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('[Cron] Fatal error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
