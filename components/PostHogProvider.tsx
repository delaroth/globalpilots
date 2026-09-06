'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  ANALYTICS_CONSENT_EVENT,
  type AnalyticsConsent,
  getAnalyticsConsent,
} from '@/lib/analytics-consent'
import { disablePostHog, loadPostHog } from '@/lib/posthog-client'
import { isInternalUser } from '@/lib/track-client'

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [consent, setConsent] = useState<AnalyticsConsent | null>(null)
  const identifiedUser = useRef<string | null>(null)

  useEffect(() => {
    setConsent(getAnalyticsConsent())
    const onConsentChange = (event: Event) => {
      setConsent((event as CustomEvent<AnalyticsConsent>).detail)
    }
    window.addEventListener(ANALYTICS_CONSENT_EVENT, onConsentChange)
    return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, onConsentChange)
  }, [])

  useEffect(() => {
    if (consent !== 'analytics' || isInternalUser()) {
      disablePostHog()
      return
    }
    const posthog = loadPostHog()
    posthog?.opt_in_capturing?.()
    posthog?.startSessionRecording?.()
  }, [consent])

  useEffect(() => {
    if (consent !== 'analytics' || isInternalUser()) return
    const posthog = loadPostHog()
    const userId = session?.user?.id
    if (!posthog) return

    if (status === 'authenticated' && userId && identifiedUser.current !== userId) {
      posthog.identify?.(userId)
      identifiedUser.current = userId
    } else if (status === 'unauthenticated' && identifiedUser.current) {
      posthog.reset?.()
      identifiedUser.current = null
    }
  }, [consent, session?.user?.id, status])

  useEffect(() => {
    if (!pathname || consent !== 'analytics' || isInternalUser()) return
    loadPostHog()?.capture?.('$pageview', {
      $current_url: `${window.location.origin}${pathname}`,
      path: pathname,
    })
  }, [consent, pathname])

  return children
}
