'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import CurrencySelector from '@/components/CurrencySelector'
import { useCurrency } from '@/hooks/useCurrency'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface SearchResult {
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PASSPORT_OPTIONS = [
  { code: 'US', label: 'United States' },
  { code: 'UK', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
  { code: 'NL', label: 'Netherlands' },
  { code: 'JP', label: 'Japan' },
  { code: 'KR', label: 'South Korea' },
  { code: 'SG', label: 'Singapore' },
  { code: 'NZ', label: 'New Zealand' },
  { code: 'IE', label: 'Ireland' },
  { code: 'IT', label: 'Italy' },
  { code: 'ES', label: 'Spain' },
  { code: 'SE', label: 'Sweden' },
  { code: 'NO', label: 'Norway' },
  { code: 'DK', label: 'Denmark' },
  { code: 'CH', label: 'Switzerland' },
  { code: 'AT', label: 'Austria' },
  { code: 'IN', label: 'India' },
  { code: 'TH', label: 'Thailand' },
  { code: 'BR', label: 'Brazil' },
  { code: 'MX', label: 'Mexico' },
]

const VERDICT_CONFIG = {
  'free-vacation': { emoji: '🎉', label: 'Free Vacation', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/30' },
  'worth-it': { emoji: '👍', label: 'Worth It', color: 'text-blue-400', bg: 'bg-blue-500/20 border-blue-500/30' },
  'splurge': { emoji: '💸', label: 'Splurge', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/30' },
  'skip': { emoji: '⏭️', label: 'Skip', color: 'text-white/40', bg: 'bg-white/10 border-white/20' },
}

const VISA_CONFIG = {
  'visa-free': { emoji: '✅', label: 'Visa Free', color: 'text-emerald-400' },
  'visa-on-arrival': { emoji: '🛂', label: 'Visa on Arrival', color: 'text-blue-400' },
  'e-visa': { emoji: '📱', label: 'E-Visa', color: 'text-amber-400' },
  'visa-required': { emoji: '⚠️', label: 'Visa Required', color: 'text-red-400' },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StopoverPage() {
  const { format: fmt, code: currencyCode, setCurrency, currencies } = useCurrency()
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [departDate, setDepartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 14)
    return d.toISOString().split('T')[0]
  })
  const [maxDays, setMaxDays] = useState(14)
  const [passport, setPassport] = useState('US')
  const [budget, setBudget] = useState<'budget' | 'mid' | 'comfort'>('mid')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!origin || !destination) { setError('Please select both origin and destination'); return }
    if (origin === destination) { setError('Origin and destination must be different'); return }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        depart_date: departDate,
        max_days: String(maxDays),
        passport,
        budget,
      })

      const res = await fetch(`/api/layover/smart?${params}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Search failed')
      }

      const data: SearchResult = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Smart Stopover Finder
            </span>
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Turn layovers into free vacations. Find flights with multi-day stopovers
            that save money while adding a new country to your trip.
          </p>
        </motion.div>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSearch}
          className="bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-2xl p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <AirportAutocomplete
                id="stopover-origin"
                label="From"
                value={origin}
                onChange={setOrigin}
                placeholder="Origin airport (e.g. JFK)"
                persistKey="origin"
              />
            </div>
            <div>
              <AirportAutocomplete
                id="stopover-destination"
                label="To"
                value={destination}
                onChange={setDestination}
                placeholder="Destination airport (e.g. BKK)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-white/50 mb-1">Depart</label>
              <input
                type="date"
                value={departDate}
                min={today}
                onChange={e => setDepartDate(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1">Max Travel Days</label>
              <select
                value={maxDays}
                onChange={e => setMaxDays(Number(e.target.value))}
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              >
                {[5, 7, 10, 14, 21, 30].map(d => (
                  <option key={d} value={d} className="bg-[#1a1a2e]">{d} days</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1">Passport</label>
              <select
                value={passport}
                onChange={e => setPassport(e.target.value)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              >
                {PASSPORT_OPTIONS.map(p => (
                  <option key={p.code} value={p.code} className="bg-[#1a1a2e]">{p.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1">Budget</label>
              <select
                value={budget}
                onChange={e => setBudget(e.target.value as any)}
                className="w-full bg-white/[0.06] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
              >
                <option value="budget" className="bg-[#1a1a2e]">Budget</option>
                <option value="mid" className="bg-[#1a1a2e]">Mid-Range</option>
                <option value="comfort" className="bg-[#1a1a2e]">Comfort</option>
              </select>
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-sm mb-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Searching real-time flights...
              </span>
            ) : (
              'Find Stopover Deals'
            )}
          </button>

          <p className="text-xs text-white/30 text-center mt-2">
            Powered by Google Flights · Visa requirements checked for your passport ·{' '}
            <CurrencySelector code={currencyCode} currencies={currencies} onChange={setCurrency} compact />
          </p>
        </motion.form>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="inline-block w-12 h-12 border-3 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
              <p className="text-white/60">Searching real-time flight prices...</p>
              <p className="text-white/30 text-sm mt-1">Checking visa requirements & ground costs</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Direct Flight Baseline */}
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-5 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wide mb-1">Direct Flight</p>
                    <p className="text-white font-medium">
                      {result.origin} → {result.destination}
                    </p>
                    {result.directAirlines.length > 0 && (
                      <p className="text-sm text-white/40">
                        {result.directAirlines.join(', ')} · {result.directDuration} · {result.directStops === 0 ? 'Nonstop' : `${result.directStops} stop${result.directStops === 1 ? '' : 's'}`}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    {result.directPrice ? (
                      <>
                        <p className="text-2xl font-bold text-white">{fmt(result.directPrice)}</p>
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
              {result.stopovers.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    Stopover Opportunities
                    <span className="text-sm font-normal text-white/40">
                      ({result.stopovers.length} found)
                    </span>
                  </h2>

                  {result.stopovers.map((stop, i) => {
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
                              <p className="text-sm text-white/40">
                                {stop.hubCountry}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-emerald-400">
                                {fmt(stop.totalFlightCost)}
                              </p>
                              {stop.savings > 0 ? (
                                <p className="text-xs text-emerald-400">
                                  Save {fmt(stop.savings)} ({stop.savingsPercent}%)
                                </p>
                              ) : (
                                <p className="text-xs text-amber-400">
                                  +{fmt(Math.abs(stop.savings))} more
                                </p>
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
                              <p className="text-white font-medium text-sm">
                                {result.origin} → {stop.hub}
                              </p>
                              <p className="text-xs text-white/40">
                                {fmt(stop.leg1Price)} · {stop.leg1Airlines.join(', ')} · {stop.leg1Duration}
                                {stop.leg1Stops > 0 && ` · ${stop.leg1Stops} stop`}
                              </p>
                            </div>
                            <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06]">
                              <p className="text-xs text-white/40 mb-1">Leg 2</p>
                              <p className="text-white font-medium text-sm">
                                {stop.hub} → {result.destination}
                              </p>
                              <p className="text-xs text-white/40">
                                {fmt(stop.leg2Price)} · {stop.leg2Airlines.join(', ')} · {stop.leg2Duration}
                                {stop.leg2Stops > 0 && ` · ${stop.leg2Stops} stop`}
                              </p>
                            </div>
                          </div>

                          {/* Ground Costs */}
                          <div className="bg-white/[0.04] rounded-lg p-3 border border-white/[0.06] mb-4">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs text-white/40">
                                {stop.stopoverDays}-day stay in {stop.hubCity} ({budget})
                              </p>
                              <p className="text-sm font-medium text-white">
                                ~{fmt(stop.totalGroundCost)}
                              </p>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div>
                                <p className="text-xs text-white/30">Hotel</p>
                                <p className="text-xs text-white/60">{fmt(stop.costBreakdown.hotel)}/d</p>
                              </div>
                              <div>
                                <p className="text-xs text-white/30">Food</p>
                                <p className="text-xs text-white/60">{fmt(stop.costBreakdown.food)}/d</p>
                              </div>
                              <div>
                                <p className="text-xs text-white/30">Transport</p>
                                <p className="text-xs text-white/60">{fmt(stop.costBreakdown.transport)}/d</p>
                              </div>
                              <div>
                                <p className="text-xs text-white/30">Activities</p>
                                <p className="text-xs text-white/60">{fmt(stop.costBreakdown.activities)}/d</p>
                              </div>
                            </div>
                          </div>

                          {/* Net Value Summary */}
                          <div className={`rounded-lg p-3 border ${stop.netValue >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                            <p className="text-sm">
                              {stop.pitch}
                            </p>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="border-t border-white/[0.06] p-4 flex gap-3">
                          <a
                            href={stop.googleFlightsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-center bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-medium py-2.5 rounded-lg transition-all text-sm"
                          >
                            Book on Google Flights →
                          </a>
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
                {result.serpApiCallsUsed} API calls used · {result.serpApiRemaining} remaining this month
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How It Works (pre-search) */}
        {!result && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            {[
              { emoji: '🔍', title: 'Discover Routes', desc: 'We search Google Flights to find which cities airlines naturally route through between your origin and destination.' },
              { emoji: '🛂', title: 'Check Visas', desc: 'Your passport country is checked against each stopover destination. Visa-free and visa-on-arrival options are prioritized.' },
              { emoji: '💰', title: 'Calculate Value', desc: 'We compare the cost of flights + a multi-day stopover against a direct flight to find genuine "free vacation" deals.' },
            ].map((step, i) => (
              <div key={i} className="bg-white/[0.04] border border-white/10 rounded-xl p-5 text-center">
                <p className="text-3xl mb-3">{step.emoji}</p>
                <h3 className="text-white font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-white/50">{step.desc}</p>
              </div>
            ))}
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  )
}
