'use client'

import { useState } from 'react'

interface PriceTrackButtonProps {
  origin: string
  destination: string
  currentPrice: number
  className?: string
}

export default function PriceTrackButton({
  origin,
  destination,
  currentPrice,
  className = '',
}: PriceTrackButtonProps) {
  const [showForm, setShowForm] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTrack = async () => {
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/price-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          origin: origin.toUpperCase(),
          destination: destination.toUpperCase(),
          targetPrice: Math.ceil(currentPrice * 0.9), // alert when 10% cheaper
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to set up tracking.')
        return
      }

      setSuccess(true)
      // Save email for future use
      if (typeof window !== 'undefined') {
        localStorage.setItem('gp_track_email', email.trim())
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Load saved email on form open
  const openForm = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gp_track_email')
      if (saved) setEmail(saved)
    }
    setShowForm(true)
  }

  // Success state
  if (success) {
    return (
      <div className={`flex items-center gap-2 text-emerald-400 text-sm ${className}`}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>Tracking {origin}-{destination}!</span>
      </div>
    )
  }

  // Inline email form
  if (showForm) {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        <div className="flex gap-2">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
            className="flex-1 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-sky-400/50"
            autoFocus
          />
          <button
            onClick={handleTrack}
            disabled={loading || !email.trim()}
            className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white text-sm font-medium transition disabled:opacity-50"
          >
            {loading ? '...' : 'Track'}
          </button>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <button
          onClick={() => { setShowForm(false); setError(null) }}
          className="text-white/30 text-xs hover:text-white/50 transition self-start"
        >
          Cancel
        </button>
      </div>
    )
  }

  // Default button
  return (
    <button
      onClick={openForm}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-300 text-sm font-medium hover:bg-amber-500/25 transition ${className}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
      Track This Price
    </button>
  )
}
