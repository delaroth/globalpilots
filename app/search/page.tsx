'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'motion/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import DestinationCard from '@/components/DestinationCard'
import WhatNext from '@/components/WhatNext'
import { buildFlightLink } from '@/lib/affiliate'
import { resolveFlightBooking } from '@/lib/booking-redirect'
import { saveRecentSearch } from '@/lib/recent-searches'
import RecentSearches from '@/components/RecentSearches'
import BookingLinks from '@/components/BookingLinks'
import DestinationImage from '@/components/DestinationImage'
import { majorAirports } from '@/lib/geolocation'
import NearbyAirportPrices from '@/components/NearbyAirportPrices'
import PriceCalendar from '@/components/PriceCalendar'
import CurrencySelector from '@/components/CurrencySelector'
import { useCurrency } from '@/hooks/useCurrency'
import Link from 'next/link'
import PassportSelector from '@/components/PassportSelector'

// Lazy load CalendarGrid — only rendered after a flexible-month search completes
const CalendarGrid = dynamic(() => import('@/components/CalendarGrid'), {
  ssr: false,
  loading: () => (
    <div className="text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-sky-400"></div>
      <p className="text-white mt-4">Loading calendar...</p>
    </div>
  ),
})

// ── Types ──────────────────────────────────────────────────────────────────

type TripType = 'one-way' | 'round-trip' | 'multi-city' | 'stopovers'
type DateFlexType = 'exact' | 'month' | 'anytime' | 'day-of-week'
/** 0=morning(6-12), 1=afternoon(12-18), 2=evening(18-24), 3=night(0-6) */
type TimeOfDay = 0 | 1 | 2 | 3

interface FlexibleDateValue {
  type: DateFlexType
  exactDate?: string    // YYYY-MM-DD
  month?: string        // YYYY-MM (e.g., "2026-04")
  dayOfWeek?: number    // 0=Sun, 1=Mon, ..., 6=Sat
  timeOfDay?: TimeOfDay // optional time-of-day filter
}

interface WeekendDeal {
  value: number
  trip_class: number
  show_to_affiliates: boolean
  origin: string
  destination: string
  gate: string
  depart_date: string
  return_date: string
  number_of_changes: number
  found_at: string
  distance: number
  actual: boolean
}

// ── Stopover types & constants ──────────────────────────────────────────────

interface StopoverOpportunity {
  hub: string
  hubCity: string
  hubCountry: string
  visaStatus: 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required'
  visaMaxStay?: number
  visaNote?: string
  directPrice: number
  leg1Price: number
  leg2Price: number
  totalFlightCost: number
  savings: number
  savingsPercent: number
  leg1Airlines: string[]
  leg1Duration: string
  leg1Stops: number
  leg2Airlines: string[]
  leg2Duration: string
  leg2Stops: number
  stopoverDays: number
  stopoverDepartDate: string
  stopoverReturnDate: string
  dailyCost: number
  totalGroundCost: number
  netValue: number
  verdict: 'free-vacation' | 'worth-it' | 'splurge' | 'skip'
  pitch: string
  costBreakdown: { hotel: number; food: number; transport: number; activities: number }
  priceIsLive: boolean
  googleFlightsUrl: string
}

interface StopoverSearchResult {
  origin: string
  destination: string
  departDate: string
  arrivalDeadline: string
  passportCountry: string
  directPrice: number | null
  directAirlines: string[]
  directDuration: string
  directStops: number
  stopovers: StopoverOpportunity[]
  serpApiCallsUsed: number
  serpApiRemaining: number
}

