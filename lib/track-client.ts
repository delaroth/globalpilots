/**
 * Client-side tracking helpers.
 *
 * Each function fires a POST to /api/analytics/event and silently
 * swallows errors so it never blocks the UI.
 */

export function trackClick(category: string, label: string) {
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'nav_click', data: { category, label } }),
  }).catch(() => {})
}

export function trackInteraction(element: string, action: string, value?: string) {
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'ui_interaction', data: { element, action, value } }),
  }).catch(() => {})
}

export function trackConversion(type: string, data?: Record<string, any>) {
  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'conversion', data: { conversion_type: type, ...data } }),
  }).catch(() => {})
}
