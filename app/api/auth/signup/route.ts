import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail, linkAlertsToUser } from '@/lib/auth'
import { createVerificationToken, sendVerificationEmail } from '@/lib/email-verification'
import { trackConversion } from '@/lib/analytics'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').optional(),
})

export async function POST(request: NextRequest) {
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

    // Link any anonymous alerts to this user
    await linkAlertsToUser(email, user.id)

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
