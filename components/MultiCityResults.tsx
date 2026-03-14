'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import { buildHotelLink, buildActivitiesLink } from '@/lib/affiliate'

// ─── Country Flags ───
const COUNTRY_FLAGS: Record<string, string> = {
  Thailand: '\u{1F1F9}\u{1F1ED}',
  Indonesia: '\u{1F1EE}\u{1F1E9}',
  Singapore: '\u{1F1F8}\u{1F1EC}',
  Malaysia: '\u{1F1F2}\u{1F1FE}',
  Vietnam: '\u{1F1FB}\u{1F1F3}',
  Philippines: '\u{1F1F5}\u{1F1ED}',
  Cambodia: '\u{1F1F0}\u{1F1ED}',
  Laos: '\u{1F1F1}\u{1F1E6}',
  Japan: '\u{1F1EF}\u{1F1F5}',
  'South Korea': '\u{1F1F0}\u{1F1F7}',
  'Hong Kong': '\u{1F1ED}\u{1F1F0}',
  Taiwan: '\u{1F1F9}\u{1F1FC}',
  China: '\u{1F1E8}\u{1F1F3}',
  India: '\u{1F1EE}\u{1F1F3}',
  'Sri Lanka': '\u{1F1F1}\u{1F1F0}',
  Nepal: '\u{1F1F3}\u{1F1F5}',
  UAE: '\u{1F1E6}\u{1F1EA}',
  Turkey: '\u{1F1F9}\u{1F1F7}',
  Qatar: '\u{1F1F6}\u{1F1E6}',
  Israel: '\u{1F1EE}\u{1F1F1}',
  Jordan: '\u{1F1EF}\u{1F1F4}',
  Egypt: '\u{1F1EA}\u{1F1EC}',
  UK: '\u{1F1EC}\u{1F1E7}',
  France: '\u{1F1EB}\u{1F1F7}',
  Netherlands: '\u{1F1F3}\u{1F1F1}',
  Spain: '\u{1F1EA}\u{1F1F8}',
  Portugal: '\u{1F1F5}\u{1F1F9}',
  'Czech Republic': '\u{1F1E8}\u{1F1FF}',
  Hungary: '\u{1F1ED}\u{1F1FA}',
  Greece: '\u{1F1EC}\u{1F1F7}',
  Italy: '\u{1F1EE}\u{1F1F9}',
  Germany: '\u{1F1E9}\u{1F1EA}',
  Austria: '\u{1F1E6}\u{1F1F9}',
  Poland: '\u{1F1F5}\u{1F1F1}',
  Denmark: '\u{1F1E9}\u{1F1F0}',
  Ireland: '\u{1F1EE}\u{1F1EA}',
  USA: '\u{1F1FA}\u{1F1F8}',
  Mexico: '\u{1F1F2}\u{1F1FD}',
  Colombia: '\u{1F1E8}\u{1F1F4}',
  Peru: '\u{1F1F5}\u{1F1EA}',
  Argentina: '\u{1F1E6}\u{1F1F7}',
  Brazil: '\u{1F1E7}\u{1F1F7}',
  Chile: '\u{1F1E8}\u{1F1F1}',
  Panama: '\u{1F1F5}\u{1F1E6}',
  'Costa Rica': '\u{1F1E8}\u{1F1F7}',
  Morocco: '\u{1F1F2}\u{1F1E6}',
  'South Africa': '\u{1F1FF}\u{1F1E6}',
  Kenya: '\u{1F1F0}\u{1F1EA}',
  Senegal: '\u{1F1F8}\u{1F1F3}',
  Georgia: '\u{1F1EC}\u{1F1EA}',
  Australia: '\u{1F1E6}\u{1F1FA}',
  'New Zealand': '\u{1F1F3}\u{1F1FF}',
  Canada: '\u{1F1E8}\u{1F1E6}',
  Switzerland: '\u{1F1E8}\u{1F1ED}',
  Sweden: '\u{1F1F8}\u{1F1EA}',
  Norway: '\u{1F1F3}\u{1F1F4}',
  Finland: '\u{1F1EB}\u{1F1EE}',
  Belgium: '\u{1F1E7}\u{1F1EA}',
  Romania: '\u{1F1F7}\u{1F1F4}',
  Bulgaria: '\u{1F1E7}\u{1F1EC}',
  Croatia: '\u{1F1ED}\u{1F1F7}',
  Serbia: '\u{1F1F7}\u{1F1F8}',
  Russia: '\u{1F1F7}\u{1F1FA}',
}

