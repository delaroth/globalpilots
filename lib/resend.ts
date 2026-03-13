/**
 * Resend email helper for GlobePilot
 * Uses RESEND_API_KEY env var for authentication
 * Gracefully falls back (logs warning) if API key is not set
 */

export interface Deal {
  origin: string
  destination: string
  price: number
  previousPrice?: number
  airline?: string
  departureDate?: string
  returnDate?: string
  link?: string
}

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_EMAIL = 'GlobePilot <alerts@globepilots.com>'

function getApiKey(): string | null {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[Resend] RESEND_API_KEY not set — emails will not be sent')
    return null
  }
  return key
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = getApiKey()
  if (!apiKey) return false

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[Resend] API error:', res.status, err)
      return false
    }

    const data = await res.json()
    console.log('[Resend] Email sent:', data.id)
    return true
  } catch (error) {
    console.error('[Resend] Failed to send email:', error)
    return false
  }
}

export async function sendWelcomeEmail(
  to: string,
  unsubscribeToken: string
): Promise<boolean> {
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://globepilots.com'}/api/email/unsubscribe?token=${unsubscribeToken}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#071630;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:48px;height:48px;background-color:#87CEEB;border-radius:50%;line-height:48px;text-align:center;">
        <span style="color:#0A1F44;font-size:24px;font-weight:bold;">G</span>
      </div>
      <h1 style="color:#FFFFFF;font-size:28px;margin:16px 0 0;">Welcome to GlobePilot!</h1>
    </div>

    <!-- Body -->
    <div style="background-color:#FFFFFF;border-radius:16px;padding:32px;margin-bottom:24px;">
      <h2 style="color:#0A1F44;font-size:22px;margin:0 0 16px;">You're all set for deal alerts</h2>
      <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">
        Thanks for subscribing! Here's what you can expect:
      </p>
      <ul style="color:#333;font-size:15px;line-height:1.8;padding-left:20px;margin:0 0 24px;">
        <li><strong>Price drop alerts</strong> — We'll notify you when flights on your tracked routes fall below your target price</li>
        <li><strong>Weekly deal roundups</strong> — The best budget flight deals from your preferred airports</li>
        <li><strong>Mistake fares &amp; flash sales</strong> — Time-sensitive deals that can save you hundreds</li>
      </ul>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0;">
        Pro tip: Visit the <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://globepilots.com'}/alerts" style="color:#5FB3D9;">Price Alerts</a> page to set up specific route tracking with custom price targets.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:16px;">
      <p style="color:#B0E0F6;font-size:13px;margin:0 0 8px;">
        Budget in. Adventure out.
      </p>
      <p style="color:#87CEEB;font-size:12px;margin:0;">
        <a href="${unsubscribeUrl}" style="color:#87CEEB;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`

  return sendEmail(to, 'Welcome to GlobePilot — Deal Alerts Activated!', html)
}

export async function sendPriceAlert(
  to: string,
  deals: Deal[],
  unsubscribeToken: string
): Promise<boolean> {
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://globepilots.com'}/api/email/unsubscribe?token=${unsubscribeToken}`

  const dealRows = deals
    .map((deal) => {
      const savings = deal.previousPrice
        ? `<span style="color:#22c55e;font-weight:bold;">Save $${deal.previousPrice - deal.price}</span>`
        : ''
      const previousPriceStrike = deal.previousPrice
        ? `<span style="color:#999;text-decoration:line-through;font-size:14px;">$${deal.previousPrice}</span> `
        : ''
      const dateInfo =
        deal.departureDate && deal.returnDate
          ? `<br><span style="color:#666;font-size:13px;">${deal.departureDate} — ${deal.returnDate}</span>`
          : ''
      const airlineInfo = deal.airline
        ? `<span style="color:#666;font-size:13px;"> · ${deal.airline}</span>`
        : ''
      const bookLink = deal.link
        ? `<a href="${deal.link}" style="display:inline-block;margin-top:8px;padding:6px 16px;background-color:#87CEEB;color:#0A1F44;border-radius:6px;text-decoration:none;font-size:13px;font-weight:bold;">Book Now</a>`
        : ''

      return `
      <div style="border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:16px;background-color:#f9fafb;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <h3 style="color:#0A1F44;font-size:18px;margin:0 0 4px;">
              ${deal.origin} &rarr; ${deal.destination}
            </h3>
            ${airlineInfo}${dateInfo}
          </div>
          <div style="text-align:right;">
            ${previousPriceStrike}
            <span style="color:#0A1F44;font-size:24px;font-weight:bold;">$${deal.price}</span>
            <br>${savings}
          </div>
        </div>
        ${bookLink}
      </div>`
    })
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#071630;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:48px;height:48px;background-color:#87CEEB;border-radius:50%;line-height:48px;text-align:center;">
        <span style="color:#0A1F44;font-size:24px;font-weight:bold;">G</span>
      </div>
      <h1 style="color:#FFFFFF;font-size:28px;margin:16px 0 0;">Price Alert!</h1>
      <p style="color:#B0E0F6;font-size:16px;margin:8px 0 0;">
        ${deals.length === 1 ? 'A flight you\'re tracking just dropped in price' : `${deals.length} flights just dropped in price`}
      </p>
    </div>

    <!-- Deals -->
    <div style="background-color:#FFFFFF;border-radius:16px;padding:32px;margin-bottom:24px;">
      <h2 style="color:#0A1F44;font-size:20px;margin:0 0 20px;">Your Deals</h2>
      ${dealRows}
      <div style="text-align:center;margin-top:24px;">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://globepilots.com'}/alerts" style="display:inline-block;padding:12px 32px;background-color:#0A1F44;color:#87CEEB;border-radius:8px;text-decoration:none;font-weight:bold;">
          View All Alerts
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:16px;">
      <p style="color:#B0E0F6;font-size:13px;margin:0 0 8px;">
        Budget in. Adventure out.
      </p>
      <p style="color:#87CEEB;font-size:12px;margin:0;">
        <a href="${unsubscribeUrl}" style="color:#87CEEB;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`

  const subject =
    deals.length === 1
      ? `Price drop: ${deals[0].origin} to ${deals[0].destination} — $${deals[0].price}`
      : `${deals.length} price drops on your tracked routes`

  return sendEmail(to, subject, html)
}
