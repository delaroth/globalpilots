'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import TripCostBadge from '@/components/TripCostBadge'
import ValueBadge from '@/components/ValueBadge'
import { calculateValueScore } from '@/lib/value-score'

// ── Types ────────────────────────────────────────────────────────────────────

interface InspireDestination {
  name: string
  country: string
  airportCode: string
  flightPrice: number | null
  hotelPrice: number | null
  startDate: string | null
  endDate: string | null
  airline: string | null
  thumbnail: string | null
  dailyCost: number | null
  budgetTier: 'budget' | 'mid-range' | 'comfort' | null
  flag: string | null
}

// ── Gradient palette ─────────────────────────────────────────────────────────

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
  'from-pink-600/80 to-rose-400/80',
  'from-cyan-600/80 to-emerald-400/80',
]

const INTERESTS = [
  { value: '', label: 'All' },
  { value: 'beaches', label: 'Beaches' },
  { value: 'outdoors', label: 'Outdoors' },
  { value: 'culture', label: 'Culture' },
  { value: 'food', label: 'Food' },
  { value: 'skiing', label: 'Skiing' },
]

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

function budgetTierColor(tier: string | null): string {
  switch (tier) {
    case 'budget':
      return 'text-emerald-400'
    case 'mid-range':
      return 'text-amber-400'
    case 'comfort':
      return 'text-rose-400'
    default:
      return 'text-white/60'
  }
}

