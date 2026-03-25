import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Health check endpoint — verifies external service connectivity.
 * Also serves as a function warmer when called by Vercel cron.
 */
export async function GET() {
  const start = Date.now()
  const checks: Record<string, 'ok' | 'error' | 'missing'> = {}

  // Check DeepSeek API key is configured
  checks.deepseek = process.env.DEEPSEEK_API_KEY ? 'ok' : 'missing'

  // Check Anthropic API key is configured
  checks.anthropic = process.env.ANTHROPIC_API_KEY ? 'ok' : 'missing'

  // Check SerpApi key is configured
  checks.serpapi = process.env.SERPAPI_KEY ? 'ok' : 'missing'

  // Check Supabase connectivity
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      checks.supabase = 'missing'
    } else {
      const res = await fetch(`${url}/rest/v1/destination_cache?select=iata&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(5000),
      })
      checks.supabase = (res.ok || res.status === 406) ? 'ok' : 'error'
    }
  } catch {
    checks.supabase = 'error'
  }

  // Check currency API
  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR', {
      signal: AbortSignal.timeout(5000),
    })
    checks.currency = res.ok ? 'ok' : 'error'
  } catch {
    checks.currency = 'error'
  }

  const duration = Date.now() - start
  const allOk = Object.values(checks).every(v => v === 'ok')

  return NextResponse.json({
    status: allOk ? 'healthy' : 'degraded',
    checks,
    duration_ms: duration,
    timestamp: new Date().toISOString(),
  }, {
    status: allOk ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
