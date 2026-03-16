import { NextRequest, NextResponse } from 'next/server'
import { trackRoute, getTrackedRoutes, deactivateRoute } from '@/lib/price-tracker'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * POST — Create a new price tracking alert
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(`price-track:${ip}`, 5, 60_000)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.resetMs / 1000)) } }
    )
  }

  try {
    const body = await request.json()
    const { email, origin, destination, targetPrice } = body

    // Validate
    if (!email || !origin || !destination || !targetPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: email, origin, destination, targetPrice' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    if (!/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination)) {
      return NextResponse.json(
        { error: 'origin and destination must be 3-letter IATA codes' },
        { status: 400 }
      )
    }

    if (targetPrice <= 0) {
      return NextResponse.json({ error: 'Target price must be greater than 0' }, { status: 400 })
    }

    const tracked = await trackRoute({ email, origin, destination, targetPrice })

    return NextResponse.json({
      success: true,
      route: {
        id: tracked.id,
        origin: tracked.origin,
        destination: tracked.destination,
        targetPrice: tracked.target_price,
        createdAt: tracked.created_at,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to track route.'
    const status = message.includes('already tracking') ? 409 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

/**
 * GET — List tracked routes for an email
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(`price-track:${ip}`, 5, 60_000)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429 }
    )
  }

  const email = request.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json({ error: 'Missing email parameter' }, { status: 400 })
  }

  try {
    const routes = await getTrackedRoutes(email)
    return NextResponse.json({
      routes: routes.map(r => ({
        id: r.id,
        origin: r.origin,
        destination: r.destination,
        targetPrice: r.target_price,
        createdAt: r.created_at,
      })),
      count: routes.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch routes.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

/**
 * DELETE — Deactivate a tracked route
 */
export async function DELETE(request: NextRequest) {
  const ip = getClientIp(request)
  const rl = rateLimit(`price-track:${ip}`, 5, 60_000)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { id, email } = body

    if (!id || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: id, email' },
        { status: 400 }
      )
    }

    await deactivateRoute(id, email)

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to deactivate.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
