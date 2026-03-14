'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { getPassport } from '@/lib/travel-passport'
import TravelPassport from '@/components/TravelPassport'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PassportButton() {
  const [stampCount, setStampCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [pulse, setPulse] = useState(false)

  const refresh = useCallback(() => {
    const passport = getPassport()
    const newCount = passport.stamps.length
    if (newCount > stampCount && stampCount > 0) {
      // New stamp added — pulse the button
      setPulse(true)
      setTimeout(() => setPulse(false), 2000)
    }
    setStampCount(newCount)
  }, [stampCount])

  // Initial load
  useEffect(() => {
    refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for passport updates (dispatched by BookingTracker or addStamp callers)
  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener('passport-updated', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('passport-updated', handler)
      window.removeEventListener('storage', handler)
    }
  }, [refresh])

  // Re-check on modal close (in case user made changes)
  const handleClose = useCallback(() => {
    setIsOpen(false)
    refresh()
  }, [refresh])

  // Don't render if no stamps
  if (stampCount === 0 && !isOpen) return null

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-40
          flex items-center gap-2
          bg-white/[0.06] hover:bg-white/[0.10]
          border border-white/10
          backdrop-blur-sm
          rounded-full
          px-4 py-2.5
          text-sm font-medium text-white/80 hover:text-white
          shadow-lg
          transition-colors
          ${pulse ? 'ring-2 ring-skyblue/50 ring-offset-2 ring-offset-navy-dark' : ''}
        `}
        animate={
          pulse
            ? {
                scale: [1, 1.08, 1, 1.05, 1],
              }
            : {}
        }
        transition={{ duration: 0.6 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-base">{'\u{1F30D}'}</span>
        <span>Passport</span>
        <span className="bg-white/10 rounded-full px-2 py-0.5 text-xs font-semibold text-skyblue-light">
          {stampCount}
        </span>
      </motion.button>

      {/* Passport modal */}
      <TravelPassport isOpen={isOpen} onClose={handleClose} />
    </>
  )
}