function budgetTierBg(tier: string | null): string {
  switch (tier) {
    case 'budget':
      return 'bg-emerald-500/20 border-emerald-500/30'
    case 'mid-range':
      return 'bg-amber-500/20 border-amber-500/30'
    case 'comfort':
      return 'bg-rose-500/20 border-rose-500/30'
    default:
      return 'bg-white/10 border-white/20'
  }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function InspirePage() {
  const [destinations, setDestinations] = useState<InspireDestination[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Filter state
  const [origin, setOrigin] = useState('')
  const [budget, setBudget] = useState('')
  const [interest, setInterest] = useState('')
  const [sortBy, setSortBy] = useState<'price' | 'value'>('price')

  // Sorted destinations
  const displayDestinations = useMemo(() => {
    if (sortBy === 'value') {
      return [...destinations].sort((a, b) => {
        const aScore = (a.flightPrice && a.dailyCost)
          ? calculateValueScore({ flightPrice: a.flightPrice, dailyCost: a.dailyCost, airportCode: a.airportCode }).score
          : 0
        const bScore = (b.flightPrice && b.dailyCost)
          ? calculateValueScore({ flightPrice: b.flightPrice, dailyCost: b.dailyCost, airportCode: b.airportCode }).score
          : 0
        return bScore - aScore
      })
    }
    return destinations
  }, [destinations, sortBy])

  const fetchDestinations = useCallback(async () => {
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (origin.trim()) params.set('origin', origin.trim().toUpperCase())
    if (budget.trim()) params.set('budget', budget.trim())
    if (interest) params.set('interest', interest)

    try {
      const res = await fetch(`/api/inspire?${params.toString()}`)
      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many requests. Please wait a moment and try again.')
          setLoading(false)
          return
        }
        throw new Error(`HTTP ${res.status}`)
      }
      const data = await res.json()
      setDestinations(data.destinations || [])
    } catch {
      setError('Failed to load destinations. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [origin, budget, interest])

  useEffect(() => {
    fetchDestinations()
  }, [fetchDestinations])

  function buildMysteryLink(d: InspireDestination): string {
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
            Inspire Me
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-white/60 text-lg max-w-2xl mx-auto"
          >
            Not sure where to go? Scroll through destinations and find your next adventure.
          </motion.p>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mb-8"
        >
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] transition text-white/70 text-sm"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
            <svg
              className={`w-3.5 h-3.5 transition-transform ${filtersOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-4 flex flex-col sm:flex-row items-center gap-3 justify-center">
                  <div className="flex flex-col gap-1">
                    <label className="text-white/40 text-xs uppercase tracking-wide px-1">
                      Origin airport
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BKK"
                      maxLength={4}
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-32 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-sky-400/50 uppercase"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-white/40 text-xs uppercase tracking-wide px-1">
                      Max budget
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 1000"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-32 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-sky-400/50"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-white/40 text-xs uppercase tracking-wide px-1">
                      Interest
                    </label>
                    <select
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                      className="w-36 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/10 text-white text-sm focus:outline-none focus:border-sky-400/50 appearance-none cursor-pointer"
                    >
                      {INTERESTS.map((i) => (
                        <option
                          key={i.value}
                          value={i.value}
                          className="bg-[#1a1a2e] text-white"
                        >
                          {i.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-white/40 text-xs invisible">Go</label>
                    <button
                      onClick={fetchDestinations}
                      disabled={loading}
                      className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-medium text-sm transition disabled:opacity-50"
                    >
                      {loading ? 'Loading...' : 'Search'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Sort toggle */}
        <div className="flex items-center justify-center gap-2 mb-6">
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

        {/* Error state */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-400 mb-4">{error}</p>
            <button
              onClick={fetchDestinations}
              className="px-5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-sm transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-hidden animate-pulse"
              >
                <div className="h-40 sm:h-48 bg-white/[0.06]" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-white/[0.08] rounded w-3/4" />
                  <div className="h-3 bg-white/[0.06] rounded w-1/2" />
                  <div className="h-3 bg-white/[0.06] rounded w-2/3" />
                  <div className="h-8 bg-white/[0.06] rounded-lg mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Card grid */}
        {!loading && !error && displayDestinations.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayDestinations.map((d, i) => (
              <motion.div
                key={`${d.airportCode}-${i}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  delay: Math.min(i * 0.05, 0.8),
                  ease: 'easeOut',
                }}
                className="group relative rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08] hover:border-white/20 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30"
              >
                {/* Gradient background */}
                <div
                  className={`h-36 sm:h-44 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} relative`}
                >
                  {d.thumbnail && (
                    <img
                      src={d.thumbnail}
                      alt={d.name}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-40"
                      loading="lazy"
                    />
                  )}
                  {/* Overlay content on gradient */}
                  <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                    <div className="flex items-center gap-1.5 mb-1">
                      {d.flag && (
                        <span className="text-lg sm:text-xl">{d.flag}</span>
                      )}
                      <h3 className="text-white font-bold text-base sm:text-lg leading-tight truncate">
                        {d.name}
                      </h3>
                    </div>
                    <p className="text-white/70 text-xs sm:text-sm truncate">
                      {d.country}
                      {d.airportCode && (
                        <span className="text-white/40 ml-1.5">({d.airportCode})</span>
                      )}
                    </p>
                  </div>
                  {/* Budget tier badge */}
                  {d.budgetTier && (
                    <div
                      className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border ${budgetTierBg(d.budgetTier)} ${budgetTierColor(d.budgetTier)}`}
                    >
                      {d.budgetTier}
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="p-3 sm:p-4 space-y-2.5">
                  {/* Flight price + airline */}
                  <div className="flex items-center justify-between gap-2">
                    {d.flightPrice ? (
                      <div>
                        <span className="text-white font-bold text-base sm:text-lg">
                          From ${d.flightPrice}
                        </span>
                        {d.airline && (
                          <span className="text-white/40 text-xs ml-1.5 hidden sm:inline">
                            {d.airline}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-white/40 text-sm italic">
                        Price unavailable
                      </span>
                    )}
                    {d.dailyCost && (
                      <span className={`text-xs sm:text-sm font-medium ${budgetTierColor(d.budgetTier)}`}>
                        ${d.dailyCost}/day
                      </span>
                    )}
                  </div>

                  {/* Trip cost badge */}
                  {d.flightPrice && (
                    <TripCostBadge iata={d.airportCode} flightPrice={d.flightPrice} />
                  )}

                  {/* Value Badge */}
                  {d.flightPrice && d.dailyCost && (() => {
                    const vs = calculateValueScore({ flightPrice: d.flightPrice, dailyCost: d.dailyCost, airportCode: d.airportCode })
                    return <ValueBadge score={vs.score} label={vs.label} />
                  })()}

                  {/* Dates */}
                  {d.startDate && d.endDate && (
                    <p className="text-white/40 text-xs flex items-center gap-1">
                      <svg
                        className="w-3 h-3 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formatDate(d.startDate)} - {formatDate(d.endDate)}
                    </p>
                  )}

                  {/* CTA */}
                  <Link
                    href={buildMysteryLink(d)}
                    className="block w-full text-center py-2 sm:py-2.5 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs sm:text-sm font-medium hover:bg-sky-500/30 hover:text-white transition-colors"
                  >
                    Plan This Trip
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && displayDestinations.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🌍</div>
            <h2 className="text-white text-xl font-semibold mb-2">
              No destinations found
            </h2>
            <p className="text-white/50 mb-6 max-w-md mx-auto">
              Try adjusting your filters or using a different origin airport.
            </p>
            <button
              onClick={() => {
                setOrigin('')
                setBudget('')
                setInterest('')
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
