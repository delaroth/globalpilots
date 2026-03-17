'use client'

import { getPriceStatusLabel } from '@/lib/price-analysis'

interface PriceSliderProps {
  currentPrice: number
  historicalLow: number
  targetPrice: number
  onTargetPriceChange: (price: number) => void
}

export default function PriceSlider({
  currentPrice,
  historicalLow,
  targetPrice,
  onTargetPriceChange
}: PriceSliderProps) {
  // Calculate slider range (10% below historical low to 20% above current)
  const minPrice = Math.floor(historicalLow * 0.9)
  const maxPrice = Math.ceil(currentPrice * 1.2)

  // Calculate status
  const percentAboveLow = ((targetPrice - historicalLow) / historicalLow) * 100

  const getStatus = () => {
    if (percentAboveLow <= 5) return { text: 'Great Deal!', color: 'green', bg: 'bg-green-100', textColor: 'text-green-700' }
    if (percentAboveLow <= 15) return { text: 'Good Price', color: 'blue', bg: 'bg-blue-100', textColor: 'text-blue-700' }
    if (percentAboveLow <= 30) return { text: 'Fair Price', color: 'yellow', bg: 'bg-yellow-100', textColor: 'text-yellow-700' }
    return { text: 'Above Average', color: 'orange', bg: 'bg-orange-100', textColor: 'text-orange-700' }
  }

  const status = getStatus()

  return (
    <div className="space-y-4">
      {/* Price Indicators */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-600">Historical Low (3 months)</p>
          <p className="text-lg font-bold text-green-600">${historicalLow}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Current Price</p>
          <p className="text-lg font-bold text-blue-600">${currentPrice}</p>
        </div>
      </div>

      {/* Slider */}
      <div className="relative pt-6">
        {/* Visual track with gradient */}
        <div className="relative w-full h-2 bg-gradient-to-r from-green-500 via-blue-500 to-orange-500 rounded-lg">
          {/* Markers for historical low and current price */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-green-700"
            style={{ left: `${((historicalLow - minPrice) / (maxPrice - minPrice)) * 100}%` }}
          >
            <div className="absolute -top-6 -translate-x-1/2 text-xs text-green-700 font-semibold whitespace-nowrap">
              ↓ Low
            </div>
          </div>
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-blue-700"
            style={{ left: `${((currentPrice - minPrice) / (maxPrice - minPrice)) * 100}%` }}
          >
            <div className="absolute -top-6 -translate-x-1/2 text-xs text-blue-700 font-semibold whitespace-nowrap">
              ↓ Now
            </div>
          </div>
        </div>

        {/* Actual slider input */}
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          value={targetPrice}
          onChange={(e) => onTargetPriceChange(parseInt(e.target.value))}
          className="absolute top-0 w-full h-8 opacity-0 cursor-pointer z-10"
        />

        {/* Custom slider thumb */}
        <div
          className="absolute top-0 h-8 w-8 bg-sky-500 border-4 border-white rounded-full shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-1/3"
          style={{ left: `${((targetPrice - minPrice) / (maxPrice - minPrice)) * 100}%` }}
        />
      </div>

      {/* Target Price Display */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-600 mb-1">Your Target Price</p>
        <p className="text-4xl font-bold text-slate-900">${targetPrice}</p>
        <span className={`inline-block mt-3 px-6 py-2 rounded-full text-sm font-semibold ${status.bg} ${status.textColor}`}>
          {status.text}
        </span>
      </div>

      {/* Price difference */}
      <div className="text-center">
        {targetPrice < currentPrice ? (
          <p className="text-sm text-green-600">
            ${currentPrice - targetPrice} below current price
          </p>
        ) : targetPrice > currentPrice ? (
          <p className="text-sm text-orange-600">
            ${targetPrice - currentPrice} above current price
          </p>
        ) : (
          <p className="text-sm text-blue-600">
            At current price
          </p>
        )}
      </div>

      {/* Visual Guide */}
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <p className="text-xs text-gray-600 mb-2 font-semibold">Price Guide:</p>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-700">Great Deal - Within 5% of historical low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-700">Good Price - Within 15% of historical low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
            <span className="text-gray-700">Fair Price - Within 30% of historical low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-gray-700">Above Average - More than 30% above low</span>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">💡 Tip:</span>{' '}
          {percentAboveLow <= 5
            ? "This target is very close to the historical low. You'll be notified when there's an excellent deal!"
            : percentAboveLow <= 15
            ? "Good target! You'll catch most price drops while staying reasonable."
            : percentAboveLow <= 30
            ? "Fair target. Consider lowering to catch better deals."
            : "Your target is above average. Consider lowering it to get better value."}
        </p>
      </div>
    </div>
  )
}
