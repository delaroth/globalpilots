'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import CalendarGrid from '@/components/CalendarGrid'
import DestinationCard from '@/components/DestinationCard'
import WhatNext from '@/components/WhatNext'
import { generateAffiliateLink, buildFlightLink } from '@/lib/affiliate'
import { saveRecentSearch } from '@/lib/recent-searches'
import RecentSearches from '@/components/RecentSearches'

type DateMode = 'exact-date' | 'flexible-month' | 'day-windows'

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

function SearchPageContent() {
  const searchParams = useSearchParams()
  // Form
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [dateMode, setDateMode] = useState<DateMode>('flexible-month')

  // Pre-fill from URL params (e.g., /search?dest=BKK or /search?origin=CNX&destination=NRT)
  useEffect(() => {
    const o = searchParams.get('origin')
    const d = searchParams.get('destination') || searchParams.get('dest')
    if (o) setOrigin(o.toUpperCase())
    if (d) setDestination(d.toUpperCase())
  }, [searchParams])

  // Exact date
  const [exactDate, setExactDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  })

  // Round trip
  const [isRoundTrip, setIsRoundTrip] = useState(false)
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 21)
    return d.toISOString().split('T')[0]
  })

  // Flexible month
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

  // Day windows
  const [departDay, setDepartDay] = useState('friday')
  const [returnDay, setReturnDay] = useState('sunday')
  const [flexibleDays, setFlexibleDays] = useState(1)
  const [timeframe, setTimeframe] = useState('3months')

  // Loading
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Results
  const [calendarData, setCalendarData] = useState<Record<string, unknown> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [exactDateResult, setExactDateResult] = useState<{ price: number; dayData: any; isLive?: boolean } | null>(null)
  const [weekendDeals, setWeekendDeals] = useState<WeekendDeal[]>([])
  const [emptyRoute, setEmptyRoute] = useState(false)
  const [showPopularSuggestions, setShowPopularSuggestions] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const currentMonth = new Date().toISOString().slice(0, 7)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setCalendarData(null); setExactDateResult(null); setWeekendDeals([])
    setError(''); setEmptyRoute(false); setShowPopularSuggestions(false)

    if (!origin) { setError('Please select a departure airport'); return }
    if ((dateMode === 'exact-date' || dateMode === 'flexible-month') && !destination) {
      setError('Please select a destination for this search mode'); return
    }
    if (destination && origin === destination) { setError('Departure and destination must be different'); return }

    setLoading(true)
    try {
      if (dateMode === 'flexible-month') {
        const res = await fetch(`/api/travelpayouts/calendar?origin=${origin}&destination=${destination}&depart_date=${month}`)
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        if (!data.data || Object.keys(data.data).length === 0) {
          setEmptyRoute(true)
        } else {
          setCalendarData(data.data)
          const monthLabel = new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          saveRecentSearch({
            origin, destination, date: month, mode: 'flexible-month',
            label: `${origin} → ${destination} · ${monthLabel}`,
            url: `/search?origin=${origin}&dest=${destination}&date=${month}&mode=flexible-month`,
          })
        }

      } else if (dateMode === 'exact-date') {
        // Try Amadeus real-time price first (supports round-trip)
        let gotLivePrice = false
        try {
          let amadeusUrl = `/api/amadeus/search?origin=${origin}&destination=${destination}&departure_date=${exactDate}&max=3`
          if (isRoundTrip && returnDate) {
            amadeusUrl += `&return_date=${returnDate}`
          }
          const amadeusRes = await fetch(amadeusUrl)
          if (amadeusRes.ok) {
            const amadeusData = await amadeusRes.json()
            if (amadeusData.offers?.length > 0) {
              const offer = amadeusData.offers[0]
              setExactDateResult({ price: offer.price, dayData: offer, isLive: true })
              gotLivePrice = true
              const dateLabel = new Date(exactDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              saveRecentSearch({
                origin, destination, date: exactDate, mode: 'exact-date',
                label: `${origin} → ${destination} · ${dateLabel}`,
                url: `/search?origin=${origin}&dest=${destination}&date=${exactDate}&mode=exact-date`,
              })
            }
          }
        } catch (amadeusErr) {
          console.log('[Search] Amadeus unavailable, falling back to cached:', amadeusErr)
        }

        // Fallback to TravelPayouts cached price
        if (!gotLivePrice) {
          const monthStr = exactDate.slice(0, 7)
          const res = await fetch(`/api/travelpayouts/calendar?origin=${origin}&destination=${destination}&depart_date=${monthStr}`)
          if (!res.ok) throw new Error(`API error: ${res.status}`)
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          const dayData = data.data?.[exactDate] ||
            data.data?.[exactDate.replace(/-0(\d)/g, '-$1')]
          const price = dayData?.price || dayData?.value
          if (!price) {
            setEmptyRoute(true)
          } else {
            setExactDateResult({ price, dayData, isLive: false })
            const dateLabel = new Date(exactDate + 'T00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            saveRecentSearch({
              origin, destination, date: exactDate, mode: 'exact-date',
              label: `${origin} → ${destination} · ${dateLabel}`,
              url: `/search?origin=${origin}&dest=${destination}&date=${exactDate}&mode=exact-date`,
            })
          }
        }

      } else if (dateMode === 'day-windows') {
        let dealsData: WeekendDeal[] = []
        let flex = flexibleDays
        while (dealsData.length < 6 && flex <= 3) {
          const res = await fetch(`/api/travelpayouts/latest?origin=${origin}&limit=200&depart_day=${departDay}&return_day=${returnDay}&timeframe=${timeframe}&flexible_days=${flex}`)
          if (!res.ok) throw new Error('Failed to fetch deals')
          const data = await res.json()
          if (data.error) throw new Error(data.error)
          dealsData = data.data || []
          if (dealsData.length >= 6) break
          flex++
        }
        if (dealsData.length < 3) setShowPopularSuggestions(true)
        if (dealsData.length > 0) {
          setWeekendDeals(dealsData.slice(0, 12))
          const capDepart = departDay.charAt(0).toUpperCase() + departDay.slice(1, 3)
          const capReturn = returnDay.charAt(0).toUpperCase() + returnDay.slice(1, 3)
          saveRecentSearch({
            origin, destination: destination || undefined, mode: 'day-windows',
            label: `${origin} → anywhere · ${capDepart}–${capReturn}`,
            url: `/search?origin=${origin}&mode=day-windows&depart=${departDay}&return=${returnDay}`,
          })
        } else {
          setShowPopularSuggestions(true)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      <Navigation />

      <div className="container mx-auto px-4 py-8 md:py-12 flex-1">
        {/* Page header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Smart Flight Search</h1>
          <p className="text-xl text-skyblue-light">Search by exact dates, browse cheapest days, or pick which days you&apos;re free</p>
        </div>

        {/* FORM CARD */}
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-10">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">

            {/* Origin + Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AirportAutocomplete id="origin" label="From" value={origin} onChange={setOrigin} placeholder="Departure city or code..." />
              <AirportAutocomplete
                id="destination" label="To"
                value={destination} onChange={setDestination}
                placeholder={dateMode === 'day-windows' ? 'Any destination (optional)' : 'Destination city or code...'}
              />
            </div>

            {/* Date mode tabs */}
            <div>
              <p className="text-sm font-medium text-navy mb-2">How do you want to search?</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { mode: 'exact-date', emoji: '📌', label: 'Exact Date', desc: 'Know your date' },
                  { mode: 'flexible-month', emoji: '📅', label: 'Browse Month', desc: 'See all prices' },
                  { mode: 'day-windows', emoji: '🗓', label: 'My Days Off', desc: 'Thu–Sun, etc.' },
                ] as const).map(({ mode, emoji, label, desc }) => (
                  <button key={mode} type="button"
                    onClick={() => { setDateMode(mode); setError('') }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      dateMode === mode
                        ? 'border-skyblue bg-skyblue/10 shadow-md'
                        : 'border-gray-200 hover:border-skyblue/40 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-lg mb-0.5">{emoji}</div>
                    <div className={`font-semibold text-sm ${dateMode === mode ? 'text-skyblue' : 'text-navy'}`}>{label}</div>
                    <div className="text-xs text-gray-500 hidden sm:block">{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* EXACT DATE MODE */}
            {dateMode === 'exact-date' && (
              <div className="space-y-4">
                {/* Round-trip toggle */}
                <div className="flex items-center gap-4">
                  <button type="button" onClick={() => setIsRoundTrip(false)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${!isRoundTrip ? 'bg-skyblue text-navy' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    One-way
                  </button>
                  <button type="button" onClick={() => setIsRoundTrip(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${isRoundTrip ? 'bg-skyblue text-navy' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    Round-trip
                  </button>
                </div>

                <div className={`grid gap-4 ${isRoundTrip ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="space-y-2">
                    <label htmlFor="exactDate" className="block text-sm font-medium text-navy">
                      {isRoundTrip ? 'Departure' : 'Travel Date'}
                    </label>
                    <input type="date" id="exactDate" value={exactDate}
                      onChange={e => {
                        setExactDate(e.target.value)
                        // Auto-adjust return date if it's before departure
                        if (isRoundTrip && e.target.value > returnDate) {
                          const d = new Date(e.target.value); d.setDate(d.getDate() + 7)
                          setReturnDate(d.toISOString().split('T')[0])
                        }
                      }}
                      min={today}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                      required
                    />
                  </div>
                  {isRoundTrip && (
                    <div className="space-y-2">
                      <label htmlFor="returnDate" className="block text-sm font-medium text-navy">Return</label>
                      <input type="date" id="returnDate" value={returnDate}
                        onChange={e => setReturnDate(e.target.value)}
                        min={exactDate}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                        required
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FLEXIBLE MONTH MODE */}
            {dateMode === 'flexible-month' && (
              <div className="space-y-2">
                <label htmlFor="month" className="block text-sm font-medium text-navy">Month</label>
                <input type="month" id="month" value={month}
                  onChange={e => setMonth(e.target.value)}
                  min={currentMonth}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                  required
                />
              </div>
            )}

            {/* DAY WINDOWS MODE */}
            {dateMode === 'day-windows' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="departDay" className="block text-sm font-medium text-navy">Depart on</label>
                    <select id="departDay" value={departDay} onChange={e => setDepartDay(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy">
                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                        <option key={d} value={d.toLowerCase()}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="returnDay" className="block text-sm font-medium text-navy">Return on</label>
                    <select id="returnDay" value={returnDay} onChange={e => setReturnDay(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy">
                      {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => (
                        <option key={d} value={d.toLowerCase()}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label htmlFor="timeframe" className="block text-sm font-medium text-navy">Search within</label>
                  <select id="timeframe" value={timeframe} onChange={e => setTimeframe(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy">
                    <option value="thisweek">This week</option>
                    <option value="thismonth">This month</option>
                    <option value="3months">Next 3 months</option>
                    <option value="6months">Next 6 months</option>
                    <option value="thisyear">This year</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-navy">
                    Date flexibility: ±{flexibleDays} day{flexibleDays !== 1 ? 's' : ''}
                  </label>
                  <input type="range" min="0" max="3" value={flexibleDays}
                    onChange={e => setFlexibleDays(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-skyblue"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Exact days only</span>
                    <span>Very flexible</span>
                  </div>
                </div>
              </div>
            )}

            {/* Search button */}
            <button type="submit" disabled={loading}
              className="w-full bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg">
              {loading ? 'Searching...' : 'Search Flights'}
            </button>
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
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-skyblue"></div>
            <p className="text-white mt-4 text-lg">
              {dateMode === 'flexible-month' && 'Loading cheapest days...'}
              {dateMode === 'exact-date' && 'Checking flight prices...'}
              {dateMode === 'day-windows' && `Finding ${departDay}–${returnDay} trips...`}
            </p>
          </div>
        )}

        {/* ——— RESULTS ——— */}
        {!loading && (
          <>
            {/* EMPTY ROUTE */}
            {emptyRoute && (
              <div className="max-w-md mx-auto mb-8">
                <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                  <div className="text-5xl mb-4">🔍</div>
                  <h3 className="text-xl font-bold text-navy mb-3">No prices found</h3>
                  <p className="text-gray-600 mb-6">
                    Click below to search live prices on Aviasales.
                  </p>
                  <button
                    onClick={() => {
                      const date = dateMode === 'exact-date' ? exactDate : `${month}-01`
                      const ret = isRoundTrip ? returnDate : undefined
                      const link = buildFlightLink(origin, destination, date, ret)
                      window.open(link, '_blank')
                    }}
                    className="w-full bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg"
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
                <CalendarGrid data={calendarData as any} origin={origin} destination={destination} month={month} />
                <WhatNext origin={origin} destination={destination} context="search" />
              </>
            )}

            {/* EXACT DATE: single price card */}
            {exactDateResult && (
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <div className={`px-6 py-5 text-center ${
                    exactDateResult.isLive
                      ? 'bg-gradient-to-r from-green-400 to-green-500'
                      : 'bg-gradient-to-r from-skyblue to-skyblue-dark'
                  }`}>
                    <p className="text-navy font-semibold text-sm uppercase tracking-wide">
                      {exactDateResult.isLive ? 'Live Price' : 'Estimated Price'}
                    </p>
                    <p className="text-navy text-6xl font-bold mt-1">
                      {exactDateResult.isLive ? '' : '~'}${exactDateResult.price}
                    </p>
                    <p className="text-navy/80 text-sm mt-2">
                      {origin} {isRoundTrip ? '↔' : '→'} {destination} · {exactDate}
                      {isRoundTrip && returnDate && ` — ${returnDate}`}
                    </p>
                    {!exactDateResult.isLive && (
                      <p className="text-navy/60 text-xs mt-1">Cached estimate — actual price may vary</p>
                    )}
                    {exactDateResult.isLive && exactDateResult.dayData?.airlines && (
                      <p className="text-navy/70 text-xs mt-1">
                        {exactDateResult.dayData.airlines.join(', ')} · {exactDateResult.dayData.stops === 0 ? 'Direct' : `${exactDateResult.dayData.stops} stop${exactDateResult.dayData.stops > 1 ? 's' : ''}`}
                      </p>
                    )}
                  </div>
                  <div className="p-6">
                    <button
                      onClick={() => {
                        const depDate = exactDateResult.dayData?.departure_at || exactDateResult.dayData?.departureTime || exactDate
                        const ret = isRoundTrip ? returnDate : undefined
                        const link = generateAffiliateLink({ origin, destination, departDate: depDate, returnDate: ret })
                        window.open(link, '_blank')
                      }}
                      className="w-full bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg"
                    >
                      {exactDateResult.isLive ? 'Book on Aviasales' : 'Search Live Prices'}
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-3">
                      {exactDateResult.isLive ? 'Book this fare on Aviasales' : 'Opens Aviasales to confirm price'}
                    </p>
                  </div>
                </div>
                <WhatNext origin={origin} destination={destination} departDate={exactDate} context="search" />
              </div>
            )}

            {/* DAY WINDOWS: destination cards grid */}
            {weekendDeals.length > 0 && (
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Top {weekendDeals.length} Destinations
                  </h2>
                  <p className="text-skyblue-light">
                    {departDay.charAt(0).toUpperCase() + departDay.slice(1)} to {returnDay.charAt(0).toUpperCase() + returnDay.slice(1)} trips from {origin}
                    {flexibleDays > 0 && ` · ±${flexibleDays} day${flexibleDays !== 1 ? 's' : ''} flexible`}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {weekendDeals.map((deal, i) => (
                    <DestinationCard
                      key={`${deal.destination}-${i}`}
                      destination={deal.gate}
                      destinationCode={deal.destination}
                      origin={deal.origin}
                      price={deal.value}
                      departDate={deal.depart_date}
                      returnDate={deal.return_date}
                      distance={deal.distance}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* POPULAR SUGGESTIONS */}
            {showPopularSuggestions && (
              <div className="max-w-6xl mx-auto mt-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Popular This Weekend</h2>
                  <p className="text-skyblue-light">Suggested routes from {origin} — click to search live prices</p>
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
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-skyblue/20 hover:border-skyblue/60 transition text-left"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-semibold text-lg">{sug.city}</p>
                          <p className="text-skyblue-light text-sm">{origin} → {sug.dest}</p>
                        </div>
                      </div>
                      <p className="text-skyblue text-sm mt-3 font-medium">Search live prices →</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!calendarData && !exactDateResult && weekendDeals.length === 0 && !emptyRoute && !error && (
              <div className="max-w-3xl mx-auto mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-navy-light/50 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20 text-center">
                    <div className="text-4xl mb-3">📌</div>
                    <h3 className="text-white font-semibold mb-2">Exact Date</h3>
                    <p className="text-skyblue-light text-sm">Know when you&apos;re flying? Get a live price and book instantly.</p>
                  </div>
                  <div className="bg-navy-light/50 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20 text-center">
                    <div className="text-4xl mb-3">📅</div>
                    <h3 className="text-white font-semibold mb-2">Browse Month</h3>
                    <p className="text-skyblue-light text-sm">See every day color-coded by price. Spot the cheapest days.</p>
                  </div>
                  <div className="bg-navy-light/50 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20 text-center">
                    <div className="text-4xl mb-3">🗓</div>
                    <h3 className="text-white font-semibold mb-2">My Days Off</h3>
                    <p className="text-skyblue-light text-sm">Free Thursday to Sunday? Find the cheapest destinations for those days.</p>
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
      <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-skyblue mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  )
}
