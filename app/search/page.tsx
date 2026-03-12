'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import CalendarGrid from '@/components/CalendarGrid'
import RouteComparison from '@/components/RouteComparison'
import DestinationCard from '@/components/DestinationCard'
import { majorHubs, LayoverRoute } from '@/lib/hubs'
import { generateAffiliateLink } from '@/lib/affiliate'

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

function SearchPageContent() {
  // Form
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [dateMode, setDateMode] = useState<DateMode>('flexible-month')

  // Exact date - default 2 weeks from now
  const [exactDate, setExactDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  })

  // Flexible month - default current month
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))

  // Day windows
  const [departDay, setDepartDay] = useState('friday')
  const [returnDay, setReturnDay] = useState('sunday')
  const [flexibleDays, setFlexibleDays] = useState(1)
  const [timeframe, setTimeframe] = useState('3months')

  // Advanced options
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [layoverEnabled, setLayoverEnabled] = useState(false)

  // Loading
  const [loading, setLoading] = useState(false)
  const [layoverLoading, setLayoverLoading] = useState(false)
  const [error, setError] = useState('')

  // Results
  const [calendarData, setCalendarData] = useState<Record<string, unknown> | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [exactDateResult, setExactDateResult] = useState<{ price: number; dayData: any } | null>(null)
  const [weekendDeals, setWeekendDeals] = useState<WeekendDeal[]>([])
  const [directPrice, setDirectPrice] = useState<number | null>(null)
  const [layoverRoutes, setLayoverRoutes] = useState<LayoverRoute[]>([])

  const today = new Date().toISOString().split('T')[0]
  const currentMonth = new Date().toISOString().slice(0, 7)
  // Layover is only available for exact-date and flexible-month modes when destination is set
  const layoverAvailable = (dateMode === 'exact-date' || dateMode === 'flexible-month') && !!destination && origin !== destination

  const fetchLayover = async (orig: string, dest: string, date: string) => {
    if (!layoverEnabled || !layoverAvailable) return
    setLayoverLoading(true)
    setDirectPrice(null)
    setLayoverRoutes([])
    try {
      const res = await fetch(`/api/layover?origin=${orig}&destination=${dest}&depart_date=${date}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.directPrice !== undefined) setDirectPrice(data.directPrice)
      if (data.layoverRoutes?.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const routes: LayoverRoute[] = data.layoverRoutes.map((route: any) => {
          const hub = majorHubs.find(h => h.code === route.hub)
          if (!hub) return null
          return { hub, leg1Price: route.leg1Price, leg2Price: route.leg2Price, totalPrice: route.totalPrice, savings: route.savings ?? null, savingsPercent: route.savingsPercent ?? null }
        }).filter(Boolean)
        setLayoverRoutes(routes)
      }
    } catch (err) {
      console.error('[Search] Layover error:', err)
    } finally {
      setLayoverLoading(false)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    // Reset all results
    setCalendarData(null); setExactDateResult(null); setWeekendDeals([])
    setDirectPrice(null); setLayoverRoutes([]); setError('')

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
        if (!data.data || Object.keys(data.data).length === 0) throw new Error('No flights found for this route and month. Try a different month.')
        setCalendarData(data.data)
        fetchLayover(origin, destination, `${month}-01`)

      } else if (dateMode === 'exact-date') {
        const monthStr = exactDate.slice(0, 7)
        const res = await fetch(`/api/travelpayouts/calendar?origin=${origin}&destination=${destination}&depart_date=${monthStr}`)
        if (!res.ok) throw new Error(`API error: ${res.status}`)
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        // Try both YYYY-MM-DD and non-padded formats
        const dayData = data.data?.[exactDate] ||
          data.data?.[exactDate.replace(/-0(\d)/g, '-$1')]
        const price = dayData?.price || dayData?.value
        if (!price) throw new Error('No flight price found for this date. Try a nearby date or use Browse Month mode.')
        setExactDateResult({ price, dayData })
        fetchLayover(origin, destination, exactDate)

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
        if (dealsData.length === 0) throw new Error(`No ${departDay}–${returnDay} trips found. Try different days, more flexibility, or a longer timeframe.`)
        setWeekendDeals(dealsData.slice(0, 12))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      {/* Nav bar - logo left, back to home right */}
      <nav className="w-full px-6 py-4 bg-navy/50 backdrop-blur-sm border-b border-skyblue/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-skyblue rounded-full flex items-center justify-center">
              <span className="text-navy text-xl font-bold">G</span>
            </div>
            <span className="text-white text-xl font-bold">GlobePilot</span>
          </Link>
          <Link href="/" className="text-skyblue hover:text-skyblue-light transition">
            ← Back to Home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Page header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Smart Flight Search ✈️</h1>
          <p className="text-xl text-skyblue-light">Search by exact dates, browse cheapest days, or pick which days you&apos;re free</p>
        </div>

        {/* FORM CARD */}
        <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-10">
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">

            {/* Row 1: Origin + Destination side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AirportAutocomplete id="origin" label="From" value={origin} onChange={setOrigin} placeholder="Departure city or code..." />
              <AirportAutocomplete
                id="destination" label="To"
                value={destination} onChange={setDestination}
                placeholder={dateMode === 'day-windows' ? 'Any destination (optional)' : 'Destination city or code...'}
              />
            </div>

            {/* Row 2: Date mode tabs */}
            <div>
              <p className="text-sm font-medium text-navy mb-2">How do you want to search?</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: 'exact-date', emoji: '📌', label: 'Exact Date', desc: 'Know your date' },
                  { mode: 'flexible-month', emoji: '📅', label: 'Browse Month', desc: 'See all prices' },
                  { mode: 'day-windows', emoji: '🗓', label: 'My Days Off', desc: 'Thu–Sun, etc.' },
                ].map(({ mode, emoji, label, desc }) => (
                  <button key={mode} type="button"
                    onClick={() => { setDateMode(mode as DateMode); setError('') }}
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

            {/* Row 3: Date inputs — conditional on mode */}

            {/* EXACT DATE MODE */}
            {dateMode === 'exact-date' && (
              <div className="space-y-2">
                <label htmlFor="exactDate" className="block text-sm font-medium text-navy">Travel Date</label>
                <input type="date" id="exactDate" value={exactDate}
                  onChange={e => setExactDate(e.target.value)}
                  min={today}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                  required
                />
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
                {/* Depart + Return day selectors */}
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
                {/* Timeframe */}
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
                {/* Flexibility slider */}
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

            {/* Advanced Options — collapsible */}
            <div className="border-t border-gray-100 pt-4">
              <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-navy transition">
                <span className={`transition-transform ${showAdvanced ? 'rotate-90' : ''}`}>▶</span>
                Advanced options
              </button>

              {showAdvanced && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <label className={`flex items-start gap-3 cursor-pointer ${!layoverAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input type="checkbox" checked={layoverEnabled}
                      disabled={!layoverAvailable}
                      onChange={e => setLayoverEnabled(e.target.checked)}
                      className="mt-1 w-4 h-4 accent-skyblue"
                    />
                    <div>
                      <p className="font-semibold text-navy text-sm">Find bonus destinations via layover arbitrage</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Compare direct flights vs. cheaper multi-city routes through hub airports — sometimes you save money AND get a bonus destination.
                      </p>
                      {!layoverAvailable && (
                        <p className="text-xs text-amber-600 mt-1">
                          {dateMode === 'day-windows' ? 'Not available in "My Days Off" mode — use Exact Date or Browse Month.' : 'Select a destination to enable.'}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              )}
            </div>

            {/* Search button */}
            <button type="submit" disabled={loading}
              className="w-full bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-4 px-6 rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg">
              {loading ? 'Searching...' : 'Search Flights'}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="max-w-3xl mx-auto mb-8">
            <div className="bg-red-500 border-2 border-red-600 rounded-lg p-4 shadow-lg">
              <p className="text-white font-semibold text-center">❌ {error}</p>
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
            {/* FLEXIBLE MONTH: CalendarGrid */}
            {calendarData && (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <CalendarGrid data={calendarData as any} origin={origin} destination={destination} month={month} />
            )}

            {/* EXACT DATE: single price card */}
            {exactDateResult && (
              <div className="max-w-md mx-auto">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                  <div className="bg-gradient-to-r from-skyblue to-skyblue-dark px-6 py-5 text-center">
                    <p className="text-navy font-semibold text-sm uppercase tracking-wide">Flight Price</p>
                    <p className="text-navy text-6xl font-bold mt-1">${exactDateResult.price}</p>
                    <p className="text-navy/80 text-sm mt-2">{origin} → {destination} · {exactDate}</p>
                  </div>
                  <div className="p-6">
                    <button
                      onClick={() => {
                        const link = generateAffiliateLink({ origin, destination, departDate: exactDateResult.dayData?.departure_at || exactDate })
                        window.open(link, '_blank')
                      }}
                      className="w-full bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg"
                    >
                      Book This Flight
                    </button>
                    <p className="text-center text-xs text-gray-500 mt-3">Opens booking on Aviasales</p>
                  </div>
                </div>
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

            {/* LAYOVER RESULTS (shown below main results for exact-date and flexible-month) */}
            {layoverEnabled && (layoverLoading || layoverRoutes.length > 0) && (
              <div className="mt-12 max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-px flex-1 bg-skyblue/30"></div>
                  <h2 className="text-xl font-bold text-white whitespace-nowrap">🔄 Layover Arbitrage</h2>
                  <div className="h-px flex-1 bg-skyblue/30"></div>
                </div>
                {layoverLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-skyblue"></div>
                    <p className="text-skyblue-light mt-3 text-sm">Comparing stopover routes...</p>
                  </div>
                ) : (
                  <RouteComparison
                    origin={origin}
                    destination={destination}
                    departDate={dateMode === 'exact-date' ? exactDate : `${month}-01`}
                    directPrice={directPrice}
                    layoverRoutes={layoverRoutes}
                  />
                )}
              </div>
            )}

            {/* Empty state (no results yet) */}
            {!calendarData && !exactDateResult && weekendDeals.length === 0 && !error && (
              <div className="max-w-3xl mx-auto mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-navy-light/50 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20 text-center">
                    <div className="text-4xl mb-3">📌</div>
                    <h3 className="text-white font-semibold mb-2">Exact Date</h3>
                    <p className="text-skyblue-light text-sm">Know when you&apos;re flying? See the price for that specific day and book instantly.</p>
                  </div>
                  <div className="bg-navy-light/50 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20 text-center">
                    <div className="text-4xl mb-3">📅</div>
                    <h3 className="text-white font-semibold mb-2">Browse Month</h3>
                    <p className="text-skyblue-light text-sm">See every day of a month color-coded by price. Spot the cheapest days instantly.</p>
                  </div>
                  <div className="bg-navy-light/50 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20 text-center">
                    <div className="text-4xl mb-3">🗓</div>
                    <h3 className="text-white font-semibold mb-2">My Days Off</h3>
                    <p className="text-skyblue-light text-sm">Free Thursday to Sunday? Find the cheapest destinations you can reach on those days.</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
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
