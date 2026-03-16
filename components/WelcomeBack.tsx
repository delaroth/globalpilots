'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface TripData {
  id?: string
  destination?: string
  city?: string
  date?: string
  origin?: string
}

interface PassportData {
  stamps?: Array<{ code: string; city: string; date: string }>
  totalStamps?: number
}

export default function WelcomeBack() {
  const [visible, setVisible] = useState(false)
  const [lastTrip, setLastTrip] = useState<TripData | null>(null)
  const [stampCount, setStampCount] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Don't show if already dismissed this session
    if (sessionStorage.getItem('gp_wb_dismissed')) return

    // Check for trips data
    const tripsRaw = localStorage.getItem('gp_trips')
    const passportRaw = localStorage.getItem('gp_passport')

    let trip: TripData | null = null
    let stamps = 0

    if (tripsRaw) {
      try {
        const trips = JSON.parse(tripsRaw)
        if (Array.isArray(trips) && trips.length > 0) {
          trip = trips[trips.length - 1] // most recent
        }
      } catch { /* ignore */ }
    }

    if (passportRaw) {
      try {
        const passport: PassportData = JSON.parse(passportRaw)
        stamps = passport.totalStamps || passport.stamps?.length || 0
      } catch { /* ignore */ }
    }

    // Only show if we have some data to display
    if (trip || stamps > 0) {
      setLastTrip(trip)
      setStampCount(stamps)
      setVisible(true)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gp_wb_dismissed', '1')
    }
  }

  if (!visible) return null

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="relative rounded-2xl bg-gradient-to-r from-violet-500/10 to-sky-500/10 border border-white/10 p-4 sm:p-5">
        {/* Dismiss button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 text-white/30 hover:text-white/60 transition"
          aria-label="Dismiss"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center">
            <span className="text-lg">👋</span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm sm:text-base mb-1">
              Welcome back, traveler!
            </h3>

            <div className="space-y-1.5 text-white/60 text-xs sm:text-sm">
              {lastTrip && (
                <p>
                  Last trip: <span className="text-white/80">{lastTrip.city || lastTrip.destination || 'Unknown'}</span>
                  {lastTrip.date && (
                    <span className="text-white/40 ml-1">
                      ({new Date(lastTrip.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})
                    </span>
                  )}
                </p>
              )}

              {stampCount > 0 && (
                <p>
                  Passport stamps: <span className="text-sky-300 font-medium">{stampCount}</span>
                </p>
              )}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href="/mystery"
                className="px-3 py-1.5 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-medium hover:bg-sky-500/30 transition"
              >
                Search again
              </Link>
              <Link
                href="/inspire"
                className="px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-white/60 text-xs font-medium hover:bg-white/10 transition"
              >
                Get inspired
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
