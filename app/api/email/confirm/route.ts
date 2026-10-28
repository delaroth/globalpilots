import { NextRequest, NextResponse } from 'next/server'
import { confirmSubscription, findSubscriberEmail } from '@/lib/newsletter'
import { renderEmailPage, escapeHtml } from '@/lib/email-page'

export const dynamic = 'force-dynamic'

function html(body: string, status: number) {
  return new NextResponse(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}

const notFoundPage = () =>
  html(
    renderEmailPage(
      'Invalid Link',
      'This confirmation link is invalid or the subscription was removed. You can sign up again on GlobePilot.',
      false
    ),
    404
  )

/** GET — show a confirm button. Never confirm on GET: mail scanners prefetch links. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || ''
  const email = await findSubscriberEmail(token)
  if (!email) return notFoundPage()

  return html(
    renderEmailPage(
      'Confirm your subscription',
      `Start sending GlobePilot deal emails to <strong>${escapeHtml(email)}</strong>?`,
      true,
      { action: `/api/email/confirm?token=${encodeURIComponent(token)}`, label: 'Yes, subscribe me' }
    ),
    200
  )
}

export async function POST(request: NextRequest) {
  try {
    const email = await confirmSubscription(request.nextUrl.searchParams.get('token') || '')
    if (!email) return notFoundPage()

    return html(
      renderEmailPage(
        "You're subscribed",
        `<strong>${escapeHtml(email)}</strong> will now get GlobePilot deal emails. Every email has an unsubscribe link.`,
        true
      ),
      200
    )
  } catch (error) {
    console.error('[Email Confirm] Error:', error)
    return html(renderEmailPage('Error', 'Something went wrong. Please try again later.', false), 500)
  }
}