// ─── Highlight emoji categories ───
const HIGHLIGHT_EMOJIS: [RegExp, string][] = [
  [/temple|shrine|pagoda|wat|mosque|church|cathedral/i, '\u{1F3DB}\u{FE0F}'],
  [/food|cuisine|eat|restaurant|street food|market|cook/i, '\u{1F372}'],
  [/beach|island|coast|sea|ocean|snorkel|dive|surf/i, '\u{1F3D6}\u{FE0F}'],
  [/mountain|trek|hike|climb|volcano|trail/i, '\u{26F0}\u{FE0F}'],
  [/museum|gallery|art|history|culture/i, '\u{1F3DB}\u{FE0F}'],
  [/nightlife|bar|club|party|rooftop/i, '\u{1F378}'],
  [/shop|market|bazaar|mall|souvenir/i, '\u{1F6CD}\u{FE0F}'],
  [/nature|park|garden|waterfall|jungle|forest|wildlife/i, '\u{1F33F}'],
  [/spa|massage|wellness|relax|yoga/i, '\u{1F9D6}'],
  [/architecture|building|skyline|tower/i, '\u{1F3D7}\u{FE0F}'],
  [/boat|cruise|river|lake|canal/i, '\u{26F5}'],
  [/coffee|cafe|tea/i, '\u{2615}'],
]

function getHighlightEmoji(text: string): string {
  for (const [pattern, emoji] of HIGHLIGHT_EMOJIS) {
    if (pattern.test(text)) return emoji
  }
  return '\u{2728}' // sparkles default
}

// ─── Activity time-of-day classifier ───
function classifyActivity(highlight: string): 'morning' | 'afternoon' | 'evening' {
  const lower = highlight.toLowerCase()
  if (/temple|shrine|market|trek|hike|sunrise|breakfast|coffee|yoga|nature|park|garden/i.test(lower)) return 'morning'
  if (/nightlife|bar|club|rooftop|dinner|sunset|evening|night/i.test(lower)) return 'evening'
  return 'afternoon'
}

// ─── Types ───

export interface CityStop {
  code: string
  name: string
  country: string
  days: number
  estimatedFlightCost: number
  estimatedDailyCost: number
  highlights: string[]
  arriveDate?: string
  departDate?: string
}

export interface BookingLink {
  from: string
  to: string
  label: string
  url: string
  date?: string
}

export interface TripResult {
  cities: CityStop[]
  totalEstimatedCost: number
  route: string
  bookingLinks: BookingLink[]
  reasoning: string
}

interface MultiCityResultsProps {
  result: TripResult
  origin: string
  totalBudget: string
  totalDays: number
  onStartOver: () => void
}

// ─── Lazy-loaded data types ───
interface CostTierData {
  hotel: number
  food: number
  transport: number
  activities: number
}

interface DestinationCostData {
  currency: string
  dailyCosts: {
    budget: CostTierData
    mid: CostTierData
    comfort: CostTierData
  }
  visaFreeFor: string[]
}

interface ClimateInfo {
  avgTempC: number
  description: string
  packingTip: string
  rainyDays: number
}

// ─── Style constants ───
const cardGradients = [
  'from-amber-500/20 to-orange-500/20 border-amber-400/30 hover:border-amber-400/60',
  'from-emerald-500/20 to-teal-500/20 border-emerald-400/30 hover:border-emerald-400/60',
  'from-purple-500/20 to-pink-500/20 border-purple-400/30 hover:border-purple-400/60',
  'from-rose-500/20 to-red-500/20 border-rose-400/30 hover:border-rose-400/60',
  'from-blue-500/20 to-indigo-500/20 border-blue-400/30 hover:border-blue-400/60',
]

