'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import InstallPrompt from '@/components/InstallPrompt'
import SocialProof from '@/components/SocialProof'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import CurrencySelector from '@/components/CurrencySelector'
import { useCurrency } from '@/hooks/useCurrency'
import { useMystery } from '@/components/MysteryContext'
import Link from 'next/link'

// ── Vibe quick-pick options ──────────────────────────────────────────────────
const vibeOptions = [
  { emoji: '\u{1F3D6}', label: 'Beach', value: 'beach' },
  { emoji: '\u{1F3D9}', label: 'City', value: 'city' },
  { emoji: '\u{1F3D4}', label: 'Adventure', value: 'adventure' },
  { emoji: '\u{1F35C}', label: 'Food', value: 'food' },
  { emoji: '\u{1F33F}', label: 'Nature', value: 'nature' },
]

// ── Static fallback destinations (from destination-costs) ────────────────────
const staticDestinations = [
  { name: 'Bangkok', country: 'Thailand', airportCode: 'BKK', flightPrice: null, dailyCost: 105, flag: '\u{1F1F9}\u{1F1ED}' },
  { name: 'Lisbon', country: 'Portugal', airportCode: 'LIS', flightPrice: null, dailyCost: 140, flag: '\u{1F1F5}\u{1F1F9}' },
  { name: 'Medellin', country: 'Colombia', airportCode: 'MDE', flightPrice: null, dailyCost: 85, flag: '\u{1F1E8}\u{1F1F4}' },
  { name: 'Bali', country: 'Indonesia', airportCode: 'DPS', flightPrice: null, dailyCost: 80, flag: '\u{1F1EE}\u{1F1E9}' },
  { name: 'Tokyo', country: 'Japan', airportCode: 'TYO', flightPrice: null, dailyCost: 160, flag: '\u{1F1EF}\u{1F1F5}' },
  { name: 'Budapest', country: 'Hungary', airportCode: 'BUD', flightPrice: null, dailyCost: 100, flag: '\u{1F1ED}\u{1F1FA}' },
]

// ── Trending Destinations ────────────────────────────────────────────────────
interface TrendingDest {
  name: string
  country: string
  airportCode: string
  flightPrice: number | null
  dailyCost: number | null
  flag: string | null
}

