'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AirportAutocomplete from '@/components/AirportAutocomplete'
import { savePriceAlert, getPriceAlerts, deletePriceAlert, updateAlertStatus, PriceAlert } from '@/lib/storage'

export default function AlertsPage() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [targetPrice, setTargetPrice] = useState('')
  const [email, setEmail] = useState('')
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setAlerts(getPriceAlerts())
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowSuccess(false)

    try {
      // Fetch current price
      const response = await fetch(
        `/api/travelpayouts/prices?origin=${origin}&destination=${destination}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch current price')
      }

      const data = await response.json()
      const flights = data.data || []

      if (flights.length === 0) {
        throw new Error('No flights found for this route')
      }

      const currentPrice = flights[0].value

      // Save alert
      const newAlert = savePriceAlert({
        email,
        origin,
        destination,
        targetPrice: parseFloat(targetPrice),
        currentPrice,
        isActive: true,
      })

      setAlerts([...alerts, newAlert])
      setShowSuccess(true)

      // Reset form
      setOrigin('')
      setDestination('')
      setTargetPrice('')

      setTimeout(() => setShowSuccess(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  const handleDelete = (id: string) => {
    deletePriceAlert(id)
    setAlerts(alerts.filter(alert => alert.id !== id))
  }

  const handleToggle = (id: string, isActive: boolean) => {
    updateAlertStatus(id, !isActive)
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, isActive: !isActive } : alert
    ))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light">
      {/* Navigation */}
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

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Price Alerts 🔔
          </h1>
          <p className="text-xl text-skyblue-light">
            Get notified when prices drop below your target
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Alert Form */}
          <div>
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-navy mb-6">Create Price Alert</h2>

              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="mb-4">
                  <label htmlFor="email" className="block text-sm font-medium text-navy mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
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

                {/* Target Price */}
                <div className="mb-6">
                  <label htmlFor="targetPrice" className="block text-sm font-medium text-navy mb-2">
                    Target Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      id="targetPrice"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      placeholder="299"
                      min="1"
                      className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-skyblue focus:outline-none transition text-navy"
                      required
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    We'll notify you when the price drops below this
                  </p>
                </div>

                {/* Success Message */}
                {showSuccess && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-700">✅ Alert created successfully! We'll monitor this route for you.</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700">❌ {error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-skyblue hover:bg-skyblue-dark text-navy font-semibold py-4 px-6 rounded-lg transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create Alert
                </button>
              </form>

              {/* Note about local storage */}
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> Alerts are stored locally in your browser. For email notifications, we'll need to integrate with an email service.
                </p>
              </div>
            </div>
          </div>

          {/* My Alerts */}
          <div>
            <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-navy mb-6">
                My Alerts ({alerts.length})
              </h2>

              {alerts.length === 0 ? (
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
                          <h3 className="font-bold text-navy text-lg">
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

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded p-3 text-center">
                          <p className="text-xs text-gray-600">Target Price</p>
                          <p className="text-xl font-bold text-green-600">${alert.targetPrice}</p>
                        </div>
                        <div className="bg-white rounded p-3 text-center">
                          <p className="text-xs text-gray-600">Current Price</p>
                          <p className={`text-xl font-bold ${
                            alert.currentPrice && alert.currentPrice <= alert.targetPrice
                              ? 'text-green-600'
                              : 'text-gray-700'
                          }`}>
                            {alert.currentPrice ? `$${alert.currentPrice}` : 'Checking...'}
                          </p>
                        </div>
                      </div>

                      {alert.currentPrice && alert.currentPrice <= alert.targetPrice && (
                        <div className="mt-3 bg-green-100 border border-green-300 rounded p-2 text-center">
                          <p className="text-green-700 font-semibold text-sm">
                            🎉 Price target reached!
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-skyblue/10 backdrop-blur-sm rounded-xl p-8 border border-skyblue/20">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">How Price Alerts Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-white font-semibold mb-2">Set Your Target</h3>
                <p className="text-skyblue-light text-sm">
                  Choose a route and your ideal price point
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">👀</div>
                <h3 className="text-white font-semibold mb-2">We Monitor</h3>
                <p className="text-skyblue-light text-sm">
                  Our system checks prices regularly
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-3">📧</div>
                <h3 className="text-white font-semibold mb-2">Get Notified</h3>
                <p className="text-skyblue-light text-sm">
                  Receive alerts when prices drop below your target
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
