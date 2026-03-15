import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// In-memory rate limiter (resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 1000 }) // 1 minute window
    return true
  }

  if (entry.count >= 5) {
    return false
  }

  entry.count++
  return true
}

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_EMAIL = 'GlobePilot Contact <contact@globepilots.com>'

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  bug: 'Bug Report',
  partnership: 'Partnership',
  feature: 'Feature Request',
}

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { name, email, subject, message } = body

    // Validate required fields
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      )
    }

    // Validate subject
    const validSubjects = ['general', 'bug', 'partnership', 'feature']
    if (!validSubjects.includes(subject)) {
      return NextResponse.json(
        { error: 'Invalid subject.' },
        { status: 400 }
      )
    }

    // Validate message length
    if (message.trim().length > 5000) {
      return NextResponse.json(
        { error: 'Message is too long. Please keep it under 5000 characters.' },
        { status: 400 }
      )
    }

    const contactEmail = process.env.CONTACT_EMAIL || 'hello@globepilots.com'
    const subjectLabel = SUBJECT_LABELS[subject] || subject
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      console.warn('[Contact] RESEND_API_KEY not set — logging contact form submission')
      console.log('[Contact] Submission:', { name, email, subject: subjectLabel, message: message.substring(0, 200) })
      return NextResponse.json({ success: true })
    }

    // Send email via Resend
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [contactEmail],
        reply_to: email.trim(),
        subject: `[GlobePilot Contact] ${subjectLabel} from ${name.trim()}`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#071630;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background-color:#FFFFFF;border-radius:16px;padding:32px;">
      <h2 style="color:#0A1F44;font-size:22px;margin:0 0 16px;">New Contact Form Submission</h2>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#666;font-size:14px;width:100px;vertical-align:top;"><strong>Name:</strong></td>
          <td style="padding:8px 0;color:#333;font-size:14px;">${escapeHtml(name.trim())}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;font-size:14px;vertical-align:top;"><strong>Email:</strong></td>
          <td style="padding:8px 0;color:#333;font-size:14px;"><a href="mailto:${escapeHtml(email.trim())}" style="color:#5FB3D9;">${escapeHtml(email.trim())}</a></td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;font-size:14px;vertical-align:top;"><strong>Subject:</strong></td>
          <td style="padding:8px 0;color:#333;font-size:14px;">${escapeHtml(subjectLabel)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#666;font-size:14px;vertical-align:top;"><strong>Message:</strong></td>
          <td style="padding:8px 0;color:#333;font-size:14px;white-space:pre-wrap;">${escapeHtml(message.trim())}</td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>`,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[Contact] Resend API error:', res.status, err)
      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      )
    }

    const data = await res.json()
    console.log('[Contact] Email sent:', data.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Contact] Error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
