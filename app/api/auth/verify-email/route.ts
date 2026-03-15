import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/email-verification'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid-token', request.url))
  }

  try {
    const result = await verifyToken(token)

    if (result.success) {
      return NextResponse.redirect(new URL('/login?verified=true', request.url))
    } else {
      return NextResponse.redirect(new URL('/login?error=invalid-token', request.url))
    }
  } catch (error) {
    console.error('[VerifyEmail] Error:', error)
    return NextResponse.redirect(new URL('/login?error=invalid-token', request.url))
  }
}
