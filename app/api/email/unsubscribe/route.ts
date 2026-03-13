import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  // Validate token is present and looks like a UUID
  if (!token || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token)) {
    return new NextResponse(
      renderHtml(
        'Invalid Link',
        'This unsubscribe link is invalid or has expired. If you need help, contact us at support@globepilots.com.',
        false
      ),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  try {
    const supabase = getSupabase()

    // Look up subscriber by unsubscribe_token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriber, error: lookupError } = await (supabase as any)
      .from('email_subscribers')
      .select('id, email')
      .eq('unsubscribe_token', token)
      .single()

    if (lookupError || !subscriber) {
      console.warn('[Unsubscribe] Token not found:', token)
      return new NextResponse(
        renderHtml(
          'Not Found',
          'This unsubscribe link is invalid or the subscription has already been removed.',
          false
        ),
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // Delete the subscriber record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('email_subscribers')
      .delete()
      .eq('id', subscriber.id)

    if (deleteError) {
      console.error('[Unsubscribe] Delete error:', deleteError)
      return new NextResponse(
        renderHtml(
          'Error',
          'Something went wrong while processing your request. Please try again or contact support@globepilots.com.',
          false
        ),
        { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    console.log('[Unsubscribe] Successfully unsubscribed:', subscriber.email)

    return new NextResponse(
      renderHtml(
        'Unsubscribed',
        `<strong>${subscriber.email}</strong> has been unsubscribed from GlobePilot emails. You will no longer receive deal alerts or newsletters from us.`,
        true
      ),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  } catch (error) {
    console.error('[Unsubscribe] Error:', error)
    return new NextResponse(
      renderHtml(
        'Error',
        'An unexpected error occurred. Please try again later.',
        false
      ),
      { status: 500, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}

function renderHtml(title: string, message: string, success: boolean): string {
  const iconColor = success ? '#22c55e' : '#ef4444'
  const icon = success
    ? '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
    : '<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — GlobePilot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #071630 0%, #0A1F44 50%, #0D2B5C 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: white;
      border-radius: 20px;
      padding: 48px 40px;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .icon { margin-bottom: 24px; }
    h1 {
      color: #0A1F44;
      font-size: 28px;
      margin-bottom: 16px;
    }
    .message {
      color: #555;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 32px;
    }
    .message strong { color: #0A1F44; }
    .home-link {
      display: inline-block;
      padding: 12px 32px;
      background: #87CEEB;
      color: #0A1F44;
      text-decoration: none;
      border-radius: 10px;
      font-weight: 600;
      transition: background 0.2s;
    }
    .home-link:hover { background: #5FB3D9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${title}</h1>
    <p class="message">${message}</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://globepilots.com'}" class="home-link">
      Back to GlobePilot
    </a>
  </div>
</body>
</html>`
}