function TrendingSection({ currency }: { currency: ReturnType<typeof useCurrency> }) {
  const [destinations, setDestinations] = useState<TrendingDest[]>([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/inspire')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.destinations?.length > 0) {
          setDestinations(data.destinations.slice(0, 6))
        } else {
          setDestinations(staticDestinations)
        }
        setLoading(false)
      })
      .catch(() => {
        setDestinations(staticDestinations)
        setLoading(false)
      })
  }, [])

  const gradients = [
    'from-purple-600/80 to-pink-600/80',
    'from-sky-600/80 to-cyan-600/80',
    'from-amber-600/80 to-orange-600/80',
    'from-emerald-600/80 to-green-600/80',
    'from-rose-600/80 to-red-600/80',
    'from-indigo-600/80 to-violet-600/80',
  ]

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-56 h-36 rounded-2xl bg-white/[0.04] animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {destinations.map((dest, i) => (
          <Link
            key={dest.airportCode}
            href={`/inspire?highlight=${dest.airportCode}`}
            className={`flex-shrink-0 w-56 rounded-2xl bg-gradient-to-br ${gradients[i % gradients.length]} p-5 snap-start hover:scale-[1.03] transition-transform cursor-pointer border border-white/10`}
          >
            <div className="flex items-center gap-2 mb-3">
              {dest.flag && <span className="text-xl">{dest.flag}</span>}
              <div>
                <h3 className="text-white font-bold text-base leading-tight">{dest.name}</h3>
                <p className="text-white/60 text-xs">{dest.country}</p>
              </div>
            </div>
            <div className="space-y-1">
              {dest.flightPrice != null && (
                <p className="text-white/90 text-sm font-medium">
                  From {currency.format(dest.flightPrice)}
                </p>
              )}
              {dest.dailyCost != null && (
                <p className="text-white/60 text-xs">
                  ~{currency.format(dest.dailyCost)}/day
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

// ── Homepage ─────────────────────────────────────────────────────────────────
export default function Home() {
  const currency = useCurrency()
  const mystery = useMystery()
  const router = useRouter()

  // Hero mode toggle
  const [heroMode, setHeroMode] = useState<'surprise' | 'plan'>('surprise')

  // Shared form state
  const [budget, setBudget] = useState('')
  const [origin, setOrigin] = useState('')
  const [selectedVibes, setSelectedVibes] = useState<string[]>([])
  const [tripDuration, setTripDuration] = useState(5)
  const [accommodation, setAccommodation] = useState('mid-range')

  // Plan mode extra state
  const [planDestination, setPlanDestination] = useState('')

  const toggleVibe = (value: string) => {
    setSelectedVibes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    )
  }

  const handleSurpriseMe = () => {
    if (!budget || !origin) return

    mystery.startSearch({
      origin,
      budget: currency.toUSD(parseFloat(budget)),
      vibes: selectedVibes,
      dates: 'flexible:next-3-months',
      tripDuration,
      packageComponents: {
        includeFlight: true,
        includeHotel: true,
        includeItinerary: true,
        includeTransportation: true,
      },
      accommodationLevel: accommodation,
      budgetPriority: 'balanced',
    })
  }

  const handlePlanTrip = () => {
    if (!budget || !origin || !planDestination) return
    // Navigate to plan-my-trip page with pre-filled params
    const params = new URLSearchParams({
      destination: planDestination,
      origin,
      budget,
      days: String(tripDuration),
      vibes: selectedVibes.join(','),
    })
    router.push(`/plan-my-trip?${params.toString()}`)
  }

  const canSubmitMystery = budget && parseFloat(budget) > 0 && origin
  const canSubmitPlan = budget && parseFloat(budget) > 0 && origin && planDestination

  return (
    <main className="min-h-screen flex flex-col bg-slate-950">
      <Navigation />

      {/* ── Section 1: Hero ── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950/30 via-slate-950 to-slate-950" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-3xl bg-gradient-to-r from-sky-600/8 to-cyan-600/8" />

        <div className="relative max-w-3xl mx-auto px-6 pt-16 pb-20 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-400">
              Plan Your Next Adventure
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-10">
            Tell us your budget and vibe. AI plans the perfect trip.
          </p>

          {/* ── UNIFIED FORM ── */}
          <div className="bg-white/[0.04] backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 text-left">
            <div className="space-y-5">

              {/* Destination toggle — the ONLY thing that changes between modes */}
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <label className="block text-sm font-medium text-white/60">Destination</label>
                  <label className="flex items-center gap-2 cursor-pointer ml-auto">
                    <span className="text-xs text-white/40">{heroMode === 'surprise' ? 'Surprise me' : 'I know where'}</span>
                    <button
                      type="button"
                      onClick={() => setHeroMode(heroMode === 'surprise' ? 'plan' : 'surprise')}
                      className={`relative w-10 h-5 rounded-full transition-colors ${
                        heroMode === 'plan' ? 'bg-sky-500' : 'bg-white/20'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow ${
                        heroMode === 'plan' ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </label>
                </div>

                {heroMode === 'surprise' ? (
                  <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl px-4 py-3 text-center">
                    <p className="text-sky-300 text-sm font-medium">AI will pick the perfect destination for you</p>
                  </div>
                ) : (
                  <div className="airport-dark-theme">
                    <AirportAutocomplete
                      id="hero-plan-dest"
                      label=""
                      value={planDestination}
                      onChange={setPlanDestination}
                      placeholder="Bangkok, Lisbon, Tokyo..."
                    />
                  </div>
                )}
              </div>

              {/* Row 1: Origin + Budget */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/60 mb-2">Flying from</label>
                  <div className="airport-dark-theme">
                    <AirportAutocomplete
                      id="hero-origin"
                      label=""
                      value={origin}
                      onChange={setOrigin}
                      placeholder="City or airport code..."
                      persistKey="origin"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/60 mb-2">Total Budget</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">{currency.symbol}</span>
                      <input
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="800"
                        min="100"
                        className="w-full pl-8 pr-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-sky-500/50 transition text-sm"
                      />
                    </div>
                    <CurrencySelector code={currency.code} currencies={currency.currencies} onChange={currency.setCurrency} />
                  </div>
                </div>
              </div>

              {/* Row 2: Vibes */}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">Vibe</label>
                <div className="flex flex-wrap gap-2">
                  {vibeOptions.map((vibe) => (
                    <button
                      key={vibe.value}
                      type="button"
                      onClick={() => toggleVibe(vibe.value)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition border ${
                        selectedVibes.includes(vibe.value)
                          ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                          : 'bg-white/[0.04] border-white/10 text-white/60 hover:bg-white/[0.08] hover:text-white/80'
                      }`}
                    >
                      <span className="mr-1">{vibe.emoji}</span>
                      {vibe.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Trip length + Accommodation */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/60 mb-2">Trip Length</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={2} max={21} value={tripDuration} onChange={(e) => setTripDuration(Number(e.target.value))} className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-sky-400 bg-white/10" />
                    <span className="text-white font-medium text-sm w-16 text-right">{tripDuration} days</span>
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/60 mb-2">Accommodation</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'hostel', label: 'Hostel' },
                      { value: 'budget', label: 'Budget' },
                      { value: 'mid-range', label: 'Mid' },
                      { value: 'comfort', label: 'Comfort' },
                    ].map((opt) => (
                      <button key={opt.value} type="button" onClick={() => setAccommodation(opt.value)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition border ${
                          accommodation === opt.value
                            ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                            : 'bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.08]'
                        }`}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="button"
                onClick={heroMode === 'surprise' ? handleSurpriseMe : handlePlanTrip}
                disabled={heroMode === 'surprise' ? !canSubmitMystery : !canSubmitPlan}
                className={`w-full py-3.5 rounded-xl font-bold text-base transition ${
                  (heroMode === 'surprise' ? canSubmitMystery : canSubmitPlan)
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white hover:shadow-lg hover:shadow-sky-500/25 hover:scale-[1.01] cursor-pointer'
                    : 'bg-white/10 text-white/30 cursor-not-allowed'
                }`}
              >
                {heroMode === 'surprise' ? 'Find My Mystery Destination' : 'Plan My Trip'}
              </button>

              <p className="text-center">
                <Link href={heroMode === 'surprise' ? '/mystery' : '/plan-my-trip'} className="text-xs text-white/30 hover:text-sky-400 transition">
                  Want more options? Use the full {heroMode === 'surprise' ? 'mystery' : 'trip'} planner →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 2: Three unique value props ── */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-3">
            <div className="text-3xl">&#10024;</div>
            <h3 className="text-white font-bold text-lg">Destinations You&apos;d Never Think Of</h3>
            <p className="text-white/50 text-sm">
              Our AI picks from 50+ live destinations based on your vibe and budget
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="text-3xl">&#128176;</div>
            <h3 className="text-white font-bold text-lg">Total Trip Cost, Not Just Flights</h3>
            <p className="text-white/50 text-sm">
              We show flights + hotels + food + activities so you know the real price
            </p>
          </div>
          <div className="text-center space-y-3">
            <div className="text-3xl">&#128506;</div>
            <h3 className="text-white font-bold text-lg">Turn Layovers Into Free Vacations</h3>
            <p className="text-white/50 text-sm">
              Add a visa-free stopover city and actually save money
            </p>
          </div>
        </div>
      </section>

      {/* ── Section 3: Trending Now ── */}
      <section className="max-w-5xl mx-auto px-6 pb-16 w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Trending Now</h2>
          <Link href="/inspire" className="text-sm text-sky-400 hover:text-sky-300 transition">
            See all destinations &rarr;
          </Link>
        </div>
        <TrendingSection currency={currency} />
      </section>

      {/* ── Section 4: Quick tools ── */}
      <section className="max-w-5xl mx-auto px-6 pb-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/search"
            className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-sky-400/30 hover:bg-sky-500/5 transition"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">&#128269;</span>
              <h3 className="text-white font-bold group-hover:text-sky-400 transition">Search Flights</h3>
            </div>
            <p className="text-white/40 text-sm">Compare prices across dates and airports</p>
          </Link>
          <Link
            href="/deals"
            className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-emerald-400/30 hover:bg-emerald-500/5 transition"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">&#127991;&#65039;</span>
              <h3 className="text-white font-bold group-hover:text-emerald-400 transition">This Month&apos;s Deals</h3>
            </div>
            <p className="text-white/40 text-sm">Cheapest flights from your airport right now</p>
          </Link>
          <Link
            href="/trip-cost"
            className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 hover:border-amber-400/30 hover:bg-amber-500/5 transition"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">&#128176;</span>
              <h3 className="text-white font-bold group-hover:text-amber-400 transition">Trip Cost Calculator</h3>
            </div>
            <p className="text-white/40 text-sm">Know what it costs before you go</p>
          </Link>
        </div>
      </section>

      {/* ── Section 5: Social Proof ── */}
      <section className="max-w-5xl mx-auto px-6 pb-16 w-full">
        <SocialProof />
      </section>

      {/* ── Section 6: How It Works ── */}
      <section className="max-w-4xl mx-auto px-6 pb-20 w-full text-center">
        <h2 className="text-2xl font-bold text-white mb-8">How It Works</h2>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-sm">
              1
            </div>
            <span className="text-white/70 font-medium">Set your budget</span>
          </div>
          <span className="hidden md:block text-white/20 text-2xl">&rarr;</span>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-pink-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 font-bold text-sm">
              2
            </div>
            <span className="text-white/70 font-medium">Pick your vibe</span>
          </div>
          <span className="hidden md:block text-white/20 text-2xl">&rarr;</span>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 font-bold text-sm">
              3
            </div>
            <span className="text-white/70 font-medium">Get surprised</span>
          </div>
        </div>
        <Link
          href="/about"
          className="inline-block mt-6 text-sm text-white/40 hover:text-purple-400 transition"
        >
          Learn more about how it works &rarr;
        </Link>
      </section>

      <Footer />
      <InstallPrompt />

      {/* Styles for dark-themed AirportAutocomplete */}
      <style jsx global>{`
        .airport-dark-theme .space-y-2 > label {
          display: none;
        }
        .airport-dark-theme input {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
          color: white !important;
          border-radius: 0.75rem !important;
        }
        .airport-dark-theme input::placeholder {
          color: rgba(255, 255, 255, 0.3) !important;
        }
        .airport-dark-theme input:focus {
          border-color: rgba(168, 85, 247, 0.5) !important;
        }
        .airport-dark-theme .bg-gray-50 {
          background: rgba(255, 255, 255, 0.06) !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .airport-dark-theme .text-navy,
        .airport-dark-theme .font-semibold.text-navy {
          color: white !important;
        }
        .airport-dark-theme .text-gray-600,
        .airport-dark-theme .text-sm.text-gray-600 {
          color: rgba(255, 255, 255, 0.5) !important;
        }
        .airport-dark-theme .text-gray-500 {
          color: rgba(255, 255, 255, 0.4) !important;
        }
        .airport-dark-theme .hover\\:bg-gray-200:hover {
          background: rgba(255, 255, 255, 0.1) !important;
        }
        .airport-dark-theme .text-gray-400 {
          color: rgba(255, 255, 255, 0.3) !important;
        }
        .airport-dark-theme .text-xs.text-gray-400 {
          color: rgba(255, 255, 255, 0.3) !important;
        }
        .airport-dark-theme .bg-skyblue\\/10 {
          background: rgba(168, 85, 247, 0.15) !important;
        }
        .airport-dark-theme .text-skyblue {
          color: rgb(192, 132, 252) !important;
        }
        .airport-dark-theme button.text-xs.font-medium.text-skyblue {
          color: rgb(192, 132, 252) !important;
        }
        .airport-dark-theme .bg-white {
          background: #1a1a2e !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        .airport-dark-theme .hover\\:bg-skyblue\\/10:hover {
          background: rgba(168, 85, 247, 0.1) !important;
        }
        .airport-dark-theme .border-gray-100 {
          border-color: rgba(255, 255, 255, 0.06) !important;
        }
        .airport-dark-theme .font-semibold:not(.text-navy) {
          color: white !important;
        }
        .airport-dark-theme .text-blue-700 {
          color: rgb(192, 132, 252) !important;
        }
        .airport-dark-theme .text-blue-500 {
          color: rgba(168, 85, 247, 0.7) !important;
        }
        .airport-dark-theme .bg-blue-50\\/50 {
          background: rgba(168, 85, 247, 0.08) !important;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </main>
  )
}
