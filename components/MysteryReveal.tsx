'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'motion/react'
import { buildBookingBundle, AFFILIATE_FLAGS } from '@/lib/affiliate'
import { trackActivity } from '@/lib/activity-feed'
import type { DestinationCost } from '@/lib/destination-costs'
import dynamic from 'next/dynamic'

const SaveTripButton = dynamic(() => import('@/components/SaveTripButton'), {
  loading: () => <div className="h-10 w-32 animate-pulse bg-white/[0.04] rounded-lg" />,
})
import BookingTracker from '@/components/BookingTracker'
import ItineraryDetail from '@/components/ItineraryDetail'
import AffiliateDisclosure from '@/components/AffiliateDisclosure'
const TripPrep = dynamic(() => import('@/components/TripPrep'), {
  loading: () => <div className="h-32 animate-pulse bg-white/[0.04] rounded-xl" />,
})
import { addStamp } from '@/lib/travel-passport'
import { countryNameToCode } from '@/lib/enrichment/country-data'
import { hasSupportedCharacters } from '@/lib/enrichment/attractions'
import { useToast } from '@/components/Toast'

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
  link?: string
  rating?: number
  reviews?: number
  type?: string
  is_real_data?: boolean
}

interface Destination {
  destination: string
  country: string
  city_code_IATA: string
  iata?: string
  bestOriginCode?: string
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
    user_budget?: number
    estimated_total?: number
    over_budget?: boolean
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
  // Google Flights real-time pricing
  googleFlightsPrice?: number
  googleFlightsPriceLevel?: string
  googleFlightsTypicalRange?: [number, number]
  googleFlightsPriceHistory?: [number, number][]
  googleFlightsAirlines?: string[]
  googleFlightsStops?: number
  googleFlightsDuration?: string
  googleFlightsCarbonEmissions?: { thisFlightKg: number; typicalKg: number; differencePercent: number }
  googleFlightsAirlineLogos?: string[]
  priceIsLive?: boolean
  cachedBasicInfo?: {
    climateHint: string
    languages: string[]
    currency: string
    timezone: string
    dailyCosts: { budget: number; mid: number; comfort: number }
    topAttractions: string[]
    bestMonths: number[]
    localFood: string[]
    safetyLevel: string
    plugType: string
    tippingCustom: string
  } | null
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
  detailsLoading?: boolean
  /** Currency formatter: takes USD amount, returns formatted string in user's currency */
  currencyFormat?: (amountUSD: number) => string
  /** User's total budget in USD (for over-budget warnings) */
  userBudgetUSD?: number
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

// Progressive reveal — no guessing game, content appears as data loads

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

/** Shimmer line placeholder for AI details loading */
function Shimmer({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-white/[0.06] rounded ${className || 'h-4 w-full'}`} />
}

/** Wrapper that fades content in when it becomes available */
function FadeIn({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <div
      className="transition-opacity duration-500 ease-out"
      style={{ opacity: visible ? 1 : 0 }}
    >
      {children}
    </div>
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
  detailsLoading = false,
  currencyFormat,
  userBudgetUSD,
}: MysteryRevealProps) {
  const { toast } = useToast()
  // Currency formatting: use provided formatter or default to USD
  // Guard: if price is 0 or falsy, show "Check prices" instead of "$0"
  const rawFmt = currencyFormat || ((usd: number) => `$${usd}`)
  const fmt = (amount: number) => (!amount ? 'Check prices' : rawFmt(amount))
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
  const enrichmentAttempted = useRef(false)

  const iata = destination.city_code_IATA || destination.iata || ''

  // Generic data availability — true when cached/generic AI content has been populated
  const hasGenericData = !!(
    (destination.whyThisPlace || destination.why_its_perfect) &&
    destination.best_local_food && destination.best_local_food.length > 0
  )

  // Personalized data availability — true when itinerary + hotels have been populated
  const hasPersonalizedData = !!(
    (destination.daily_itinerary && destination.daily_itinerary.length > 0) ||
    (destination.itinerary && destination.itinerary.length > 0) ||
    (destination.day1 && destination.day1.length > 0)
  )

  // Backward compat alias
  const hasAIDetails = hasGenericData
  const flightPrice =
    destination.indicativeFlightPrice || destination.estimated_flight_cost
  const isEstimate = destination.priceIsEstimate
  const isLivePrice = destination.priceIsLive

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

  // Email capture
  const [captureEmail, setCaptureEmail] = useState('')
  const [emailCaptured, setEmailCaptured] = useState(false)

  const [emailError, setEmailError] = useState('')
  const handleEmailCapture = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!captureEmail) return
    setEmailError('')
    try {
      const res = await fetch('/api/price-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: captureEmail,
          origin: origin || 'ANY',
          destination: iata,
          targetPrice: flightPrice || 500,
        }),
      })
      if (!res.ok) throw new Error()
      setEmailCaptured(true)
    } catch {
      setEmailError('Could not save — please try again')
    }
  }

  // Dynamically import destination-costs + seasonal data
  const [costData, setCostData] = useState<DestinationCost | undefined>(undefined)
  const [seasonLabel, setSeasonLabel] = useState<'peak' | 'shoulder' | 'low' | null>(null)
  useEffect(() => {
    if (!iata) return
    import('@/lib/destination-costs').then((mod) => {
      setCostData(mod.getDestinationCost(iata))
      const travelMonth = effectiveDepartDate ? new Date(effectiveDepartDate + 'T00:00:00').getMonth() + 1 : undefined
      setSeasonLabel(mod.getSeasonLabel(iata, travelMonth))
    })
  }, [iata, effectiveDepartDate])

  // Build booking bundle
  // Use the specific airport with the best price for booking links (e.g., BKK not BKK,DMK)
  const bookingOrigin = destination.bestOriginCode || origin
  const bookingBundle = buildBookingBundle({
    origin: bookingOrigin,
    destination: iata,
    cityName: destination.destination,
    departDate: effectiveDepartDate,
    nights: tripDuration,
    maxHotelPerNight:
      destination.budget_breakdown?.hotel_per_night ||
      destination.estimated_hotel_per_night ||
      undefined,
    country: destination.country,
  })

  // Derive a climate hint from the country name (no API data needed)
  const getClimateHint = (country: string): string => {
    const c = country.toLowerCase()
    const tropical = ['thailand', 'vietnam', 'cambodia', 'laos', 'myanmar', 'indonesia', 'malaysia', 'philippines', 'singapore', 'india', 'sri lanka', 'maldives', 'costa rica', 'panama', 'colombia', 'ecuador', 'peru', 'brazil', 'mexico', 'cuba', 'dominican republic', 'jamaica', 'kenya', 'tanzania', 'nigeria', 'ghana', 'madagascar', 'fiji', 'bali']
    const desert = ['egypt', 'morocco', 'tunisia', 'jordan', 'israel', 'oman', 'uae', 'united arab emirates', 'qatar', 'saudi arabia', 'bahrain', 'kuwait']
    const cold = ['iceland', 'norway', 'sweden', 'finland', 'russia', 'canada', 'greenland', 'alaska']
    const mediterranean = ['greece', 'italy', 'spain', 'portugal', 'croatia', 'turkey', 'cyprus', 'malta', 'montenegro', 'albania']
    if (tropical.some(t => c.includes(t))) return 'Tropical — warm & humid, pack light clothes'
    if (desert.some(t => c.includes(t))) return 'Arid & warm — sunscreen essential'
    if (cold.some(t => c.includes(t))) return 'Cool climate — pack warm layers'
    if (mediterranean.some(t => c.includes(t))) return 'Mediterranean — sunny & pleasant'
    return 'Temperate — pack layers for variable weather'
  }

  // Flight info for display
  const airlineInfo = destination.googleFlightsAirlines?.[0]
  const stopsInfo = destination.googleFlightsStops

  const totalCost =
    destination.budget_breakdown?.user_budget ||
    destination.budgetBreakdown?.total ||
    userBudgetUSD ||
    (destination.budget_breakdown
      ? destination.budget_breakdown.flight + destination.budget_breakdown.hotel_total + destination.budget_breakdown.activities + destination.budget_breakdown.food_estimate
      : destination.estimated_flight_cost +
        destination.estimated_hotel_per_night * 3)

  // ---- Auto-trigger on mount: stamp + tracking ----
  const hasTracked = useRef(false)
  useEffect(() => {
    if (hasTracked.current || !destination.destination) return
    hasTracked.current = true

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

  // Fetch enrichment data once when we have a valid city name (not an IATA code)
  useEffect(() => {
    if (enrichmentAttempted.current) return
    if (enrichment || enrichmentLoading) return
    // Don't fetch if destination looks like a bare IATA code (3 uppercase letters)
    const name = destination.destination || ''
    if (!name || /^[A-Z]{3}$/.test(name)) return
    if (!destination.country) return

    enrichmentAttempted.current = true
    setEnrichmentLoading(true)
    fetch('/api/enrich-destination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cityName: name,
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
      toast('Link copied to clipboard', 'success')
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
      toast('Shareable link created and copied', 'success')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const url = `${window.location.origin}/mystery?dest=${encodeURIComponent(destination.destination)}`
      navigator.clipboard.writeText(url)
      toast('Link copied (couldn\'t save full trip details)', 'info')
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
        toast('Dare shared!', 'success')
      } else {
        await navigator.clipboard.writeText(dareMessage)
        toast('Dare copied to clipboard', 'success')
      }
    } catch {
      try {
        await navigator.clipboard.writeText(dareMessage)
        toast('Dare copied to clipboard', 'success')
      } catch {
        toast('Could not share — try copying manually', 'error')
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
      toast('Story card downloaded', 'success')
    } catch {
      toast('Could not generate story card', 'error')
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
    <div className="pb-20 lg:pb-0">
      {/* Progressive reveal — content appears as data loads */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
      >
            <div>
              {/* ---- Hero header — full width ---- */}
              <div className="h-56 sm:h-72 lg:h-80 relative overflow-hidden">
                {heroPhoto ? (
                  <>
                    <Image
                      src={heroPhoto.url}
                      alt={heroPhoto.alt || `${destination.destination}, ${destination.country}`}
                      fill
                      className="object-cover"
                      priority
                      sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(10,15,30,1)] via-[rgba(10,15,30,0.4)] to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-sky-600/80 via-sky-700/60 to-transparent">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10rem] opacity-30">
                        {enrichment?.country?.flag || '🌍'}
                      </span>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:px-12">
                  <div className="max-w-6xl mx-auto">
                    <motion.h2
                      {...staggerChild(0)}
                      className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg"
                    >
                      {destination.destination}
                    </motion.h2>
                    <motion.p {...staggerChild(1)} className="text-xl sm:text-2xl text-sky-300 mt-1">
                      {enrichment?.country?.flag ? `${enrichment.country.flag} ` : ''}
                      {destination.country}
                    </motion.p>
                    <motion.p {...staggerChild(2)} className="text-sm sm:text-base text-white/70 mt-2">
                      {formatDate(effectiveDepartDate)} &rarr;{' '}
                      {formatDate(effectiveReturnDate)} &middot; {tripDuration} nights
                      {seasonLabel && (
                        <span className={`ml-2 inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          seasonLabel === 'peak' ? 'bg-amber-500/20 text-amber-300' :
                          seasonLabel === 'low' ? 'bg-emerald-500/20 text-emerald-300' :
                          'bg-sky-500/20 text-sky-300'
                        }`}>
                          {seasonLabel === 'peak' ? 'Peak season' : seasonLabel === 'low' ? 'Low season' : 'Shoulder season'}
                        </span>
                      )}
                    </motion.p>
                  </div>
                </div>
              </div>

              {/* ---- Content body — 2-column grid on desktop ---- */}
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-x-10">

                {/* Blog link */}
                {destination.blog_post_slug && (
                  <motion.div {...staggerChild(3)} className="lg:col-span-2">
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
                <motion.div {...staggerChild(4)} className="lg:col-span-2">
                  {destination.budget_breakdown ? (
                    <div className={`bg-white/[0.06] border rounded-xl p-6 ${destination.budget_breakdown.over_budget ? 'border-amber-500/30' : 'border-emerald-500/20'}`}>
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2 flex-wrap">
                        Estimated Costs
                        {isLivePrice ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Live prices</span>
                        ) : isEstimate ? (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Estimated</span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400">Cached prices</span>
                        )}
                      </h3>
                      {/* Over-budget warning */}
                      {destination.budget_breakdown.over_budget && destination.budget_breakdown.user_budget && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                          <p className="text-amber-300 text-sm font-medium">
                            Estimated cost ({fmt(destination.budget_breakdown.estimated_total || 0)}) exceeds your budget ({fmt(destination.budget_breakdown.user_budget)})
                          </p>
                          <p className="text-amber-300/60 text-xs mt-1">
                            Try increasing your budget, shortening the trip, or choosing a closer destination.
                          </p>
                        </div>
                      )}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        <div className="text-center min-w-0">
                          <p className="text-xs text-white/60">Flight</p>
                          <p className="text-lg font-bold text-emerald-400">
                            {isEstimate ? '~' : ''}{fmt(destination.budget_breakdown.flight)}
                            {isEstimate ? ' est.' : ''}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-white/60">Hotel ({tripDuration} nights)</p>
                          <p className="text-lg font-bold text-emerald-400">
                            {fmt(destination.budget_breakdown.hotel_total)}
                          </p>
                          <p className="text-xs text-white/50">{fmt(destination.budget_breakdown.hotel_per_night)}/night</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-white/60">Activities</p>
                          <p className="text-lg font-bold text-emerald-400">
                            {fmt(destination.budget_breakdown.activities)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-white/60">
                            {destination.budget_breakdown.user_budget ? 'Your Budget' : 'Estimated Total'}
                          </p>
                          <p className={`text-2xl font-bold ${destination.budget_breakdown.over_budget ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {fmt(destination.budget_breakdown.user_budget || totalCost)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-center text-sm">
                        {destination.budget_breakdown.local_transport > 0 && (
                          <div>
                            <p className="text-xs text-white/60">Transport</p>
                            <p className="font-semibold text-emerald-400/80">
                              {fmt(destination.budget_breakdown.local_transport)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-white/60">Food</p>
                          <p className="font-semibold text-emerald-400/80">
                            {fmt(destination.budget_breakdown.food_estimate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-white/60">Buffer</p>
                          <p className="font-semibold text-emerald-400/80">
                            {fmt(destination.budget_breakdown.buffer)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : destination.budgetBreakdown ? (
                    <div className="bg-white/[0.06] border border-emerald-500/20 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">
                        Budget Breakdown
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-white/60">Flights</p>
                          <p className="text-lg font-bold text-emerald-400">
                            {isEstimate ? '~' : ''}$
                            {destination.budgetBreakdown.flights}
                            {isEstimate ? ' est.' : ''}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-white/60">Hotel</p>
                          <p className="text-lg font-bold text-emerald-400">
                            {fmt(destination.budgetBreakdown.hotel)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-white/60">Activities</p>
                          <p className="text-lg font-bold text-emerald-400">
                            {fmt(destination.budgetBreakdown.activities)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-white/60">Total</p>
                          <p className="text-2xl font-bold text-emerald-400">
                            {fmt(destination.budgetBreakdown.total)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/[0.06] border border-emerald-500/20 rounded-xl p-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-sm text-white/50">
                            Flight
                            {isLivePrice && (
                              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                LIVE
                              </span>
                            )}
                          </p>
                          <p className="text-2xl font-bold text-emerald-400">
                            {isEstimate ? '~' : ''}{fmt(flightPrice)}
                          </p>
                          {isEstimate && (
                            <p className="text-xs text-amber-400/70 mt-0.5">Estimate — verify on booking site</p>
                          )}
                          {destination.googleFlightsAirlines && destination.googleFlightsAirlines.length > 0 && (
                            <p className="text-xs text-white/50 mt-0.5 flex items-center justify-center gap-1 flex-wrap">
                              {destination.googleFlightsAirlineLogos && destination.googleFlightsAirlineLogos.map((logo, i) => (
                                <img key={i} src={logo} alt="" width={16} height={16} className="inline-block rounded-sm" />
                              ))}
                              <span>{destination.googleFlightsAirlines.join(', ')} · {destination.googleFlightsStops === 0 ? 'Nonstop' : `${destination.googleFlightsStops} stop${destination.googleFlightsStops === 1 ? '' : 's'}`}</span>
                            </p>
                          )}
                          {destination.googleFlightsPriceLevel && (
                            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              destination.googleFlightsPriceLevel === 'low'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : destination.googleFlightsPriceLevel === 'high'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-white/10 text-white/50 border border-white/20'
                            }`}>
                              {destination.googleFlightsPriceLevel === 'low' ? 'Great Price' : destination.googleFlightsPriceLevel === 'high' ? 'Prices Are High' : 'Typical Price'}
                            </span>
                          )}
                          <p className="text-xs text-amber-400/60 mt-1">Flights at this price typically sell out within 24-48 hours</p>
                        </div>
                        <div>
                          <p className="text-sm text-white/50">
                            Hotel ({tripDuration} nights)
                          </p>
                          <p className="text-2xl font-bold text-emerald-400">
                            {fmt(destination.estimated_hotel_per_night * tripDuration)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-white/50">Total</p>
                          <p className="text-2xl font-bold text-emerald-400">
                            {fmt(totalCost)}
                          </p>
                        </div>
                      </div>
                      {/* Carbon emissions badge */}
                      {destination.googleFlightsCarbonEmissions && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-center gap-2 text-xs">
                          <span className="text-white/40">{destination.googleFlightsCarbonEmissions.thisFlightKg} kg CO₂</span>
                          {destination.googleFlightsCarbonEmissions.differencePercent !== 0 && (
                            <span className={destination.googleFlightsCarbonEmissions.differencePercent < 0 ? 'text-emerald-400' : 'text-white/40'}>
                              {destination.googleFlightsCarbonEmissions.differencePercent < 0
                                ? `${Math.abs(destination.googleFlightsCarbonEmissions.differencePercent)}% less CO₂ than typical`
                                : `${destination.googleFlightsCarbonEmissions.differencePercent}% more CO₂ than typical`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* Price disclaimer */}
                <motion.p
                  {...staggerChild(5)}
                  className="text-xs text-white/40 text-center"
                >
                  {isLivePrice
                    ? `${fmt(flightPrice)} is a real-time price from Google Flights.${destination.googleFlightsPriceLevel ? ` Price level: ${destination.googleFlightsPriceLevel}.` : ''}${destination.googleFlightsTypicalRange ? ` Typical range: ${fmt(destination.googleFlightsTypicalRange[0])}–${fmt(destination.googleFlightsTypicalRange[1])}.` : ''}`
                    : isEstimate
                    ? `~${fmt(flightPrice)} est. is an estimated price based on regional averages. Actual price confirmed on booking.`
                    : `~${fmt(flightPrice)} is an indicative cached price. Actual price confirmed on Aviasales.`}
                </motion.p>

                {/* Urgency signal */}
                <motion.p
                  {...staggerChild(5)}
                  className="text-xs text-amber-400/70 text-center"
                >
                  Flights at this price typically sell out within 24-48 hours
                </motion.p>

                {/* ── View Full Itinerary button (opens detail popup) ── */}
                <motion.div {...staggerChild(6)} className="lg:col-span-2">
                  <ItineraryDetail
                    destination={destination.destination}
                    country={destination.country}
                    tripDuration={tripDuration}
                    departDate={effectiveDepartDate}
                    returnDate={effectiveReturnDate}
                    whyThisPlace={destination.whyThisPlace || destination.why_its_perfect}
                    bestTimeToGo={destination.bestTimeToGo}
                    daily_itinerary={destination.daily_itinerary}
                    itinerary={destination.itinerary}
                    hotel_recommendations={destination.hotel_recommendations}
                    local_transportation={destination.local_transportation}
                    best_local_food={destination.best_local_food?.length ? destination.best_local_food : destination.cachedBasicInfo?.localFood}
                    insider_tip={destination.insider_tip}
                    localTip={destination.localTip}
                    fmt={fmt}
                    detailsLoading={detailsLoading}
                  />
                </motion.div>


                {/* ============================================================
                    BOOKING BUTTONS
                ============================================================ */}
                <motion.div {...staggerChild(14)} ref={bookingRef} className="lg:col-span-2">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    Book Your Trip
                    <AffiliateDisclosure />
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Flight */}
                    <BookingTracker
                      stampId={stampId || ''}
                      type="flight"
                      provider={AFFILIATE_FLAGS.kiwi ? 'Kiwi' : 'Aviasales'}
                      href={bookingBundle.flightUrl}
                      className="block w-full bg-emerald-500/90 hover:bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl text-center"
                    >
                      {flightPrice ? (
                        <>Book Flights (~{fmt(flightPrice)}{isEstimate ? ' est.' : ''})</>
                      ) : (
                        <>Search Flights</>
                      )}
                      <span className="block text-sm font-normal mt-1 opacity-90">
                        {formatDate(effectiveDepartDate)} &middot;{' '}
                        {AFFILIATE_FLAGS.kiwi
                          ? 'Search on Kiwi'
                          : 'Search on Aviasales'}
                      </span>
                    </BookingTracker>

                    {/* Hotel */}
                    <BookingTracker
                      stampId={stampId || ''}
                      type="hotel"
                      provider="Agoda"
                      href={bookingBundle.hotelUrl}
                      className="block w-full bg-blue-500/90 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl text-center"
                    >
                      {destination.estimated_hotel_per_night ? (
                        <>Find Hotels (~{fmt(destination.estimated_hotel_per_night)}/night)</>
                      ) : (
                        <>Search Hotels</>
                      )}
                      <span className="block text-sm font-normal mt-1 opacity-90">
                        {formatDate(effectiveDepartDate)} &ndash;{' '}
                        {formatDate(effectiveReturnDate)} &middot; Booking.com
                      </span>
                    </BookingTracker>

                    {/* Activities */}
                    <BookingTracker
                      stampId={stampId || ''}
                      type="activity"
                      provider="GetYourGuide"
                      href={bookingBundle.activitiesUrl}
                      className="block w-full bg-purple-500/90 hover:bg-purple-500 text-white font-bold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl text-center"
                    >
                      Find Activities
                      <span className="block text-sm font-normal mt-1 opacity-90">
                        Browse on GetYourGuide
                      </span>
                    </BookingTracker>
                  </div>
                  <p className="text-xs text-white/40 text-center mt-3">You book directly with the airline or hotel. GlobePilots never handles your payment.</p>
                </motion.div>

                {/* ============================================================
                    DESTINATION INTEL (Enrichment Data)
                    Shows cached basicInfo instantly, enrichment fills in live data
                ============================================================ */}
                <motion.div {...staggerChild(15)} className="lg:col-span-2">
                  {enrichmentLoading && !enrichment ? (
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold text-white mb-4">
                        Destination Intel
                      </h3>
                      {/* If we have cached basic info, show it instantly instead of shimmers */}
                      {destination.cachedBasicInfo ? (
                        <div className="grid grid-cols-2 gap-3">
                          {/* Climate from cache */}
                          {destination.cachedBasicInfo.climateHint && (
                            <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base">🌤️</span>
                                <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                  Climate
                                </span>
                              </div>
                              <p className="text-white font-medium text-sm">
                                {destination.cachedBasicInfo.climateHint}
                              </p>
                            </div>
                          )}
                          {/* Currency from cache */}
                          {destination.cachedBasicInfo.currency && (
                            <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base">💱</span>
                                <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                  Currency
                                </span>
                              </div>
                              <p className="text-white font-medium text-sm">
                                {destination.cachedBasicInfo.currency}
                              </p>
                            </div>
                          )}
                          {/* Languages from cache */}
                          {destination.cachedBasicInfo.languages.length > 0 && (
                            <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base">🗣️</span>
                                <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                  Language
                                </span>
                              </div>
                              <p className="text-white font-medium text-sm">
                                {destination.cachedBasicInfo.languages.slice(0, 3).join(', ')}
                              </p>
                            </div>
                          )}
                          {/* Timezone from cache */}
                          {destination.cachedBasicInfo.timezone && (
                            <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base">🕐</span>
                                <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                  Timezone
                                </span>
                              </div>
                              <p className="text-white font-medium text-sm">
                                {destination.cachedBasicInfo.timezone.replace(/_/g, ' ')}
                              </p>
                            </div>
                          )}
                          {/* Daily Costs from cache */}
                          {destination.cachedBasicInfo.dailyCosts && (
                            <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base">💰</span>
                                <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                  Daily Costs
                                </span>
                              </div>
                              <p className="text-white font-medium text-sm">
                                ${destination.cachedBasicInfo.dailyCosts.budget} &ndash; ${destination.cachedBasicInfo.dailyCosts.comfort}/day
                              </p>
                            </div>
                          )}
                          {/* Plug Type from cache */}
                          {destination.cachedBasicInfo.plugType && (
                            <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base">🔌</span>
                                <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                  Plug Type
                                </span>
                              </div>
                              <p className="text-white font-medium text-sm">
                                Type {destination.cachedBasicInfo.plugType}
                              </p>
                            </div>
                          )}
                          {/* Tipping from cache */}
                          {destination.cachedBasicInfo.tippingCustom && (
                            <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06] col-span-2">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-base">🍽️</span>
                                <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                                  Tipping
                                </span>
                              </div>
                              <p className="text-white font-medium text-sm">
                                {destination.cachedBasicInfo.tippingCustom}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <ShimmerBlock />
                          <ShimmerBlock />
                          <ShimmerBlock />
                          <ShimmerBlock />
                        </div>
                      )}
                      {/* Top attractions from cache */}
                      {destination.cachedBasicInfo && destination.cachedBasicInfo.topAttractions.length > 0 && (
                        <div className="mt-3 bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">📍</span>
                            <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                              Top Attractions
                            </span>
                          </div>
                          <div className="space-y-1">
                            {destination.cachedBasicInfo.topAttractions.map((a, idx) => (
                              <p key={idx} className="text-sm text-white/70">
                                <span className="text-white/30 mr-1.5">{idx + 1}.</span>
                                <span className="text-white font-medium">{a}</span>
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* Local food from cache */}
                      {destination.cachedBasicInfo && destination.cachedBasicInfo.localFood.length > 0 && (
                        <div className="mt-3 bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-base">🍜</span>
                            <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                              Must-Try Food
                            </span>
                          </div>
                          <p className="text-white font-medium text-sm">
                            {destination.cachedBasicInfo.localFood.join(', ')}
                          </p>
                        </div>
                      )}
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
                            <p className="text-xs text-amber-400/50 mt-1">
                              Rules change — verify with your embassy before booking
                            </p>
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
                                <p className="text-xs text-white/60">
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
                            {enrichment.attractions.filter(a => hasSupportedCharacters(a.name)).slice(0, 5).map((a, idx) => (
                              <div key={idx} className="flex gap-2">
                                <span className="text-xs text-white/30 mt-0.5 shrink-0">{idx + 1}.</span>
                                <div className="min-w-0">
                                  <p className="text-white font-medium text-sm">
                                    {a.name}
                                    <span className="text-white/50 font-normal ml-1.5 text-xs">
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
                  <motion.div {...staggerChild(16)} className="lg:col-span-2">
                    <TripPrep
                      countryCode={countryNameToCode(destination.country) || ''}
                      cityName={destination.destination}
                      climate={enrichment.climate || undefined}
                      tripDuration={tripDuration}
                    />
                  </motion.div>
                )}

                {/* ---- Email capture — shown after full reveal ---- */}
                <motion.div {...staggerChild(17)} className="lg:col-span-2">
                  <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 text-center">
                    <p className="text-white font-medium mb-1">Track prices for this trip</p>
                    <p className="text-white/50 text-sm mb-3">We&apos;ll email you if flights to {destination.destination} drop in price</p>
                    <form onSubmit={handleEmailCapture} className="flex gap-2 max-w-md mx-auto">
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={captureEmail}
                        onChange={(e) => setCaptureEmail(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-white/[0.06] border border-white/10 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:border-sky-500/50"
                      />
                      <button type="submit" className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-lg text-sm font-medium transition">
                        Track Price
                      </button>
                    </form>
                    {emailCaptured && <p className="text-emerald-400 text-sm mt-2">We&apos;ll let you know when prices drop!</p>}
                    {emailError && <p className="text-red-400 text-sm mt-2">{emailError}</p>}
                  </div>
                </motion.div>

                {/* ---- Continue Planning Links ---- */}
                <motion.div {...staggerChild(18)} className="lg:col-span-2">
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                    <span className="text-xs text-white/50 mr-1">
                      Continue planning:
                    </span>
                    {origin && (
                      <Link
                        href={`/explore?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(iata)}`}
                        className="text-sm text-sky-300 hover:text-sky-400 transition"
                      >
                        Layover routes to {destination.destination}
                      </Link>
                    )}
                    <Link
                      href={`/trip-cost?destination=${encodeURIComponent(iata)}`}
                      className="text-sm text-sky-300 hover:text-sky-400 transition"
                    >
                      Daily costs in {destination.destination}
                    </Link>
                    <Link
                      href={`/search?destination=${encodeURIComponent(iata)}`}
                      className="text-sm text-sky-300 hover:text-sky-400 transition"
                    >
                      Search more flights
                    </Link>
                  </div>
                </motion.div>

                {/* ---- Re-roll Section ---- */}
                {onReroll && (
                  <motion.div {...staggerChild(19)} className="lg:col-span-2">
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
                <motion.div {...staggerChild(20)} className="lg:col-span-2">
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
                      aria-label="Show me another mystery destination"
                      className="bg-sky-500 hover:bg-sky-600 text-slate-900 font-semibold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl"
                    >
                      Show Me Another
                    </button>
                    <button
                      onClick={handleShare}
                      disabled={sharing}
                      aria-label="Share this trip"
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
                  <motion.div {...staggerChild(21)} className="lg:col-span-2">
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
                          aria-label="Copy shareable link"
                          className="bg-emerald-500/90 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded-lg transition text-sm whitespace-nowrap"
                        >
                          {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ---- Dare a Friend + Download Story Card ---- */}
                <motion.div {...staggerChild(22)} className="lg:col-span-2">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Dare a Friend */}
                    <button
                      onClick={handleDare}
                      aria-label="Dare a friend to beat your deal"
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
                          <span className="block text-xs text-white/60 mt-1 font-normal group-hover:text-white/60 transition">
                            Dare a friend to beat your deal
                          </span>
                        </>
                      )}
                    </button>

                    {/* Download Story Card */}
                    <button
                      onClick={handleDownloadStoryCard}
                      disabled={downloading}
                      aria-label="Download story card for social media"
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
                          <span className="block text-xs text-white/60 mt-1 font-normal group-hover:text-white/60 transition">
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

      {/* Mobile sticky action bar — only on small screens */}
      {(
        <div className="fixed bottom-0 left-0 right-0 z-30 p-3 bg-slate-950/95 backdrop-blur border-t border-white/10 lg:hidden">
          <div className="flex gap-2 max-w-lg mx-auto">
            {onReroll && rerollCount < maxRerolls && (
              <button
                onClick={onReroll}
                className="flex-1 py-2.5 rounded-lg bg-white/10 text-white text-sm font-medium transition hover:bg-white/15"
              >
                Try Another
              </button>
            )}
            <a
              href={bookingBundle.flightUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 rounded-lg bg-sky-500 text-white text-sm font-bold text-center transition hover:bg-sky-400"
            >
              Book Flight
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
