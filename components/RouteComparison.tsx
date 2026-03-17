'use client'

import dynamic from 'next/dynamic'
import { resolveFlightBooking } from '@/lib/booking-redirect'
import { LayoverRoute } from '@/lib/hubs'
import BookingLinks from '@/components/BookingLinks'

// Lazy load CityGuide — only rendered when user clicks "What to do in X?"
const CityGuide = dynamic(() => import('@/components/CityGuide'), {
  ssr: false,
  loading: () => (
    <div className="mt-3 bg-slate-900/95 rounded-lg px-4 py-3 text-center">
      <p className="text-sky-300 text-sm">Loading guide...</p>
    </div>
  ),
})

interface RouteComparisonProps {
  origin: string
  destination: string
  departDate: string
  directPrice: number | null
  layoverRoutes: LayoverRoute[]
  priceSource?: 'travelpayouts-cached' | 'kiwi-live' | 'flightapi-live' | 'serpapi-live'
}

// Fun taglines for layover cities
const cityTaglines: { [key: string]: string } = {
  'Dubai': 'Explore the tallest building in the world!',
  'Singapore': 'Experience the future of urban living!',
  'Istanbul': 'Where East meets West!',
  'Doha': 'Discover Arabian luxury!',
  'London': 'Tea, history, and royalty await!',
  'Paris': 'The City of Light beckons!',
  'Amsterdam': 'Canals, bikes, and culture!',
  'Frankfurt': 'Gateway to Europe!',
  'Hong Kong': 'Skyline like no other!',
  'Tokyo': 'Ultra-modern meets ancient tradition!',
  'Seoul': 'K-culture capital!',
  'Bangkok': 'Street food paradise!',
  'Kuala Lumpur': 'Twin towers and tropical vibes!',
}

