'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  getSavedTrips,
  deleteTrip,
  clearTrips,
  markTripBooked,
  getTripCount,
} from '@/lib/trip-history'
import type { SavedTrip } from '@/lib/trip-history'

interface TripHistoryProps {
  isOpen: boolean
  onClose: () => void
  onSelectTrip: (trip: SavedTrip) => void
  onCompare: (trips: SavedTrip[]) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDepartDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TripHistory({
  isOpen,
  onClose,
  onSelectTrip,
  onCompare,
}: TripHistoryProps) {
  const [trips, setTrips] = useState<SavedTrip[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [confirmClear, setConfirmClear] = useState(false)
  const [tripCount, setTripCount] = useState(0)

  // Load trips when drawer opens
  useEffect(() => {
    if (isOpen) {
      setTrips(getSavedTrips())
      setTripCount(getTripCount())
      setSelected(new Set())
      setConfirmClear(false)
    }
  }, [isOpen])

  const handleToggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        // Max 3 for comparison
        if (next.size >= 3) return prev
        next.add(id)
      }
      return next
    })
  }, [])

  const handleDelete = useCallback((id: string) => {
    deleteTrip(id)
    setTrips((prev) => prev.filter((t) => t.id !== id))
    setSelected((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setTripCount((prev) => prev - 1)
  }, [])

  const handleMarkBooked = useCallback((id: string) => {
    markTripBooked(id)
    setTrips((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isBooked: true } : t))
    )
  }, [])

  const handleClearAll = useCallback(() => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    clearTrips()
    setTrips([])
    setSelected(new Set())
    setTripCount(0)
    setConfirmClear(false)
  }, [confirmClear])

  const handleCompare = useCallback(() => {
    const selectedTrips = trips.filter((t) => selected.has(t.id))
    if (selectedTrips.length >= 2) {
      onCompare(selectedTrips)
    }
  }, [trips, selected, onCompare])

  const canCompare = selected.size >= 2 && selected.size <= 3

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Drawer — right on desktop, bottom on mobile */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] z-50
              bg-navy-dark/95 backdrop-blur-xl border-l border-white/10
              flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-white">Your Trips</h2>
                {tripCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                    {tripCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white transition"
                aria-label="Close trip history"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Trip list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {trips.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="text-5xl mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1}
                      stroke="currentColor"
                      className="w-16 h-16 text-white/20 mx-auto"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                      />
                    </svg>
                  </div>
                  <p className="text-white/50 text-sm leading-relaxed">
                    No trips saved yet. Reveal a mystery destination to get
                    started!
                  </p>
                </div>
              ) : (
                trips.map((trip) => (
                  <motion.div
                    key={trip.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40 }}
                    className={`
                      bg-white/[0.04] border rounded-lg p-3 transition-colors
                      ${selected.has(trip.id)
                        ? 'border-emerald-500/40 bg-emerald-500/[0.06]'
                        : 'border-white/10 hover:border-white/20'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleSelect(trip.id)}
                        className={`
                          mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 transition-all
                          flex items-center justify-center
                          ${selected.has(trip.id)
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-white/30 hover:border-white/50'
                          }
                          ${!selected.has(trip.id) && selected.size >= 3
                            ? 'opacity-30 cursor-not-allowed'
                            : 'cursor-pointer'
                          }
                        `}
                        disabled={!selected.has(trip.id) && selected.size >= 3}
                        aria-label={`Select ${trip.destination} for comparison`}
                      >
                        {selected.has(trip.id) && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            className="w-3 h-3"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Trip info */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => onSelectTrip(trip)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {trip.enrichment?.flag && (
                            <span className="text-lg">{trip.enrichment.flag}</span>
                          )}
                          <h3 className="text-white font-semibold text-sm truncate">
                            {trip.destination}
                          </h3>
                          {trip.isBooked && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-wide">
                              Booked
                            </span>
                          )}
                        </div>

                        <p className="text-white/50 text-xs mb-1.5">
                          {trip.country}
                        </p>

                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-white/40">
                            Saved {formatDate(trip.timestamp)}
                          </span>
                          <span className="text-white/40">
                            Depart {formatDepartDate(trip.departDate)}
                          </span>
                        </div>

                        <div className="mt-2">
                          <span className="text-emerald-400 font-bold text-sm">
                            ${trip.totalCost.toLocaleString()}
                          </span>
                          <span className="text-white/40 text-xs ml-1">total</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {!trip.isBooked && (
                          <button
                            onClick={() => handleMarkBooked(trip.id)}
                            className="p-1.5 rounded hover:bg-emerald-500/20 text-white/40 hover:text-emerald-400 transition"
                            title="Mark as booked"
                          >
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
                                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(trip.id)}
                          className="p-1.5 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition"
                          title="Delete trip"
                        >
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
                              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Footer actions */}
            {trips.length > 0 && (
              <div className="px-4 py-3 border-t border-white/10 space-y-2">
                {/* Compare button */}
                <button
                  onClick={handleCompare}
                  disabled={!canCompare}
                  className={`
                    w-full py-2.5 rounded-lg font-semibold text-sm transition-all
                    ${canCompare
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30'
                      : 'bg-white/[0.04] text-white/30 border border-white/10 cursor-not-allowed'
                    }
                  `}
                >
                  {canCompare
                    ? `Compare ${selected.size} Trips`
                    : 'Select 2-3 trips to compare'}
                </button>

                {/* Clear all */}
                <button
                  onClick={handleClearAll}
                  className={`
                    w-full py-2 rounded-lg text-xs font-medium transition-all
                    ${confirmClear
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'text-white/30 hover:text-white/50'
                    }
                  `}
                >
                  {confirmClear ? 'Tap again to confirm clear all' : 'Clear All'}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
