import { NextRequest, NextResponse } from 'next/server'
import { verifyAlertToken, alertUnsubscribeUrl, alertManageUrl } from '@/lib/alert-tokens'
import { unsubscribeAll } from '@/lib/price-tracker'
import { renderEmailPage, escapeHtml } from '@/lib/email-page'

export const dynamic = 'force-dynamic'

function html(body: string, status: number) {
  return new NextResponse(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

const invalidPage = () =>
  html(
    renderEmailPage(
      'Invalid Link',
      'This unsubscribe link is invalid. If you need help, contact us at hello@globepilots.com.',
      false
    ),
    400
  )

/** GET — show an unsubscribe button. Never unsubscribe on GET: mail scanners prefetch links. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const email = verifyAlertToken(token)
  if (!token || !email) return invalidPage()

  return html(
    renderEmailPage(
      'Unsubscribe from price alerts',
      `Stop all GlobePilot price alert emails to <strong>${escapeHtml(email)}</strong>?<br/><br/>` +
        `Want to keep some? <a href="${alertManageUrl(token)}" style="color:#5FB3D9;">Manage individual alerts</a> instead.`,
      true,
      { action: alertUnsubscribeUrl(token), label: 'Unsubscribe from all alerts' }
    ),
    200
  )
}

/**
 * POST — pause every alert for this email. Handles both the button above and
 * RFC 8058 one-click unsubscribe (mail clients POST "List-Unsubscribe=One-Click"
 * to the List-Unsubscribe URL).
 */
export async function POST(request: NextRequest) {
  const email = verifyAlertToken(request.nextUrl.searchParams.get('token'))
  if (!email) return invalidPage()

  try {
    const count = await unsubscribeAll(email)
    console.log('[Alerts Unsubscribe] Paused', count, 'alerts')
    return html(
      renderEmailPage(
        'Unsubscribed',
        `<strong>${escapeHtml(email)}</strong> will no longer receive price alert emails from GlobePilot.`,
        true
      ),
      200
    )
  } catch (error) {
    console.error('[Alerts Unsubscribe] Error:', error)
    return html(renderEmailPage('Error', 'Something went wrong. Please try again or contact hello@globepilots.com.', false), 500)
  }
}
