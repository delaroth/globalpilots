import crypto from 'crypto'
import { supabase } from './supabase'
import { findUserByEmail, hashPassword } from './auth'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://globepilots.com'
const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_EMAIL = 'GlobePilot <alerts@globepilots.com>'

// ── helpers ──────────────────────────────────────────

function getResendApiKey(): string | null {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[PasswordReset] RESEND_API_KEY not set — reset emails will not be sent')
    return null
  }
  return key
}

async function sendResetEmail(to: string, token: string): Promise<boolean> {
  const apiKey = getResendApiKey()
  if (!apiKey) return false

  const resetUrl = `${APP_URL}/reset-password?token=${token}`

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
      <h1 style="color:#FFFFFF;font-size:28px;margin:16px 0 0;">Password Reset</h1>
    </div>

    <!-- Body -->
    <div style="background-color:#FFFFFF;border-radius:16px;padding:32px;margin-bottom:24px;">
      <h2 style="color:#0A1F44;font-size:22px;margin:0 0 16px;">Reset your password</h2>
      <p style="color:#333;font-size:16px;line-height:1.6;margin:0 0 16px;">
        We received a request to reset the password for your GlobePilot account. Click the button below to choose a new password.
      </p>
      <div style="text-align:center;margin:24px 0;">
        <a href="${resetUrl}" style="display:inline-block;padding:14px 40px;background-color:#87CEEB;color:#0A1F44;border-radius:8px;text-decoration:none;font-size:16px;font-weight:bold;">
          Reset Password
        </a>
      </div>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0 0 8px;">
        This link will expire in <strong>1 hour</strong>.
      </p>
      <p style="color:#666;font-size:14px;line-height:1.6;margin:0;">
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding-top:16px;">
      <p style="color:#B0E0F6;font-size:13px;margin:0;">
        Budget in. Adventure out.
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject: 'Reset your GlobePilot password',
        html,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[PasswordReset] Resend API error:', res.status, err)
      return false
    }

    const data = await res.json()
    console.log('[PasswordReset] Reset email sent:', data.id)
    return true
  } catch (error) {
    console.error('[PasswordReset] Failed to send reset email:', error)
    return false
  }
}

// ── public API ───────────────────────────────────────

/**
 * Create a password-reset token and email it to the user.
 * Always returns { success: true } to prevent email enumeration.
 */
export async function createResetToken(email: string): Promise<{ success: boolean }> {
  try {
    const user = await findUserByEmail(email)

    if (!user) {
      // Return success even when user not found (anti-enumeration)
      return { success: true }
    }

    // Generate a cryptographically-secure random token
    const token = crypto.randomBytes(32).toString('hex')

    // 1-hour expiry
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    // Invalidate any existing unused tokens for this user
    await (supabase as any)
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('user_id', user.id)
      .eq('used', false)

    // Insert new token
    const { error } = await (supabase as any)
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token,
        expires_at: expiresAt,
        used: false,
      })

    if (error) {
      console.error('[PasswordReset] DB insert error:', error)
      return { success: true } // still hide failures from client
    }

    await sendResetEmail(user.email, token)
  } catch (err) {
    console.error('[PasswordReset] createResetToken error:', err)
  }

  return { success: true }
}

/**
 * Validate a reset token. Returns the associated userId when valid.
 */
export async function validateResetToken(
  token: string
): Promise<{ valid: boolean; userId?: string }> {
  const { data, error } = await (supabase as any)
    .from('password_reset_tokens')
    .select('*')
    .eq('token', token)
    .eq('used', false)
    .single()

  if (error || !data) {
    return { valid: false }
  }

  // Check expiry
  if (new Date(data.expires_at) < new Date()) {
    return { valid: false }
  }

  return { valid: true, userId: data.user_id }
}

/**
 * Reset a user's password using a valid token.
 */
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  const { valid, userId } = await validateResetToken(token)

  if (!valid || !userId) {
    return { success: false, error: 'Invalid or expired reset link. Please request a new one.' }
  }

  try {
    // Hash and update the password
    const passwordHash = await hashPassword(newPassword)

    const { error: updateError } = await (supabase as any)
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('[PasswordReset] Password update error:', updateError)
      return { success: false, error: 'Failed to update password. Please try again.' }
    }

    // Mark token as used
    await (supabase as any)
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token', token)

    return { success: true }
  } catch (err) {
    console.error('[PasswordReset] resetPassword error:', err)
    return { success: false, error: 'An unexpected error occurred. Please try again.' }
  }
}
