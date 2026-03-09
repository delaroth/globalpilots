'use client'

import { generateAffiliateLink } from '@/lib/affiliate'
import { LayoverRoute } from '@/lib/hubs'

interface RouteComparisonProps {
  origin: string
  destination: string
  departDate: string
  directPrice: number
  bestLayover: LayoverRoute | null
}

export default function RouteComparison({
  origin,
  destination,
  departDate,
  directPrice,
  bestLayover,
}: RouteComparisonProps) {
  const handleBookDirect = () => {
    const affiliateLink = generateAffiliateLink({
      origin,
      destination,
      departDate,
    })
    window.open(affiliateLink, '_blank')
  }

  const handleBookLayover = (hubCode: string) => {
    // For layover routes, book the first leg
    const affiliateLink = generateAffiliateLink({
      origin,
      destination: hubCode,
      departDate,
    })
    window.open(affiliateLink, '_blank')
  }

  if (!bestLayover) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">✈️</div>
          <h3 className="text-2xl font-bold text-navy mb-3">
            Direct Flight is Your Best Option
          </h3>
          <p className="text-gray-700 mb-6">
            We couldn't find any cheaper layover routes for this trip. Flying direct is the way to go!
          </p>
          <div className="bg-white rounded-lg p-6 mb-6 max-w-md mx-auto">
            <p className="text-sm text-gray-600 mb-2">Best Price</p>
            <p className="text-4xl font-bold text-green-600 mb-4">${directPrice}</p>
            <button
              onClick={handleBookDirect}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg hover:shadow-xl"
            >
              Book Direct Flight
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Savings Banner */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 mb-8 text-center shadow-2xl">
        <div className="text-6xl mb-3">🎉</div>
        <h2 className="text-3xl font-bold mb-2">
          Save ${bestLayover.savings} with a Stopover!
        </h2>
        <p className="text-xl">
          Stop in {bestLayover.hub.city} for 2 days and save {bestLayover.savingsPercent}% vs flying direct
        </p>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Direct Flight */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b">
            <h3 className="text-xl font-bold text-navy">Direct Flight</h3>
            <p className="text-sm text-gray-600">{origin} → {destination}</p>
          </div>
          <div className="p-6">
            {/* Route visualization */}
            <div className="flex items-center justify-center mb-6 py-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-navy">{origin}</div>
              </div>
              <div className="flex-1 relative mx-4">
                <div className="border-t-2 border-gray-300"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                  <span className="text-2xl">✈️</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-navy">{destination}</div>
              </div>
            </div>

            {/* Price */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-center">
              <p className="text-sm text-gray-600 mb-1">Total Price</p>
              <p className="text-4xl font-bold text-gray-700">${directPrice}</p>
            </div>

            <button
              onClick={handleBookDirect}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md hover:shadow-lg"
            >
              Book Direct
            </button>
          </div>
        </div>

        {/* Layover Route */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border-4 border-green-500 relative">
          {/* Best Deal Badge */}
          <div className="absolute -top-3 -right-3 bg-green-500 text-white px-4 py-2 rounded-full font-bold shadow-lg rotate-12 z-10">
            BEST DEAL!
          </div>

          <div className="bg-green-50 px-6 py-4 border-b border-green-200">
            <h3 className="text-xl font-bold text-green-700">Stopover Route</h3>
            <p className="text-sm text-green-600">
              {origin} → {bestLayover.hub.city} → {destination}
            </p>
          </div>
          <div className="p-6">
            {/* Route visualization */}
            <div className="mb-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-navy">{origin}</div>
                </div>
                <div className="relative flex-1">
                  <div className="border-t-2 border-green-400"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                    <span className="text-lg">✈️</span>
                  </div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-green-600">{bestLayover.hub.code}</div>
                  <div className="text-xs text-gray-600">{bestLayover.hub.city}</div>
                </div>
                <div className="relative flex-1">
                  <div className="border-t-2 border-green-400"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                    <span className="text-lg">✈️</span>
                  </div>
                </div>
                <div className="text-center flex-1">
                  <div className="text-2xl font-bold text-navy">{destination}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                <div className="bg-green-50 rounded p-2 text-center">
                  <p className="text-gray-600">Leg 1</p>
                  <p className="font-semibold text-green-700">${bestLayover.leg1Price}</p>
                </div>
                <div className="bg-green-50 rounded p-2 text-center">
                  <p className="text-gray-600">Leg 2</p>
                  <p className="font-semibold text-green-700">${bestLayover.leg2Price}</p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="bg-green-100 rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-green-700 mb-1">Total Price</p>
              <p className="text-4xl font-bold text-green-600">${bestLayover.totalPrice}</p>
              <p className="text-sm text-green-700 mt-2 font-semibold">
                Save ${bestLayover.savings} ({bestLayover.savingsPercent}% off)
              </p>
            </div>

            {/* Bonus Feature */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm">
              <p className="text-yellow-800">
                ⭐ <strong>Bonus:</strong> Spend 2 days exploring {bestLayover.hub.city} for free!
              </p>
            </div>

            <button
              onClick={() => handleBookLayover(bestLayover.hub.code)}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
            >
              Book This Route
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-8 bg-skyblue/10 backdrop-blur-sm rounded-xl p-6 border border-skyblue/20">
        <h3 className="text-white font-semibold mb-2">💡 How Layover Arbitrage Works</h3>
        <p className="text-skyblue-light text-sm">
          Sometimes booking two separate flights with a stopover in a major hub city is cheaper than flying direct.
          Use the layover as a chance to explore a bonus destination for a couple days - essentially getting two trips for less than the price of one!
        </p>
      </div>
    </div>
  )
}
