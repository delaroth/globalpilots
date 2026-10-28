import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { CONTACT_FROM, PUBLIC_CONTACT_EMAIL } from '@/lib/email-addresses'
import { rateLimitAsync, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_EMAIL = CONTACT_FROM

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Inquiry',
  bug: 'Bug Report',
  partnership: 'Partnership',
  feature: 'Feature Request',
}

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  subject: z.enum(['general', 'bug', 'partnership', 'feature']),
  message: z.string().trim().min(1).max(5000, 'Message is too long. Please keep it under 5000 characters.'),
  // Bot traps — see app/contact/page.tsx
  website: z.string().optional(),
  startedAt: z.number().optional(),
})

// Humans take longer than this to fill in four fields.
const MIN_FILL_MS = 3000

// Returns why a submission looks automated, or null if it looks human.
function botReason({ website, startedAt, message }: z.infer<typeof contactSchema>): string | null {
  if (website) return 'honeypot'
  if (!startedAt) return 'no-form-timestamp' // POSTed directly, never loaded the form
  const elapsed = Date.now() - startedAt
  if (elapsed < MIN_FILL_MS || elapsed > 24 * 60 * 60 * 1000) return 'fill-time'
  if (!/\p{L}/u.test(message)) return 'no-letters' // e.g. a bare phone number
  return null
}

export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimitAsync(`contact:${getClientIp(request)}`, 3, 10 * 60 * 1000)
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Too many messages. Please try again later.' },
        { status: 429 }
      )
    }

    const parsed = contactSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'All fields are required.' },
        { status: 400 }
      )
    }

    // Bots get a fake success so they don't learn what tripped them.
    const reason = botReason(parsed.data)
    if (reason) {
      console.warn('[Contact] Dropped likely bot submission:', reason, request.headers.get('user-agent')?.slice(0, 120))
      return NextResponse.json({ success: true })
    }

    const { email, subject, message } = parsed.data
    // No newlines in the email subject line
    const name = parsed.data.name.replace(/[\r\n]+/g, ' ')

    const contactEmail = process.env.CONTACT_EMAIL || PUBLIC_CONTACT_EMAIL
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
