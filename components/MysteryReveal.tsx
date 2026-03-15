'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { buildBookingBundle, AFFILIATE_FLAGS } from '@/lib/affiliate'
import { trackActivity } from '@/lib/activity-feed'
import type { DestinationCost } from '@/lib/destination-costs'
import ClueReveal from '@/components/ClueReveal'
import ScratchReveal from '@/components/ScratchReveal'
import ConfettiCelebration from '@/components/ConfettiCelebration'
import SaveTripButton from '@/components/SaveTripButton'
import BookingTracker from '@/components/BookingTracker'
import AffiliateDisclosure from '@/components/AffiliateDisclosure'
import TripPrep from '@/components/TripPrep'
import { addStamp } from '@/lib/travel-passport'
import { countryNameToCode } from '@/lib/enrichment/country-data'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DailyActivity {
  time: string
  activity: string
  estimated_cost: number
}

interface DailyItinerary {
  day: number
  activities: DailyActivity[]
  total_day_cost: number
}

interface HotelRecommendation {
  name: string
  estimated_price_per_night: number
  neighborhood: string
  why_recommended: string
}

interface Destination {
  destination: string
  country: string
  city_code_IATA: string
  iata?: string
  estimated_flight_cost: number
  indicativeFlightPrice?: number
  estimated_hotel_per_night: number
  why_its_perfect: string
  whyThisPlace?: string
  day1: string[]
  day2: string[]
  day3: string[]
  best_local_food: string[]
  insider_tip: string
  localTip?: string
  priceIsEstimate?: boolean
  budgetBreakdown?: {
    flights: number
    hotel: number
    activities: number
    food: number
    total: number
  }
  budget_breakdown?: {
    flight: number
    hotel_total: number
    hotel_per_night: number
    activities: number
    local_transport: number
    food_estimate: number
    buffer: number
  }
  hotel_recommendations?: HotelRecommendation[]
  daily_itinerary?: DailyItinerary[]
  local_transportation?: {
    airport_to_city: string
    daily_transport: string
    estimated_daily_cost: number
  }
  blog_post_slug?: string
  itinerary?: { day: number; activities: string[] }[]
  bestTimeToGo?: string
  suggestedDepartureDate?: string
  suggestedReturnDate?: string
}

interface MysteryRevealProps {
  destination: Destination
  origin: string
  departDate: string
  tripDuration?: number
  onShowAnother: () => void
  onReroll?: () => void
  rerollCount?: number
  maxRerolls?: number
}

interface EnrichmentData {
  photos: { url: string; photographer: string; alt: string }[]
  country: {
    flag: string
    languages: string[]
    currency: { code: string; name: string; symbol: string }
    capital: string
    drivingSide: string
    timezones: string[]
  } | null
  visa: {
    status: 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required'
    maxStay?: number
    note?: string
  } | null
  climate: {
    avgTempC: number
    avgTempF: number
    rainyDays: number
    description: string
    packingTip: string
  } | null
  weather: {
    current: { tempC: number; description: string; icon: string }
    forecast: { date: string; highC: number; lowC: number; rain: number; description: string }[]
    packingTip: string
  } | null
  attractions: {
    name: string
    description: string
    distance: string
  }[] | null
  timezone: {
    timezone: string
    utcOffset: string
    currentTime: string
  } | null
  exchangeRate: { rate: number; formatted: string } | null
  safety: { level: 1 | 2 | 3 | 4; label: string } | null
  holidays: { date: string; name: string; localName: string }[]
}

type RevealPhase = 'clues' | 'scratch' | 'revealed'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const phaseTransition = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3, ease: 'easeIn' as const } },
}

function staggerChild(index: number) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, delay: index * 0.1, ease: 'easeOut' as const },
    },
  }
}

