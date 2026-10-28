/**
 * Newsletter / deal-alert subscriptions (email_subscribers table), double opt-in.
 *
 * A subscribe request never emails an address more than once an hour, never
 * emails an already-confirmed subscriber, and the row only counts as
 * subscribed once the confirmation link is clicked. Proof of inbox ownership
 * is the row's unsubscribe_token, which is only ever delivered by email.
 *
 * Uses the service-role client: email_subscribers has no anon RLS policies.
 */

import { getSupabaseAdmin } from '@/lib/supabase'
import { sendSubscribeConfirmationEmail } from '@/lib/resend'
import { normalizeEmail } from '@/lib/alert-tokens'

const CONFIRMATION_EMAIL_INTERVAL_MS = 60 * 60 * 1000

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function subscribeToNewsletter(params: {
  email: string
  origin?: string | null
  destinations?: string[] | null
  maxPrice?: number | null
}): Promise<void> {
  const supabase = getSupabaseAdmin() as any
  const email = normalizeEmail(params.email)

  const { data: existing } = await supabase
    .from('email_subscribers')
    .select('id, confirmed, subscribed_at')
    .eq('email', email)
    .maybeSingle()

  if (existing?.confirmed) return // already subscribed — say nothing, send nothing

  if (existing && Date.now() - new Date(existing.subscribed_at).getTime() < CONFIRMATION_EMAIL_INTERVAL_MS) {
    return // confirmation already sent recently
  }

  const { data, error } = await supabase
    .from('email_subscribers')
    .upsert(
      {
        email,
        origin: params.origin || null,
        destinations: params.destinations && params.destinations.length > 0 ? params.destinations : null,
        max_price: params.maxPrice || null,
        // Doubles as "last confirmation email sent" for the throttle above
        subscribed_at: new Date().toISOString(),
        confirmed: false,
      },
      { onConflict: 'email' }
    )
    .select('email, unsubscribe_token')
    .single()

  if (error) {
    console.error('[Newsletter] Upsert error:', error)
    throw new Error('Failed to save subscription.')
  }

  const sent = await sendSubscribeConfirmationEmail(data.email, data.unsubscribe_token)
  if (!sent) console.warn('[Newsletter] Confirmation email not sent (Resend may not be configured)')
}

/** Confirm a subscription by token. Returns the email, or null if not found. */
export async function confirmSubscription(token: string): Promise<string | null> {
  if (!UUID_RE.test(token)) return null
  const { data, error } = await (getSupabaseAdmin() as any)
    .from('email_subscribers')
    .update({ confirmed: true })
    .eq('unsubscribe_token', token)
    .select('email')
    .maybeSingle()

  if (error) {
    console.error('[Newsletter] Confirm error:', error)
    throw new Error('Failed to confirm subscription.')
  }
  return data?.email ?? null
}

/** Look up the email for a token without changing anything. */
export async function findSubscriberEmail(token: string): Promise<string | null> {
  if (!UUID_RE.test(token)) return null
  const { data } = await (getSupabaseAdmin() as any)
    .from('email_subscribers')
    .select('email')
    .eq('unsubscribe_token', token)
    .maybeSingle()
  return data?.email ?? null
}

/** Delete the subscriber row for a token. Returns the email, or null if not found. */
export async function unsubscribeNewsletter(token: string): Promise<string | null> {
  if (!UUID_RE.test(token)) return null
  const { data, error } = await (getSupabaseAdmin() as any)
    .from('email_subscribers')
    .delete()
    .eq('unsubscribe_token', token)
    .select('email')
    .maybeSingle()

  if (error) {
    console.error('[Newsletter] Unsubscribe error:', error)
    throw new Error('Failed to unsubscribe.')
  }
  return data?.email ?? null
}
