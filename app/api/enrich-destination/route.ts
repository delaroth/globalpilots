import { NextResponse } from 'next/server'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { enrichDestination, type EnrichmentParams } from '@/lib/enrichment'

export async function POST(request: Request) {
  // Rate limit: 30 req/min per IP
  const ip = getClientIp(request)
  const limiter = rateLimit(`enrich-destination:${ip}`, 30, 60 * 1000)

  if (!limiter.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again shortly.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(limiter.resetMs / 1000)),
          'X-RateLimit-Limit': String(limiter.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  // Parse request body
  let body: EnrichmentParams
  try {
    body = await request.json() as EnrichmentParams
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  // Validate required fields
  if (!body.cityName || !body.country || !body.iata || !body.departDate || !body.returnDate) {
    return NextResponse.json(
      { error: 'Missing required fields: cityName, country, iata, departDate, returnDate' },
      { status: 400 }
    )
  }

  // Validate date format (basic check)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(body.departDate) || !dateRegex.test(body.returnDate)) {
    return NextResponse.json(
      { error: 'Dates must be in YYYY-MM-DD format' },
      { status: 400 }
    )
  }

  try {
    const data = await enrichDestination(body)

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600',
        'X-RateLimit-Limit': String(limiter.limit),
        'X-RateLimit-Remaining': String(limiter.remaining),
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error during enrichment' },
      { status: 500 }
    )
  }
}