const bubbleColors = [
  'bg-gradient-to-br from-amber-400 to-orange-500 ring-amber-400/50',
  'bg-gradient-to-br from-emerald-400 to-teal-500 ring-emerald-400/50',
  'bg-gradient-to-br from-purple-400 to-pink-500 ring-purple-400/50',
  'bg-gradient-to-br from-rose-400 to-red-500 ring-rose-400/50',
  'bg-gradient-to-br from-blue-400 to-indigo-500 ring-blue-400/50',
]

function formatShortDate(d: string) {
  const date = new Date(d + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Expanded City Detail Component ───
function CityExpandedDetail({ city, bookingLink }: { city: CityStop; bookingLink?: BookingLink }) {
  const [costData, setCostData] = useState<DestinationCostData | null>(null)
  const [climate, setClimate] = useState<ClimateInfo | null>(null)
  const [activeTier, setActiveTier] = useState<'budget' | 'mid' | 'comfort'>('mid')
  const [loading, setLoading] = useState(true)

  // Lazy-load destination costs and climate data
  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setLoading(true)
      try {
        const [costModule, climateModule] = await Promise.all([
          import('@/lib/destination-costs'),
          import('@/lib/enrichment/climate'),
        ])

        if (cancelled) return

        const dest = costModule.getDestinationCost(city.code)
        if (dest) {
          setCostData({
            currency: dest.currency,
            dailyCosts: dest.dailyCosts,
            visaFreeFor: dest.visaFreeFor,
          })
        }

        // Get month from arrive date or current month
        const month = city.arriveDate
          ? new Date(city.arriveDate + 'T00:00:00').getMonth() + 1
          : new Date().getMonth() + 1
        const climateResult = climateModule.getClimateData(city.code, month)
        if (climateResult) {
          setClimate(climateResult)
        }
      } catch {
        // Graceful fallback — data unavailable
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadData()
    return () => { cancelled = true }
  }, [city.code, city.arriveDate])

  // Build grouped activities by time of day
  const groupedActivities = { morning: [] as string[], afternoon: [] as string[], evening: [] as string[] }
  city.highlights.forEach(h => {
    groupedActivities[classifyActivity(h)].push(h)
  })

  // Build hotel/activity links
  const hotelUrl = city.arriveDate
    ? buildHotelLink(city.name, city.arriveDate, city.days)
    : `https://www.agoda.com/search?textToSearch=${encodeURIComponent(city.name)}&adults=1`

  const activitiesUrl = buildActivitiesLink(city.name)

  const tierData = costData?.dailyCosts[activeTier]
  const tierDailyTotal = tierData
    ? tierData.hotel + tierData.food + tierData.transport + tierData.activities
    : null
  const tierStopTotal = tierDailyTotal ? tierDailyTotal * city.days : null

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="bg-white/[0.03] border-t border-white/[0.06] p-4 mt-3 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <div className="w-5 h-5 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
            <span className="ml-2 text-white/40 text-sm">Loading details...</span>
          </div>
        ) : (
          <>
            {/* 1. What to Do */}
            <div>
              <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">What to Do</h4>
              <div className="space-y-1.5 mb-3">
                {city.highlights.map((h, hIdx) => (
                  <div key={hIdx} className="flex items-start gap-2">
                    <span className="flex-shrink-0 text-sm">{getHighlightEmoji(h)}</span>
                    <span className="text-white/90 text-sm">{h}</span>
                  </div>
                ))}
              </div>

              {/* Time-of-day suggestions */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {(['morning', 'afternoon', 'evening'] as const).map(time => {
                  const items = groupedActivities[time]
                  if (items.length === 0) return null
                  const labels = { morning: '\u{1F305} Morning', afternoon: '\u{2600}\u{FE0F} Afternoon', evening: '\u{1F303} Evening' }
                  return (
                    <div key={time} className="bg-white/[0.04] rounded-lg p-2.5">
                      <span className="text-[10px] font-semibold text-white/40 uppercase tracking-wider block mb-1">
                        {labels[time]}
                      </span>
                      <p className="text-white/70 text-xs leading-relaxed">
                        {items[0]}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2. Estimated Costs */}
            {costData && tierData && (
              <div>
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Estimated Costs</h4>

                {/* Tier pills */}
                <div className="flex gap-2 mb-3">
                  {(['budget', 'mid', 'comfort'] as const).map(tier => (
                    <button
                      key={tier}
                      onClick={(e) => { e.stopPropagation(); setActiveTier(tier) }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        activeTier === tier
                          ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                          : 'bg-white/[0.06] text-white/50 border border-white/[0.06] hover:bg-white/[0.10]'
                      }`}
                    >
                      {tier === 'budget' ? 'Budget' : tier === 'mid' ? 'Mid-Range' : 'Comfort'}
                    </button>
                  ))}
                </div>

                {/* Cost grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/[0.04] rounded-lg p-2.5 flex justify-between items-center">
                    <span className="text-white/50 text-xs">{'\u{1F3E8}'} Hotel/night</span>
                    <span className="text-white font-medium text-sm">${tierData.hotel}</span>
                  </div>
                  <div className="bg-white/[0.04] rounded-lg p-2.5 flex justify-between items-center">
                    <span className="text-white/50 text-xs">{'\u{1F35C}'} Food/day</span>
                    <span className="text-white font-medium text-sm">${tierData.food}</span>
                  </div>
                  <div className="bg-white/[0.04] rounded-lg p-2.5 flex justify-between items-center">
                    <span className="text-white/50 text-xs">{'\u{1F68C}'} Transport/day</span>
                    <span className="text-white font-medium text-sm">${tierData.transport}</span>
                  </div>
                  <div className="bg-white/[0.04] rounded-lg p-2.5 flex justify-between items-center">
                    <span className="text-white/50 text-xs">{'\u{1F3AD}'} Activities/day</span>
                    <span className="text-white font-medium text-sm">${tierData.activities}</span>
                  </div>
                </div>

                {tierStopTotal && (
                  <div className="mt-2 bg-white/[0.06] rounded-lg p-3 flex justify-between items-center">
                    <span className="text-white/70 text-sm font-medium">
                      Total for {city.days} days ({activeTier})
                    </span>
                    <span className="text-white font-bold text-base">${tierStopTotal}</span>
                  </div>
                )}
              </div>
            )}

            {/* 3. Booking Links */}
            <div>
              <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Book This Stop</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {bookingLink && (
                  <a
                    href={bookingLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold py-2.5 px-3 rounded-lg transition-all border border-emerald-500/30 hover:border-emerald-400/50 text-xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                    </svg>
                    Flights
                  </a>
                )}
                <a
                  href={hotelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-semibold py-2.5 px-3 rounded-lg transition-all border border-blue-500/30 hover:border-blue-400/50 text-xs"
                >
                  <span>{'\u{1F3E8}'}</span>
                  Hotels
                </a>
                <a
                  href={activitiesUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center gap-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-semibold py-2.5 px-3 rounded-lg transition-all border border-purple-500/30 hover:border-purple-400/50 text-xs"
                >
                  <span>{'\u{1F3AD}'}</span>
                  Activities
                </a>
              </div>
            </div>

            {/* 4. Quick Intel */}
            {(climate || costData) && (
              <div>
                <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Quick Intel</h4>
                <div className="flex flex-wrap gap-2">
                  {climate && (
                    <>
                      <span className="bg-white/[0.06] rounded-full px-3 py-1 text-xs text-white/60">
                        {'\u{1F321}\u{FE0F}'} {climate.avgTempC}&deg;C
                      </span>
                      <span className="bg-white/[0.06] rounded-full px-3 py-1 text-xs text-white/60">
                        {'\u{1F327}\u{FE0F}'} {climate.rainyDays} rainy days
                      </span>
                      <span className="bg-white/[0.06] rounded-full px-3 py-1 text-xs text-white/60">
                        {climate.description}
                      </span>
                    </>
                  )}
                  {costData?.visaFreeFor && costData.visaFreeFor.length > 0 && (
                    <span className="bg-white/[0.06] rounded-full px-3 py-1 text-xs text-white/60">
                      {'\u{1F6C2}'} Visa-free for {costData.visaFreeFor.slice(0, 3).join(', ')}
                    </span>
                  )}
                  {costData?.currency && (
                    <span className="bg-white/[0.06] rounded-full px-3 py-1 text-xs text-white/60">
                      {'\u{1F4B1}'} {costData.currency}
                    </span>
                  )}
                  {climate?.packingTip && (
                    <span className="bg-white/[0.06] rounded-full px-3 py-1 text-xs text-white/60">
                      {'\u{1F9F3}'} {climate.packingTip}
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main Component ───

export default function MultiCityResults({ result, origin, totalBudget, totalDays, onStartOver }: MultiCityResultsProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  const toggleCard = (idx: number) => {
    setExpandedIdx(prev => prev === idx ? null : idx)
  }

  const handleShare = async () => {
    const text = `Check out this mystery multi-city trip I planned with GlobePilot!\n\n${result.route}\n\nEstimated cost: $${result.totalEstimatedCost}\n\nPlan yours at ${window.location.href}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'My Mystery Trip', text })
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text)
      alert('Trip details copied to clipboard!')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Route Visualization */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20">
        <h2 className="text-lg font-semibold text-skyblue-light mb-6 text-center uppercase tracking-wider">Your Mystery Route</h2>

        <div className="flex items-center justify-center flex-wrap gap-y-4">
          {/* Origin */}
          <div className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-skyblue to-skyblue-dark flex items-center justify-center shadow-lg ring-2 ring-skyblue/50">
                <span className="text-navy font-bold text-sm">{origin}</span>
              </div>
              <span className="text-xs text-skyblue-light mt-1.5">Start</span>
            </div>
          </div>

          {result.cities.map((city, idx) => (
            <div key={city.code} className="flex items-center">
              <div className="flex items-center mx-1 md:mx-2">
                <div className="w-6 md:w-12 h-px bg-gradient-to-r from-skyblue/60 to-amber-400/60" />
                <svg className="w-5 h-5 text-amber-400 -mx-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
                <div className="w-6 md:w-12 h-px bg-gradient-to-r from-amber-400/60 to-skyblue/60" />
              </div>
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg ring-2 ${bubbleColors[idx % bubbleColors.length]}`}>
                  <div className="text-center">
                    <span className="text-white font-bold text-xs block">{city.code}</span>
                    <span className="text-white/80 text-[10px] block">{city.days}d</span>
                  </div>
                </div>
                <span className="text-xs text-white mt-1.5 max-w-[80px] text-center truncate">{city.name}</span>
              </div>
            </div>
          ))}

          {/* Return */}
          <div className="flex items-center">
            <div className="flex items-center mx-1 md:mx-2">
              <div className="w-6 md:w-12 h-px bg-gradient-to-r from-skyblue/60 to-amber-400/60" />
              <svg className="w-5 h-5 text-amber-400 -mx-1 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <div className="w-6 md:w-12 h-px bg-gradient-to-r from-amber-400/60 to-skyblue/60" />
            </div>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-skyblue to-skyblue-dark flex items-center justify-center shadow-lg ring-2 ring-skyblue/50">
                <span className="text-navy font-bold text-sm">{origin}</span>
              </div>
              <span className="text-xs text-skyblue-light mt-1.5">Return</span>
            </div>
          </div>
        </div>

        <p className="text-center text-white/80 mt-6 font-mono text-sm tracking-widest">{result.route}</p>

        {result.reasoning && (
          <div className="mt-6 bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-skyblue-light text-sm italic text-center">{result.reasoning}</p>
          </div>
        )}
      </div>

      {/* City Cards */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white text-center mb-6">Your Stops</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {result.cities.map((city, idx) => {
            const cityTotal = city.estimatedFlightCost + (city.estimatedDailyCost * city.days)
            const isExpanded = expandedIdx === idx
            const flag = COUNTRY_FLAGS[city.country] || ''

            return (
              <div
                key={city.code}
                className={`bg-gradient-to-br ${cardGradients[idx % cardGradients.length]} backdrop-blur-sm rounded-2xl p-6 border transition-all hover:shadow-xl cursor-pointer ${
                  isExpanded ? 'md:col-span-2 lg:col-span-3' : ''
                }`}
                onClick={() => toggleCard(idx)}
              >
                {/* Collapsed state — always visible */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-sm font-mono">#{idx + 1}</span>
                      {flag && <span className="text-lg">{flag}</span>}
                      <h3 className="text-xl font-bold text-white">{city.name}</h3>
                    </div>
                    <p className="text-skyblue-light text-sm">{city.country}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 rounded-lg px-3 py-1.5">
                      <span className="text-white font-bold text-sm">{city.days} days</span>
                    </div>
                    {/* Chevron */}
                    <svg
                      className={`w-5 h-5 text-white/40 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {city.arriveDate && city.departDate && (
                  <div className="flex items-center gap-2 mb-4 text-xs text-skyblue-light/80">
                    <span>{formatShortDate(city.arriveDate)}</span>
                    <span className="text-white/30">&rarr;</span>
                    <span>{formatShortDate(city.departDate)}</span>
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-skyblue-light">Flight to {city.code}</span>
                    <span className="text-white font-semibold">${city.estimatedFlightCost}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-skyblue-light">Daily costs</span>
                    <span className="text-white font-semibold">${city.estimatedDailyCost}/day</span>
                  </div>
                  <div className="border-t border-white/20 pt-2 flex justify-between">
                    <span className="text-skyblue-light font-medium">Subtotal</span>
                    <span className="text-white font-bold">${cityTotal}</span>
                  </div>
                </div>

                {/* Highlights preview (collapsed) */}
                {!isExpanded && (
                  <div className="space-y-1.5 mb-5">
                    {city.highlights.map((h, hIdx) => (
                      <div key={hIdx} className="flex items-start gap-2">
                        <span className="text-amber-400 mt-0.5 flex-shrink-0">&#9733;</span>
                        <span className="text-white/90 text-sm">{h}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Tap to explore hint */}
                {!isExpanded && (
                  <p className="text-white/30 text-xs text-center mb-3">Tap to explore details</p>
                )}

                {/* Collapsed booking button */}
                {!isExpanded && result.bookingLinks[idx] && (
                  <a
                    href={result.bookingLinks[idx].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="block w-full text-center bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-4 rounded-lg transition-all border border-white/20 hover:border-white/40 text-sm"
                  >
                    Book flight to {city.name}
                  </a>
                )}

                {/* Expanded state */}
                <AnimatePresence>
                  {isExpanded && (
                    <CityExpandedDetail
                      city={city}
                      bookingLink={result.bookingLinks[idx]}
                    />
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>

      {/* Cost Summary */}
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-2xl p-6 border border-amber-400/30">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">Total Estimated Cost</h3>
            <p className="text-skyblue-light text-sm">
              {result.cities.length} cities &middot; {totalDays} days &middot; {result.bookingLinks.length} flights
            </p>
          </div>
          <div className="text-center md:text-right">
            <div className="text-4xl font-bold text-white">${result.totalEstimatedCost}</div>
            <p className="text-skyblue-light text-sm">
              of ${totalBudget} budget
              {result.totalEstimatedCost <= parseFloat(totalBudget)
                ? ` ($${Math.round(parseFloat(totalBudget) - result.totalEstimatedCost)} remaining)`
                : ' (over budget)'}
            </p>
          </div>
        </div>
      </div>

      {/* All Booking Links */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <h3 className="text-xl font-bold text-white mb-4 text-center">Book All Flights</h3>
        <div className="space-y-3">
          {result.bookingLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 hover:border-amber-400/40 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                  </svg>
                </div>
                <div>
                  <span className="text-white font-medium text-sm">{link.label}</span>
                  <span className="block text-skyblue-light text-xs">
                    Leg {idx + 1} of {result.bookingLinks.length}
                    {link.date && ` · ${formatShortDate(link.date)}`}
                  </span>
                </div>
              </div>
              <span className="text-amber-400 font-semibold text-sm group-hover:translate-x-1 transition-transform whitespace-nowrap ml-4">
                Search flights &rarr;
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 pb-4">
        <button
          onClick={onStartOver}
          className="px-8 py-3 rounded-xl border-2 border-white/30 text-white hover:bg-white/10 font-semibold transition-all hover:border-white/60"
        >
          Start Over
        </button>
        <button
          onClick={handleShare}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
        >
          Share This Route
        </button>
      </div>

      {/* Continue planning */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pb-8">
        <span className="text-xs text-white/40">Continue planning:</span>
        {result.cities.map((city) => (
          <Link
            key={city.code}
            href={`/trip-cost?destination=${encodeURIComponent(city.code)}`}
            className="text-sm text-skyblue-light/70 hover:text-skyblue transition"
          >
            Daily costs in {city.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
