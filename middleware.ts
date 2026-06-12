import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'

// AI crawler user-agent fragments → readable bot name.
// Logged to user_events so the admin dashboard can show which assistants
// are reading the site (leading indicator of LLM citations/referrals).
const AI_BOTS: [string, string][] = [
  ['oai-searchbot', 'OpenAI SearchBot'],
  ['chatgpt-user', 'ChatGPT (live browse)'],
  ['gptbot', 'GPTBot (OpenAI training)'],
  ['claude-searchbot', 'Claude SearchBot'],
  ['claude-web', 'Claude (live browse)'],
  ['claudebot', 'ClaudeBot (Anthropic)'],
  ['anthropic-ai', 'Anthropic AI'],
  ['perplexity-user', 'Perplexity (live browse)'],
  ['perplexitybot', 'PerplexityBot'],
  ['google-extended', 'Google-Extended (Gemini)'],
  ['duckassistbot', 'DuckAssistBot'],
  ['bytespider', 'Bytespider (ByteDance)'],
  ['amazonbot', 'Amazonbot'],
  ['applebot-extended', 'Applebot-Extended'],
  ['meta-externalagent', 'Meta AI'],
  ['ccbot', 'CCBot (Common Crawl)'],
  ['mistralai', 'MistralAI'],
  ['cohere', 'Cohere'],
]

function detectAIBot(ua: string): string | null {
  const lower = ua.toLowerCase()
  for (const [fragment, name] of AI_BOTS) {
    if (lower.includes(fragment)) return name
  }
  return null
}

export function middleware(request: NextRequest, event: NextFetchEvent) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; img-src 'self' https: data: blob:; style-src 'self' 'unsafe-inline'; font-src 'self' https: data:; connect-src 'self' https:; frame-ancestors 'none'")
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // Log AI crawler visits (fire-and-forget via waitUntil — zero latency cost).
  // Page routes only; API/static noise excluded by matcher + this check.
  const path = request.nextUrl.pathname
  if (!path.startsWith('/api/')) {
    const ua = request.headers.get('user-agent') || ''
    const bot = detectAIBot(ua)
    if (bot) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (supabaseUrl && anonKey) {
        event.waitUntil(
          fetch(`${supabaseUrl}/rest/v1/user_events`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
              Prefer: 'return=minimal',
            },
            body: JSON.stringify({
              event_type: 'ai_crawler',
              event_data: { bot, ua: ua.slice(0, 200) },
              page_url: path,
            }),
          }).catch(() => {})
        )
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