export default function RouteComparison({
  origin,
  destination,
  departDate,
  directPrice,
  layoverRoutes,
  priceSource = 'travelpayouts-cached',
}: RouteComparisonProps) {
  const isLiveSource = priceSource === 'kiwi-live' || priceSource === 'flightapi-live' || priceSource === 'serpapi-live'
  const priceLabel = isLiveSource ? 'Live Price' : 'Estimated Price'
  const handleBookDirect = () => {
    const { action } = resolveFlightBooking({ origin, destination, departDate, price: directPrice ?? undefined })
    if (action.type === 'affiliate-redirect') window.open(action.url, '_blank')
  }

  const handleBookLeg = (legOrigin: string, legDestination: string, price?: number) => {
    const { action } = resolveFlightBooking({ origin: legOrigin, destination: legDestination, departDate, price })
    if (action.type === 'affiliate-redirect') window.open(action.url, '_blank')
  }

  // Check if any routes have savings
  const routesWithSavings = layoverRoutes.filter(r => r.savings !== null && r.savings > 0)
  const bestSavings = routesWithSavings.length > 0 ? routesWithSavings[0] : null

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Banner */}
      {directPrice !== null ? (
        bestSavings ? (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 mb-8 text-center shadow-2xl">
            <div className="text-6xl mb-3">🎉</div>
            <h2 className="text-3xl font-bold mb-2">
              Save up to ${bestSavings.savings} with a Stopover!
            </h2>
            <p className="text-xl">
              Found {layoverRoutes.length} stopover route{layoverRoutes.length !== 1 ? 's' : ''} - cheapest saves {bestSavings.savingsPercent}%
            </p>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 mb-8 text-center shadow-2xl">
            <div className="text-6xl mb-3">✈️</div>
            <h2 className="text-3xl font-bold mb-2">
              Found {layoverRoutes.length} Stopover Route{layoverRoutes.length !== 1 ? 's' : ''}
            </h2>
            <p className="text-xl">
              Direct flight: ~${directPrice} - Compare with stopovers below
            </p>
          </div>
        )
      ) : (
        <div className="bg-gradient-to-r from-sky-500 to-sky-600 text-white rounded-xl p-6 mb-8 text-center shadow-2xl">
          <div className="text-6xl mb-3">🌍</div>
          <h2 className="text-3xl font-bold mb-2">
            No Direct Flight Available - But We Found Stopover Options!
          </h2>
          <p className="text-xl">
            {layoverRoutes.length} stopover route{layoverRoutes.length !== 1 ? 's' : ''} found - turn your layover into a bonus trip
          </p>
        </div>
      )}

      {/* Direct Flight Card (only if price available) */}
      {directPrice !== null && (
        <div className="mb-8">
          <h3 className="text-white text-xl font-bold mb-4">Direct Flight Option</h3>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-gray-100 px-6 py-4 border-b">
              <h3 className="text-xl font-bold text-slate-900">Direct Flight</h3>
              <p className="text-sm text-gray-600">{origin} → {destination}</p>
            </div>
            <div className="p-6">
              {/* Route visualization */}
              <div className="flex items-center justify-center mb-6 py-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">{origin}</div>
                </div>
                <div className="flex-1 relative mx-4">
                  <div className="border-t-2 border-gray-300"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                    <span className="text-2xl">✈️</span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-slate-900">{destination}</div>
                </div>
              </div>

              {/* Price */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
                <p className="text-sm text-gray-600 mb-1">{priceLabel}</p>
                <p className="text-4xl font-bold text-gray-700">~${directPrice}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {isLiveSource ? 'Live price — may vary at time of booking' : 'Cached estimate — actual price may differ'}
                </p>
              </div>

              <button
                onClick={handleBookDirect}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg"
              >
                Check on Aviasales
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stopover Routes */}
      <div className="mb-8">
        <h3 className="text-white text-xl font-bold mb-4">
          Stopover Options {directPrice !== null && '(sorted by savings)'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {layoverRoutes.map((route, index) => {
            const tagline = cityTaglines[route.hub.city] || 'Explore for free!'
            const hasSavings = route.savings !== null && route.savings > 0
            const isBestDeal = hasSavings && index === 0

            return (
              <div
                key={`${route.hub.code}-${index}`}
                className={`bg-white rounded-xl shadow-lg overflow-hidden relative ${
                  isBestDeal ? 'border-4 border-green-500' : ''
                }`}
              >
                {/* Best Deal Badge */}
                {isBestDeal && (
                  <div className="absolute -top-3 -right-3 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg rotate-12 z-10 text-sm">
                    BEST DEAL!
                  </div>
                )}

                {/* Header */}
                <div className={`px-6 py-4 border-b ${hasSavings ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                  <h4 className={`text-lg font-bold ${hasSavings ? 'text-green-700' : 'text-blue-700'}`}>
                    Via {route.hub.city}
                  </h4>
                  <p className={`text-xs ${hasSavings ? 'text-green-600' : 'text-blue-600'}`}>
                    {origin} → {route.hub.code} → {destination}
                  </p>
                </div>

                <div className="p-4">
                  {/* Route visualization */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-center flex-1">
                        <div className="text-lg font-bold text-slate-900">{origin}</div>
                      </div>
                      <div className="relative flex-1">
                        <div className={`border-t-2 ${hasSavings ? 'border-green-400' : 'border-blue-400'}`}></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                          <span className="text-sm">✈️</span>
                        </div>
                      </div>
                      <div className="text-center flex-1">
                        <div className={`text-lg font-bold ${hasSavings ? 'text-green-600' : 'text-blue-600'}`}>
                          {route.hub.code}
                        </div>
                      </div>
                      <div className="relative flex-1">
                        <div className={`border-t-2 ${hasSavings ? 'border-green-400' : 'border-blue-400'}`}></div>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                          <span className="text-sm">✈️</span>
                        </div>
                      </div>
                      <div className="text-center flex-1">
                        <div className="text-lg font-bold text-slate-900">{destination}</div>
                      </div>
                    </div>

                    {/* Leg Prices */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`${hasSavings ? 'bg-green-50' : 'bg-blue-50'} rounded p-2 text-center`}>
                        <p className="text-gray-600">Leg 1</p>
                        <p className={`font-semibold ${hasSavings ? 'text-green-700' : 'text-blue-700'}`}>
                          ${Math.round(route.leg1Price)}
                        </p>
                      </div>
                      <div className={`${hasSavings ? 'bg-green-50' : 'bg-blue-50'} rounded p-2 text-center`}>
                        <p className="text-gray-600">Leg 2</p>
                        <p className={`font-semibold ${hasSavings ? 'text-green-700' : 'text-blue-700'}`}>
                          ${Math.round(route.leg2Price)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Total Price */}
                  <div className={`${hasSavings ? 'bg-green-100' : 'bg-blue-100'} rounded-lg p-3 mb-3 text-center`}>
                    <p className={`text-xs ${hasSavings ? 'text-green-700' : 'text-blue-700'} mb-1`}>
                      {priceLabel}
                    </p>
                    <p className={`text-3xl font-bold ${hasSavings ? 'text-green-600' : 'text-blue-600'}`}>
                      ~${Math.round(route.totalPrice)}
                    </p>
                    {hasSavings && (
                      <p className="text-xs text-green-700 mt-1 font-semibold">
                        Save ${route.savings} ({route.savingsPercent}% off)
                      </p>
                    )}
                  </div>

                  {/* Side Quest Value */}
                  {route.sideQuest ? (
                    <div className={`rounded-lg p-2 mb-3 text-xs text-center border ${
                      route.sideQuest.verdict === 'free-vacation' ? 'bg-green-50 border-green-300' :
                      route.sideQuest.verdict === 'worth-it' ? 'bg-blue-50 border-blue-300' :
                      route.sideQuest.verdict === 'splurge' ? 'bg-amber-50 border-amber-300' :
                      'bg-gray-50 border-gray-300'
                    }`}>
                      <p className={`font-semibold ${
                        route.sideQuest.verdict === 'free-vacation' ? 'text-green-700' :
                        route.sideQuest.verdict === 'worth-it' ? 'text-blue-700' :
                        route.sideQuest.verdict === 'splurge' ? 'text-amber-700' :
                        'text-gray-600'
                      }`}>
                        {route.sideQuest.verdict === 'free-vacation' && 'Free Vacation!'}
                        {route.sideQuest.verdict === 'worth-it' && 'Worth It'}
                        {route.sideQuest.verdict === 'splurge' && 'Splurge'}
                        {route.sideQuest.verdict === 'skip' && 'Skip'}
                      </p>
                      <p className="text-gray-600 mt-0.5">{route.sideQuest.pitch}</p>
                      <p className="text-gray-400 mt-0.5">~${route.sideQuest.dailyCost}/day · {route.sideQuest.layoverDays} days</p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3 text-xs text-center">
                      <p className="text-yellow-800">
                        ⭐ <strong>Stopover in {route.hub.city}</strong><br />
                        {tagline}
                      </p>
                    </div>
                  )}

                  {/* Booking Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleBookLeg(origin, route.hub.code, route.leg1Price)}
                      className={`${
                        hasSavings ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                      } text-white font-semibold py-2 px-3 rounded-lg transition text-xs shadow-md hover:shadow-lg`}
                    >
                      Search Leg 1
                    </button>
                    <button
                      onClick={() => handleBookLeg(route.hub.code, destination, route.leg2Price)}
                      className={`${
                        hasSavings ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'
                      } text-white font-semibold py-2 px-3 rounded-lg transition text-xs shadow-md hover:shadow-lg`}
                    >
                      Search Leg 2
                    </button>
                  </div>

                  {/* Hotel + Activity Links */}
                  <BookingLinks
                    cityName={route.hub.city}
                    iata={route.hub.code}
                    checkIn={departDate}
                    nights={route.sideQuest?.layoverDays || 2}
                    maxHotelPerNight={route.sideQuest?.breakdown?.hotel}
                  />

                  {/* AI City Guide */}
                  <CityGuide city={route.hub.city} hubCode={route.hub.code} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Info */}
      <div className="bg-sky-500/10 backdrop-blur-sm rounded-xl p-6 border border-sky-500/20">
        <h3 className="text-white font-semibold mb-2">💡 How Layover Arbitrage Works</h3>
        <p className="text-sky-300 text-sm">
          Sometimes booking two separate flights with a stopover in a major hub city {directPrice !== null ? 'is cheaper than flying direct' : 'can save you money'}.
          Use the layover as a chance to explore a bonus destination for a couple days - essentially getting two trips for {directPrice !== null ? 'less than the price of one' : 'the price of one'}!
        </p>
        <p className="text-sky-300/60 text-xs mt-3">
          {isLiveSource
            ? 'Prices shown are live but may change at time of booking. Click "Search" to confirm the latest fare.'
            : 'Prices shown are cached estimates and may differ from booking prices. Click "Search" to see current prices on Aviasales.'}
        </p>
      </div>
    </div>
  )
}
