/**
 * Signed price-alert tokens.
 *
 * A token proves the holder received an email at that address — it is only
 * ever delivered by email (confirmation + alert emails). One token per email
 * address covers confirm, manage and unsubscribe. No DB storage needed:
 * token = base64url(email) + "." + HMAC-SHA256(secret, email).
 *
 * Rotating ALERT_TOKEN_SECRET (falls back to NEXTAUTH_SECRET) invalidates
 * every outstanding link.
 */

import { createHmac, timingSafeEqual } from 'crypto'

function getSecret(): string {
  const secret = process.env.ALERT_TOKEN_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('ALERT_TOKEN_SECRET or NEXTAUTH_SECRET must be set')
  return secret
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function sign(email: string): string {
  return createHmac('sha256', getSecret()).update(`price-alerts:${email}`).digest('base64url')
}

export function signAlertToken(email: string): string {
  const normalized = normalizeEmail(email)
  return `${Buffer.from(normalized).toString('base64url')}.${sign(normalized)}`
}

/** Returns the email the token was issued for, or null if invalid. */
export function verifyAlertToken(token: string | null | undefined): string | null {
  if (!token || token.length > 512) return null
  const [encodedEmail, signature] = token.split('.')
  if (!encodedEmail || !signature) return null

  const email = Buffer.from(encodedEmail, 'base64url').toString('utf8')
  const expected = Buffer.from(sign(email))
  const given = Buffer.from(signature)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null

  return email
}

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'https://globepilots.com'
}

export function alertConfirmUrl(token: string): string {
  return `${siteUrl()}/api/alerts/confirm?token=${encodeURIComponent(token)}`
}

export function alertManageUrl(token: string): string {
  return `${siteUrl()}/alerts?token=${encodeURIComponent(token)}`
}

export function alertUnsubscribeUrl(token: string): string {
  return `${siteUrl()}/api/alerts/unsubscribe?token=${encodeURIComponent(token)}`
}

/** RFC 8058 one-click unsubscribe headers (required by Gmail/Yahoo bulk-sender rules). */
export function listUnsubscribeHeaders(token: string): Record<string, string> {
  return {
    'List-Unsubscribe': `<${alertUnsubscribeUrl(token)}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  }
}
