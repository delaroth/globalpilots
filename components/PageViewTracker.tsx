'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { isInternalUser } from '@/lib/track-client'
import {
  ANALYTICS_CONSENT_EVENT,
  type AnalyticsConsent,
  getAnalyticsConsent,
} from '@/lib/analytics-consent'

// Referrer host → AI assistant label (tracks LLM-driven visits)
const AI_REFERRERS: [string, string][] = [
  ['chatgpt.com', 'ChatGPT'],
  ['chat.openai.com', 'ChatGPT'],
  ['perplexity.ai', 'Perplexity'],
  ['gemini.google.com', 'Gemini'],
  ['bard.google.com', 'Gemini'],
  ['copilot.microsoft.com', 'Copilot'],
  ['claude.ai', 'Claude'],
  ['you.com', 'You.com'],
  ['poe.com', 'Poe'],
  ['duckduckgo.com', 'DuckDuckGo'],
]

function classifyAIReferrer(host: string): string | null {
  for (const [domain, label] of AI_REFERRERS) {
    if (host === domain || host.endsWith(`.${domain}`)) return label
  }
  return null
}

/**
 * Tracks page views by calling /api/analytics/event on pathname change.
 * Debounces: won't re-track the same path within 5 seconds.
 * Generates a session_id in sessionStorage on first load.
 */
export default function PageViewTracker() {
  const pathname = usePathname()
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null)
  const lastTracked = useRef<{ path: string; at: number }>({ path: '', at: 0 })

  useEffect(() => {
    setConsent(getAnalyticsConsent())
    const onConsentChange = (event: Event) => {
      setConsent((event as CustomEvent<AnalyticsConsent>).detail)
    }
    window.addEventListener(ANALYTICS_CONSENT_EVENT, onConsentChange)
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, onConsentChange)
  }, [])

  useEffect(() => {
    if (!pathname || consent !== 'analytics') return

    const now = Date.now()
    // Debounce: skip if same page tracked within 5 seconds
    if (
      lastTracked.current.path === pathname &&
      now - lastTracked.current.at < 5000
    ) {
      return
    }

    lastTracked.current = { path: pathname, at: now }

    // Get or create session id
    let sessionId = ''
    let isNewSession = false
    try {
      sessionId = sessionStorage.getItem('gp_session_id') || ''
      if (!sessionId) {
        sessionId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
        sessionStorage.setItem('gp_session_id', sessionId)
        isNewSession = true
      }
    } catch {
      // sessionStorage not available (SSR or private browsing)
      sessionId = `anon-${Date.now()}`
    }

    // On the first page view of a session, capture where the visitor came from.
    // document.referrer persists across SPA navigations, so only the entry
    // page view gets tagged — otherwise every view in the session would.
    let entryData: Record<string, string> = {}
    if (isNewSession) {
      try {
        if (document.referrer) {
          const ref = new URL(document.referrer)
          if (ref.host && ref.host !== window.location.host) {
            entryData.referrer = ref.host
            const aiSource = classifyAIReferrer(ref.host)
            if (aiSource) entryData.ai_source = aiSource
          }
        }
      } catch {
        // unparsable referrer — skip
      }
    }

    // Tag founder traffic so the admin dashboard can exclude it
    if (isInternalUser()) entryData.internal = 'true'

    // Fire-and-forget
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'page_view',
        url: pathname,
        sessionId,
        ...(Object.keys(entryData).length > 0 && { data: entryData }),
      }),
    }).catch(() => {
      // silently ignore
    })
  }, [pathname, consent])

  return null
}
