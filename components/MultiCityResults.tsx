'use client'

import Link from 'next/link'

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

export default function MultiCityResults({ result, origin, totalBudget, totalDays, onStartOver }: MultiCityResultsProps) {
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
            return (
              <div
                key={city.code}
                className={`bg-gradient-to-br ${cardGradients[idx % cardGradients.length]} backdrop-blur-sm rounded-2xl p-6 border transition-all hover:shadow-xl`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 text-sm font-mono">#{idx + 1}</span>
                      <h3 className="text-xl font-bold text-white">{city.name}</h3>
                    </div>
                    <p className="text-skyblue-light text-sm">{city.country}</p>
                  </div>
                  <div className="bg-white/10 rounded-lg px-3 py-1.5">
                    <span className="text-white font-bold text-sm">{city.days} days</span>
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

                <div className="space-y-1.5 mb-5">
                  {city.highlights.map((h, hIdx) => (
                    <div key={hIdx} className="flex items-start gap-2">
                      <span className="text-amber-400 mt-0.5 flex-shrink-0">&#9733;</span>
                      <span className="text-white/90 text-sm">{h}</span>
                    </div>
                  ))}
                </div>

                {result.bookingLinks[idx] && (
                  <a
                    href={result.bookingLinks[idx].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-white/10 hover:bg-white/20 text-white font-semibold py-2.5 px-4 rounded-lg transition-all border border-white/20 hover:border-white/40 text-sm"
                  >
                    Book flight to {city.name}
                  </a>
                )}
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