const VERDICT_CONFIG = {
  'free-vacation': { emoji: '\uD83C\uDF89', label: 'Free Vacation', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  'worth-it': { emoji: '\uD83D\uDC4D', label: 'Worth It', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30' },
  'splurge': { emoji: '\uD83D\uDCB8', label: 'Splurge', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
  'skip': { emoji: '\u23ED\uFE0F', label: 'Skip', color: 'text-white/40', bg: 'bg-white/10 border-white/20' },
}

const VISA_CONFIG = {
  'visa-free': { emoji: '\u2705', label: 'Visa Free', color: 'text-emerald-400' },
  'visa-on-arrival': { emoji: '\uD83D\uDEC2', label: 'Visa on Arrival', color: 'text-blue-400' },
  'e-visa': { emoji: '\uD83D\uDCF1', label: 'E-Visa', color: 'text-amber-400' },
  'visa-required': { emoji: '\u26A0\uFE0F', label: 'Visa Required', color: 'text-red-400' },
}

// Popular route suggestions by origin region
function getPopularSuggestions(origin: string): { dest: string; city: string }[] {
  const seAsiaOrigins = ['BKK', 'SIN', 'KUL', 'CGK', 'MNL', 'HKT', 'CNX', 'HAN', 'SGN', 'DPS']
  const eastAsiaOrigins = ['NRT', 'HND', 'ICN', 'PVG', 'PEK', 'HKG', 'TPE']
  const europeanOrigins = ['LHR', 'CDG', 'AMS', 'FRA', 'BCN', 'FCO', 'MAD', 'MUC', 'VIE', 'ZRH', 'LIS']

  if (seAsiaOrigins.includes(origin)) {
    return [
      { dest: 'BKK', city: 'Bangkok' }, { dest: 'SIN', city: 'Singapore' },
      { dest: 'KUL', city: 'Kuala Lumpur' }, { dest: 'HAN', city: 'Hanoi' },
      { dest: 'SGN', city: 'Ho Chi Minh City' }, { dest: 'DPS', city: 'Bali' },
    ].filter(s => s.dest !== origin)
  }
  if (eastAsiaOrigins.includes(origin)) {
    return [
      { dest: 'NRT', city: 'Tokyo' }, { dest: 'ICN', city: 'Seoul' },
      { dest: 'HKG', city: 'Hong Kong' }, { dest: 'TPE', city: 'Taipei' },
      { dest: 'BKK', city: 'Bangkok' }, { dest: 'SIN', city: 'Singapore' },
    ].filter(s => s.dest !== origin)
  }
  if (europeanOrigins.includes(origin)) {
    return [
      { dest: 'BCN', city: 'Barcelona' }, { dest: 'LIS', city: 'Lisbon' },
      { dest: 'PRG', city: 'Prague' }, { dest: 'KRK', city: 'Krakow' },
      { dest: 'BUD', city: 'Budapest' }, { dest: 'ATH', city: 'Athens' },
    ].filter(s => s.dest !== origin)
  }
  return [
    { dest: 'BKK', city: 'Bangkok' }, { dest: 'LHR', city: 'London' },
    { dest: 'NRT', city: 'Tokyo' }, { dest: 'BCN', city: 'Barcelona' },
    { dest: 'DXB', city: 'Dubai' }, { dest: 'SIN', city: 'Singapore' },
  ].filter(s => s.dest !== origin)
}

function getNextWeekendDate(): string {
  const d = new Date()
  const dayOfWeek = d.getDay()
  const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7
  d.setDate(d.getDate() + daysUntilFriday)
  return d.toISOString().split('T')[0]
}

/** Compute next departure/return dates for a weekend trip */
function getWeekendDates(departDay: 'thursday' | 'friday', returnDay: 'saturday' | 'sunday' | 'monday'): { depart: string; return: string } {
  const dayMap = { sunday: 0, monday: 1, thursday: 4, friday: 5, saturday: 6 }
  const now = new Date()
  const today = now.getDay()

  // Find next occurrence of depart day (at least 2 days from now for booking buffer)
  let daysUntilDepart = (dayMap[departDay] - today + 7) % 7
  if (daysUntilDepart < 2) daysUntilDepart += 7

  const departDate = new Date(now)
  departDate.setDate(departDate.getDate() + daysUntilDepart)

  // Find the return day AFTER the depart date
  const departDow = departDate.getDay()
  let daysUntilReturn = (dayMap[returnDay] - departDow + 7) % 7
  if (daysUntilReturn === 0) daysUntilReturn = 7 // at least next occurrence

  const returnDate = new Date(departDate)
  returnDate.setDate(returnDate.getDate() + daysUntilReturn)

  return {
    depart: departDate.toISOString().split('T')[0],
    return: returnDate.toISOString().split('T')[0],
  }
}

// ── FlexibleDateInput Component ────────────────────────────────────────────

function FlexibleDateInput({
  label,
  value,
  onChange,
  minDate,
  minMonth,
}: {
  label: string
  value: FlexibleDateValue
  onChange: (v: FlexibleDateValue) => void
  minDate?: string
  minMonth?: string
}) {
  const typeOptions: { value: DateFlexType; label: string }[] = [
    { value: 'exact', label: 'Exact Date' },
    { value: 'day-of-week', label: 'Day' },
    { value: 'month', label: 'Month' },
    { value: 'anytime', label: 'Anytime' },
  ]

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  // Generate month options: current month through 12 months out
  const monthOptions: { value: string; label: string }[] = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const val = d.toISOString().slice(0, 7)
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    monthOptions.push({ value: val, label })
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-900">{label}</label>

      {/* Type selector - compact segmented control */}
      <div className="flex bg-gray-100 rounded-lg p-0.5">
        {typeOptions.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              const updated: FlexibleDateValue = { type: opt.value }
              if (opt.value === 'exact') {
                updated.exactDate = value.exactDate || minDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
              } else if (opt.value === 'month') {
                updated.month = value.month || minMonth || now.toISOString().slice(0, 7)
              } else if (opt.value === 'day-of-week') {
                updated.dayOfWeek = value.dayOfWeek ?? 5 // Default to Friday
              }
              onChange(updated)
            }}
            className={`flex-1 text-xs font-medium py-1.5 px-2 rounded-md transition-all ${
              value.type === opt.value
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Input area based on selected type */}
      {value.type === 'exact' && (
        <input
          type="date"
          value={value.exactDate || ''}
          onChange={e => onChange({ ...value, exactDate: e.target.value })}
          min={minDate || new Date().toISOString().split('T')[0]}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition text-slate-900"
          required
        />
      )}

      {value.type === 'month' && (
        <select
          value={value.month || ''}
          onChange={e => onChange({ ...value, month: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition text-slate-900"
          required
        >
          {monthOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}

      {value.type === 'day-of-week' && (
        <div className="space-y-1.5">
          <div className="grid grid-cols-4 gap-1.5">
            {dayNames.map((name, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange({ ...value, dayOfWeek: i })}
                className={`py-2 rounded-lg text-xs font-medium transition ${
                  value.dayOfWeek === i
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {name.slice(0, 3)}
              </button>
            ))}
          </div>
          {value.dayOfWeek !== undefined && (
            <p className="text-xs text-gray-400">
              Next {dayNames[value.dayOfWeek]}: {(() => {
                const d = new Date()
                const diff = (value.dayOfWeek - d.getDay() + 7) % 7 || 7
                d.setDate(d.getDate() + (diff < 2 ? diff + 7 : diff))
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              })()}
            </p>
          )}
        </div>
      )}

      {value.type === 'anytime' && (
        <div className="px-4 py-3 bg-sky-500/5 border-2 border-sky-500/20 rounded-lg text-sm text-gray-600">
          Best price in the next 6 months
        </div>
      )}

      {/* Time-of-day filter — shown for exact date and day-of-week */}
      {(value.type === 'exact' || value.type === 'day-of-week') && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 shrink-0">Time:</span>
          {([
            { val: undefined as TimeOfDay | undefined, label: 'Any' },
            { val: 0 as TimeOfDay, label: 'Morning' },
            { val: 1 as TimeOfDay, label: 'Afternoon' },
            { val: 2 as TimeOfDay, label: 'Evening' },
            { val: 3 as TimeOfDay, label: 'Night' },
          ]).map(opt => (
            <button
              key={opt.label}
              type="button"
              onClick={() => onChange({ ...value, timeOfDay: opt.val })}
              className={`px-2 py-1 rounded text-xs font-medium transition ${
                value.timeOfDay === opt.val
                  ? 'bg-sky-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Search Component ──────────────────────────────────────────────────

function SearchPageContent() {
  const searchParams = useSearchParams()
  // Form state
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [tripType, setTripType] = useState<TripType>('round-trip')

  // Stopovers state
  const { format: fmtCurrency, code: currencyCode, setCurrency, currencies } = useCurrency()
  const [stopoverMaxDays, setStopoverMaxDays] = useState(14)
  const [stopoverPassports, setStopoverPassports] = useState<string[]>(['US'])
  const [stopoverBudget, setStopoverBudget] = useState<'budget' | 'mid' | 'comfort'>('mid')
  const [stopoverLoading, setStopoverLoading] = useState(false)
  const [stopoverError, setStopoverError] = useState('')
  const [stopoverResult, setStopoverResult] = useState<StopoverSearchResult | null>(null)

  // Pre-fill from URL params
  useEffect(() => {
    const o = searchParams.get('origin')
    const d = searchParams.get('destination') || searchParams.get('dest')
    const tab = searchParams.get('tab')
    if (o) setOrigin(o.toUpperCase())
    if (d) setDestination(d.toUpperCase())
    if (tab === 'stopovers') setTripType('stopovers')
  }, [searchParams])

  // Flexible date states
  const [departureDate, setDepartureDate] = useState<FlexibleDateValue>(() => ({
    type: 'exact',
    exactDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  }))

  const [returnDateFlex, setReturnDateFlex] = useState<FlexibleDateValue>(() => ({
    type: 'exact',
    exactDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
  }))

  // Loading
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Results
  const [calendarData, setCalendarData] = useState<Record<string, unknown> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [exactDateResult, setExactDateResult] = useState<{ price: number; dayData: any; source?: string; deepLink?: string; isLive?: boolean; departDate?: string; returnDate?: string } | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [flexResult, setFlexResult] = useState<any>(null)
  const [discoverResults, setDiscoverResults] = useState<{ destination: string; city: string; price: number; departDate: string; returnDate: string }[]>([])
  const [emptyRoute, setEmptyRoute] = useState(false)
  const [showPopularSuggestions, setShowPopularSuggestions] = useState(false)
  const [showPriceCalendar, setShowPriceCalendar] = useState(false)

  // Multi-city
  interface FlightLeg {
    from: string
    to: string
    date: string
  }
  const [legs, setLegs] = useState<FlightLeg[]>([
    { from: '', to: '', date: departureDate.exactDate || '' },
    { from: '', to: '', date: '' },
  ])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [multiCityResults, setMultiCityResults] = useState<any>(null)

  // Budget mode for multi-city
  const [budgetMode, setBudgetMode] = useState(false)
  const [budgetDestinations, setBudgetDestinations] = useState<string[]>(['', ''])
  const [budgetTotal, setBudgetTotal] = useState('')
  const [budgetTripDays, setBudgetTripDays] = useState('')
  const [budgetStartDate, setBudgetStartDate] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [budgetOptimizeResult, setBudgetOptimizeResult] = useState<any>(null)
  const [budgetOptimizeLoading, setBudgetOptimizeLoading] = useState(false)

  // One-way vs round-trip comparison
  const [oneWayComparison, setOneWayComparison] = useState<{
    outbound: number
    inbound: number
    total: number
    savings: number
  } | null>(null)

  const today = new Date().toISOString().split('T')[0]

  // Auto-adjust return date if departure date is set after return
  useEffect(() => {
    if (
      tripType === 'round-trip' &&
      departureDate.type === 'exact' &&
      returnDateFlex.type === 'exact' &&
      departureDate.exactDate &&
      returnDateFlex.exactDate &&
      departureDate.exactDate > returnDateFlex.exactDate
    ) {
      const d = new Date(departureDate.exactDate)
      d.setDate(d.getDate() + 7)
      setReturnDateFlex({ ...returnDateFlex, exactDate: d.toISOString().split('T')[0] })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departureDate.exactDate])

  // Compute derived values for display/search
  const isRoundTrip = tripType === 'round-trip'
  // Resolve day-of-week to actual dates
  const resolveDayOfWeek = (dow: number | undefined): string | undefined => {
    if (dow === undefined) return undefined
    const d = new Date()
    const diff = (dow - d.getDay() + 7) % 7
    d.setDate(d.getDate() + (diff < 2 ? diff + 7 : diff)) // At least 2 days out
    return d.toISOString().split('T')[0]
  }

  const effectiveDepartDate = departureDate.type === 'exact'
    ? departureDate.exactDate
    : departureDate.type === 'day-of-week'
      ? resolveDayOfWeek(departureDate.dayOfWeek)
      : undefined
  const effectiveReturnDate = returnDateFlex.type === 'exact'
    ? returnDateFlex.exactDate
    : returnDateFlex.type === 'day-of-week'
      ? resolveDayOfWeek(returnDateFlex.dayOfWeek)
      : undefined

  // Feature 9: One-way vs round-trip comparison
  // When a round-trip result is shown, check if 2 one-ways would be cheaper
  useEffect(() => {
    if (!exactDateResult || !isRoundTrip || !effectiveDepartDate || !effectiveReturnDate) return
    if (!origin || !destination) return

    const checkOneWays = async () => {
      try {
        // Use TravelPayouts (free) for both one-way checks
        const [outRes, inRes] = await Promise.all([
          fetch(`/api/nearby-price?origin=${origin}&destination=${destination}&departDate=${effectiveDepartDate}`),
          fetch(`/api/nearby-price?origin=${destination}&destination=${origin}&departDate=${effectiveReturnDate}`),
        ])

        if (!outRes.ok || !inRes.ok) return

        const outData = await outRes.json()
        const inData = await inRes.json()

        if (outData.price == null || inData.price == null) return

        const oneWayTotal = outData.price + inData.price
        const roundTripPrice = exactDateResult.price
        const savings = roundTripPrice - oneWayTotal

        // Only show if savings > $10
        if (savings > 10) {
          setOneWayComparison({
            outbound: outData.price,
            inbound: inData.price,
            total: oneWayTotal,
            savings,
          })
        }
      } catch {
        // Silently fail — this is a nice-to-have tip
      }
    }

    checkOneWays()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exactDateResult?.price])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setCalendarData(null); setExactDateResult(null); setFlexResult(null); setDiscoverResults([])
    setError(''); setEmptyRoute(false); setShowPopularSuggestions(false); setMultiCityResults(null)
    setOneWayComparison(null); setBudgetOptimizeResult(null); setStopoverResult(null); setStopoverError('')

    // ── Stopovers mode ──
    if (tripType === 'stopovers') {
      if (!origin || !destination) { setError('Please select both origin and destination'); return }
      if (origin === destination) { setError('Origin and destination must be different'); return }

      setStopoverLoading(true)
      try {
        // Resolve departure date based on flex type
        const stopoverDepartDate = departureDate.type === 'exact'
          ? (departureDate.exactDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0])
          : departureDate.type === 'month'
            ? `${departureDate.month}-15` // mid-month as approximate date
            : new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] // anytime = 1 month out

        const params = new URLSearchParams({
          origin: origin.toUpperCase(),
          destination: destination.toUpperCase(),
          depart_date: stopoverDepartDate,
          max_days: String(stopoverMaxDays),
          passport: stopoverPassports.join(','),
          budget: stopoverBudget,
        })

        const res = await fetch(`/api/layover/smart?${params}`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Search failed')
        }

        const data: StopoverSearchResult = await res.json()
        setStopoverResult(data)
      } catch (err) {
        setStopoverError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        setStopoverLoading(false)
      }
      return
    }

    // ── Multi-city validation ──
    if (tripType === 'multi-city') {
      if (budgetMode) {
        // Budget mode validation
        if (!origin) { setError('Please select an origin airport'); return }
        const validDests = budgetDestinations.filter(d => d.trim())
        if (validDests.length < 2) { setError('Add at least 2 destinations'); return }
        if (validDests.length > 4) { setError('Maximum 4 destinations for budget optimizer'); return }
        if (!budgetTotal || Number(budgetTotal) <= 0) { setError('Enter a total budget'); return }
        if (!budgetTripDays || Number(budgetTripDays) <= 0) { setError('Enter total trip days'); return }
      } else {
        if (legs.length < 2) { setError('Add at least 2 flight legs'); return }
        for (let i = 0; i < legs.length; i++) {
          if (!legs[i].from || !legs[i].to || !legs[i].date) {
            setError(`Please fill in all fields for flight ${i + 1}`); return
          }
          if (legs[i].from === legs[i].to) {
            setError(`Flight ${i + 1}: origin and destination must be different`); return
          }
        }
      }
    } else {
      if (!origin) { setError('Please select a departure airport'); return }
      if (!destination && destination !== 'ANYWHERE') {
        setError('Please select a destination'); return
      }
      if (destination && destination !== 'ANYWHERE' && origin === destination) { setError('Departure and destination must be different'); return }
    }

    setLoading(true)
    try {
      // ── "Anywhere" mode — find cheapest destinations ──
      if (destination === 'ANYWHERE') {
        const dateParam = departureDate.type === 'exact'
          ? departureDate.exactDate
          : departureDate.type === 'month'
            ? `${departureDate.month}-01`
            : undefined
        const res = await fetch(`/api/discover?origin=${origin}${dateParam ? `&depart_date=${dateParam}` : ''}&limit=5`)
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || `API error: ${res.status}`)
        }
        const data = await res.json()
        const results = data.results || []
        if (results.length === 0) {
          setEmptyRoute(true)
        } else {
          setDiscoverResults(results)
          const label = departureDate.type === 'exact'
            ? new Date(departureDate.exactDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : departureDate.type === 'month'
              ? new Date(departureDate.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : 'Anytime'
          saveRecentSearch({
            origin, mode: 'discover', date: dateParam || 'anytime',
            label: `${origin} → anywhere · ${label}`,
            url: `/search?origin=${origin}&dest=ANYWHERE`,
          })
        }
        setLoading(false)
        return
      }

      // ── Multi-city ──
      if (tripType === 'multi-city') {
        if (budgetMode) {
          // Budget optimizer mode
          setBudgetOptimizeLoading(true)
          const validDests = budgetDestinations.filter(d => d.trim()).map(d => d.trim().toUpperCase())
          const res = await fetch('/api/search/flights/multi-city/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              origin: origin.toUpperCase(),
              destinations: validDests,
              totalBudget: Number(budgetTotal),
              tripDays: Number(budgetTripDays),
            }),
          })
          if (!res.ok) {
            const data = await res.json()
            throw new Error(data.error || `API error: ${res.status}`)
          }
          const data = await res.json()
          setBudgetOptimizeLoading(false)
          if (!data.success) {
            setEmptyRoute(true)
          } else {
            setBudgetOptimizeResult(data)
          }
          setLoading(false)
          return
        }

        const res = await fetch('/api/search/flights/multi-city', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ legs }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || `API error: ${res.status}`)
        }
        const data = await res.json()
        if (!data.success || !data.legs || data.legs.length === 0) {
          setEmptyRoute(true)
        } else {
          setMultiCityResults(data)
          const legSummary = legs.map(l => l.from).join('→') + '→' + legs[legs.length - 1].to
          saveRecentSearch({
            origin: legs[0].from, destination: legs[legs.length - 1].to, mode: 'exact-date',
            label: `${legSummary} · Multi-city`,
            url: `/search?origin=${legs[0].from}&mode=multi-city`,
          })
        }
        setLoading(false)
        return
      }

      // ── Standard search: use flexible API ──
      const returnType = isRoundTrip ? returnDateFlex.type : 'none'

      // Determine if this is a simple exact+exact or exact+none case that
      // should use the existing direct flight search for maximum compatibility
      const departIsResolved = departureDate.type === 'exact' || departureDate.type === 'day-of-week'
      const returnIsResolved = returnType === 'exact' || returnType === 'day-of-week' || returnType === 'none'
      const isSimpleExact = departIsResolved && returnIsResolved

      if (isSimpleExact) {
        // Use existing proven flow: direct SerpApi → Kiwi → TravelPayouts
        await searchExactFlow(returnType === 'exact')
      } else {
        // Use new flexible search API for month/anytime combos
        await searchFlexibleFlow(returnType)
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Exact date search flow (proven pipeline) ──
  const searchExactFlow = async (roundTrip: boolean) => {
    const depDate = effectiveDepartDate || departureDate.exactDate!
    const retDate = roundTrip ? (effectiveReturnDate || returnDateFlex.exactDate) : undefined
    let gotPrice = false

    // Priority 1: SerpApi Google Flights
    try {
      let flightUrl = `/api/search/flights?origin=${origin}&destination=${destination}&departDate=${depDate}`
      if (roundTrip && retDate) {
        flightUrl += `&returnDate=${retDate}`
      }
      if (departureDate.timeOfDay !== undefined) {
        flightUrl += `&departTime=${departureDate.timeOfDay}`
      }
      if (roundTrip && returnDateFlex.timeOfDay !== undefined) {
        flightUrl += `&returnTime=${returnDateFlex.timeOfDay}`
      }
      const flightRes = await fetch(flightUrl)
      if (flightRes.ok) {
        const flightData = await flightRes.json()
        if (flightData.success && flightData.flight) {
          setExactDateResult({
            price: flightData.flight.price,
            dayData: {
              airlines: flightData.flight.airlines,
              stops: flightData.flight.stops,
              duration: flightData.flight.duration,
              priceLevel: flightData.flight.priceLevel,
              typicalRange: flightData.flight.typicalRange,
            },
            source: flightData.source,
            isLive: flightData.isLive,
            departDate: depDate,
            returnDate: retDate,
          })
          gotPrice = true
          const dateLabel = new Date(depDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          saveRecentSearch({
            origin, destination, date: depDate, mode: 'exact-date',
            label: `${origin} → ${destination} · ${dateLabel}`,
            url: `/search?origin=${origin}&dest=${destination}&date=${depDate}&mode=exact-date`,
          })
        }
      }
    } catch (serpErr) {
      console.log('[Search] SerpApi flight search failed, trying Kiwi:', serpErr)
    }

    // Priority 2: Kiwi
    if (!gotPrice) {
      try {
        let kiwiUrl = `/api/kiwi/search?origin=${origin}&destination=${destination}&departure_date=${depDate}&max=3`
        if (roundTrip && retDate) {
          kiwiUrl += `&return_date=${retDate}`
        }
        const kiwiRes = await fetch(kiwiUrl)
        if (kiwiRes.ok) {
          const kiwiData = await kiwiRes.json()
          if (kiwiData.offers?.length > 0) {
            const offer = kiwiData.offers[0]
            setExactDateResult({
              price: offer.price,
              dayData: { ...offer, airlines: offer.airlines, stops: offer.stops },
              source: 'kiwi',
              deepLink: offer.deepLink,
              isLive: true,
              departDate: depDate,
              returnDate: retDate,
            })
            gotPrice = true
            const dateLabel = new Date(depDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            saveRecentSearch({
              origin, destination, date: depDate, mode: 'exact-date',
              label: `${origin} → ${destination} · ${dateLabel}`,
              url: `/search?origin=${origin}&dest=${destination}&date=${depDate}&mode=exact-date`,
            })
          }
        }
      } catch (kiwiErr) {
        console.log('[Search] Kiwi unavailable, falling back to cached:', kiwiErr)
      }
    }

    // Priority 3: TravelPayouts cached
    if (!gotPrice) {
      const monthStr = depDate.slice(0, 7)
      const res = await fetch(`/api/travelpayouts/calendar?origin=${origin}&destination=${destination}&depart_date=${monthStr}`)
      if (!res.ok) throw new Error(`API error: ${res.status}`)
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const dayData = data.data?.[depDate] ||
        data.data?.[depDate.replace(/-0(\d)/g, '-$1')]
      const price = dayData?.price || dayData?.value
      if (!price) {
        setEmptyRoute(true)
      } else {
        setExactDateResult({
          price, dayData, source: 'travelpayouts', isLive: false,
          departDate: depDate, returnDate: retDate,
        })
        const dateLabel = new Date(depDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        saveRecentSearch({
          origin, destination, date: depDate, mode: 'exact-date',
          label: `${origin} → ${destination} · ${dateLabel}`,
          url: `/search?origin=${origin}&dest=${destination}&date=${depDate}&mode=exact-date`,
        })
      }
    }
  }

  // ── Flexible date search flow (month/anytime) ──
  const searchFlexibleFlow = async (returnType: string) => {
    const params = new URLSearchParams({
      origin,
      destination,
      departType: departureDate.type,
      returnType,
    })

    if (departureDate.type === 'exact' && departureDate.exactDate) {
      params.set('departDate', departureDate.exactDate)
    }
    if (departureDate.type === 'month' && departureDate.month) {
      params.set('departMonth', departureDate.month)
    }
    if (returnType === 'exact' && returnDateFlex.exactDate) {
      params.set('returnDate', returnDateFlex.exactDate)
    }
    if (returnType === 'month' && returnDateFlex.month) {
      params.set('returnMonth', returnDateFlex.month)
    }

    const res = await fetch(`/api/search/flights/flexible?${params.toString()}`)
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || `API error: ${res.status}`)
    }
    const data = await res.json()

    if (!data.success) {
      throw new Error(data.message || 'Search returned no results')
    }

    // If the flexible API returned calendar data (TravelPayouts month fallback), show it
    if (data.calendarData) {
      setCalendarData(data.calendarData)
      const monthLabel = departureDate.month
        ? new Date(departureDate.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Flexible'
      saveRecentSearch({
        origin, destination, date: departureDate.month || 'flex', mode: 'flexible-month',
        label: `${origin} → ${destination} · ${monthLabel}`,
        url: `/search?origin=${origin}&dest=${destination}`,
      })
      return
    }

    // For exact searchType results, map to exactDateResult format
    if (data.searchType === 'exact' && data.price) {
      setExactDateResult({
        price: data.price,
        dayData: {
          airlines: data.airlines || [],
          stops: data.stops,
          duration: data.duration,
          priceLevel: data.priceLevel,
          typicalRange: data.typicalRange,
        },
        source: data.source,
        isLive: data.isLive,
        departDate: data.departDate,
        returnDate: data.returnDate,
      })
      return
    }

    // For flexible/mixed results
    if (data.price || data.departure?.price || data.totalEstimate) {
      setFlexResult(data)
      const label = departureDate.type === 'month'
        ? new Date(departureDate.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Anytime'
      saveRecentSearch({
        origin, destination, date: data.bestDepartDate || 'flex', mode: 'flexible-month',
        label: `${origin} → ${destination} · ${label}`,
        url: `/search?origin=${origin}&dest=${destination}`,
      })
    } else {
      setEmptyRoute(true)
    }
  }

  // Helper: get a display-friendly date label for the effective departure
  const getDepartLabel = () => {
    if (departureDate.type === 'exact' && departureDate.exactDate) {
      return new Date(departureDate.exactDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    if (departureDate.type === 'month' && departureDate.month) {
      return new Date(departureDate.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
    return 'Anytime'
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <Navigation />

      <div className="container mx-auto px-4 py-8 md:py-12 flex-1">
        {/* Page header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Smart Flight Search</h1>
          <p className="text-xl text-sky-300">Search by exact dates, browse a month, or find the cheapest time to fly</p>
        </div>

        {/* FORM CARD */}
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-10">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">

            {/* Trip type toggle */}
            <div className="flex items-center gap-2 flex-wrap">
              {([
                { value: 'one-way' as TripType, label: 'One-way' },
                { value: 'round-trip' as TripType, label: 'Round-trip' },
                { value: 'multi-city' as TripType, label: 'Multi-city' },
                { value: 'stopovers' as TripType, label: 'Stopovers' },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setTripType(opt.value); setError('') }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    tripType === opt.value
                      ? 'bg-sky-500 text-slate-900 shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Origin + Destination (hidden in multi-city non-budget mode) */}
            {(tripType !== 'multi-city' || (tripType === 'multi-city' && budgetMode)) && tripType !== 'stopovers' && (
              <div className={`grid grid-cols-1 ${tripType !== 'multi-city' ? 'md:grid-cols-2' : ''} gap-4`}>
                <div className="relative">
                  <AirportAutocomplete id="origin" label="From *" value={origin} onChange={setOrigin} placeholder="Departure city or code..." />
                </div>
                {tripType !== 'multi-city' && (
                  <div className="relative">
                    <AirportAutocomplete
                      id="destination" label="To *"
                      value={destination} onChange={setDestination}
                      placeholder='City, code, or "Anywhere"...'
                      allowAnywhere
                    />
                  </div>
                )}
              </div>
            )}

            {/* DATE INPUTS (not multi-city, not stopovers) */}
            {tripType !== 'multi-city' && tripType !== 'stopovers' && (
              <div className={`grid gap-4 ${tripType === 'round-trip' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                <FlexibleDateInput
                  label={tripType === 'round-trip' ? 'Departure' : 'Travel Date'}
                  value={departureDate}
                  onChange={setDepartureDate}
                  minDate={today}
                  minMonth={new Date().toISOString().slice(0, 7)}
                />
                {tripType === 'round-trip' && (
                  <FlexibleDateInput
                    label="Return"
                    value={returnDateFlex}
                    onChange={setReturnDateFlex}
                    minDate={departureDate.type === 'exact' ? departureDate.exactDate : today}
                    minMonth={departureDate.type === 'month' ? departureDate.month : new Date().toISOString().slice(0, 7)}
                  />
                )}
              </div>
            )}

            {/* Price Calendar — expandable section */}
            {tripType !== 'multi-city' && tripType !== 'stopovers' &&
              origin.length === 3 &&
              destination.length === 3 &&
              destination !== 'ANYWHERE' &&
              (departureDate.type === 'exact' || departureDate.type === 'month') && (
              <div>
                <button
                  type="button"
                  onClick={() => setShowPriceCalendar(!showPriceCalendar)}
                  className="flex items-center gap-2 text-sm text-sky-400 hover:text-sky-600 font-medium transition"
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${showPriceCalendar ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  View price calendar
                </button>
                {showPriceCalendar && (
                  <div className="mt-3">
                    <PriceCalendar
                      origin={origin}
                      destination={destination}
                      month={
                        departureDate.type === 'month' && departureDate.month
                          ? departureDate.month
                          : departureDate.type === 'exact' && departureDate.exactDate
                            ? departureDate.exactDate.slice(0, 7)
                            : new Date().toISOString().slice(0, 7)
                      }
                      onSelectDate={(date) => {
                        setDepartureDate({ type: 'exact', exactDate: date })
                        setShowPriceCalendar(false)
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* STOPOVERS MODE */}
            {tripType === 'stopovers' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AirportAutocomplete id="stopover-origin" label="From" value={origin} onChange={setOrigin} placeholder="Origin airport (e.g. JFK)" persistKey="origin" />
                  <AirportAutocomplete id="stopover-destination" label="To" value={destination} onChange={setDestination} placeholder="Destination airport (e.g. BKK)" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Depart</label>
                    <select
                      value={departureDate.type === 'exact' ? 'exact' : departureDate.type === 'month' ? 'month' : 'anytime'}
                      onChange={e => {
                        const val = e.target.value
                        if (val === 'exact') setDepartureDate({ type: 'exact', exactDate: departureDate.exactDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] })
                        else if (val === 'month') setDepartureDate({ type: 'month', month: new Date().toISOString().slice(0, 7) })
                        else setDepartureDate({ type: 'anytime' })
                      }}
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition text-slate-900 text-xs mb-1"
                    >
                      <option value="anytime">Anytime</option>
                      <option value="month">Specific month</option>
                      <option value="exact">Exact date</option>
                    </select>
                    {departureDate.type === 'exact' && (
                      <input
                        type="date"
                        value={departureDate.exactDate || ''}
                        min={today}
                        onChange={e => setDepartureDate({ type: 'exact', exactDate: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition text-slate-900 text-sm"
                      />
                    )}
                    {departureDate.type === 'month' && (
                      <input
                        type="month"
                        value={departureDate.month || new Date().toISOString().slice(0, 7)}
                        onChange={e => setDepartureDate({ type: 'month', month: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition text-slate-900 text-sm"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Max Travel Days</label>
                    <select
                      value={stopoverMaxDays}
                      onChange={e => setStopoverMaxDays(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition text-slate-900 text-sm"
                    >
                      {[1, 2, 3, 5, 7, 10, 14, 21, 30, 45, 60].map(d => (
                        <option key={d} value={d}>{d} days</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Passport</label>
                    <PassportSelector
                      selected={stopoverPassports}
                      onChange={setStopoverPassports}
                      maxSelections={3}
                      variant="light"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Budget</label>
                    <select
                      value={stopoverBudget}
                      onChange={e => setStopoverBudget(e.target.value as 'budget' | 'mid' | 'comfort')}
                      className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition text-slate-900 text-sm"
                    >
                      <option value="budget">Budget</option>
                      <option value="mid">Mid-Range</option>
                      <option value="comfort">Comfort</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Turn layovers into free vacations. Find flights with multi-day stopovers that save money while adding a new country to your trip.
                </p>
              </div>
            )}

            {/* MULTI-CITY MODE */}
            {tripType === 'multi-city' && (
              <div className="space-y-3">
                {/* Budget Mode Toggle */}
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">{budgetMode ? 'Budget Optimizer' : 'Flight legs'}</p>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="text-xs text-gray-500">Budget Mode</span>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={budgetMode}
                        onChange={(e) => setBudgetMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
                    </div>
                  </label>
                </div>

                {budgetMode ? (
                  /* Budget Mode Form */
                  <div className="space-y-3 bg-sky-500/5 border border-sky-500/20 rounded-lg p-4">
                    <p className="text-xs text-gray-500">Enter your desired cities and let us find the cheapest route order.</p>

                    {/* Destinations */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-900">Destinations (2-4 cities)</label>
                      {budgetDestinations.map((dest, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <AirportAutocomplete
                            id={`budget-dest-${idx}`}
                            label=""
                            value={dest}
                            onChange={(val) => {
                              const updated = [...budgetDestinations]
                              updated[idx] = val
                              setBudgetDestinations(updated)
                            }}
                            placeholder={`City ${idx + 1}`}
                          />
                          {idx >= 2 && (
                            <button
                              type="button"
                              onClick={() => setBudgetDestinations(budgetDestinations.filter((_, i) => i !== idx))}
                              className="px-2 py-2 text-red-400 hover:text-red-600 transition text-lg leading-none shrink-0"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      ))}
                      {budgetDestinations.length < 4 && (
                        <button
                          type="button"
                          onClick={() => setBudgetDestinations([...budgetDestinations, ''])}
                          className="text-sm text-sky-400 hover:text-sky-600 font-medium transition"
                        >
                          + Add city
                        </button>
                      )}
                    </div>

                    {/* Trip starts + total days + budget */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">Trip starts</label>
                        <input
                          type="date"
                          value={budgetStartDate}
                          onChange={(e) => setBudgetStartDate(e.target.value)}
                          min={today}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition text-slate-900 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">Total days</label>
                        <input
                          type="number"
                          value={budgetTripDays}
                          onChange={(e) => setBudgetTripDays(e.target.value)}
                          placeholder="14"
                          min={2}
                          max={90}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition text-slate-900 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-900 mb-1">Budget ($)</label>
                        <input
                          type="number"
                          value={budgetTotal}
                          onChange={(e) => setBudgetTotal(e.target.value)}
                          placeholder="1500"
                          min={1}
                          className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition text-slate-900 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Standard Multi-city Legs */
                  <>
                    {legs.map((leg, idx) => (
                      <div key={idx} className="flex items-end gap-2">
                        <div className="flex-1 min-w-0">
                          <AirportAutocomplete
                            id={`mc-from-${idx}`}
                            label={idx === 0 ? 'From' : ''}
                            value={leg.from}
                            onChange={(val) => {
                              const updated = [...legs]
                              updated[idx] = { ...updated[idx], from: val }
                              setLegs(updated)
                            }}
                            placeholder="Origin"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <AirportAutocomplete
                            id={`mc-to-${idx}`}
                            label={idx === 0 ? 'To' : ''}
                            value={leg.to}
                            onChange={(val) => {
                              const updated = [...legs]
                              updated[idx] = { ...updated[idx], to: val }
                              setLegs(updated)
                            }}
                            placeholder="Destination"
                          />
                        </div>
                        <div className="w-36 shrink-0">
                          {idx === 0 && <label className="block text-sm font-medium text-slate-900 mb-1">Date</label>}
                          <input
                            type="date"
                            value={leg.date}
                            onChange={(e) => {
                              const updated = [...legs]
                              updated[idx] = { ...updated[idx], date: e.target.value }
                              setLegs(updated)
                            }}
                            min={idx > 0 && legs[idx - 1].date ? legs[idx - 1].date : today}
                            className="w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition text-slate-900 text-sm"
                            required
                          />
                        </div>
                        {idx >= 2 && (
                          <button
                            type="button"
                            onClick={() => setLegs(legs.filter((_, i) => i !== idx))}
                            className="px-2 py-2.5 text-red-400 hover:text-red-600 transition text-lg leading-none"
                            title="Remove leg"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                    {legs.length < 5 && (
                      <button
                        type="button"
                        onClick={() => {
                          const prevTo = legs[legs.length - 1]?.to || ''
                          setLegs([...legs, { from: prevTo, to: '', date: '' }])
                        }}
                        className="text-sm text-sky-400 hover:text-sky-600 font-medium transition"
                      >
                        + Add flight
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Search + Clear buttons */}
            <div className="flex gap-3">
              <button type="submit" disabled={loading || stopoverLoading}
                className={`flex-1 font-semibold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg ${
                  tripType === 'stopovers'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white'
                    : 'bg-sky-500 hover:bg-sky-600 text-slate-900'
                }`}>
                {stopoverLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Searching real-time flights...
                  </span>
                ) : loading ? 'Searching...' : tripType === 'stopovers' ? 'Find Stopover Deals' : 'Search Flights'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOrigin(''); setDestination(''); setError('')
                  setDepartureDate({ type: 'exact', exactDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0] })
                  setReturnDateFlex({ type: 'exact', exactDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0] })
                  setCalendarData(null); setExactDateResult(null); setFlexResult(null); setDiscoverResults([])
                  setEmptyRoute(false); setMultiCityResults(null); setStopoverResult(null)
                  setOneWayComparison(null); setBudgetOptimizeResult(null)
                  setLegs([{ from: '', to: '', date: '' }, { from: '', to: '', date: '' }])
                  setBudgetDestinations(['', '']); setBudgetTotal(''); setBudgetTripDays(''); setBudgetStartDate('')
                }}
                className="py-4 px-6 rounded-xl font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition text-lg"
              >
                Clear
              </button>
            </div>
          </div>
        </form>

        <RecentSearches />

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
              <p className="text-red-300 font-semibold text-center">{error}</p>
            </div>
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-white/[0.04] backdrop-blur border border-white/10 rounded-2xl p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-sky-400/30 border-t-sky-400 mb-4"></div>
              <p className="text-white text-lg font-medium">
                {destination === 'ANYWHERE' && 'Searching flights... Finding cheapest destinations'}
                {destination !== 'ANYWHERE' && tripType === 'multi-city' && `Searching flights... Checking ${legs.length} flight legs`}
                {destination !== 'ANYWHERE' && tripType !== 'multi-city' && departureDate.type === 'exact' && 'Searching flights... Checking real-time prices'}
                {destination !== 'ANYWHERE' && tripType !== 'multi-city' && departureDate.type === 'month' && 'Searching flights... Finding cheapest days this month'}
                {destination !== 'ANYWHERE' && tripType !== 'multi-city' && departureDate.type === 'anytime' && 'Searching flights... Finding the cheapest time to fly'}
              </p>
              <p className="text-white/40 text-sm mt-2">This may take a few seconds</p>
            </div>
          </div>
        )}

        {/* ——— RESULTS ——— */}
        {!loading && (
          <>
            {/* EMPTY ROUTE */}
            {emptyRoute && (
              <div className="max-w-md mx-auto mb-8">
                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                  <div className="text-5xl mb-4">&#128269;</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">No prices found</h3>
                  <p className="text-gray-600 mb-6">
                    Click below to check current prices on Aviasales.
                  </p>
                  <button
                    onClick={() => {
                      const date = effectiveDepartDate || `${departureDate.month || new Date().toISOString().slice(0, 7)}-01`
                      const ret = isRoundTrip ? effectiveReturnDate : undefined
                      const link = buildFlightLink(origin, destination, date, ret)
                      window.open(link, '_blank')
                    }}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-slate-900 font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg"
                  >
                    Search on Aviasales
                  </button>
                </div>
              </div>
            )}

            {/* FLEXIBLE MONTH: CalendarGrid */}
            {calendarData && (
              <>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <CalendarGrid data={calendarData as any} origin={origin} destination={destination} month={departureDate.month || new Date().toISOString().slice(0, 7)} />
                <WhatNext origin={origin} destination={destination} context="search" />
              </>
            )}

            {/* EXACT DATE: single price card */}
            {exactDateResult && (
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <div className="px-6 py-5 text-center bg-gradient-to-r from-sky-500 to-sky-600 relative">
                    {exactDateResult.isLive && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                        LIVE
                      </span>
                    )}
                    <p className="text-slate-900 font-semibold text-sm uppercase tracking-wide">
                      {exactDateResult.isLive ? 'Live Price' : 'Estimated Price'}
                    </p>
                    <p className="text-slate-900 text-6xl font-bold mt-1">
                      {exactDateResult.isLive ? '' : '~'}${exactDateResult.price}
                    </p>
                    <p className="text-slate-900/80 text-sm mt-2">
                      {origin} {isRoundTrip ? '<>' : '>'} {destination} · {exactDateResult.departDate || effectiveDepartDate}
                      {isRoundTrip && (exactDateResult.returnDate || effectiveReturnDate) && ` — ${exactDateResult.returnDate || effectiveReturnDate}`}
                    </p>
                    <p className="text-slate-900/60 text-xs mt-1">
                      {exactDateResult.isLive
                        ? exactDateResult.source === 'google-flights'
                          ? 'Live from Google Flights — prices update in real time'
                          : 'Live price — may vary at time of booking'
                        : 'Cached estimate — actual price may vary'}
                    </p>
                    {exactDateResult.dayData?.airlines && exactDateResult.dayData.airlines.length > 0 && (
                      <p className="text-slate-900/70 text-xs mt-1">
                        {exactDateResult.dayData.airlines.join(', ')}
                        {exactDateResult.dayData.stops !== undefined && ` · ${exactDateResult.dayData.stops === 0 ? 'Direct' : `${exactDateResult.dayData.stops} stop${exactDateResult.dayData.stops > 1 ? 's' : ''}`}`}
                        {exactDateResult.dayData.duration && ` · ${exactDateResult.dayData.duration}`}
                      </p>
                    )}
                    {exactDateResult.dayData?.priceLevel && (
                      <p className="text-slate-900/60 text-xs mt-1">
                        Price level: <span className="font-semibold">{exactDateResult.dayData.priceLevel}</span>
                        {exactDateResult.dayData.typicalRange && (
                          <> · Typical: ${exactDateResult.dayData.typicalRange[0]}–${exactDateResult.dayData.typicalRange[1]}</>
                        )}
                      </p>
                    )}
                  </div>
                  <div className="p-6">
                    <button
                      onClick={() => {
                        const depDate = exactDateResult.dayData?.departure_at || exactDateResult.dayData?.departureTime || effectiveDepartDate || ''
                        const ret = isRoundTrip ? (exactDateResult.returnDate || effectiveReturnDate) : undefined
                        const { action } = resolveFlightBooking({
                          origin, destination, departDate: depDate, returnDate: ret,
                          price: exactDateResult.price, source: exactDateResult.source,
                          deepLink: exactDateResult.deepLink,
                        })
                        if (action.type === 'affiliate-redirect') window.open(action.url, '_blank')
                      }}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-slate-900 font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg"
                    >
                      {exactDateResult.source === 'google-flights'
                        ? 'Book on Google Flights'
                        : exactDateResult.source === 'kiwi'
                          ? 'Check This Fare on Kiwi'
                          : 'Check on Aviasales'}
                    </button>

                    {/* Always show Google Flights as a reliable alternative */}
                    {exactDateResult.source !== 'google-flights' && (
                      <a
                        href={`https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}+on+${effectiveDepartDate}${isRoundTrip && effectiveReturnDate ? '+returning+' + effectiveReturnDate : ''}&curr=USD`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-6 rounded-lg transition mt-2 text-sm"
                      >
                        Also check on Google Flights
                      </a>
                    )}
                    <p className="text-center text-xs text-gray-500 mt-3">
                      {exactDateResult.source === 'google-flights'
                        ? 'Opens Google Flights with this route'
                        : 'Estimated price — verify on booking site'}
                    </p>
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-xs text-gray-500 mb-2 font-medium text-center">Plan your stay</p>
                      <BookingLinks
                        cityName={majorAirports.find(a => a.code === destination)?.city || destination}
                        iata={destination}
                        checkIn={effectiveDepartDate || ''}
                        nights={isRoundTrip && effectiveDepartDate && effectiveReturnDate ? Math.ceil((new Date(effectiveReturnDate).getTime() - new Date(effectiveDepartDate).getTime()) / 86400000) : 3}
                      />
                    </div>
                  </div>
                </div>
                {/* Feature 9: One-way vs round-trip comparison tip */}
                {oneWayComparison && isRoundTrip && (
                  <div className="mt-3 rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-amber-300 text-sm font-medium">
                          Tip: Book as 2 one-way flights and save ${oneWayComparison.savings}
                        </p>
                        <p className="text-amber-300/60 text-xs mt-0.5">
                          Outbound ~${oneWayComparison.outbound} + Return ~${oneWayComparison.inbound} = ${oneWayComparison.total} vs round-trip ${exactDateResult.price}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feature 6: Nearby airport price comparison */}
                {effectiveDepartDate && (
                  <NearbyAirportPrices
                    origin={origin}
                    destination={destination}
                    departDate={effectiveDepartDate}
                    currentPrice={exactDateResult.price}
                  />
                )}

                <WhatNext origin={origin} destination={destination} departDate={effectiveDepartDate} context="search" />
              </div>
            )}

            {/* FLEXIBLE RESULT: best price for month/anytime */}
            {flexResult && (
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <div className="px-6 py-5 text-center bg-gradient-to-r from-sky-500 to-sky-600 relative">
                    {flexResult.isLive && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg animate-pulse">
                        <span className="w-2 h-2 bg-white rounded-full"></span>
                        LIVE
                      </span>
                    )}
                    <p className="text-slate-900 font-semibold text-sm uppercase tracking-wide">
                      {flexResult.searchType === 'mixed' ? 'Estimated Total' : 'Best Price Found'}
                    </p>
                    <p className="text-slate-900 text-6xl font-bold mt-1">
                      {flexResult.isLive ? '' : '~'}${flexResult.searchType === 'mixed' ? flexResult.totalEstimate : flexResult.price}
                    </p>
                    <p className="text-slate-900/80 text-sm mt-2">
                      {origin} {isRoundTrip ? '<>' : '>'} {destination}
                    </p>

                    {/* Show best dates if available */}
                    {flexResult.bestDepartDate && (
                      <p className="text-slate-900/70 text-sm mt-1 font-medium">
                        Best departure: {new Date(flexResult.bestDepartDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        {flexResult.bestReturnDate && (
                          <> — return {new Date(flexResult.bestReturnDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</>
                        )}
                      </p>
                    )}

                    {/* Mixed search: show departure + return breakdown */}
                    {flexResult.searchType === 'mixed' && (
                      <div className="mt-3 space-y-1">
                        {flexResult.departure?.price && (
                          <p className="text-slate-900/60 text-xs">
                            Outbound: ${flexResult.departure.price}
                            {flexResult.departure.airlines?.length > 0 && ` · ${flexResult.departure.airlines.join(', ')}`}
                          </p>
                        )}
                        {flexResult.return?.price && (
                          <p className="text-slate-900/60 text-xs">
                            Return: ${flexResult.return.price}
                            {flexResult.return.airline && ` · ${flexResult.return.airline}`}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Single search: show airline/stops info */}
                    {flexResult.searchType !== 'mixed' && flexResult.airline && (
                      <p className="text-slate-900/70 text-xs mt-1">
                        {flexResult.airline}
                        {flexResult.stops !== null && ` · ${flexResult.stops === 0 ? 'Direct' : `${flexResult.stops} stop${flexResult.stops > 1 ? 's' : ''}`}`}
                      </p>
                    )}

                    <p className="text-slate-900/60 text-xs mt-2">
                      {flexResult.isLive
                        ? 'Live from Google — prices change frequently'
                        : 'Cached estimate — verify on booking site'}
                    </p>
                  </div>

                  <div className="p-6">
                    {/* Flight options if available */}
                    {flexResult.flights && flexResult.flights.length > 1 && (
                      <div className="mb-4 space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Flight options</p>
                        {flexResult.flights.slice(0, 3).map((f: any, i: number) => (
                          <div key={i} className={`flex items-center justify-between py-2 px-3 rounded-lg ${i === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                            <div className="text-sm text-gray-700">
                              {f.airline || 'Unknown'}
                              {f.stops !== undefined && (
                                <span className="text-gray-400 ml-2">
                                  {f.stops === 0 ? 'Direct' : `${f.stops} stop${f.stops > 1 ? 's' : ''}`}
                                </span>
                              )}
                            </div>
                            <div className={`font-bold ${i === 0 ? 'text-green-600' : 'text-slate-900'}`}>${f.price}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => {
                        const depDate = flexResult.bestDepartDate || effectiveDepartDate || `${departureDate.month || new Date().toISOString().slice(0, 7)}-15`
                        const retDate = flexResult.bestReturnDate || effectiveReturnDate || undefined
                        const link = buildFlightLink(origin, destination, depDate, retDate)
                        window.open(link, '_blank')
                      }}
                      className="w-full bg-sky-500 hover:bg-sky-600 text-slate-900 font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg"
                    >
                      {flexResult.bestDepartDate
                        ? `Book for ${new Date(flexResult.bestDepartDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : 'Check Prices'}
                    </button>
                    <a
                      href={`https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination}&curr=USD`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-6 rounded-lg transition mt-2 text-sm"
                    >
                      Also check on Google Flights
                    </a>
                    <p className="text-center text-xs text-gray-500 mt-3">
                      Flexible search — actual fares may vary
                    </p>

                    {flexResult.bestDepartDate && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-2 font-medium text-center">Plan your stay</p>
                        <BookingLinks
                          cityName={majorAirports.find(a => a.code === destination)?.city || destination}
                          iata={destination}
                          checkIn={flexResult.bestDepartDate}
                          nights={flexResult.bestReturnDate
                            ? Math.ceil((new Date(flexResult.bestReturnDate).getTime() - new Date(flexResult.bestDepartDate).getTime()) / 86400000)
                            : 3}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <WhatNext origin={origin} destination={destination} departDate={flexResult.bestDepartDate} context="search" />
              </div>
            )}

            {/* MULTI-CITY RESULTS */}
            {multiCityResults && multiCityResults.legs && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Multi-city Itinerary</h2>
                  <p className="text-sky-300">{multiCityResults.legs.length} flights</p>
                </div>
                <div className="space-y-4">
                  {multiCityResults.legs.map((leg: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="px-5 py-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-white bg-slate-900 rounded-full w-5 h-5 flex items-center justify-center">{idx + 1}</span>
                            <span className="font-bold text-slate-900 text-lg">{leg.from} &rarr; {leg.to}</span>
                            {leg.isLive && (
                              <span className="inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                                LIVE
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-sm">
                            {new Date(leg.date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          {leg.airlines && leg.airlines.length > 0 && (
                            <p className="text-gray-400 text-xs mt-1">
                              {leg.airlines.join(', ')}
                              {leg.stops !== undefined && ` · ${leg.stops === 0 ? 'Direct' : `${leg.stops} stop${leg.stops > 1 ? 's' : ''}`}`}
                              {leg.duration && ` · ${leg.duration}`}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          {leg.price != null ? (
                            <p className="text-2xl font-bold text-slate-900">${leg.price}</p>
                          ) : (
                            <p className="text-sm text-gray-400">No price</p>
                          )}
                        </div>
                      </div>
                      {leg.bookingUrl && (
                        <div className="px-5 pb-3">
                          <a
                            href={leg.bookingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-sky-400 hover:text-sky-600 font-medium transition"
                          >
                            Book on Google Flights &rarr;
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Total price */}
                <div className="mt-6 bg-gradient-to-r from-sky-500 to-sky-600 rounded-xl p-5 text-center shadow-lg">
                  <p className="text-slate-900/70 text-sm font-medium uppercase tracking-wide">Estimated Total</p>
                  <p className="text-slate-900 text-5xl font-bold mt-1">${multiCityResults.totalPrice}</p>
                  <p className="text-slate-900/60 text-xs mt-2">Sum of individual one-way fares — actual multi-city fare may differ</p>
                </div>
              </div>
            )}

            {/* BUDGET OPTIMIZE RESULTS */}
            {budgetOptimizeResult && budgetOptimizeResult.success && (
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Cheapest Route Found</h2>
                  <p className="text-sky-300">
                    Checked {budgetOptimizeResult.permutationsChecked} route permutations
                  </p>
                </div>

                {/* Route visualization */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <div className={`px-6 py-5 text-center ${budgetOptimizeResult.withinBudget ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-sky-500 to-sky-600'}`}>
                    <p className="text-slate-900/70 text-sm font-medium uppercase tracking-wide">
                      {budgetOptimizeResult.withinBudget ? 'Within Budget!' : 'Estimated Total'}
                    </p>
                    <p className="text-slate-900 text-5xl font-bold mt-1">${budgetOptimizeResult.totalCost}</p>
                    {budgetOptimizeResult.savings > 0 && (
                      <p className="text-slate-900/80 text-sm mt-2 font-medium">
                        Saves ${budgetOptimizeResult.savings} vs worst route order
                      </p>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    {/* Route path */}
                    <div className="flex items-center justify-center flex-wrap gap-1 text-sm">
                      {budgetOptimizeResult.legs.map((leg: { from: string; to: string; price: number | null }, idx: number) => (
                        <span key={idx} className="flex items-center gap-1">
                          {idx === 0 && <span className="font-bold text-slate-900">{leg.from}</span>}
                          <span className="text-gray-400 mx-1">&rarr;</span>
                          <span className="font-bold text-slate-900">{leg.to}</span>
                          {leg.price != null && (
                            <span className="text-xs text-gray-400">(${leg.price})</span>
                          )}
                        </span>
                      ))}
                    </div>

                    {/* Day distribution */}
                    {budgetOptimizeResult.cityDays && budgetOptimizeResult.bestRoute && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Suggested itinerary</p>
                        <div className="space-y-1">
                          {budgetOptimizeResult.bestRoute.map((city: string, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span className="text-slate-900 font-medium">{city}</span>
                              <span className="text-gray-500">{budgetOptimizeResult.cityDays[idx]} days</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Each leg detail */}
                    <div className="space-y-2">
                      {budgetOptimizeResult.legs.map((leg: { from: string; to: string; price: number | null }, idx: number) => (
                        <div key={idx} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white bg-slate-900 rounded-full w-5 h-5 flex items-center justify-center">{idx + 1}</span>
                            <span className="text-sm text-slate-900 font-medium">{leg.from} &rarr; {leg.to}</span>
                          </div>
                          <span className="font-bold text-slate-900">{leg.price != null ? `$${leg.price}` : 'N/A'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STOPOVER RESULTS */}
            {stopoverError && (
              <div className="max-w-3xl mx-auto mb-8">
                <div className="bg-red-500/20 border border-red-500/40 rounded-lg p-4">
                  <p className="text-red-300 font-semibold text-center">{stopoverError}</p>
                </div>
              </div>
            )}

            {stopoverLoading && (
              <div className="text-center py-16">
                <div className="inline-block w-12 h-12 border-[3px] border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
                <p className="text-white/60">Searching real-time flight prices...</p>
                <p className="text-white/30 text-sm mt-1">Checking visa requirements & ground costs</p>
              </div>
            )}

            {stopoverResult && !stopoverLoading && (
              <div className="max-w-5xl mx-auto">
                {/* Direct Flight Baseline */}
                <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Direct Flight</p>
                      <p className="text-white font-medium">
                        {stopoverResult.origin} &rarr; {stopoverResult.destination}
                      </p>
                      {stopoverResult.directAirlines.length > 0 && (
                        <p className="text-sm text-white/40">
                          {stopoverResult.directAirlines.join(', ')} &middot; {stopoverResult.directDuration} &middot; {stopoverResult.directStops === 0 ? 'Nonstop' : `${stopoverResult.directStops} stop${stopoverResult.directStops === 1 ? '' : 's'}`}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {stopoverResult.directPrice ? (
                        <>
                          <p className="text-2xl font-bold text-white">{fmtCurrency(stopoverResult.directPrice)}</p>
                          <p className="text-xs text-emerald-400">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 border border-emerald-500/30">
                              LIVE
                            </span>
                          </p>
                        </>
                      ) : (
                        <p className="text-white/40">No direct flights found</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stopover Cards */}
                {stopoverResult.stopovers.length > 0 ? (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                      Stopover Opportunities
                      <span className="text-sm font-normal text-white/40">
                        ({stopoverResult.stopovers.length} found)
                      </span>
                    </h2>

                    {stopoverResult.stopovers.map((stop, i) => {
                      const vc = VERDICT_CONFIG[stop.verdict]
                      const visa = VISA_CONFIG[stop.visaStatus]

                      return (
                        <motion.div
                          key={stop.hub}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="bg-white/[0.04] border border-white/10 rounded-xl overflow-hidden"
                        >
                          {/* Header */}
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-semibold text-white">
                                    {stop.stopoverDays} days in {stop.hubCity}
                                  </h3>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${vc.bg}`}>
                                    {vc.emoji} {vc.label}
                                  </span>
                                </div>
                                <p className="text-sm text-white/40">{stop.hubCountry}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-emerald-400">{fmtCurrency(stop.totalFlightCost)}</p>
                                {stop.savings > 0 ? (
                                  <p className="text-xs text-emerald-400">Save {fmtCurrency(stop.savings)} ({stop.savingsPercent}%)</p>
                                ) : (
                                  <p className="text-xs text-amber-400">+{fmtCurrency(Math.abs(stop.savings))} more</p>
                                )}
                              </div>
                            </div>

                            {/* Visa Badge */}
                            <div className="flex items-center gap-3 mb-4">
                              <span className={`flex items-center gap-1 text-xs ${visa.color}`}>
                                {visa.emoji} {visa.label}
                                {stop.visaMaxStay && ` (${stop.visaMaxStay} days)`}
                              </span>
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                LIVE PRICE
                              </span>
                            </div>

                            {/* Flight Legs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                              <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                                <p className="text-xs text-white/40 mb-1">Leg 1</p>
                                <p className="text-white font-medium text-sm">{stopoverResult.origin} &rarr; {stop.hub}</p>
                                <p className="text-xs text-white/40">
                                  {fmtCurrency(stop.leg1Price)} &middot; {stop.leg1Airlines.join(', ')} &middot; {stop.leg1Duration}
                                  {stop.leg1Stops > 0 && ` \u00B7 ${stop.leg1Stops} stop`}
                                </p>
                              </div>
                              <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                                <p className="text-xs text-white/40 mb-1">Leg 2</p>
                                <p className="text-white font-medium text-sm">{stop.hub} &rarr; {stopoverResult.destination}</p>
                                <p className="text-xs text-white/40">
                                  {fmtCurrency(stop.leg2Price)} &middot; {stop.leg2Airlines.join(', ')} &middot; {stop.leg2Duration}
                                  {stop.leg2Stops > 0 && ` \u00B7 ${stop.leg2Stops} stop`}
                                </p>
                              </div>
                            </div>

                            {/* Ground Costs */}
                            <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06] mb-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-white/40">{stop.stopoverDays}-day stay in {stop.hubCity} ({stopoverBudget})</p>
                                <p className="text-sm font-medium text-white">~{fmtCurrency(stop.totalGroundCost)}</p>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-center">
                                <div>
                                  <p className="text-xs text-white/30">Hotel</p>
                                  <p className="text-xs text-white/60">{fmtCurrency(stop.costBreakdown.hotel)}/d</p>
                                </div>
                                <div>
                                  <p className="text-xs text-white/30">Food</p>
                                  <p className="text-xs text-white/60">{fmtCurrency(stop.costBreakdown.food)}/d</p>
                                </div>
                                <div>
                                  <p className="text-xs text-white/30">Transport</p>
                                  <p className="text-xs text-white/60">{fmtCurrency(stop.costBreakdown.transport)}/d</p>
                                </div>
                                <div>
                                  <p className="text-xs text-white/30">Activities</p>
                                  <p className="text-xs text-white/60">{fmtCurrency(stop.costBreakdown.activities)}/d</p>
                                </div>
                              </div>
                            </div>

                            {/* Net Value Summary */}
                            <div className={`rounded-lg p-3 border ${stop.netValue >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                              <p className="text-sm">{stop.pitch}</p>
                            </div>
                          </div>

                          {/* Action — two separate booking links per leg */}
                          <div className="border-t border-white/[0.06] p-4 space-y-2">
                            <div className="flex gap-2">
                              <a
                                href={(() => {
                                  const d = stop.stopoverDepartDate?.split('-')
                                  const dd = d?.[2] || '', mm = d?.[1] || ''
                                  return `https://www.aviasales.com/search/${stopoverResult.origin}${dd}${mm}${stop.hub}1`
                                })()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-center bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 rounded-lg transition-all text-sm"
                              >
                                Leg 1: {stopoverResult.origin} → {stop.hub} (${stop.leg1Price})
                              </a>
                              <a
                                href={(() => {
                                  const d = stop.stopoverReturnDate?.split('-')
                                  const dd = d?.[2] || '', mm = d?.[1] || ''
                                  return `https://www.aviasales.com/search/${stop.hub}${dd}${mm}${stopoverResult.destination}1`
                                })()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-center bg-sky-600 hover:bg-sky-500 text-white font-medium py-2.5 rounded-lg transition-all text-sm"
                              >
                                Leg 2: {stop.hub} → {stopoverResult.destination} (${stop.leg2Price})
                              </a>
                            </div>
                            <p className="text-[10px] text-white/30 text-center">
                              Book each leg separately on Aviasales for the best stopover price
                            </p>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-white/60 text-lg">No stopover opportunities found for this route.</p>
                    <p className="text-white/40 text-sm mt-1">Try a longer travel window or a different route.</p>
                  </div>
                )}

                {/* API Usage */}
                <p className="text-xs text-white/20 text-center mt-6">
                  {stopoverResult.serpApiCallsUsed} API calls used &middot; {stopoverResult.serpApiRemaining} remaining this month
                </p>
              </div>
            )}

            {/* Stopovers: How it works (pre-search) */}
            {tripType === 'stopovers' && !stopoverResult && !stopoverLoading && !stopoverError && (
              <div className="max-w-3xl mx-auto mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { emoji: '\uD83D\uDD0D', title: 'Discover Routes', desc: 'We search Google Flights to find which cities airlines naturally route through between your origin and destination.' },
                    { emoji: '\uD83D\uDEC2', title: 'Check Visas', desc: 'Your passport country is checked against each stopover destination. Visa-free and visa-on-arrival options are prioritized.' },
                    { emoji: '\uD83D\uDCB0', title: 'Calculate Value', desc: 'We compare the cost of flights + a multi-day stopover against a direct flight to find genuine "free vacation" deals.' },
                  ].map((step, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-sky-500/20 text-center">
                      <p className="text-3xl mb-3">{step.emoji}</p>
                      <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                      <p className="text-sm text-sky-300/70">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANYWHERE: cheapest destinations */}
            {discoverResults.length > 0 && (
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Top {discoverResults.length} Cheapest Destinations
                  </h2>
                  <p className="text-sky-300">From {origin}</p>
                </div>
                <p className="text-sky-300/60 text-xs text-center mb-6">
                  Prices are cached estimates — click to check current prices on Aviasales
                </p>
                <div className="space-y-4">
                  {discoverResults.map((r, i) => (
                    <div key={r.destination} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden">
                      <button
                        onClick={() => {
                          const link = buildFlightLink(origin, r.destination, r.departDate)
                          window.open(link, '_blank')
                        }}
                        className="w-full text-left"
                      >
                        <div className="flex items-center">
                          <div className={`w-16 h-full flex items-center justify-center text-2xl font-bold shrink-0 py-6 ${
                            i === 0 ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400'
                          }`}>
                            #{i + 1}
                          </div>
                          <div className="w-16 h-16 shrink-0 my-2 ml-3 rounded-lg overflow-hidden">
                            <DestinationImage code={r.destination} city={r.city} height="h-full" className="w-full" />
                          </div>
                          <div className="flex-1 px-5 py-4">
                            <div className="flex items-baseline gap-2">
                              <h3 className="text-xl font-bold text-slate-900">{r.city}</h3>
                              <span className="text-gray-400 text-sm">{r.destination}</span>
                            </div>
                            <p className="text-gray-500 text-sm mt-1">
                              {new Date(r.departDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(r.returnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right px-5 py-4 shrink-0">
                            <p className="text-xs text-gray-400">from ~</p>
                            <p className={`text-3xl font-bold ${i === 0 ? 'text-green-600' : 'text-slate-900'}`}>
                              ${r.price}
                            </p>
                            <p className="text-sky-400 text-xs font-medium mt-1">Check on Aviasales &rarr;</p>
                          </div>
                        </div>
                      </button>
                      <div className="flex items-center gap-4 px-5 pb-2 pt-0">
                        <Link
                          href={`/trip-cost?destination=${encodeURIComponent(r.destination)}`}
                          className="text-xs text-gray-400 hover:text-sky-400 transition"
                        >
                          Plan a trip
                        </Link>
                        <Link
                          href={`/explore?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(r.destination)}`}
                          className="text-xs text-gray-400 hover:text-sky-400 transition"
                        >
                          Layover routes
                        </Link>
                      </div>
                      <div className="px-5 pb-3">
                        <BookingLinks cityName={r.city} iata={r.destination} checkIn={r.departDate} nights={3} />
                      </div>
                    </div>
                  ))}
                </div>
                <WhatNext
                  origin={origin}
                  destination={discoverResults[0]?.destination}
                  destinationCity={discoverResults[0]?.city}
                  context="search"
                />
              </div>
            )}

            {/* POPULAR SUGGESTIONS */}
            {showPopularSuggestions && (
              <div className="max-w-6xl mx-auto mt-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Popular This Weekend</h2>
                  <p className="text-sky-300">Suggested routes from {origin} — click to check prices on Aviasales</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getPopularSuggestions(origin).map((sug) => (
                    <button
                      key={sug.dest}
                      onClick={() => {
                        const nextWeekend = getNextWeekendDate()
                        const link = buildFlightLink(origin, sug.dest, nextWeekend)
                        window.open(link, '_blank')
                      }}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-sky-500/20 hover:border-sky-400/60 transition text-left"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-semibold text-lg">{sug.city}</p>
                          <p className="text-sky-300 text-sm">{origin} &rarr; {sug.dest}</p>
                        </div>
                      </div>
                      <p className="text-sky-400 text-sm mt-3 font-medium">Check prices on Aviasales &rarr;</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state — help cards */}
            {tripType !== 'stopovers' && !calendarData && !exactDateResult && !flexResult && discoverResults.length === 0 && !multiCityResults && !budgetOptimizeResult && !emptyRoute && !error && (
              <div className="max-w-3xl mx-auto mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-sky-500/20 text-center">
                    <div className="text-4xl mb-3">&#128197;</div>
                    <h3 className="text-white font-semibold mb-2">Exact Dates</h3>
                    <p className="text-sky-300 text-sm">Know when you&apos;re flying? Get a live price and book directly.</p>
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-sky-500/20 text-center">
                    <div className="text-4xl mb-3">&#128198;</div>
                    <h3 className="text-white font-semibold mb-2">Flexible Month</h3>
                    <p className="text-sky-300 text-sm">Set departure or return to &quot;Month&quot; to find the cheapest day.</p>
                  </div>
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-sky-500/20 text-center">
                    <div className="text-4xl mb-3">&#9992;&#65039;</div>
                    <h3 className="text-white font-semibold mb-2">Anytime</h3>
                    <p className="text-sky-300 text-sm">Set to &quot;Anytime&quot; to find the absolute cheapest time in the next 6 months.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-sky-400 mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
