'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import TripCostBadge from '@/components/TripCostBadge'
import ValueBadge from '@/components/ValueBadge'
import { getDestinationCost } from '@/lib/destination-costs'
import { calculateValueScore } from '@/lib/value-score'

// ── Types ────────────────────────────────────────────────────────────────────

interface Deal {
  airportCode: string
  name: string
  country: string
  flightPrice: number | null
  hotelPrice: number | null
  startDate: string | null
  endDate: string | null
  airline: string | null
  stops: number | null
  thumbnail: string | null
  dailyCost: number | null
  bestMonths: number[]
  isBestMonth: boolean
}

// ── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  { value: 0, label: 'Anytime', short: 'Any' },
  { value: 1, label: 'January', short: 'Jan' },
  { value: 2, label: 'February', short: 'Feb' },
  { value: 3, label: 'March', short: 'Mar' },
  { value: 4, label: 'April', short: 'Apr' },
  { value: 5, label: 'May', short: 'May' },
  { value: 6, label: 'June', short: 'Jun' },
  { value: 7, label: 'July', short: 'Jul' },
  { value: 8, label: 'August', short: 'Aug' },
  { value: 9, label: 'September', short: 'Sep' },
  { value: 10, label: 'October', short: 'Oct' },
  { value: 11, label: 'November', short: 'Nov' },
  { value: 12, label: 'December', short: 'Dec' },
]

const GRADIENTS = [
  'from-blue-600/80 to-cyan-500/80',
  'from-violet-600/80 to-fuchsia-500/80',
  'from-emerald-600/80 to-teal-400/80',
  'from-orange-500/80 to-amber-400/80',
  'from-rose-600/80 to-pink-400/80',
  'from-indigo-600/80 to-sky-400/80',
  'from-teal-600/80 to-green-400/80',
  'from-fuchsia-600/80 to-purple-400/80',
  'from-amber-600/80 to-yellow-400/80',
  'from-sky-600/80 to-blue-400/80',
]

type ViewMode = 'deals' | 'quick-escape'

// ── Trip cost calculator for Quick Escape ───────────────────────────────────

