'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { trackBookingClick, markAsBooked } from '@/lib/travel-passport'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingTrackerProps {
  stampId: string
  type: 'flight' | 'hotel' | 'activity'
  provider: string
  href: string
  children: React.ReactNode
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BookingTracker({
  stampId,
  type,
  provider,
  href,
  children,
  className = '',
}: BookingTrackerProps) {
  const [showToast, setShowToast] = useState(false)
  const [showMarkBooked, setShowMarkBooked] = useState(false)
  const [markedBooked, setMarkedBooked] = useState(false)

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Track the click
      trackBookingClick(stampId, {
        type,
        provider,
        url: href,
      })

      // Show toast notification
      setShowToast(true)
      setTimeout(() => setShowToast(false), 3000)

      // Show "Mark as Booked" button after a short delay
      setTimeout(() => setShowMarkBooked(true), 1000)

      // Let the link open normally (target="_blank" handled by the anchor)
    },
    [stampId, type, provider, href],
  )

  const handleMarkBooked = useCallback(() => {
    markAsBooked(stampId)
    setMarkedBooked(true)
    setShowMarkBooked(false)

    // Dispatch custom event so PassportButton can react
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('passport-updated'))
    }
  }, [stampId])

  return (
    <div className="relative">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className={className}
      >
        {children}
      </a>

      {/* Toast notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap"
          >
            <div className="bg-navy-dark/95 border border-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-white/80 shadow-lg">
              Click tracked! Mark as booked when you complete your reservation.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mark as Booked button */}
      <AnimatePresence>
        {showMarkBooked && !markedBooked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <button
              onClick={handleMarkBooked}
              className="mt-2 w-full text-center text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg py-2 px-3 transition"
            >
              Did you complete the booking? Mark as Booked
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Booked confirmation */}
      <AnimatePresence>
        {markedBooked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 w-full text-center text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg py-2 px-3"
          >
            Booked! Added to your passport.
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
