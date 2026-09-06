import { getAnalyticsConsent } from '@/lib/analytics-consent'

type PostHogProperties = Record<string, unknown>

interface PostHogClient extends Array<unknown> {
  __loaded?: boolean
  __SV?: number
  _i?: unknown[][]
  init?: (token: string, config: PostHogProperties, name?: string) => void
  capture?: (event: string, properties?: PostHogProperties) => void
  identify?: (distinctId: string, properties?: PostHogProperties) => void
  reset?: () => void
  opt_in_capturing?: () => void
  opt_out_capturing?: () => void
  startSessionRecording?: () => void
  stopSessionRecording?: () => void
  people?: PostHogClient
  [key: string]: unknown
}

declare global {
  interface Window {
    posthog?: PostHogClient
  }
}

const STUB_METHODS = [
  'capture', 'identify', 'reset', 'opt_in_capturing', 'opt_out_capturing',
  'startSessionRecording', 'stopSessionRecording', 'register', 'register_once',
  'unregister', 'get_distinct_id', 'get_session_id', 'onFeatureFlags',
  'getFeatureFlag', 'isFeatureEnabled', 'captureException',
] as const

function addStub(target: PostHogClient, method: string) {
  target[method] = (...args: unknown[]) => target.push([method, ...args])
}

/** Loads PostHog's official browser bundle only after analytics consent. */
export function loadPostHog(): PostHogClient | null {
  if (typeof window === 'undefined' || getAnalyticsConsent() !== 'analytics') return null

  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  const apiHost = process.env.NEXT_PUBLIC_POSTHOG_HOST
  if (!token || !apiHost) return null
  if (window.posthog?.__loaded || window.posthog?._i) return window.posthog

  const posthog = [] as unknown as PostHogClient
  posthog.__SV = 1
  posthog._i = []
  posthog.people = [] as unknown as PostHogClient
  for (const method of STUB_METHODS) addStub(posthog, method)

  posthog.init = (projectToken, config, name) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.crossOrigin = 'anonymous'
    script.async = true
    script.src = `${apiHost.replace('.i.posthog.com', '-assets.i.posthog.com')}/static/array.js`
    script.onerror = () => {
      if (window.posthog === posthog) window.posthog = undefined
    }
    document.head.appendChild(script)
    posthog._i?.push([projectToken, config, name])
  }

  window.posthog = posthog
  posthog.init?.(token, {
    api_host: apiHost,
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://app.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,
    capture_pageleave: true,
    autocapture: true,
    mask_all_text: true,
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '*',
      maskCapturedNetworkRequestFn: (request: { name?: string }) => {
        if (request.name) request.name = request.name.split('?')[0]
        return request
      },
    },
  })

  return posthog
}

export function capturePostHog(event: string, properties?: PostHogProperties) {
  if (typeof window === 'undefined' || getAnalyticsConsent() !== 'analytics') return
  window.posthog?.capture?.(event, properties)
}

export function disablePostHog() {
  window.posthog?.stopSessionRecording?.()
  window.posthog?.opt_out_capturing?.()
}
