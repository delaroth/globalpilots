'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import PriceSlider from '@/components/PriceSlider'
import LiveActivityFeed from '@/components/LiveActivityFeed'
import RouteTrackingBadge from '@/components/RouteTrackingBadge'
import RecentDealsCarousel from '@/components/RecentDealsCarousel'
import EmailCapture from '@/components/EmailCapture'

interface PriceAlert {
  id: string
  email: string
  origin: string
  destination: string
  targetPrice: number
  createdAt: string
  isActive: boolean
}

export default function AlertsPage() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [email, setEmail] = useState('')
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false)

  // Price slider state
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [historicalLow, setHistoricalLow] = useState<number | null>(null)
  const [isLoadingPrices, setIsLoadingPrices] = useState(false)

  // Flexible dates state
  const [flexibleDates, setFlexibleDates] = useState(false)
  const [dateRangeDays, setDateRangeDays] = useState(3)

  // Load user's email from localStorage and fetch their alerts
  useEffect(() => {
    const savedEmail = localStorage.getItem('globepilot_user_email')
    if (savedEmail) {
      setEmail(savedEmail)
      fetchAlerts(savedEmail)
    }
  }, [])

  // Fetch price data when origin and destination are selected
  useEffect(() => {
    const fetchPriceData = async () => {
      if (!origin || !destination) {
        setCurrentPrice(null)
        setHistoricalLow(null)
        return
      }

      setIsLoadingPrices(true)
      try {
        // Fetch historical prices (3 months)
        const historyResponse = await fetch(
          `/api/price-tracking/history?origin=${origin}&destination=${destination}&months=3`
        )

        if (!historyResponse.ok) {
          throw new Error('Failed to fetch price history')
        }

        const historyData = await historyResponse.json()
        const prices = historyData.prices || []

        if (prices.length === 0) {
          // No historical data, try to get current price
          const currentResponse = await fetch(
            `/api/travelpayouts/latest?origin=${origin}&destination=${destination}`
          )

          if (currentResponse.ok) {
            const currentData = await currentResponse.json()
            const flights = currentData.data || []

            if (flights.length > 0) {
              const price = flights[0].value
              setCurrentPrice(price)
              setHistoricalLow(price)
              // Set default target to 10% above this price
              setTargetPrice(Math.ceil(price * 1.1).toString())
            }
          }
        } else {
          // Calculate current and historical low from data
          const priceValues = prices.map((p: any) => p.price)
          const low = Math.min(...priceValues)
          const current = priceValues[priceValues.length - 1] || low

          setCurrentPrice(current)
          setHistoricalLow(low)
          // Set default target to 10% above historical low
          setTargetPrice(Math.ceil(low * 1.1).toString())
        }
      } catch (err) {
        console.error('Error fetching price data:', err)
        // Don't show error to user, just disable slider
        setCurrentPrice(null)
        setHistoricalLow(null)
      } finally {
        setIsLoadingPrices(false)
      }
    }

    fetchPriceData()
  }, [origin, destination])

  const fetchAlerts = async (userEmail: string) => {
    if (!userEmail) return

    setIsLoadingAlerts(true)
    try {
      const response = await fetch(`/api/alerts/list?email=${encodeURIComponent(userEmail)}`)
      if (!response.ok) throw new Error('Failed to fetch alerts')

      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (err) {
      console.error('Error fetching alerts:', err)
    } finally {
      setIsLoadingAlerts(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowSuccess(false)
    setIsSubmitting(true)

    try {
      // Validate required fields
      if (!email) {
        throw new Error('Please enter your email address')
      }

      if (!origin) {
        throw new Error('Please select a departure airport')
      }

      if (!destination) {
        throw new Error('Please select a destination airport')
      }

      if (!targetPrice || parseFloat(targetPrice) <= 0) {
        throw new Error('Please enter a valid target price')
      }

      console.log('[Alerts] Creating alert:', { email, origin, destination, targetPrice })

      // Create alert via API
      const response = await fetch('/api/alerts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          origin,
          destination,
          targetPrice: parseFloat(targetPrice),
          flexibleDates,
          dateRangeDays: flexibleDates ? dateRangeDays : 0,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
        throw new Error(errorData.error || 'Failed to create alert')
      }

      const data = await response.json()
      console.log('[Alerts] ✅ Alert created:', data.alert.id)

      // Save email to localStorage for next visit
      localStorage.setItem('globepilot_user_email', email)

      // Refresh alerts list
      await fetchAlerts(email)

      setShowSuccess(true)

      // Reset form (except email)
      setOrigin('')
      setDestination('')
      setTargetPrice('')

      setTimeout(() => setShowSuccess(false), 10000)
    } catch (err) {
      console.error('[Alerts] Error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch('/api/alerts/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) throw new Error('Failed to delete alert')

      // Remove from local state
      setAlerts(alerts.filter(alert => alert.id !== id))
    } catch (err) {
      console.error('Error deleting alert:', err)
      setError('Failed to delete alert. Please try again.')
    }
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/alerts/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, isActive: !isActive }),
      })

      if (!response.ok) throw new Error('Failed to update alert')

      // Update local state
      setAlerts(alerts.map(alert =>
        alert.id === id ? { ...alert, isActive: !isActive } : alert
      ))
    } catch (err) {
      console.error('Error updating alert:', err)
      setError('Failed to update alert. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Navigation */}
      <nav className="w-full px-6 py-4 bg-slate-900/95 backdrop-blur-sm border-b border-sky-500/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
              <span className="text-slate-900 text-xl font-bold">G</span>
            </div>
            <span className="text-white text-xl font-bold">GlobePilot</span>
          </Link>
          <Link href="/" className="text-sky-400 hover:text-sky-300 transition">
            ← Back to Home
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Price Alerts 🔔
          </h1>
          <p className="text-xl text-sky-300">
            Get notified when prices drop below your target
          </p>
        </div>

        {/* Recent Deals Carousel */}
        <div className="max-w-4xl mx-auto mb-8">
          <RecentDealsCarousel />
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Alert Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Price Alert</h2>

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-900 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition text-slate-900"
                    required
                  />
                </div>

                {/* Route */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <AirportAutocomplete
                    id="origin"
                    label="From"
                    value={origin}
                    onChange={setOrigin}
                    placeholder="Search departure city..."
                  />
                  <AirportAutocomplete
                    id="destination"
                    label="To"
                    value={destination}
                    onChange={setDestination}
                    placeholder="Search arrival city..."
                  />
                </div>

                {/* Route Tracking Badge */}
                {origin && destination && (
                  <div className="mb-4 flex justify-center">
                    <RouteTrackingBadge origin={origin} destination={destination} />
                  </div>
                )}

                {/* Flexible Dates Toggle */}
                <div className="mb-4 bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flexibleDates}
                      onChange={(e) => setFlexibleDates(e.target.checked)}
                      className="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-sky-400 mt-0.5"
                    />
                    <div className="ml-3 flex-1">
                      <span className="text-slate-900 font-semibold">My dates are flexible</span>
                      <p className="text-sm text-gray-600 mt-1">
                        Track prices ±{dateRangeDays} days around your travel date for better deals
                      </p>
                    </div>
                  </label>

                  {flexibleDates && (
                    <div className="mt-4 pt-4 border-t border-sky-500/20">
                      <label className="block text-sm font-medium text-slate-900 mb-2">
                        Date Flexibility: ±{dateRangeDays} days
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="7"
                        value={dateRangeDays}
                        onChange={(e) => setDateRangeDays(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-sky-400"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>±1 day</span>
                        <span>±7 days</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        We'll notify you of the best price within {dateRangeDays} days before or after your date
                      </p>
                    </div>
                  )}
                </div>

                {/* Target Price */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Target Price (USD)
                  </label>

                  {isLoadingPrices ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="inline-block w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-3"></div>
                      <p className="text-sm text-gray-600">Loading price data...</p>
                    </div>
                  ) : currentPrice !== null && historicalLow !== null ? (
                    <PriceSlider
                      currentPrice={currentPrice}
                      historicalLow={historicalLow}
                      targetPrice={parseInt(targetPrice) || Math.ceil(historicalLow * 1.1)}
                      onTargetPriceChange={(price) => setTargetPrice(price.toString())}
                    />
                  ) : (
                    <>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          id="targetPrice"
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(e.target.value)}
                          placeholder="299"
                          min="1"
                          className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-sky-400 focus:outline-none transition text-slate-900"
                          required
                        />
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {origin && destination
                          ? 'No price data available. Enter your target price manually.'
                          : 'Select origin and destination to see price insights'}
                      </p>
                    </>
                  )}
                </div>

                {/* Success Message */}
                {showSuccess && (
                  <div className="mb-4 bg-green-50 border-2 border-green-500 rounded-lg p-4">
                    <p className="text-green-700 font-semibold">✅ Alert created! We'll email you when prices drop below ${targetPrice || 'your target'}.</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-4 bg-red-50 border-2 border-red-500 rounded-lg p-4">
                    <p className="text-red-700 font-semibold">❌ {error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-slate-900 font-semibold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <div className="inline-block w-5 h-5 border-3 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Alert...</span>
                    </>
                  ) : (
                    'Create Alert'
                  )}
                </button>
              </form>

              {/* Note about alerts */}
              <div className="mt-6 bg-sky-500/10 border border-sky-500/30 rounded-lg p-4">
                <p className="text-sky-400 text-sm">
                  <strong>💡 How it works:</strong> We check prices every 6 hours and email you when they drop below your target. Alerts are stored securely and synced across your devices.
                </p>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Live Activity Feed */}
            <LiveActivityFeed />

            {/* My Alerts */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                My Alerts ({alerts.length})
              </h2>

              {isLoadingAlerts ? (
                <div className="text-center py-12">
                  <div className="inline-block w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading your alerts...</p>
                </div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔔</div>
                  <p className="text-gray-600">No alerts yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Create your first alert to start tracking prices
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`border-2 rounded-lg p-4 transition ${
                        alert.isActive
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">
                            {alert.origin} → {alert.destination}
                          </h3>
                          <p className="text-sm text-gray-600">{alert.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggle(alert.id, alert.isActive)}
                            className={`px-3 py-1 rounded text-sm font-medium transition ${
                              alert.isActive
                                ? 'bg-green-500 text-white hover:bg-green-600'
                                : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                            }`}
                          >
                            {alert.isActive ? 'Active' : 'Paused'}
                          </button>
                          <button
                            onClick={() => handleDelete(alert.id)}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm font-medium hover:bg-red-600 transition"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="bg-white rounded p-3 text-center">
                        <p className="text-xs text-gray-600">Target Price</p>
                        <p className="text-xl font-bold text-green-600">${alert.targetPrice}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          We'll email you when prices drop below this
                        </p>
                      </div>

                      <div className="mt-3 bg-sky-500/10 border border-sky-500/30 rounded p-2 text-center">
                        <p className="text-sky-600 text-xs">
                          Created {new Date(alert.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-sky-500/10 backdrop-blur-sm rounded-xl p-8 border border-sky-500/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">How Price Alerts Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-white font-semibold mb-2">Set Your Target</h3>
                <p className="text-sky-300 text-sm">
                  Choose a route and your ideal price point
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">👀</div>
                <h3 className="text-white font-semibold mb-2">We Monitor</h3>
                <p className="text-sky-300 text-sm">
                  Our system checks prices regularly
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">📧</div>
                <h3 className="text-white font-semibold mb-2">Get Notified</h3>
                <p className="text-sky-300 text-sm">
                  Receive alerts when prices drop below your target
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Subscription CTA */}
        <div className="max-w-4xl mx-auto mt-12">
          <EmailCapture context="alerts" />
        </div>
      </div>
    </div>
  )
}
