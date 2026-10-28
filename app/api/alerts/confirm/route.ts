import { NextRequest, NextResponse } from 'next/server'
import { verifyAlertToken, alertConfirmUrl, alertManageUrl } from '@/lib/alert-tokens'
import { confirmAlerts } from '@/lib/price-tracker'
import { renderEmailPage, escapeHtml } from '@/lib/email-page'

export const dynamic = 'force-dynamic'

function html(body: string, status: number) {
  return new NextResponse(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

const invalidPage = () =>
  html(
    renderEmailPage(
      'Invalid Link',
      'This confirmation link is invalid. Create the alert again or contact hello@globepilots.com.',
      false
    ),
    400
  )

/** GET — show a confirm button. Never confirm on GET: mail scanners prefetch links. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  const email = verifyAlertToken(token)
  if (!token || !email) return invalidPage()

  return html(
    renderEmailPage(
      'Confirm your price alerts',
      `Start sending price drop alerts to <strong>${escapeHtml(email)}</strong>?`,
      true,
      { action: alertConfirmUrl(token), label: 'Yes, send me alerts' }
    ),
    200
  )
}

/** POST — activate pending alerts, then go to the manage page. */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  try {
    const email = await confirmAlerts(token)
    if (!token || !email) return invalidPage()
    return NextResponse.redirect(alertManageUrl(token), 303)
  } catch (error) {
    console.error('[Alerts Confirm] Error:', error)
    return html(renderEmailPage('Error', 'Something went wrong. Please try again later.', false), 500)
  }
}