/** Tiny shimmer placeholder while enrichment data loads */
function ShimmerBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/[0.06] ${className}`}
      style={{ minHeight: 80 }}
    />
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MysteryReveal({
  destination,
  origin,
  departDate,
  onShowAnother,
  onReroll,
  rerollCount = 0,
  maxRerolls = 3,
  tripDuration = 3,
}: MysteryRevealProps) {
  const [phase, setPhase] = useState<RevealPhase>('clues')
  const bookingRef = useRef<HTMLDivElement>(null)
  const [shareUrl, setShareUrl] = useState('')
  const [sharing, setSharing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [dared, setDared] = useState(false)
  const [downloading, setDownloading] = useState(false)

  // Passport stamp
  const [stampId, setStampId] = useState<string | null>(null)

  // Enrichment
  const [enrichment, setEnrichment] = useState<EnrichmentData | null>(null)
  const [enrichmentLoading, setEnrichmentLoading] = useState(false)

  const iata = destination.city_code_IATA || destination.iata || ''
  const flightPrice =
    destination.indicativeFlightPrice || destination.estimated_flight_cost
  const isEstimate = destination.priceIsEstimate

  // Effective travel dates
  const effectiveDepartDate = destination.suggestedDepartureDate || departDate
  const effectiveReturnDate = (() => {
    if (destination.suggestedReturnDate) return destination.suggestedReturnDate
    const d = new Date(effectiveDepartDate + 'T00:00:00')
    d.setDate(d.getDate() + tripDuration)
    return d.toISOString().split('T')[0]
  })()

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  // Dynamically import destination-costs
  const [costData, setCostData] = useState<DestinationCost | undefined>(undefined)
  useEffect(() => {
    if (!iata) return
    import('@/lib/destination-costs').then((mod) => {
      setCostData(mod.getDestinationCost(iata))
    })
  }, [iata])

  // Build booking bundle
  const bookingBundle = buildBookingBundle({
    origin,
    destination: iata,
    cityName: destination.destination,
    departDate: effectiveDepartDate,
    nights: tripDuration,
    maxHotelPerNight:
      destination.budget_breakdown?.hotel_per_night ||
      destination.estimated_hotel_per_night ||
      undefined,
  })

  // Build clues for ClueReveal
  const clues = [
    {
      icon: destination.country ? '🌍' : '🗺️',
      label: 'Region',
      value: destination.country,
    },
    {
      icon: '💰',
      label: 'Flight from',
      value: `~$${flightPrice}`,
    },
    {
      icon: '🍜',
      label: 'Must-try dish',
      value: destination.best_local_food?.[0] || 'Local cuisine',
    },
    ...(destination.bestTimeToGo
      ? [{ icon: '📅', label: 'Best time', value: destination.bestTimeToGo }]
      : []),
  ].slice(0, 4)

  const totalCost =
    destination.budgetBreakdown?.total ||
    (destination.budget_breakdown
      ? Object.values(destination.budget_breakdown).reduce(
          (sum, val) => sum + val,
          0,
        )
      : destination.estimated_flight_cost +
        destination.estimated_hotel_per_night * 3)

  // ---- Handlers ----

  const handleFullReveal = useCallback(() => {
    setPhase('revealed')
    trackActivity('destination_revealed', {
      destination: destination.destination,
      country: destination.country,
    }).catch(() => {})

    // Add passport stamp
    try {
      const cc = countryNameToCode(destination.country) || ''
      const stamp = addStamp({
        destination: destination.destination,
        country: destination.country,
        countryCode: cc,
        iata,
        flag: '',
        revealedAt: Date.now(),
        departDate: effectiveDepartDate,
        totalCost,
        isBooked: false,
      })
      setStampId(stamp.id)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('passport-updated'))
      }
    } catch {
      // silently fail — passport is non-critical
    }
  }, [destination.destination, destination.country, iata, effectiveDepartDate, totalCost])

  // Scroll to booking buttons after full reveal
  useEffect(() => {
    if (phase === 'revealed' && bookingRef.current) {
      setTimeout(() => {
        bookingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 800)
    }
  }, [phase])

  // Fetch enrichment data when revealed
  useEffect(() => {
    if (phase !== 'revealed') return
    if (enrichment || enrichmentLoading) return

    setEnrichmentLoading(true)
    fetch('/api/enrich-destination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cityName: destination.destination,
        country: destination.country,
        iata,
        departDate: effectiveDepartDate,
        returnDate: effectiveReturnDate,
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: EnrichmentData | null) => {
        if (data) setEnrichment(data)
      })
      .catch(() => {})
      .finally(() => setEnrichmentLoading(false))
  }, [
    phase,
    enrichment,
    enrichmentLoading,
    destination.destination,
    destination.country,
    iata,
    effectiveDepartDate,
    effectiveReturnDate,
  ])

  // OG image URL for sharing
  const ogImageUrl = `/api/og/mystery?dest=${encodeURIComponent(destination.destination)}&country=${encodeURIComponent(destination.country)}&price=${totalCost}&duration=${tripDuration}&origin=${encodeURIComponent(origin)}`

  const handleShare = async () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    }

    setSharing(true)
    try {
      const res = await fetch('/api/trips/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          origin,
          departDate,
          ogImage: ogImageUrl,
        }),
      })

      if (!res.ok) throw new Error('Failed to save trip')

      const data = await res.json()
      const url = `${window.location.origin}/trips/${data.id}`
      setShareUrl(url)
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const url = `${window.location.origin}/mystery?dest=${encodeURIComponent(destination.destination)}`
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } finally {
      setSharing(false)
    }
  }

  const handleDare = async () => {
    const dareMessage = `I got ${destination.destination} for $${totalCost} \u2014 can you beat it? Plan your mystery vacation at globepilots.com/mystery`
    const dareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/mystery`

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mystery Trip Dare',
          text: dareMessage,
          url: dareUrl,
        })
      } else {
        await navigator.clipboard.writeText(dareMessage)
      }
    } catch {
      // User cancelled native share or clipboard failed — try clipboard as last resort
      try {
        await navigator.clipboard.writeText(dareMessage)
      } catch {
        // silently fail
      }
    }
    setDared(true)
    setTimeout(() => setDared(false), 2500)
  }

  const handleDownloadStoryCard = async () => {
    setDownloading(true)
    try {
      const flag = enrichment?.country?.flag || ''
      const cardUrl = `/api/og/mystery-card?dest=${encodeURIComponent(destination.destination)}&country=${encodeURIComponent(destination.country)}&price=${totalCost}&duration=${tripDuration}&origin=${encodeURIComponent(origin)}&flag=${encodeURIComponent(flag)}`
      const res = await fetch(cardUrl)
      if (!res.ok) throw new Error('Failed to fetch story card')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mystery-trip-${destination.destination.toLowerCase().replace(/\s+/g, '-')}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // silently fail
    } finally {
      setDownloading(false)
    }
  }

  // Hero background: use enrichment photo if available
  const heroPhoto = enrichment?.photos?.[0]

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="max-w-4xl mx-auto">
      <AnimatePresence mode="wait">
        {/* ================================================================
            PHASE 1 — CLUE REVEAL
        ================================================================ */}
        {phase === 'clues' && (
          <motion.div key="clues" {...phaseTransition} className="text-center">
            <ClueReveal
              clues={clues}
              destinationName={destination.destination}
              country={destination.country}
              onComplete={() => setPhase('scratch')}
            />
            <button
              onClick={() => setPhase('revealed')}
              className="mt-4 text-xs text-white/30 hover:text-white/50 transition"
            >
              Skip to reveal
            </button>
          </motion.div>
        )}

        {/* ================================================================
            PHASE 2 — SCRATCH REVEAL
        ================================================================ */}
        {phase === 'scratch' && (
          <motion.div key="scratch" {...phaseTransition} className="text-center">
            <ScratchReveal
              destinationName={destination.destination}
              country={destination.country}
              onRevealed={handleFullReveal}
            />
            <button
              onClick={handleFullReveal}
              className="mt-4 text-xs text-white/30 hover:text-white/50 transition"
            >
              Skip
            </button>
          </motion.div>
        )}

        {/* ================================================================
            PHASE 3 — FULL REVEALED CARD
        ================================================================ */}
        {phase === 'revealed' && (
          <motion.div key="revealed" {...phaseTransition}>
            {/* Confetti fires on reveal */}
            <ConfettiCelebration active={phase === 'revealed'} duration={4000} intensity="high" />

            <div className="bg-white/[0.04] backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/10">
              {/* ---- Hero header ---- */}
              <div className="h-64 relative overflow-hidden">
                {heroPhoto ? (
                  <>
                    <img
                      src={heroPhoto.url}
                      alt={heroPhoto.alt}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/60 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-skyblue via-skyblue-dark to-navy">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-9xl">
                        {enrichment?.country?.flag || '🌍'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-navy/90 to-transparent p-6">
                  <motion.h2
                    {...staggerChild(0)}
                    className="text-4xl font-bold text-white drop-shadow-lg"
                  >
                    {destination.destination}
                  </motion.h2>
                  <motion.p {...staggerChild(1)} className="text-xl text-skyblue-light">
                    {enrichment?.country?.flag ? `${enrichment.country.flag} ` : ''}
                    {destination.country}
                  </motion.p>
                  <motion.p {...staggerChild(2)} className="text-sm text-white/80 mt-1">
                    {formatDate(effectiveDepartDate)} &rarr;{' '}
                    {formatDate(effectiveReturnDate)} &middot; {tripDuration} nights
                  </motion.p>
                </div>
              </div>

              {/* ---- Card body ---- */}
              <div className="p-8 space-y-6">
                {/* Blog link */}
                {destination.blog_post_slug && (
                  <motion.div {...staggerChild(3)}>
                    <Link
                      href={`/blog/${destination.blog_post_slug}`}
                      className="block bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 hover:bg-amber-500/20 transition"
                    >
                      <p className="text-amber-300 font-semibold flex items-center gap-2">
                        <span>
                          Read our complete travel guide for{' '}
                          {destination.destination}
                        </span>
                        <span className="ml-auto">&rarr;</span>
                      </p>
                    </Link>
                  </motion.div>
                )}

                {/* ---- Budget Breakdown ---- */}
                <motion.div {...staggerChild(4)}>
                  {destination.budget_breakdown ? (
                    <div className="bg-white/[0.06] border border-emerald-500/20 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">
                        Budget Breakdown
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-xs text-white/50">Flight</p>
                          <p className="text-lg font-bold text-emerald-400">
                            {isEstimate ? '~' : ''}$
                            {destination.budget_breakdown.flight}
                            {isEstimate ? ' est.' : ''}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-white/50">Hotel (total)</p>
                          <p className="text-lg font-bold text-emerald-400">
                            ${destination.budget_breakdown.hotel_total}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-white/50">Activities</p>
                          <p className="text-lg font-bold text-emerald-400">
                            ${destination.budget_breakdown.activities}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-white/50">Total</p>
                          <p className="text-2xl font-bold text-emerald-400">
                            ${totalCost}
                          </p>
                        </div>
                      </div>
                      {destination.budget_breakdown.local_transport > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center text-sm">
                          <div>
                            <p className="text-xs text-white/50">Transport</p>
                            <p className="font-semibold text-emerald-400/80">
                              ${destination.budget_breakdown.local_transport}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/50">Food</p>
                            <p className="font-semibold text-emerald-400/80">
                              ${destination.budget_breakdown.food_estimate}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-white/50">Buffer</p>
                            <p className="font-semibold text-emerald-400/80">
                              ${destination.budget_breakdown.buffer}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : destination.budgetBreakdown ? (
                    <div className="bg-white/[0.06] border border-emerald-500/20 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">
                        Budget Breakdown
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-white/50">Flights</p>
                          <p className="text-lg font-bold text-emerald-400">
                            {isEstimate ? '~' : ''}$
                            {destination.budgetBreakdown.flights}
                            {isEstimate ? ' est.' : ''}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-white/50">Hotel</p>
                          <p className="text-lg font-bold text-emerald-400">
                            ${destination.budgetBreakdown.hotel}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-white/50">Activities</p>
                          <p className="text-lg font-bold text-emerald-400">
                            ${destination.budgetBreakdown.activities}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-white/50">Total</p>
                          <p className="text-2xl font-bold text-emerald-400">
                            ${destination.budgetBreakdown.total}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/[0.06] border border-emerald-500/20 rounded-xl p-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-white/50">Flight</p>
                          <p className="text-2xl font-bold text-emerald-400">
                            {isEstimate ? '~' : ''}${flightPrice}
                            {isEstimate ? ' est.' : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/50">
                            Hotel ({tripDuration} nights)
                          </p>
                          <p className="text-2xl font-bold text-emerald-400">
                            ${destination.estimated_hotel_per_night * tripDuration}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/50">Total</p>
                          <p className="text-2xl font-bold text-emerald-400">
                            ${totalCost}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Price disclaimer */}
                <motion.p
                  {...staggerChild(5)}
                  className="text-xs text-white/40 text-center"
                >
                  {isEstimate
                    ? `~$${flightPrice} est. is an estimated price based on regional averages. Actual price confirmed on booking.`
                    : `~$${flightPrice} is an indicative cached price. Actual price confirmed on Aviasales.`}
                </motion.p>

                {/* Why It's Perfect */}
                <motion.div {...staggerChild(6)}>
                  <div className="bg-white/[0.04] backdrop-blur-sm rounded-xl p-5 border border-white/10">
                    <h3 className="text-xl font-bold text-white mb-2">
                      Why This Destination?
                    </h3>
                    <p className="text-white/70">
                      {destination.whyThisPlace || destination.why_its_perfect}
                    </p>
                  </div>
                </motion.div>

                {/* Best Time to Go */}
                {destination.bestTimeToGo && (
                  <motion.div {...staggerChild(7)}>
                    <div className="bg-skyblue/10 border border-skyblue/20 rounded-lg p-4">
                      <p className="text-sm text-white/80">
                        <span className="font-semibold text-skyblue-light">
                          Best time to go:
                        </span>{' '}
                        {destination.bestTimeToGo}
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Hotel Recommendations */}
                {destination.hotel_recommendations &&
                  destination.hotel_recommendations.length > 0 && (
                    <motion.div {...staggerChild(8)}>
                      <h3 className="text-xl font-bold text-white mb-3">
                        Where to Stay
                      </h3>
                      <div className="space-y-3">
                        {destination.hotel_recommendations.map((hotel, idx) => (
                          <div
                            key={idx}
                            className="bg-white/[0.04] backdrop-blur-sm rounded-lg p-4 border border-white/10"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-white">
                                {hotel.name}
                              </h4>
                              <p className="text-emerald-400 font-bold whitespace-nowrap ml-4">
                                ${hotel.estimated_price_per_night}/night
                              </p>
                            </div>
                            <p className="text-sm text-white/50 mb-1">
                              {hotel.neighborhood}
                            </p>
                            <p className="text-sm text-white/70">
                              {hotel.why_recommended}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                {/* ---- Itinerary ---- */}
                <motion.div {...staggerChild(9)}>
                  {destination.daily_itinerary &&
                  destination.daily_itinerary.length > 0 ? (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">
                        Your Daily Itinerary
                      </h3>
                      <div className="space-y-4">
                        {destination.daily_itinerary.map((day) => (
                          <div
                            key={day.day}
                            className="bg-white/[0.04] backdrop-blur-sm rounded-lg p-4 border border-white/10"
                          >
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-semibold text-white">
                                Day {day.day}
                              </h4>
                              <span className="text-sm font-semibold text-emerald-400">
                                Daily total: ${day.total_day_cost}
                              </span>
                            </div>
                            <div className="space-y-2">
                              {day.activities.map((activity, idx) => (
                                <div
                                  key={idx}
                                  className="flex justify-between items-start"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-skyblue-light">
                                      {activity.time}
                                    </p>
                                    <p className="text-white/70">
                                      {activity.activity}
                                    </p>
                                  </div>
                                  <p className="text-sm font-semibold text-white/50 ml-4">
                                    ${activity.estimated_cost}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : destination.itinerary &&
                    destination.itinerary.length > 0 ? (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">
                        Your Itinerary
                      </h3>
                      <div className="space-y-4">
                        {destination.itinerary.map((day) => (
                          <div
                            key={day.day}
                            className="bg-white/[0.04] backdrop-blur-sm rounded-lg p-4 border border-white/10"
                          >
                            <h4 className="font-semibold text-white mb-2">
                              Day {day.day}
                            </h4>
                            <ul className="space-y-1">
                              {day.activities.map((activity, idx) => (
                                <li
                                  key={idx}
                                  className="text-white/70 flex items-start"
                                >
                                  <span className="text-skyblue mr-2">
                                    &bull;
                                  </span>
                                  {activity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">
                        Your {tripDuration}-Day Adventure
                      </h3>
                      <div className="space-y-4">
                        {[
                          { label: 'Day 1', items: destination.day1 },
                          { label: 'Day 2', items: destination.day2 },
                          { label: 'Day 3', items: destination.day3 },
                        ].map(({ label, items }) => (
                          <div
                            key={label}
                            className="bg-white/[0.04] backdrop-blur-sm rounded-lg p-4 border border-white/10"
                          >
                            <h4 className="font-semibold text-white mb-2">
                              {label}
                            </h4>
                            <ul className="space-y-1">
                              {items?.map((activity, idx) => (
                                <li
                                  key={idx}
                                  className="text-white/70 flex items-start"
                                >
                                  <span className="text-skyblue mr-2">
                                    &bull;
                                  </span>
                                  {activity}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Local Transportation */}
                {destination.local_transportation && (
                  <motion.div {...staggerChild(10)}>
                    <div className="bg-skyblue/10 border border-skyblue/20 rounded-lg p-4">
                      <h3 className="text-lg font-bold text-white mb-3">
                        Getting Around
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <p className="font-semibold text-white/70">
                            Airport to City:
                          </p>
                          <p className="text-white/50">
                            {destination.local_transportation.airport_to_city}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-white/70">
                            Daily Transport:
                          </p>
                          <p className="text-white/50">
                            {destination.local_transportation.daily_transport}
                          </p>
                        </div>
                        <p className="text-emerald-400 font-semibold">
                          Estimated daily cost: $
                          {destination.local_transportation.estimated_daily_cost}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Food */}
                <motion.div {...staggerChild(11)}>
                  <h3 className="text-xl font-bold text-white mb-3">
                    Must-Try Local Food
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {destination.best_local_food?.map((food, idx) => (
                      <span
                        key={idx}
                        className="bg-amber-500/10 border border-amber-500/20 text-amber-300 px-4 py-2 rounded-full text-sm font-medium"
                      >
                        {food}
                      </span>
                    ))}
                  </div>
                </motion.div>

                {/* Insider Tip */}
                <motion.div {...staggerChild(12)}>
                  <div className="bg-amber-500/10 border-l-4 border-amber-500/40 p-4 rounded-r-lg">
                    <h3 className="font-semibold text-white mb-1">
                      Insider Tip
                    </h3>
                    <p className="text-white/70">
                      {destination.localTip || destination.insider_tip}
                    </p>
                  </div>
                </motion.div>

                {/* Daily Costs Mini-Breakdown from destination-costs data */}
                {costData && (
                  <motion.div {...staggerChild(13)}>
                    <div className="bg-white/[0.04] backdrop-blur-sm rounded-xl p-5 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-white">
                          Daily Costs in {costData.city}
                        </h3>
                        <Link
                          href={`/trip-cost?dest=${costData.code}`}
                          className="text-xs text-skyblue-light hover:text-skyblue font-medium transition"
                        >
                          Full calculator &rarr;
                        </Link>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {(['budget', 'mid', 'comfort'] as const).map((t) => {
                          const d = costData.dailyCosts[t]
                          const total =
                            d.hotel + d.food + d.transport + d.activities
                          const tierLabel =
                            t === 'budget'
                              ? 'Budget'
                              : t === 'mid'
                                ? 'Mid-Range'
                                : 'Comfort'
                          return (
                            <div
                              key={t}
                              className="bg-white/[0.06] rounded-lg p-3 text-center border border-white/[0.06]"
                            >
                              <p className="text-xs text-white/40 font-medium mb-1">
                                {tierLabel}
                              </p>
                              <p className="text-xl font-bold text-white">
                                ${total}
                              </p>
                              <p className="text-xs text-white/30">per day</p>
                              <div className="mt-2 space-y-0.5 text-xs text-white/40">
                                <div className="flex justify-between">
                                  <span>Hotel</span>
                                  <span>${d.hotel}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Food</span>
                                  <span>${d.food}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Transport</span>
                                  <span>${d.transport}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Activities</span>
                                  <span>${d.activities}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ============================================================
                    BOOKING BUTTONS
                ============================================================ */}
                <motion.div {...staggerChild(14)} ref={bookingRef} className="space-y-3">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    Book Your Trip
                    <AffiliateDisclosure />
                  </h3>

                  {/* Flight */}
                  <BookingTracker
                    stampId={stampId || ''}
                    type="flight"
                    provider={AFFILIATE_FLAGS.kiwi ? 'Kiwi' : 'Aviasales'}
                    href={bookingBundle.flightUrl}
                    className="block w-full bg-emerald-500/90 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl text-center"
                  >
                    Book Flights (~$
                    {isEstimate ? `${flightPrice} est.` : flightPrice})
                    <span className="block text-sm font-normal mt-1 opacity-90">
                      {formatDate(effectiveDepartDate)} &middot;{' '}
                      {AFFILIATE_FLAGS.kiwi
                        ? 'Book on Kiwi'
                        : 'Book on Aviasales'}
                    </span>
                  </BookingTracker>

                  {/* Hotel */}
                  <BookingTracker
                    stampId={stampId || ''}
                    type="hotel"
                    provider="Agoda"
                    href={bookingBundle.hotelUrl}
                    className="block w-full bg-blue-500/90 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl text-center"
                  >
                    Find Hotels (~${destination.estimated_hotel_per_night}
                    /night)
                    <span className="block text-sm font-normal mt-1 opacity-90">
                      {formatDate(effectiveDepartDate)} &ndash;{' '}
                      {formatDate(effectiveReturnDate)} &middot; Search on Agoda
                    </span>
                  </BookingTracker>

                  {/* Activities */}
                  <BookingTracker
                    stampId={stampId || ''}
                    type="activity"
                    provider="GetYourGuide"
                    href={bookingBundle.activitiesUrl}
                    className="block w-full bg-purple-500/90 hover:bg-purple-500 text-white font-bold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl text-center"
                  >
                    Book Activities
                    <span className="block text-sm font-normal mt-1 opacity-90">
                      Browse on GetYourGuide
                    </span>
                  </BookingTracker>
                </motion.div>

                {/* ============================================================
                    DESTINATION INTEL (Enrichment Data)
                ============================================================ */}
                <motion.div {...staggerChild(15)}>
                  {enrichmentLoading ? (
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-white mb-4">
                        Destination Intel
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <ShimmerBlock />
                        <ShimmerBlock />
                        <ShimmerBlock />
                        <ShimmerBlock />
                      </div>
                    </div>
                  ) : enrichment ? (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">
                        Destination Intel
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Weather (live) or Climate (fallback) */}
                        {enrichment.weather ? (
                          <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base">{enrichment.weather.current.icon}</span>
                              <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                Weather Now
                              </span>
                            </div>
                            <p className="text-white font-medium text-sm">
                              {enrichment.weather.current.tempC}&deg;C &middot;{' '}
                              {enrichment.weather.current.description}
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                              {enrichment.weather.packingTip}
                            </p>
                          </div>
                        ) : enrichment.climate ? (
                          <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base">🌤️</span>
                              <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                Climate
                              </span>
                            </div>
                            <p className="text-white font-medium text-sm">
                              {enrichment.climate.avgTempC}&deg;C &middot;{' '}
                              {enrichment.climate.description}
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                              {enrichment.climate.packingTip}
                            </p>
                          </div>
                        ) : null}

                        {/* Visa */}
                        {enrichment.visa && (
                          <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base">🛂</span>
                              <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                Visa
                              </span>
                            </div>
                            <p className="text-white font-medium text-sm">
                              {enrichment.visa.status.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                              {enrichment.visa.maxStay
                                ? `, ${enrichment.visa.maxStay} days`
                                : ''}
                            </p>
                            {enrichment.visa.note && (
                              <p className="text-xs text-white/40 mt-1">
                                {enrichment.visa.note}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Currency / Exchange */}
                        {(enrichment.country?.currency || enrichment.exchangeRate) && (
                          <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base">💱</span>
                              <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                Currency
                              </span>
                            </div>
                            <p className="text-white font-medium text-sm">
                              {enrichment.country?.currency
                                ? `${enrichment.country.currency.code} (${enrichment.country.currency.symbol})`
                                : ''}
                            </p>
                            {enrichment.exchangeRate && (
                              <p className="text-xs text-white/40 mt-1">
                                {enrichment.exchangeRate.formatted}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Driving Side */}
                        {enrichment.country?.drivingSide && (
                          <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base">🚗</span>
                              <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                Driving
                              </span>
                            </div>
                            <p className="text-white font-medium text-sm">
                              {enrichment.country.drivingSide
                                .charAt(0)
                                .toUpperCase() +
                                enrichment.country.drivingSide.slice(1)}{' '}
                              side
                            </p>
                          </div>
                        )}

                        {/* Safety */}
                        {enrichment.safety && (
                          <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base">🛡️</span>
                              <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                Safety
                              </span>
                            </div>
                            <p className="text-white font-medium text-sm">
                              Level {enrichment.safety.level} &mdash;{' '}
                              {enrichment.safety.label}
                            </p>
                          </div>
                        )}

                        {/* Languages */}
                        {enrichment.country?.languages &&
                          enrichment.country.languages.length > 0 && (
                            <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base">🗣️</span>
                                <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                  Language
                                </span>
                              </div>
                              <p className="text-white font-medium text-sm">
                                {enrichment.country.languages.slice(0, 3).join(', ')}
                              </p>
                            </div>
                          )}

                        {/* Timezone */}
                        {enrichment.timezone && (
                          <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base">🕐</span>
                              <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                Local Time
                              </span>
                            </div>
                            <p className="text-white font-medium text-sm">
                              {enrichment.timezone.currentTime}
                            </p>
                            <p className="text-xs text-white/40 mt-1">
                              {enrichment.timezone.utcOffset} &middot;{' '}
                              {enrichment.timezone.timezone.replace(/_/g, ' ')}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 3-Day Weather Forecast */}
                      {enrichment.weather && enrichment.weather.forecast.length > 0 && (
                        <div className="mt-3 bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">📅</span>
                            <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                              3-Day Forecast
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {enrichment.weather.forecast.slice(0, 3).map((day) => (
                              <div key={day.date} className="text-center">
                                <p className="text-xs text-white/50">
                                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </p>
                                <p className="text-white font-medium text-sm mt-1">
                                  {day.highC}&deg; / {day.lowC}&deg;
                                </p>
                                <p className="text-xs text-white/40">
                                  {day.description}
                                </p>
                                {day.rain > 0 && (
                                  <p className="text-xs text-blue-300/60 mt-0.5">
                                    {day.rain}mm rain
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Top Attractions */}
                      {enrichment.attractions && enrichment.attractions.length > 0 && (
                        <div className="mt-3 bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">📍</span>
                            <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                              Nearby Attractions
                            </span>
                          </div>
                          <div className="space-y-2">
                            {enrichment.attractions.slice(0, 5).map((a, idx) => (
                              <div key={idx} className="flex gap-2">
                                <span className="text-xs text-white/30 mt-0.5 shrink-0">{idx + 1}.</span>
                                <div className="min-w-0">
                                  <p className="text-white font-medium text-sm">
                                    {a.name}
                                    <span className="text-white/30 font-normal ml-1.5 text-xs">
                                      {a.distance}
                                    </span>
                                  </p>
                                  <p className="text-xs text-white/40 line-clamp-2">
                                    {a.description}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Holidays during trip */}
                      {enrichment.holidays && enrichment.holidays.length > 0 && (
                        <div className="mt-3 bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">🎉</span>
                            <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                              During your trip
                            </span>
                          </div>
                          <div className="space-y-1">
                            {enrichment.holidays.map((h, idx) => (
                              <p key={idx} className="text-sm text-white/70">
                                <span className="text-white font-medium">
                                  {h.name}
                                </span>{' '}
                                ({new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})
                                {h.localName !== h.name && (
                                  <span className="text-white/40">
                                    {' '}
                                    &mdash; {h.localName}
                                  </span>
                                )}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </motion.div>

                {/* ---- Trip Prep: Phrasebook, Packing, Practical ---- */}
                {enrichment?.country && (
                  <motion.div {...staggerChild(16)}>
                    <TripPrep
                      countryCode={countryNameToCode(destination.country) || ''}
                      cityName={destination.destination}
                      climate={enrichment.climate || undefined}
                      tripDuration={tripDuration}
                    />
                  </motion.div>
                )}

                {/* ---- Continue Planning Links ---- */}
                <motion.div {...staggerChild(17)}>
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                    <span className="text-xs text-white/30 mr-1">
                      Continue planning:
                    </span>
                    {origin && (
                      <Link
                        href={`/explore?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(iata)}`}
                        className="text-sm text-skyblue-light hover:text-skyblue transition"
                      >
                        Layover routes to {destination.destination}
                      </Link>
                    )}
                    <Link
                      href={`/trip-cost?destination=${encodeURIComponent(iata)}`}
                      className="text-sm text-skyblue-light hover:text-skyblue transition"
                    >
                      Daily costs in {destination.destination}
                    </Link>
                    <Link
                      href={`/search?destination=${encodeURIComponent(iata)}`}
                      className="text-sm text-skyblue-light hover:text-skyblue transition"
                    >
                      Search more flights
                    </Link>
                  </div>
                </motion.div>

                {/* ---- Re-roll Section ---- */}
                {onReroll && (
                  <motion.div {...staggerChild(18)}>
                    <div className="border-t border-white/10 pt-6">
                      {rerollCount < maxRerolls ? (
                        <div className="text-center">
                          <p className="text-sm text-white/40 mb-3">
                            Surprise #{rerollCount + 1} of {maxRerolls}
                          </p>
                          <button
                            onClick={onReroll}
                            className="inline-flex items-center gap-2 bg-white/[0.06] hover:bg-white/[0.10] text-white/80 font-semibold py-3 px-8 rounded-full transition-all transform hover:scale-105 border border-white/10 hover:border-white/20"
                          >
                            <span className="text-xl">🎲</span>
                            Not feeling it? Try another!
                          </button>
                        </div>
                      ) : (
                        <div className="text-center bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                          <p className="text-amber-300 font-semibold">
                            🎯 Run out of surprises! Adjust your budget or
                            preferences for more options.
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ---- Save Trip + Show Another + Share ---- */}
                <motion.div {...staggerChild(19)}>
                  {/* Save Trip */}
                  <div className="mb-4 flex justify-center">
                    <SaveTripButton
                      destination={destination.destination}
                      country={destination.country}
                      iata={iata}
                      flightPrice={flightPrice}
                      totalCost={totalCost}
                      tripDuration={tripDuration}
                      departDate={effectiveDepartDate}
                      origin={origin}
                      vibes={[]}
                      enrichment={enrichment ? {
                        climate: enrichment.climate || undefined,
                        visa: enrichment.visa || undefined,
                        flag: enrichment.country?.flag,
                      } : undefined}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={onShowAnother}
                      className="bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl"
                    >
                      Show Me Another
                    </button>
                    <button
                      onClick={handleShare}
                      disabled={sharing}
                      className="bg-white/[0.06] hover:bg-white/[0.10] text-white/80 font-medium py-4 px-6 rounded-lg transition border border-white/10 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {sharing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : copied ? (
                        <>
                          <svg
                            className="w-5 h-5 text-emerald-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Link Copied!
                        </>
                      ) : (
                        'Share This Trip'
                      )}
                    </button>
                  </div>
                </motion.div>

                {/* Share URL display */}
                {shareUrl && (
                  <motion.div {...staggerChild(20)}>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                      <p className="text-sm font-semibold text-emerald-400 mb-2">
                        Shareable link created!
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          className="flex-1 bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2 text-sm text-white/70 focus:outline-none focus:border-emerald-500/30"
                          onClick={(e) =>
                            (e.target as HTMLInputElement).select()
                          }
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(shareUrl)
                            setCopied(true)
                            setTimeout(() => setCopied(false), 2000)
                          }}
                          className="bg-emerald-500/90 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded-lg transition text-sm whitespace-nowrap"
                        >
                          {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ---- Dare a Friend + Download Story Card ---- */}
                <motion.div {...staggerChild(21)}>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Dare a Friend */}
                    <button
                      onClick={handleDare}
                      className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/20 hover:border-purple-500/40 text-white font-semibold py-4 px-5 rounded-lg transition-all group text-left"
                    >
                      {dared ? (
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-5 h-5 text-emerald-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span className="text-emerald-400">Dare sent!</span>
                        </div>
                      ) : (
                        <>
                          <span className="flex items-center gap-2 text-base">
                            <span>&#9889;</span> Dare a Friend
                          </span>
                          <span className="block text-xs text-white/50 mt-1 font-normal group-hover:text-white/60 transition">
                            Dare a friend to beat your deal
                          </span>
                        </>
                      )}
                    </button>

                    {/* Download Story Card */}
                    <button
                      onClick={handleDownloadStoryCard}
                      disabled={downloading}
                      className="bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-white font-semibold py-4 px-5 rounded-lg transition-all group text-left disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {downloading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                          <span className="text-white/70">Downloading...</span>
                        </div>
                      ) : (
                        <>
                          <span className="flex items-center gap-2 text-base">
                            <svg
                              className="w-5 h-5 text-white/70 group-hover:text-white/90 transition"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                              />
                            </svg>
                            Download Story Card
                          </span>
                          <span className="block text-xs text-white/50 mt-1 font-normal group-hover:text-white/60 transition">
                            Share on Instagram / TikTok
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