function calcTotalTripCost(d: Deal, nights: number = 5): number | null {
  if (!d.flightPrice) return null
  const dest = getDestinationCost(d.airportCode)
  if (!dest) {
    // Fallback: use hotelPrice and dailyCost if available
    const hotel = (d.hotelPrice || 30) * nights
    const daily = (d.dailyCost || 40) * nights
    return Math.round(d.flightPrice + hotel + daily)
  }
  const budget = dest.dailyCosts.budget
  const dailyTotal = budget.hotel + budget.food + budget.transport + budget.activities
  return Math.round(d.flightPrice + dailyTotal * nights)
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function DealsPage() {
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [origin, setOrigin] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(0)
  const [monthName, setMonthName] = useState('Anytime')
  const [viewMode, setViewMode] = useState<ViewMode>('deals')
  const [sortBy, setSortBy] = useState<'price' | 'value'>('price')

  // Quick Escape: sort by total trip cost (flight + 5 nights of budget living)
  const displayDeals = useMemo(() => {
    let result = deals

    if (viewMode === 'quick-escape') {
      result = [...deals]
        .map(d => ({ ...d, totalTripCost: calcTotalTripCost(d) }))
        .filter(d => d.totalTripCost !== null)
        .sort((a, b) => (a.totalTripCost ?? Infinity) - (b.totalTripCost ?? Infinity))
    } else if (sortBy === 'value') {
      result = [...deals].sort((a, b) => {
        const aScore = (a.flightPrice && a.dailyCost)
          ? calculateValueScore({ flightPrice: a.flightPrice, dailyCost: a.dailyCost, airportCode: a.airportCode }).score
          : 0
        const bScore = (b.flightPrice && b.dailyCost)
          ? calculateValueScore({ flightPrice: b.flightPrice, dailyCost: b.dailyCost, airportCode: b.airportCode }).score
          : 0
        return bScore - aScore
      })
    }

    return result
  }, [deals, viewMode, sortBy])

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (origin.trim()) params.set('origin', origin.trim().toUpperCase())
    if (selectedMonth) params.set('month', String(selectedMonth))

    try {
      const res = await fetch(`/api/deals?${params.toString()}`)
      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many requests. Please wait a moment.')
          setLoading(false)
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      setDeals(data.deals || [])
      setMonthName(data.monthName || 'Anytime')
    } catch {
      setError('Failed to load deals. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [origin, selectedMonth])

  useEffect(() => {
    fetchDeals()
  }, [fetchDeals])

  function buildBookingLink(d: Deal): string {
    const dep = d.startDate || ''
    const ret = d.endDate || ''
    const base = `https://www.aviasales.com/search/${origin.trim().toUpperCase() || 'JFK'}${dep.replace(/-/g, '')}${d.airportCode}${ret.replace(/-/g, '')}1`
    return base
  }

  function buildMysteryLink(d: Deal): string {
    const params = new URLSearchParams()
    if (origin.trim()) params.set('origin', origin.trim().toUpperCase())
    if (d.airportCode) params.set('destination', d.airportCode)
    if (d.flightPrice) params.set('budget', String(Math.ceil(d.flightPrice * 1.5)))
    if (d.startDate) params.set('date', d.startDate)
    const qs = params.toString()
    return `/mystery${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <Navigation />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold text-white mb-3"
          >
            Seasonal Deals
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-white/60 text-lg max-w-2xl mx-auto"
          >
            Find the cheapest flights by month. The best time to fly, at the best price.
          </motion.p>
        </div>

        {/* Origin selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex items-center justify-center gap-3 mb-6"
        >
          <label className="text-white/50 text-sm">From:</label>
          <input
            type="text"
            placeholder="e.g. BKK"
            maxLength={4}
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            className="w-28 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-sky-400/50 uppercase"
          />
          <button
            onClick={fetchDeals}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm transition disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Search'}
          </button>
        </motion.div>

        {/* View mode tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.17 }}
          className="flex justify-center gap-2 mb-4"
        >
          <button
            onClick={() => setViewMode('deals')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              viewMode === 'deals'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] border border-white/10'
            }`}
          >
            All Deals
          </button>
          <button
            onClick={() => setViewMode('quick-escape')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
              viewMode === 'quick-escape'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] border border-white/10'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Escape
          </button>
        </motion.div>

        {viewMode === 'quick-escape' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-emerald-400/60 text-xs mb-4"
          >
            Sorted by total 5-day trip cost (flight + hotel + food + transport) using budget estimates
          </motion.p>
        )}

        {/* Month buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-2 mb-4"
        >
          {MONTHS.map((m) => (
            <button
              key={m.value}
              onClick={() => setSelectedMonth(m.value)}
              className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${
                selectedMonth === m.value
                  ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30'
                  : 'bg-white/[0.06] text-white/60 hover:bg-white/[0.1] hover:text-white/80 border border-white/10'
              }`}
            >
              <span className="hidden sm:inline">{m.label}</span>
              <span className="sm:hidden">{m.short}</span>
            </button>
          ))}
        </motion.div>

        {/* Sort toggle */}
        {viewMode === 'deals' && (
          <div className="flex items-center justify-center gap-2 mb-8">
            <span className="text-white/40 text-xs">Sort by:</span>
            <button
              onClick={() => setSortBy('price')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                sortBy === 'price'
                  ? 'bg-sky-500/20 border border-sky-500/30 text-sky-300'
                  : 'bg-white/[0.06] text-white/40 hover:text-white/60 border border-white/10'
              }`}
            >
              Price
            </button>
            <button
              onClick={() => setSortBy('value')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                sortBy === 'value'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                  : 'bg-white/[0.06] text-white/40 hover:text-white/60 border border-white/10'
              }`}
            >
              Value
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchDeals}
              className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-hidden animate-pulse"
              >
                <div className="h-32 sm:h-36 bg-white/[0.06]" />
                <div className="p-3 sm:p-4 space-y-2.5">
                  <div className="h-4 bg-white/[0.08] rounded w-3/4" />
                  <div className="h-3 bg-white/[0.06] rounded w-1/2" />
                  <div className="flex gap-2">
                    <div className="h-8 bg-white/[0.06] rounded-lg flex-1" />
                    <div className="h-8 bg-white/[0.06] rounded-lg flex-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Deals grid */}
        {!loading && !error && displayDeals.length > 0 && (
          <>
            <p className="text-center text-white/40 text-sm mb-6">
              {displayDeals.length} deal{displayDeals.length !== 1 ? 's' : ''} found for {monthName}
              {viewMode === 'quick-escape' && ' (sorted by total trip cost)'}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              <AnimatePresence>
                {displayDeals.map((d, i) => {
                  const totalTripCost = calcTotalTripCost(d)
                  const isCheapestTrip = viewMode === 'quick-escape' && i === 0

                  return (
                  <motion.div
                    key={`${d.airportCode}-${i}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.6) }}
                    className={`group rounded-2xl overflow-hidden bg-white/[0.04] border transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30 ${
                      isCheapestTrip
                        ? 'border-emerald-500/40 ring-1 ring-emerald-500/20'
                        : 'border-white/[0.08] hover:border-white/20'
                    }`}
                  >
                    {/* Gradient header */}
                    <div className={`h-28 sm:h-32 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} relative`}>
                      {d.thumbnail && (
                        <img
                          src={d.thumbnail}
                          alt={d.name}
                          className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
                          loading="lazy"
                        />
                      )}
                      <div className="absolute inset-0 flex flex-col justify-end p-3 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                        <h3 className="text-white font-bold text-sm sm:text-base leading-tight truncate">
                          {d.name}
                        </h3>
                        <p className="text-white/70 text-xs truncate">
                          {d.country}
                          <span className="text-white/40 ml-1">({d.airportCode})</span>
                        </p>
                      </div>
                      {/* Badges in top-right */}
                      <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
                        {isCheapestTrip && (
                          <div className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/40 border border-emerald-500/50 text-emerald-200 shadow-lg">
                            Cheapest Trip
                          </div>
                        )}
                        {d.isBestMonth && (
                          <div className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/30 border border-emerald-500/40 text-emerald-300">
                            Best Month
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-3 sm:p-4 space-y-2.5">
                      {/* Quick Escape: prominent total trip cost */}
                      {viewMode === 'quick-escape' && totalTripCost !== null && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2.5 py-1.5">
                          <div className="text-emerald-300 font-bold text-sm sm:text-base">
                            Total 5-day trip: ${totalTripCost.toLocaleString()}
                          </div>
                          <div className="text-emerald-300/50 text-[10px] mt-0.5">
                            Flight ${d.flightPrice}{d.dailyCost ? ` + ~$${Math.round((totalTripCost - (d.flightPrice || 0)) / 5)}/day x 5` : ''}
                          </div>
                        </div>
                      )}

                      {/* Price info */}
                      <div className="flex items-center justify-between">
                        {d.flightPrice ? (
                          <span className="text-white font-bold text-sm sm:text-base">
                            ${d.flightPrice}
                          </span>
                        ) : (
                          <span className="text-white/30 text-xs italic">
                            Price TBD
                          </span>
                        )}
                        {d.dailyCost && (
                          <span className="text-white/50 text-xs">
                            ${d.dailyCost}/day
                          </span>
                        )}
                      </div>

                      {/* TripCostBadge in normal mode */}
                      {viewMode === 'deals' && d.flightPrice && (
                        <TripCostBadge iata={d.airportCode} flightPrice={d.flightPrice} />
                      )}

                      {/* Value Badge */}
                      {d.flightPrice && d.dailyCost && (() => {
                        const vs = calculateValueScore({ flightPrice: d.flightPrice, dailyCost: d.dailyCost, airportCode: d.airportCode })
                        return <ValueBadge score={vs.score} label={vs.label} />
                      })()}

                      {/* Dates */}
                      {d.startDate && d.endDate && (
                        <p className="text-white/40 text-xs">
                          {formatDate(d.startDate)} - {formatDate(d.endDate)}
                          {d.airline && <span className="ml-1.5">{d.airline}</span>}
                        </p>
                      )}

                      {/* CTAs */}
                      <div className="flex gap-2">
                        {d.flightPrice ? (
                          <a
                            href={buildBookingLink(d)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center py-2 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-medium hover:bg-sky-500/30 transition"
                          >
                            Book
                          </a>
                        ) : (
                          <div className="flex-1" />
                        )}
                        <Link
                          href={buildMysteryLink(d)}
                          className="flex-1 text-center py-2 rounded-xl bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-medium hover:bg-violet-500/30 transition"
                        >
                          Mystery Trip
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* Empty state */}
        {!loading && !error && displayDeals.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📅</div>
            <h2 className="text-white text-xl font-semibold mb-2">
              No deals found for {monthName}
            </h2>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              Try a different month or origin airport.
            </p>
            <button
              onClick={() => {
                setSelectedMonth(0)
                setOrigin('')
              }}
              className="px-5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
