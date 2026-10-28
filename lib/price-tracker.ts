/**
 * Price alert storage + double opt-in, on the price_alerts Supabase table.
 *
 * Ownership model: an alert belongs to its email address. The only proof of
 * ownership is a signed token delivered to that inbox (lib/alert-tokens.ts).
 * New alerts are created unconfirmed (is_active = false, confirmed_at = null)
 * and only go live once the confirmation link is clicked — so nobody can make
 * GlobePilots email an address that didn't ask for it.
 *
 * Uses the service-role client: price_alerts has no anon RLS policies.
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { TRANSACTIONAL_FROM } from '@/lib/email-addresses'
import { normalizeEmail, signAlertToken, alertConfirmUrl, verifyAlertToken } from '@/lib/alert-tokens'

export interface TrackedRoute {
  id: string
  email: string
  origin: string
  destination: string
  target_price: number
  is_active: boolean
  confirmed_at: string | null
  flexible_dates?: boolean
  date_range_days?: number
  created_at: string
  last_checked_at?: string | null
  last_notified_at?: string | null
}

export class AlertError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

// Durable (DB-backed) throttles per email address — survive cold starts and
// work across serverless instances, unlike the in-memory IP limiter.
const MAX_PENDING_PER_DAY = 5
const MAX_ACTIVE_PER_EMAIL = 20
const CONFIRMATION_EMAIL_INTERVAL_MS = 60 * 60 * 1000

/**
 * Create a price alert. Confirmed immediately only if the caller presents a
 * valid token for this email (returning user); otherwise it stays pending and
 * a confirmation email is sent (at most once an hour per address).
 */
export async function trackRoute(params: {
  email: string
  origin: string
  destination: string
  targetPrice: number
  flexibleDates?: boolean
  dateRangeDays?: number
  userId?: string | null
  token?: string | null
}): Promise<{ route: TrackedRoute; pending: boolean }> {
  const supabase = getSupabaseAdmin() as any
  const email = normalizeEmail(params.email)
  const confirmed = verifyAlertToken(params.token) === email
  const now = Date.now()

  const { data: existing } = await supabase
    .from('price_alerts')
    .select('id, is_active, confirmed_at, created_at')
    .eq('email', email)
    .limit(200)
  const rows: Pick<TrackedRoute, 'id' | 'is_active' | 'confirmed_at' | 'created_at'>[] = existing || []

  const pendingToday = rows.filter(
    r => !r.confirmed_at && now - new Date(r.created_at).getTime() < 24 * 60 * 60 * 1000
  )
  const pendingLastHour = pendingToday.filter(
    r => now - new Date(r.created_at).getTime() < CONFIRMATION_EMAIL_INTERVAL_MS
  )

  if (!confirmed && pendingToday.length >= MAX_PENDING_PER_DAY) {
    throw new AlertError('Too many unconfirmed alerts for this email. Check your inbox for the confirmation link.', 429)
  }
  if (rows.filter(r => r.is_active).length >= MAX_ACTIVE_PER_EMAIL) {
    throw new AlertError(`You can have up to ${MAX_ACTIVE_PER_EMAIL} active alerts.`, 429)
  }

  const { data: duplicate } = await supabase
    .from('price_alerts')
    .select('id')
    .eq('email', email)
    .eq('origin', params.origin)
    .eq('destination', params.destination)
    .or('is_active.eq.true,confirmed_at.is.null')
    .limit(1)

  if (duplicate && duplicate.length > 0) {
    throw new AlertError('You are already tracking this route.', 409)
  }

  const { data, error } = await supabase
    .from('price_alerts')
    .insert([
      {
        email,
        origin: params.origin,
        destination: params.destination,
        target_price: params.targetPrice,
        is_active: confirmed,
        confirmed_at: confirmed ? new Date(now).toISOString() : null,
        user_id: params.userId || null,
        flexible_dates: params.flexibleDates || false,
        date_range_days: params.flexibleDates ? (params.dateRangeDays || 3) : 0,
      },
    ])
    .select()
    .single()

  if (error) {
    console.error('[PriceTracker] Insert error:', error)
    throw new AlertError('Failed to create price tracking alert.', 500)
  }

  if (!confirmed && pendingLastHour.length === 0) {
    await sendConfirmationEmail(email, params.origin, params.destination, params.targetPrice)
  }

  return { route: data as TrackedRoute, pending: !confirmed }
}

