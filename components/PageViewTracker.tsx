'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Tracks page views by calling /api/analytics/event on pathname change.
 * Debounces: won't re-track the same path within 5 seconds.
 * Generates a session_id in sessionStorage on first load.
 */
export default function PageViewTracker() {
  const pathname = usePathname()
  const lastTracked = useRef<{ path: string; at: number }>({ path: '', at: 0 })

  useEffect(() => {
    if (!pathname) return

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
    try {
      sessionId = sessionStorage.getItem('gp_session_id') || ''
      if (!sessionId) {
        sessionId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`
        sessionStorage.setItem('gp_session_id', sessionId)
      }
    } catch {
      // sessionStorage not available (SSR or private browsing)
      sessionId = `anon-${Date.now()}`
    }

    // Fire-and-forget
    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'page_view',
        url: pathname,
        sessionId,
      }),
    }).catch(() => {
      // silently ignore
    })
  }, [pathname])

  return null
}
