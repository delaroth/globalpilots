'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { saveTrip, tripExists } from '@/lib/trip-history'
import type { SavedTrip } from '@/lib/trip-history'

interface SaveTripButtonProps {
  destination: string
  country: string
  iata: string
  flightPrice: number
  totalCost: number
  tripDuration: number
  departDate: string
  origin: string
  vibes?: string[]
  enrichment?: SavedTrip['enrichment']
}

export default function SaveTripButton({
  destination,
  country,
  iata,
  flightPrice,
  totalCost,
  tripDuration,
  departDate,
  origin,
  vibes = [],
  enrichment,
}: SaveTripButtonProps) {
  const [saved, setSaved] = useState(false)
  const [animating, setAnimating] = useState(false)

  // Check if already saved on mount
  useEffect(() => {
    if (iata && departDate) {
      setSaved(tripExists(iata, departDate))
    }
  }, [iata, departDate])

  const handleSave = useCallback(() => {
    if (saved || animating) return

    setAnimating(true)

    const trip: SavedTrip = {
      id: crypto.randomUUID(),
      destination,
      country,
      iata,
      flightPrice,
      totalCost,
      tripDuration,
      departDate,
      origin,
      vibes,
      timestamp: Date.now(),
      isBooked: false,
      enrichment,
    }

    saveTrip(trip)
    setSaved(true)

    // Reset animation flag after animation completes
    setTimeout(() => setAnimating(false), 600)
  }, [saved, animating, destination, country, iata, flightPrice, totalCost, tripDuration, departDate, origin, vibes, enrichment])

  return (
    <motion.button
      onClick={handleSave}
      disabled={saved}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
        transition-colors duration-200 border
        ${saved
          ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 cursor-default'
          : 'bg-white/[0.06] hover:bg-white/[0.10] border-white/10 text-white/70 hover:text-white cursor-pointer'
        }
      `}
      whileTap={saved ? {} : { scale: 0.95 }}
    >
      <AnimatePresence mode="wait">
        {saved ? (
          <motion.span
            key="saved"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="flex items-center gap-2"
          >
            {/* Filled bookmark icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M6.32 2.577a49.255 49.255 0 0111.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 01-1.085.67L12 18.089l-7.165 3.583A.75.75 0 013.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93z"
                clipRule="evenodd"
              />
            </svg>
            {/* Checkmark */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
              />
            </svg>
            Saved!
          </motion.span>
        ) : (
          <motion.span
            key="save"
            initial={{ opacity: 1 }}
            exit={{ scale: 1.3, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2"
          >
            {/* Outline bookmark icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
              />
            </svg>
            Save Trip
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
