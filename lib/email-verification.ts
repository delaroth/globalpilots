import { supabase } from './supabase'

const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_EMAIL = 'GlobePilot <alerts@globepilots.com>'

/**
 * Create a verification token for a user.
 * Generates a random UUID token, stores it in verification_tokens with 24-hour expiry.
 */
export async function createVerificationToken(userId: string): Promise<string> {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  // Delete any existing tokens for this user first
  await (supabase as any)
    .from('verification_tokens')
    .delete()
    .eq('user_id', userId)

  const { error } = await (supabase as any)
    .from('verification_tokens')
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt,
    })

  if (error) {
    console.error('[EmailVerification] Failed to create token:', error)
    throw new Error('Failed to create verification token')
  }

  return token
}

/**
 * Verify a token: look it up, check expiry, mark user as verified, delete the token.
 */
export async function verifyToken(token: string): Promise<{ success: boolean; error?: string }> {
  // Look up the token
  const { data: tokenRecord, error: lookupError } = await (supabase as any)
    .from('verification_tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (lookupError || !tokenRecord) {
    return { success: false, error: 'Invalid or expired verification token' }
  }

  // Check expiry
  if (new Date(tokenRecord.expires_at) < new Date()) {
    // Clean up expired token
    await (supabase as any)
      .from('verification_tokens')
      .delete()
      .eq('id', tokenRecord.id)

    return { success: false, error: 'Verification token has expired. Please request a new one.' }
  }

  // Mark user as email_verified
  const { error: updateError } = await (supabase as any)
    .from('users')
    .update({ email_verified: true })
    .eq('id', tokenRecord.user_id)

  if (updateError) {
    console.error('[EmailVerification] Failed to update user:', updateError)
    return { success: false, error: 'Failed to verify email. Please try again.' }
  }

  // Delete the used token
  await (supabase as any)
    .from('verification_tokens')
    .delete()
    .eq('id', tokenRecord.id)

  return { success: true }
}

/**
 * Send a verification email via Resend with a verification link.
 */
export async function sendVerificationEmail(email: string, token: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[EmailVerification] RESEND_API_KEY not set — verification email will not be sent')
    return false
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://globepilots.com'
  const verifyUrl = `${siteUrl}/api/auth/verify-email?token=${token}`

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
      <h1 style="color:#FFFFFF;font-size:28px;margin:16px 0 0;">Verify Your Email</h1>
    </div>

    <!-- Body -->
    <div style="background-color:#FFFFFF;border-radius:16px;padding:32px;margin-bottom:24px;">
      <h2 style="color:#0A1F44;font-size:22px;margin:0 0 16px;">Almost there!</h2>
      <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Thanks for signing up for GlobePilot. Please verify your email address to activate your account and start discovering amazing flight deals.
      </p>

      <!-- Verify Button -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${verifyUrl}" style="display:inline-block;padding:14px 40px;background-color:#87CEEB;color:#0A1F44;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">
          Verify Email Address
        </a>
      </div>

      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 16px;">
        This link expires in <strong>24 hours</strong>. If you did not create an account, you can safely ignore this email.
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

      <p style="color:#999;font-size:13px;line-height:1.6;margin:0;">
        If the button above doesn't work, copy and paste this link into your browser:<br/>
        <a href="${verifyUrl}" style="color:#5FB3D9;word-break:break-all;">${verifyUrl}</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:16px;">
      <p style="color:#B0E0F6;font-size:13px;margin:0 0 8px;">
        Budget in. Adventure out.
      </p>
      <p style="color:#87CEEB;font-size:12px;margin:0;">
        &copy; GlobePilot
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: 'Verify your GlobePilot email address',
        html,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[EmailVerification] Resend API error:', res.status, err)
      return false
    }

    const data = await res.json()
    console.log('[EmailVerification] Verification email sent:', data.id)
    return true
  } catch (error) {
    console.error('[EmailVerification] Failed to send verification email:', error)
    return false
  }
}
