'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'

const STORAGE_KEY = 'gp_cookie_consent'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const consent = localStorage.getItem(STORAGE_KEY)
      if (consent !== 'true') {
        setVisible(true)
      }
    } catch {
      // localStorage not available — show banner to be safe
      setVisible(true)
    }
  }, [])

  const handleAccept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // ignore
    }
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
              We use cookies to improve your experience. By continuing to
              browse, you agree to our use of{' '}
              <Link
                href="/privacy"
                className="text-sky-400 hover:text-sky-300 underline underline-offset-2 transition"
              >
                cookies
              </Link>
              .
            </p>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/privacy"
                className="text-sm text-white/50 hover:text-white/70 transition"
              >
                Learn More
              </Link>
              <button
                onClick={handleAccept}
                className="bg-sky-500 hover:bg-sky-500-light text-slate-900 font-semibold text-sm px-5 py-2 rounded-lg transition"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
