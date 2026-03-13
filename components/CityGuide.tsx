'use client'

import { useState } from 'react'

interface CityGuideActivity {
  name: string
  description: string
  time_needed: string
  estimated_cost: string
}

interface CityGuideFoodPick {
  name: string
  type: string
  price_range: string
  must_try: string
}

interface CityGuideData {
  city: string
  hub_code: string
  hours: number
  can_leave_airport: string
  visa_info: string
  airport_to_city: string
  best_area: string
  top_activities: CityGuideActivity[]
  food_picks: CityGuideFoodPick[]
  practical_tips: string[]
  currency: string
  language_tip: string
}

interface CityGuideProps {
  city: string
  hubCode: string
  hours?: number
}

export default function CityGuide({ city, hubCode, hours = 12 }: CityGuideProps) {
  const [expanded, setExpanded] = useState(false)
  const [guide, setGuide] = useState<CityGuideData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchGuide = async () => {
    if (guide) {
      setExpanded(!expanded)
      return
    }

    setExpanded(true)
    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        `/api/city-guide?city=${encodeURIComponent(city)}&hours=${hours}&hub_code=${encodeURIComponent(hubCode)}`
      )
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to load guide')
      }
      const data: CityGuideData = await res.json()
      setGuide(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3">
      {/* Trigger Button */}
      <button
        onClick={fetchGuide}
        className="w-full text-left bg-gradient-to-r from-navy/90 to-navy-light/90 hover:from-navy hover:to-navy-light text-white rounded-lg px-4 py-3 transition-all duration-200 group border border-skyblue/20 hover:border-skyblue/40"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">
              {expanded ? '\u{1F4D6}' : '\u{1F30D}'}
            </span>
            <span className="font-medium text-sm">
              {expanded ? `Layover Guide: ${city}` : `What to do in ${city}?`}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-skyblue transition-transform duration-200 ${
              expanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {!expanded && (
          <p className="text-skyblue-light/60 text-xs mt-1">
            AI-powered layover guide with activities, food, and transit tips
          </p>
        )}
      </button>

      {/* Expanded Guide Content */}
      {expanded && (
        <div className="mt-2 bg-gradient-to-b from-navy/95 to-navy-dark/95 rounded-lg border border-skyblue/20 overflow-hidden">
          {/* Loading State */}
          {loading && (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-skyblue mb-3"></div>
              <p className="text-skyblue-light text-sm">Generating your layover guide for {city}...</p>
              <p className="text-skyblue-light/40 text-xs mt-1">Powered by AI travel intelligence</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="p-4">
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-center">
                <p className="text-red-300 text-sm">{error}</p>
                <button
                  onClick={() => { setGuide(null); fetchGuide() }}
                  className="text-skyblue text-xs mt-2 hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Guide Content */}
          {guide && !loading && (
            <div className="p-4 space-y-4">
              {/* Quick Info Bar */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-skyblue/10 rounded-lg p-3 border border-skyblue/20">
                  <p className="text-skyblue text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Can I leave the airport?
                  </p>
                  <p className="text-white text-xs leading-relaxed">
                    {guide.can_leave_airport}
                  </p>
                </div>
                <div className="bg-skyblue/10 rounded-lg p-3 border border-skyblue/20">
                  <p className="text-skyblue text-[10px] uppercase tracking-wider font-semibold mb-1">
                    Getting to the City
                  </p>
                  <p className="text-white text-xs leading-relaxed">
                    {guide.airport_to_city}
                  </p>
                </div>
              </div>

              {/* Visa Info */}
              <div className="bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                <div className="flex items-start gap-2">
                  <span className="text-sm flex-shrink-0">{'\u{1F4CB}'}</span>
                  <div>
                    <p className="text-amber-300 text-[10px] uppercase tracking-wider font-semibold mb-1">
                      Visa & Transit Info
                    </p>
                    <p className="text-amber-100/80 text-xs leading-relaxed">
                      {guide.visa_info}
                    </p>
                  </div>
                </div>
              </div>

              {/* Best Area */}
              <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                <div className="flex items-start gap-2">
                  <span className="text-sm flex-shrink-0">{'\u{1F4CD}'}</span>
                  <div>
                    <p className="text-purple-300 text-[10px] uppercase tracking-wider font-semibold mb-1">
                      Best Area to Visit
                    </p>
                    <p className="text-purple-100/80 text-xs leading-relaxed">
                      {guide.best_area}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Activities */}
              <div>
                <h4 className="text-skyblue font-semibold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>{'\u2B50'}</span> Top Things to Do
                </h4>
                <div className="space-y-2">
                  {guide.top_activities.map((activity, i) => (
                    <div
                      key={i}
                      className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-skyblue/30 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{activity.name}</p>
                          <p className="text-skyblue-light/60 text-xs mt-0.5">{activity.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-skyblue text-xs font-semibold">{activity.estimated_cost}</p>
                          <p className="text-skyblue-light/40 text-[10px]">{activity.time_needed}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Food Picks */}
              <div>
                <h4 className="text-skyblue font-semibold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>{'\u{1F37D}\uFE0F'}</span> Where to Eat
                </h4>
                <div className="space-y-2">
                  {guide.food_picks.map((pick, i) => (
                    <div
                      key={i}
                      className="bg-white/5 rounded-lg p-3 border border-white/10 hover:border-skyblue/30 transition"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-white text-sm font-medium">{pick.name}</p>
                          <p className="text-skyblue-light/60 text-xs mt-0.5">
                            {pick.type} &middot; Must try: <span className="text-amber-300/80">{pick.must_try}</span>
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-skyblue text-xs font-semibold">{pick.price_range}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Practical Tips */}
              <div>
                <h4 className="text-skyblue font-semibold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span>{'\u{1F4A1}'}</span> Practical Tips
                </h4>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10 space-y-2">
                  {guide.practical_tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-skyblue text-xs mt-0.5 flex-shrink-0">{'\u2713'}</span>
                      <p className="text-skyblue-light/80 text-xs leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Currency & Language */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-skyblue text-[10px] uppercase tracking-wider font-semibold mb-1">
                    {'\u{1F4B0}'} Currency
                  </p>
                  <p className="text-white/80 text-xs">{guide.currency}</p>
                </div>
                <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                  <p className="text-skyblue text-[10px] uppercase tracking-wider font-semibold mb-1">
                    {'\u{1F5E3}\uFE0F'} Language
                  </p>
                  <p className="text-white/80 text-xs">{guide.language_tip}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center pt-2 border-t border-white/10">
                <p className="text-skyblue-light/30 text-[10px]">
                  AI-generated guide for {guide.hours}-hour layover &middot; Verify visa requirements with your embassy
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
