'use client'

import { openCookieSettings } from '@/lib/analytics-consent'

export default function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={openCookieSettings}
      className="mt-4 text-sky-400 hover:text-sky-300 underline underline-offset-2"
    >
      Change analytics preference
    </button>
  )
}
