export const ANALYTICS_CONSENT_KEY = 'gp_analytics_consent'
export const ANALYTICS_CONSENT_EVENT = 'gp:analytics-consent-change'
export const OPEN_COOKIE_SETTINGS_EVENT = 'gp:open-cookie-settings'

export type AnalyticsConsent = 'analytics' | 'essential'

export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === 'undefined') return null

  try {
    const value = localStorage.getItem(ANALYTICS_CONSENT_KEY)
    if (value === 'analytics' || value === 'essential') return value
  } catch {
    // Storage may be unavailable in strict/private browser modes.
  }

  return null
}

export function setAnalyticsConsent(consent: AnalyticsConsent) {
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, consent)
    localStorage.removeItem('gp_cookie_consent')
  } catch {
    // The event still lets the current page respect the choice.
  }

  window.dispatchEvent(
    new CustomEvent<AnalyticsConsent>(ANALYTICS_CONSENT_EVENT, { detail: consent }),
  )
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_COOKIE_SETTINGS_EVENT))
}
