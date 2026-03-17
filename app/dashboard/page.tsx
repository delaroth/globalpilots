'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import MigrationPrompt from '@/components/MigrationPrompt'

interface PriceAlert {
  id: string
  origin: string
  destination: string
  target_price: number
  current_price: number | null
  historical_low_price: number | null
  price_status: string | null
  is_active: boolean
  flexible_dates: boolean
  date_range_days: number
  best_price_in_range: number | null
  best_price_date: string | null
  created_at: string
}

interface SavedTrip {
  id: string
  trip_name: string | null
  destination_data: any
  is_favorite: boolean
  notes: string | null
  created_at: string
}

interface UserStatistics {
  total_alerts_created: number
  active_alerts_count: number
  total_trips_saved: number
  total_destinations_revealed: number
  estimated_money_saved: number
}

interface PassportData {
  stamps: any[]
  badges: any[]
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([])
  const [statistics, setStatistics] = useState<UserStatistics | null>(null)
  const [passport, setPassport] = useState<PassportData | null>(null)
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(true)
  const [isLoadingTrips, setIsLoadingTrips] = useState(true)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingPassport, setIsLoadingPassport] = useState(true)
  const [showMigration, setShowMigration] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard')
    }
  }, [status, router])

  // Check for unmigrated localStorage data
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (localStorage.getItem('gp_migrated') === 'true') return

    const hasTrips = !!localStorage.getItem('gp_trips')
    const hasPassport = !!localStorage.getItem('gp_passport')
    if (hasTrips || hasPassport) {
      setShowMigration(true)
    }
  }, [])

  // Fetch user data
  useEffect(() => {
    if (session?.user?.id) {
      fetchAlerts()
      fetchSavedTrips()
      fetchStatistics()
      fetchPassport()
    }
  }, [session])

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/dashboard/alerts')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setIsLoadingAlerts(false)
    }
  }

  const fetchSavedTrips = async () => {
    try {
      const response = await fetch('/api/dashboard/saved-trips')
      if (response.ok) {
        const data = await response.json()
        setSavedTrips(data.trips || [])
      }
    } catch (error) {
      console.error('Error fetching saved trips:', error)
    } finally {
      setIsLoadingTrips(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/dashboard/statistics')
      if (response.ok) {
        const data = await response.json()
        setStatistics(data.statistics)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  const fetchPassport = async () => {
    try {
      const response = await fetch('/api/dashboard/passport')
      if (response.ok) {
        const data = await response.json()
        setPassport(data.passport)
      }
    } catch (error) {
      console.error('Error fetching passport:', error)
    } finally {
      setIsLoadingPassport(false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const stampCount = passport?.stamps?.length || 0
  const badgeCount = passport?.badges?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Migration Prompt Modal */}
      {showMigration && <MigrationPrompt />}

      {/* Navigation */}
      <nav className="w-full px-6 py-4 bg-slate-900/95 backdrop-blur-sm border-b border-sky-500/20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
              <span className="text-slate-900 text-xl font-bold">G</span>
            </div>
            <span className="text-white text-xl font-bold">GlobePilot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/mystery" className="text-sky-400 hover:text-sky-300 transition">
              Mystery
            </Link>
            <Link href="/alerts" className="text-sky-400 hover:text-sky-300 transition">
              Alerts
            </Link>
            <Link href="/blog" className="text-sky-400 hover:text-sky-300 transition">
              Guides
            </Link>
            <button
              onClick={handleSignOut}
              className="text-sky-400 hover:text-sky-300 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Welcome back, {session.user.name?.split(' ')[0] || 'Traveler'}!
          </h1>
          <p className="text-xl text-sky-300">
            Here&apos;s your travel dashboard
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">{'\uD83D\uDD14'}</span>
              <span className="text-sm text-gray-500">Active</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {isLoadingStats ? '...' : statistics?.active_alerts_count || 0}
            </p>
            <p className="text-sm text-gray-600">Price Alerts</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">{'\u2B50'}</span>
              <span className="text-sm text-gray-500">Saved</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {isLoadingStats ? '...' : statistics?.total_trips_saved || 0}
            </p>
            <p className="text-sm text-gray-600">Trips</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">{'\uD83C\uDF0D'}</span>
              <span className="text-sm text-gray-500">Discovered</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {isLoadingStats ? '...' : statistics?.total_destinations_revealed || 0}
            </p>
            <p className="text-sm text-gray-600">Destinations</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">{'\uD83D\uDCCD'}</span>
              <span className="text-sm text-gray-500">Passport</span>
            </div>
            <p className="text-3xl font-bold text-slate-900">
              {isLoadingPassport ? '...' : stampCount}
            </p>
            <p className="text-sm text-gray-600">Stamps</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">{'\uD83D\uDCB0'}</span>
              <span className="text-sm text-green-100">Estimated</span>
            </div>
            <p className="text-3xl font-bold">
              ${isLoadingStats ? '...' : statistics?.estimated_money_saved || 0}
            </p>
            <p className="text-sm text-green-100">Money Saved</p>
          </div>
        </div>

        {/* Badge Showcase */}
        {!isLoadingPassport && badgeCount > 0 && (
          <div className="mb-12 bg-white/5 border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              {'\uD83C\uDFC6'} Your Badges
            </h2>
            <div className="flex flex-wrap gap-3">
              {passport!.badges.map((badge: any) => (
                <div
                  key={badge.badge_id || badge.id}
                  className="flex items-center gap-2 bg-slate-900/60 border border-sky-500/20 rounded-lg px-4 py-2"
                  title={badge.description}
                >
                  <span className="text-2xl">{badge.emoji}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{badge.name}</p>
                    <p className="text-xs text-sky-300">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Active Alerts */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Active Alerts</h2>
              <Link
                href="/alerts"
                className="text-sky-400 hover:text-sky-600 font-semibold text-sm"
              >
                Manage {'\u2192'}
              </Link>
            </div>

            {isLoadingAlerts ? (
              <div className="text-center py-12">
                <div className="inline-block w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">{'\uD83D\uDD14'}</div>
                <p className="text-gray-600 mb-4">No active alerts</p>
                <Link
                  href="/alerts"
                  className="inline-block bg-sky-500 hover:bg-sky-600 text-slate-900 font-semibold py-2 px-6 rounded-lg transition"
                >
                  Create Alert
                </Link>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert.id}
                    className="border-2 border-green-200 bg-green-50 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-slate-900">
                        {alert.origin} {'\u2192'} {alert.destination}
                      </h3>
                      {alert.flexible_dates && (
                        <span className="text-xs bg-sky-500/20 text-sky-400 px-2 py-1 rounded">
                          {'\u00B1'}{alert.date_range_days}d
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Target</p>
                        <p className="font-bold text-green-600">${alert.target_price}</p>
                      </div>
                      {alert.current_price && (
                        <div>
                          <p className="text-gray-600">Current</p>
                          <p className="font-bold text-slate-900">${alert.current_price}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {alerts.length > 5 && (
                  <Link
                    href="/alerts"
                    className="block text-center text-sky-400 hover:text-sky-600 font-semibold text-sm py-2"
                  >
                    View all {alerts.length} alerts {'\u2192'}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Saved Trips */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Saved Trips</h2>
              <Link
                href="/mystery"
                className="text-sky-400 hover:text-sky-600 font-semibold text-sm"
              >
                Discover {'\u2192'}
              </Link>
            </div>

            {isLoadingTrips ? (
              <div className="text-center py-12">
                <div className="inline-block w-12 h-12 border-4 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : savedTrips.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">{'\u2708\uFE0F'}</div>
                <p className="text-gray-600 mb-4">No saved trips yet</p>
                <Link
                  href="/mystery"
                  className="inline-block bg-sky-500 hover:bg-sky-600 text-slate-900 font-semibold py-2 px-6 rounded-lg transition"
                >
                  Discover Destinations
                </Link>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {savedTrips.slice(0, 5).map((trip) => (
                  <div
                    key={trip.id}
                    className="border-2 border-sky-500/30 bg-sky-500/10 rounded-lg p-4 hover:bg-sky-500/20 transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-slate-900">
                        {trip.destination_data?.destination || 'Mystery Destination'}
                      </h3>
                      {trip.is_favorite && <span className="text-xl">{'\u2B50'}</span>}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {trip.destination_data?.country}
                    </p>
                    {trip.trip_name && (
                      <p className="text-sm text-gray-700 italic">{trip.trip_name}</p>
                    )}
                  </div>
                ))}
                {savedTrips.length > 5 && (
                  <p className="block text-center text-sky-400 hover:text-sky-600 font-semibold text-sm py-2">
                    {savedTrips.length - 5} more saved trips
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/mystery"
            className="bg-gradient-to-br from-sky-500 to-sky-600 text-slate-900 rounded-xl p-6 hover:shadow-2xl transition transform hover:scale-105"
          >
            <div className="text-4xl mb-3">{'\u2728'}</div>
            <h3 className="text-xl font-bold mb-2">Discover Mystery Destination</h3>
            <p className="text-sm text-slate-900/80">Let AI plan your perfect surprise trip</p>
          </Link>

          <Link
            href="/alerts"
            className="bg-white rounded-xl p-6 hover:shadow-2xl transition transform hover:scale-105"
          >
            <div className="text-4xl mb-3">{'\uD83D\uDD14'}</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Create Price Alert</h3>
            <p className="text-sm text-gray-600">Get notified when prices drop</p>
          </Link>

          <Link
            href="/blog"
            className="bg-white rounded-xl p-6 hover:shadow-2xl transition transform hover:scale-105"
          >
            <div className="text-4xl mb-3">{'\uD83D\uDCD6'}</div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Browse Travel Guides</h3>
            <p className="text-sm text-gray-600">Comprehensive destination guides</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
