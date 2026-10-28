import { NextRequest, NextResponse } from 'next/server'
import { findSubscriberEmail, unsubscribeNewsletter } from '@/lib/newsletter'
import { renderEmailPage, escapeHtml } from '@/lib/email-page'

export const dynamic = 'force-dynamic'

function html(body: string, status: number) {
  return new NextResponse(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

const notFoundPage = () =>
  html(
    renderEmailPage(
      'Not Found',
      'This unsubscribe link is invalid or the subscription has already been removed. If you need help, contact us at hello@globepilots.com.',
      false
    ),
    404
  )

/** GET — show an unsubscribe button. Never delete on GET: mail scanners prefetch links. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || ''
  const email = await findSubscriberEmail(token)
  if (!email) return notFoundPage()

  return html(
    renderEmailPage(
      'Unsubscribe',
      `Stop all GlobePilot deal emails and newsletters to <strong>${escapeHtml(email)}</strong>?`,
      true,
      { action: `/api/email/unsubscribe?token=${encodeURIComponent(token)}`, label: 'Unsubscribe' }
    ),
    200
  )
}

/** POST — delete the subscriber. Also serves RFC 8058 one-click unsubscribe. */
export async function POST(request: NextRequest) {
  try {
    const email = await unsubscribeNewsletter(request.nextUrl.searchParams.get('token') || '')
    if (!email) return notFoundPage()

    console.log('[Unsubscribe] Newsletter subscriber removed')
    return html(
      renderEmailPage(
        'Unsubscribed',
        `<strong>${escapeHtml(email)}</strong> has been unsubscribed from GlobePilot emails. You will no longer receive deal alerts or newsletters from us.`,
        true
      ),
      200
    )
  } catch (error) {
    console.error('[Unsubscribe] Error:', error)
    return html(
      renderEmailPage(
        'Error',
        'Something went wrong while processing your request. Please try again or contact hello@globepilots.com.',
        false
      ),
      500
    )
  }
}
