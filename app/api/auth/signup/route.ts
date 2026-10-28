import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '@/lib/auth'
import { createVerificationToken, sendVerificationEmail } from '@/lib/email-verification'
import { trackConversion } from '@/lib/analytics'
import { z } from 'zod'
import { rateLimitAsync, getClientIp } from '@/lib/rate-limit'

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address').max(254),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200),
  name: z.string().trim().min(1, 'Name is required').max(100).optional(),
})

export async function POST(request: NextRequest) {
  const rl = await rateLimitAsync(`signup:${getClientIp(request)}`, 5, 60 * 60 * 1000)
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many sign-up attempts. Please try again later.' }, { status: 429 })
  }

  try {
    const body = await request.json()

    // Validate input
    const validation = signupSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { email, password, name } = validation.data

    // Check if user already exists
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Create user
    const user = await createUser(email, password, name)

    // Anonymous alerts are linked once the email is verified (lib/email-verification.ts),
    // not here — anyone can sign up with someone else's address.

    // Fire-and-forget conversion tracking
    trackConversion('account_created', { auth_provider: 'email' })

    // Send verification email
    try {
      const token = await createVerificationToken(user.id)
      await sendVerificationEmail(user.email, token)
    } catch (verificationError) {
      // Don't fail signup if verification email fails — user can request a new one
      console.error('[Signup] Failed to send verification email:', verificationError)
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('[Signup] Error:', error)
    // Only reveal specific auth errors, not internal details
    const message = error instanceof Error && error.message.includes('already exists')
      ? error.message
      : 'Failed to create account. Please try again.'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
