'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import {
  OPEN_COOKIE_SETTINGS_EVENT,
  getAnalyticsConsent,
  setAnalyticsConsent,
} from '@/lib/analytics-consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!getAnalyticsConsent()) setVisible(true)
  }, [])

  useEffect(() => {
    const open = () => setVisible(true)
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, open)
    return () => window.removeEventListener(OPEN_COOKIE_SETTINGS_EVENT, open)
  }, [])

  const choose = (consent: 'analytics' | 'essential') => {
    setAnalyticsConsent(consent)
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-sm border-t border-white/10"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-white/70 text-sm text-center sm:text-left">
              With your permission, we use PostHog analytics and privacy-masked
              session replay to understand how GlobePilot is used.{' '}
              <Link href="/privacy" className="text-sky-400 hover:text-sky-300 underline underline-offset-2 transition">
                Privacy details
              </Link>
              .
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={() => choose('essential')} className="border border-white/20 hover:bg-white/10 text-white/80 font-semibold text-sm px-5 py-2 rounded-lg transition">
                Essential only
              </button>
              <button onClick={() => choose('analytics')} className="bg-sky-500 hover:bg-sky-500-light text-slate-900 font-semibold text-sm px-5 py-2 rounded-lg transition">
                Allow analytics
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
