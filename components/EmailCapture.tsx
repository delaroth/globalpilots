'use client'

import { useState } from 'react'

interface EmailCaptureProps {
  context?: 'footer' | 'alerts' | 'inline'
}

export default function EmailCapture({ context = 'inline' }: EmailCaptureProps) {
  const [email, setEmail] = useState('')
  const [origin, setOrigin] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [showCustomize, setShowCustomize] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/email/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          origin: origin || undefined,
          maxPrice: maxPrice ? parseInt(maxPrice) : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to subscribe')
      }

      setStatus('success')
      setMessage(data.emailSent
        ? 'Subscribed! Check your inbox for a welcome email.'
        : 'Subscribed! You\'ll receive deal alerts soon.'
      )
      setEmail('')
      setOrigin('')
      setMaxPrice('')
      setShowCustomize(false)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }

  // Footer context: minimal, horizontal layout
  if (context === 'footer') {
    return (
      <div className="w-full">
        <h4 className="text-white font-semibold text-sm mb-3">Get Deal Alerts</h4>
        <p className="text-sky-300/70 text-xs mb-3">
          Flight deals &amp; price drops straight to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-3 py-2 bg-slate-800/80 border border-sky-500/30 rounded-lg text-white placeholder-sky-300/50 text-sm focus:outline-none focus:border-sky-400 transition"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-slate-900 font-semibold text-sm rounded-lg transition disabled:opacity-60 whitespace-nowrap"
          >
            {status === 'loading' ? '...' : 'Subscribe'}
          </button>
        </form>
        {status === 'success' && (
          <p className="text-green-400 text-xs mt-2">{message}</p>
        )}
        {status === 'error' && (
          <p className="text-red-400 text-xs mt-2">{message}</p>
        )}
      </div>
    )
  }

  // Alerts context: prominent CTA card
  if (context === 'alerts') {
    return (
      <div className="bg-gradient-to-r from-sky-500/20 to-sky-500/10 backdrop-blur-sm border border-sky-500/30 rounded-2xl p-8">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-white mb-2">
            Never Miss a Deal
          </h3>
          <p className="text-sky-300">
            Subscribe to get price drops, mistake fares, and weekly deal roundups delivered to your inbox.
          </p>
        </div>

        {status === 'success' ? (
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-400 font-semibold text-lg">{message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
            <div className="flex gap-3 mb-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-4 py-3 bg-slate-900/60 border-2 border-sky-500/30 rounded-xl text-white placeholder-sky-300/50 focus:outline-none focus:border-sky-400 transition text-base"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-slate-900 font-bold rounded-xl transition shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:transform-none whitespace-nowrap"
              >
                {status === 'loading' ? (
                  <span className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                    Subscribing
                  </span>
                ) : (
                  'Get Alerts'
                )}
              </button>
            </div>

            {/* Collapsible customize section */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowCustomize(!showCustomize)}
                className="text-sky-300/70 text-sm hover:text-sky-400 transition inline-flex items-center gap-1"
              >
                <svg
                  className={`w-4 h-4 transition-transform ${showCustomize ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                Customize alerts
              </button>
            </div>

            {showCustomize && (
              <div className="mt-4 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                <div>
                  <label className="block text-sky-300 text-xs mb-1">Home airport (IATA)</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value.toUpperCase().slice(0, 3))}
                    placeholder="e.g. BKK"
                    maxLength={3}
                    className="w-full px-3 py-2 bg-slate-900/60 border border-sky-500/30 rounded-lg text-white placeholder-sky-300/50 text-sm focus:outline-none focus:border-sky-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-sky-300 text-xs mb-1">Max price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-300/50 text-sm">$</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="500"
                      min="1"
                      className="w-full pl-7 pr-3 py-2 bg-slate-900/60 border border-sky-500/30 rounded-lg text-white placeholder-sky-300/50 text-sm focus:outline-none focus:border-sky-400 transition"
                    />
                  </div>
                </div>
              </div>
            )}

            {status === 'error' && (
              <p className="text-red-400 text-sm mt-3 text-center">{message}</p>
            )}

            <p className="text-sky-300/50 text-xs text-center mt-4">
              No spam, ever. Unsubscribe anytime with one click.
            </p>
          </form>
        )}
      </div>
    )
  }

  // Default inline context: compact card
  return (
    <div className="bg-white/10 backdrop-blur-sm border border-sky-500/20 rounded-xl p-6">
      <h4 className="text-white font-semibold mb-2">Get Deal Alerts</h4>
      <p className="text-sky-300 text-sm mb-4">
        Price drops and mistake fares in your inbox.
      </p>

      {status === 'success' ? (
        <p className="text-green-400 text-sm font-medium">{message}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2 mb-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="flex-1 px-3 py-2 bg-slate-900/60 border border-sky-500/30 rounded-lg text-white placeholder-sky-300/50 text-sm focus:outline-none focus:border-sky-400 transition"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-slate-900 font-semibold text-sm rounded-lg transition disabled:opacity-60"
            >
              {status === 'loading' ? '...' : 'Subscribe'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomize(!showCustomize)}
            className="text-sky-300/60 text-xs hover:text-sky-400 transition"
          >
            {showCustomize ? 'Hide options' : 'Customize alerts'}
          </button>

          {showCustomize && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value.toUpperCase().slice(0, 3))}
                placeholder="Home airport (BKK)"
                maxLength={3}
                className="px-3 py-2 bg-slate-900/60 border border-sky-500/30 rounded-lg text-white placeholder-sky-300/50 text-xs focus:outline-none focus:border-sky-400 transition"
              />
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sky-300/50 text-xs">$</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max price"
                  min="1"
                  className="w-full pl-5 pr-3 py-2 bg-slate-900/60 border border-sky-500/30 rounded-lg text-white placeholder-sky-300/50 text-xs focus:outline-none focus:border-sky-400 transition"
                />
              </div>
            </div>
          )}

          {status === 'error' && (
            <p className="text-red-400 text-xs mt-2">{message}</p>
          )}
        </form>
      )}
    </div>
  )
}