/** Activate every pending alert for the token's email. Returns the email, or null if the token is invalid. */
export async function confirmAlerts(token: string | null): Promise<string | null> {
  const email = verifyAlertToken(token)
  if (!email) return null

  const { error } = await (getSupabaseAdmin() as any)
    .from('price_alerts')
    .update({ is_active: true, confirmed_at: new Date().toISOString() })
    .eq('email', email)
    .is('confirmed_at', null)

  if (error) {
    console.error('[PriceTracker] Confirm error:', error)
    throw new AlertError('Failed to confirm alerts.', 500)
  }
  return email
}

/** Get all alerts (active, paused and pending) for an email. */
export async function getAlertsForEmail(email: string): Promise<TrackedRoute[]> {
  const { data, error } = await (getSupabaseAdmin() as any)
    .from('price_alerts')
    .select('*')
    .eq('email', normalizeEmail(email))
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    console.error('[PriceTracker] Fetch error:', error)
    throw new AlertError('Failed to fetch alerts.', 500)
  }
  return (data || []) as TrackedRoute[]
}

/** Pause/resume one alert, scoped to its owner. Pending alerts can't be resumed without confirming. */
export async function setAlertActive(id: string, email: string, isActive: boolean): Promise<TrackedRoute | null> {
  let query = (getSupabaseAdmin() as any)
    .from('price_alerts')
    .update({ is_active: isActive })
    .eq('id', id)
    .eq('email', normalizeEmail(email))
  if (isActive) query = query.not('confirmed_at', 'is', null)

  const { data, error } = await query.select().maybeSingle()
  if (error) {
    console.error('[PriceTracker] Update error:', error)
    throw new AlertError('Failed to update alert.', 500)
  }
  return data as TrackedRoute | null
}

/** Delete one alert, scoped to its owner. */
export async function deleteAlert(id: string, email: string): Promise<void> {
  const { error } = await (getSupabaseAdmin() as any)
    .from('price_alerts')
    .delete()
    .eq('id', id)
    .eq('email', normalizeEmail(email))

  if (error) {
    console.error('[PriceTracker] Delete error:', error)
    throw new AlertError('Failed to delete alert.', 500)
  }
}

/** Stop all price alert emails for an address. Returns how many alerts were paused. */
export async function unsubscribeAll(email: string): Promise<number> {
  const { data, error } = await (getSupabaseAdmin() as any)
    .from('price_alerts')
    .update({ is_active: false })
    .eq('email', normalizeEmail(email))
    .eq('is_active', true)
    .select('id')

  if (error) {
    console.error('[PriceTracker] Unsubscribe error:', error)
    throw new AlertError('Failed to unsubscribe.', 500)
  }
  return (data || []).length
}

async function sendConfirmationEmail(email: string, origin: string, destination: string, targetPrice: number): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[PriceTracker] RESEND_API_KEY not set — confirmation email not sent')
    return
  }

  const confirmUrl = alertConfirmUrl(signAlertToken(email))
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#071630;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background-color:#FFFFFF;border-radius:16px;padding:32px;">
      <h2 style="color:#0A1F44;font-size:22px;margin:0 0 16px;">Confirm your price alert</h2>
      <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Someone (hopefully you) asked GlobePilot to email this address when flights from
        <strong>${origin} → ${destination}</strong> drop below <strong>$${targetPrice}</strong>.
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${confirmUrl}" style="display:inline-block;padding:14px 40px;background-color:#87CEEB;color:#0A1F44;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
          Confirm alert
        </a>
      </div>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0;">
        If you didn't request this, ignore this email — no alerts will be sent.
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: TRANSACTIONAL_FROM,
        to: [email],
        subject: `Confirm your GlobePilot price alert: ${origin} → ${destination}`,
        html,
      }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      console.error('[PriceTracker] Resend error:', res.status, await res.json().catch(() => ({})))
    }
  } catch (err) {
    console.error('[PriceTracker] Failed to send confirmation email:', err)
  }
}
