'use client'

import { useState, useEffect, useCallback } from 'react'

interface AnalyticsData {
  users: {
    total: number
    today: number
    thisWeek: number
    googleOAuth: number
    emailSignup: number
    emailVerified: number
    emailUnverified: number
  }
  trips: { total: number }
  activity: {
    total: number
    today: number
    popularDestinations: { destination: string; count: number }[]
    recent: { activity_type: string; data: any; created_at: string }[]
  }
  alerts: { active: number; inactive: number; total: number }
  recentSignups: { name: string; email: string; created_at: string; auth_provider: string }[]
  serpApi: { used: number; limit: number; remaining: number }
  cache: { totalEntries: number; activeEntries: number; expiredEntries: number }
  system: {
    uptime: number
    memory: { rss: number; heapUsed: number; heapTotal: number; external: number }
    nodeVersion: string
    timestamp: string
  }
  featurePopularity?: { event_type: string; count: number }[]
  topOrigins?: { origin: string; count: number }[]
  topVibes?: { vibe: string; count: number }[]
  budgetDistribution?: { under_500: number; range_500_1000: number; range_1000_2000: number; over_2000: number }
  topPages?: { page: string; count: number }[]
  conversionFunnel?: { page_views: number; searches: number; reveals: number }
  feedbackSummary?: { type: string; message: string; rating: number | null; would_recommend: boolean | null; page_url: string | null; created_at: string }[]
  avgRating?: { avg: number; count: number }
  topCachedDestinations?: { iata: string; city: string; country: string; reveal_count: number }[]
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function getHealthColor(percent: number): string {
  if (percent >= 70) return '#22c55e'
  if (percent >= 30) return '#eab308'
  return '#ef4444'
}

function getHealthLabel(percent: number): string {
  if (percent >= 70) return 'Healthy'
  if (percent >= 30) return 'Warning'
  return 'Critical'
}

function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0
  const remaining = max - value
  const remainingPercent = max > 0 ? Math.round((remaining / max) * 100) : 0
  const color = getHealthColor(remainingPercent)

  return (
    <div>
      {label && <div className="text-xs text-gray-400 mb-1">{label}</div>}
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1">
        <span style={{ color }}>{value} used</span>
        <span className="text-gray-500">{remaining} remaining</span>
      </div>
    </div>
  )
}

function Card({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-5 ${className}`}
      style={{ boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)' }}
    >
      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  )
}

function MetricValue({ value, label, sub }: { value: string | number; label: string; sub?: string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-white">{value}</div>
      <div className="text-sm text-gray-400 mt-1">{label}</div>
      {sub && <div className="text-xs text-gray-500 mt-0.5">{sub}</div>}
    </div>
  )
}

function StatusDot({ color }: { color: string }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-2"
      style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
    />
  )
}

export default function AdminDashboard() {
  const [secret, setSecret] = useState('')
  const [inputSecret, setInputSecret] = useState('')
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [nextRefreshIn, setNextRefreshIn] = useState(60)

  // Restore secret from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('admin_secret')
    if (stored) setSecret(stored)
  }, [])

  const fetchData = useCallback(async () => {
    if (!secret) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/analytics?secret=${encodeURIComponent(secret)}`)
      if (res.status === 401) {
        setError('Invalid secret. Access denied.')
        setSecret('')
        sessionStorage.removeItem('admin_secret')
        setData(null)
        return
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const json = await res.json()
      setData(json)
      setLastRefresh(new Date())
      setNextRefreshIn(60)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }, [secret])

  // Fetch on secret change
  useEffect(() => {
    if (secret) fetchData()
  }, [secret, fetchData])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!secret || !autoRefresh) return
    const interval = setInterval(() => {
      fetchData()
    }, 60000)
    return () => clearInterval(interval)
  }, [secret, autoRefresh, fetchData])

  // Countdown timer
  useEffect(() => {
    if (!secret || !autoRefresh || !lastRefresh) return
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastRefresh.getTime()) / 1000)
      setNextRefreshIn(Math.max(0, 60 - elapsed))
    }, 1000)
    return () => clearInterval(interval)
  }, [secret, autoRefresh, lastRefresh])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputSecret.trim()) return
    sessionStorage.setItem('admin_secret', inputSecret.trim())
    setSecret(inputSecret.trim())
    setInputSecret('')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('admin_secret')
    setSecret('')
    setData(null)
    setError('')
  }

  // Login screen
  if (!secret) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-8">
            <h1 className="text-xl font-bold text-white mb-1">GlobePilots Admin</h1>
            <p className="text-sm text-gray-400 mb-6">Enter the admin secret to continue.</p>
            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={inputSecret}
                onChange={(e) => setInputSecret(e.target.value)}
                placeholder="Admin secret"
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 mb-4"
                autoFocus
              />
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium transition-colors"
              >
                Access Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Loading state (initial)
  if (!data && loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading analytics...</div>
      </div>
    )
  }

  // Error state with no data
  if (!data && error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <button onClick={fetchData} className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm">
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const serpPercent = data.serpApi.limit > 0 ? Math.round((data.serpApi.remaining / data.serpApi.limit) * 100) : 0
  const heapPercent =
    data.system.memory.heapTotal > 0
      ? Math.round((data.system.memory.heapUsed / data.system.memory.heapTotal) * 100)
      : 0

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/[0.02] backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">GlobePilots Admin</h1>
            <div className="flex items-center gap-3 mt-1">
              {lastRefresh && (
                <span className="text-xs text-gray-500">
                  Last refreshed: {lastRefresh.toLocaleTimeString()}
                </span>
              )}
              {autoRefresh && (
                <span className="text-xs text-gray-600">
                  Next in {nextRefreshIn}s
                </span>
              )}
              {loading && <span className="text-xs text-sky-400">Refreshing...</span>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-sky-500 focus:ring-sky-500/30"
              />
              Auto-refresh
            </label>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-gray-300 transition-colors disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 text-sm text-gray-400 hover:text-red-400 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Row 1: Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card title="Total Users">
            <MetricValue
              value={data.users.total}
              label="registered users"
              sub={`+${data.users.today} today / +${data.users.thisWeek} this week`}
            />
          </Card>

          <Card title="Activity Feed">
            <MetricValue
              value={data.activity.total}
              label="total entries"
              sub={`+${data.activity.today} today`}
            />
          </Card>

          <Card title="SerpApi Budget">
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <StatusDot color={getHealthColor(serpPercent)} />
                <span className="text-sm font-medium" style={{ color: getHealthColor(serpPercent) }}>
                  {getHealthLabel(serpPercent)}
                </span>
              </div>
              <div className="text-2xl font-bold text-white">
                {data.serpApi.remaining}
                <span className="text-sm text-gray-500 font-normal ml-1">/ {data.serpApi.limit}</span>
              </div>
            </div>
            <ProgressBar value={data.serpApi.used} max={data.serpApi.limit} />
          </Card>

          <Card title="Server Health">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Uptime</span>
                <span className="text-white font-medium">{formatUptime(data.system.uptime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Heap</span>
                <span className="text-white font-medium">
                  {formatBytes(data.system.memory.heapUsed)} / {formatBytes(data.system.memory.heapTotal)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">RSS</span>
                <span className="text-white font-medium">{formatBytes(data.system.memory.rss)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Node</span>
                <span className="text-white font-medium">{data.system.nodeVersion}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Row 2: User Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Auth Methods">
            <div className="space-y-4">
              {(() => {
                const total = data.users.googleOAuth + data.users.emailSignup
                const googlePct = total > 0 ? Math.round((data.users.googleOAuth / total) * 100) : 0
                const emailPct = total > 0 ? Math.round((data.users.emailSignup / total) * 100) : 0
                return (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">Google OAuth</span>
                        <span className="text-white font-medium">{data.users.googleOAuth} ({googlePct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${googlePct}%`, backgroundColor: '#4285f4' }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">Email Signup</span>
                        <span className="text-white font-medium">{data.users.emailSignup} ({emailPct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${emailPct}%`, backgroundColor: '#a855f7' }}
                        />
                      </div>
                    </div>
                    {/* Simple pie-style summary */}
                    <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4285f4' }} />
                        Google
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#a855f7' }} />
                        Email
                      </div>
                      <div className="text-xs text-gray-500 ml-auto">{total} total</div>
                    </div>
                  </>
                )
              })()}
            </div>
          </Card>

          <Card title="Verification Status">
            <div className="space-y-4">
              {(() => {
                const total = data.users.emailVerified + data.users.emailUnverified
                const verifiedPct = total > 0 ? Math.round((data.users.emailVerified / total) * 100) : 0
                const unverifiedPct = total > 0 ? Math.round((data.users.emailUnverified / total) * 100) : 0
                return (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">Verified</span>
                        <span className="text-white font-medium">{data.users.emailVerified} ({verifiedPct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${verifiedPct}%`, backgroundColor: '#22c55e' }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">Unverified</span>
                        <span className="text-white font-medium">{data.users.emailUnverified} ({unverifiedPct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${unverifiedPct}%`, backgroundColor: '#ef4444' }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
                        Verified
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
                        Unverified
                      </div>
                      <div className="text-xs text-gray-500 ml-auto">{total} total</div>
                    </div>
                  </>
                )
              })()}
            </div>
          </Card>
        </div>

        {/* Row 3: Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Popular Destinations (Top 10)">
            {data.activity.popularDestinations.length === 0 ? (
              <div className="text-gray-500 text-sm py-4">No destination reveals yet.</div>
            ) : (
              <div className="space-y-2">
                {data.activity.popularDestinations.map((dest, i) => {
                  const maxCount = data.activity.popularDestinations[0]?.count || 1
                  const pct = Math.round((dest.count / maxCount) * 100)
                  return (
                    <div key={dest.destination} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-5 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-200 truncate">{dest.destination}</span>
                          <span className="text-xs text-gray-400 ml-2 shrink-0">{dest.count}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-sky-500/70 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card title="Recent Signups">
            {data.recentSignups.length === 0 ? (
              <div className="text-gray-500 text-sm py-4">No signups yet.</div>
            ) : (
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs uppercase">
                      <th className="pb-2 pr-3 font-medium">Email</th>
                      <th className="pb-2 pr-3 font-medium">Name</th>
                      <th className="pb-2 pr-3 font-medium">Method</th>
                      <th className="pb-2 font-medium">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.recentSignups.map((user, i) => (
                      <tr key={i}>
                        <td className="py-2 pr-3 text-gray-300 font-mono text-xs">{user.email}</td>
                        <td className="py-2 pr-3 text-gray-300">{user.name}</td>
                        <td className="py-2 pr-3">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor:
                                user.auth_provider === 'google' ? 'rgba(66,133,244,0.15)' : 'rgba(168,85,247,0.15)',
                              color: user.auth_provider === 'google' ? '#93b4f4' : '#c084fc',
                            }}
                          >
                            {user.auth_provider === 'google' ? 'Google' : 'Email'}
                          </span>
                        </td>
                        <td className="py-2 text-gray-500 text-xs whitespace-nowrap">
                          {formatTimeAgo(user.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* Row 4: System */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="API & System Health">
            <div className="space-y-4">
              {/* SerpApi */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-300">SerpApi Remaining</span>
                  <span className="font-medium" style={{ color: getHealthColor(serpPercent) }}>
                    {data.serpApi.remaining} / {data.serpApi.limit}
                  </span>
                </div>
                <ProgressBar value={data.serpApi.used} max={data.serpApi.limit} />
              </div>

              {/* Memory */}
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-300">Heap Memory</span>
                  <span className="font-medium" style={{ color: getHealthColor(100 - heapPercent) }}>
                    {heapPercent}% used
                  </span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${heapPercent}%`,
                      backgroundColor: getHealthColor(100 - heapPercent),
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-gray-500">{formatBytes(data.system.memory.heapUsed)}</span>
                  <span className="text-gray-500">{formatBytes(data.system.memory.heapTotal)}</span>
                </div>
              </div>

              {/* Cache */}
              <div className="pt-2 border-t border-white/5">
                <div className="text-sm text-gray-300 mb-2">Cache Stats</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center px-2 py-2 rounded-lg bg-white/5">
                    <div className="text-lg font-bold text-white">{data.cache.totalEntries}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="text-center px-2 py-2 rounded-lg bg-white/5">
                    <div className="text-lg font-bold text-green-400">{data.cache.activeEntries}</div>
                    <div className="text-xs text-gray-500">Active</div>
                  </div>
                  <div className="text-center px-2 py-2 rounded-lg bg-white/5">
                    <div className="text-lg font-bold text-gray-500">{data.cache.expiredEntries}</div>
                    <div className="text-xs text-gray-500">Expired</div>
                  </div>
                </div>
              </div>

              {/* Price Alerts */}
              <div className="pt-2 border-t border-white/5">
                <div className="text-sm text-gray-300 mb-2">Price Alerts</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center px-2 py-2 rounded-lg bg-white/5">
                    <div className="text-lg font-bold text-white">{data.alerts.total}</div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div className="text-center px-2 py-2 rounded-lg bg-white/5">
                    <div className="text-lg font-bold text-green-400">{data.alerts.active}</div>
                    <div className="text-xs text-gray-500">Active</div>
                  </div>
                  <div className="text-center px-2 py-2 rounded-lg bg-white/5">
                    <div className="text-lg font-bold text-gray-500">{data.alerts.inactive}</div>
                    <div className="text-xs text-gray-500">Inactive</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Recent Activity Feed">
            {data.activity.recent.length === 0 ? (
              <div className="text-gray-500 text-sm py-4">No activity yet.</div>
            ) : (
              <div className="space-y-3">
                {data.activity.recent.map((entry, i) => {
                  const typeColors: Record<string, string> = {
                    alert_created: '#3b82f6',
                    deal_found: '#22c55e',
                    trip_saved: '#eab308',
                    destination_revealed: '#a855f7',
                  }
                  const typeLabels: Record<string, string> = {
                    alert_created: 'Alert Created',
                    deal_found: 'Deal Found',
                    trip_saved: 'Trip Saved',
                    destination_revealed: 'Reveal',
                  }
                  const color = typeColors[entry.activity_type] || '#6b7280'
                  const label = typeLabels[entry.activity_type] || entry.activity_type

                  // Build a summary from entry.data
                  let summary = ''
                  const d = entry.data
                  if (entry.activity_type === 'destination_revealed' && d?.destination) {
                    summary = `${d.destination}${d.country ? ', ' + d.country : ''}`
                  } else if (entry.activity_type === 'deal_found' && d?.route) {
                    summary = `${d.route} - $${d.price}`
                  } else if (entry.activity_type === 'alert_created' && d?.route) {
                    summary = `${d.route}`
                  } else if (entry.activity_type === 'trip_saved' && d?.destination) {
                    summary = `${d.destination}${d.country ? ', ' + d.country : ''}`
                  }

                  return (
                    <div key={i} className="flex items-center gap-3 py-1">
                      <span
                        className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {label}
                      </span>
                      <span className="text-sm text-gray-300 truncate flex-1">
                        {summary || 'Activity logged'}
                      </span>
                      <span className="text-xs text-gray-600 shrink-0 whitespace-nowrap">
                        {formatTimeAgo(entry.created_at)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Row 5: Feature Popularity + Top Pages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Feature Popularity (7d)">
            {!data.featurePopularity || data.featurePopularity.length === 0 ? (
              <div className="text-gray-500 text-sm py-4">No data yet.</div>
            ) : (
              <div className="space-y-2">
                {data.featurePopularity.map((item, i) => {
                  const maxCount = data.featurePopularity![0]?.count || 1
                  const pct = Math.round((item.count / maxCount) * 100)
                  const eventColors: Record<string, string> = {
                    mystery_search: '#a855f7',
                    flight_search: '#3b82f6',
                    stopover_search: '#06b6d4',
                    page_view: '#6b7280',
                    destination_revealed: '#22c55e',
                    trip_saved: '#eab308',
                    share: '#ec4899',
                  }
                  const color = eventColors[item.event_type] || '#8b5cf6'
                  return (
                    <div key={item.event_type} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-5 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-200 truncate font-mono">{item.event_type}</span>
                          <span className="text-xs text-gray-400 ml-2 shrink-0">{item.count}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card title="Top Pages (24h)">
            {!data.topPages || data.topPages.length === 0 ? (
              <div className="text-gray-500 text-sm py-4">No data yet.</div>
            ) : (
              <div className="space-y-2">
                {data.topPages.map((item, i) => {
                  const maxCount = data.topPages![0]?.count || 1
                  const pct = Math.round((item.count / maxCount) * 100)
                  return (
                    <div key={item.page} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-5 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-200 truncate font-mono">{item.page}</span>
                          <span className="text-xs text-gray-400 ml-2 shrink-0">{item.count}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-cyan-500/70 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Row 6: User Search Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card title="Top Origins (7d)">
            {!data.topOrigins || data.topOrigins.length === 0 ? (
              <div className="text-gray-500 text-sm py-4">No data yet.</div>
            ) : (
              <div className="space-y-2">
                {data.topOrigins.map((item, i) => {
                  const maxCount = data.topOrigins![0]?.count || 1
                  const pct = Math.round((item.count / maxCount) * 100)
                  return (
                    <div key={item.origin} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-5 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-200 font-mono">{item.origin}</span>
                          <span className="text-xs text-gray-400 ml-2 shrink-0">{item.count}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-blue-500/70 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card title="Top Vibes (7d)">
            {!data.topVibes || data.topVibes.length === 0 ? (
              <div className="text-gray-500 text-sm py-4">No data yet.</div>
            ) : (
              <div className="space-y-2">
                {data.topVibes.map((item, i) => {
                  const maxCount = data.topVibes![0]?.count || 1
                  const pct = Math.round((item.count / maxCount) * 100)
                  return (
                    <div key={item.vibe} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-5 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-200">{item.vibe}</span>
                          <span className="text-xs text-gray-400 ml-2 shrink-0">{item.count}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-purple-500/70 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card title="Budget Distribution">
            {!data.budgetDistribution ? (
              <div className="text-gray-500 text-sm py-4">No data yet.</div>
            ) : (() => {
              const bd = data.budgetDistribution
              const total = bd.under_500 + bd.range_500_1000 + bd.range_1000_2000 + bd.over_2000
              if (total === 0) return <div className="text-gray-500 text-sm py-4">No data yet.</div>
              const segments = [
                { label: 'Under $500', value: bd.under_500, color: '#22c55e' },
                { label: '$500 - $1K', value: bd.range_500_1000, color: '#3b82f6' },
                { label: '$1K - $2K', value: bd.range_1000_2000, color: '#eab308' },
                { label: '$2K+', value: bd.over_2000, color: '#ef4444' },
              ]
              return (
                <div className="space-y-4">
                  {/* Segmented bar */}
                  <div className="w-full h-6 bg-white/5 rounded-full overflow-hidden flex">
                    {segments.map((seg) => {
                      const pct = total > 0 ? (seg.value / total) * 100 : 0
                      if (pct === 0) return null
                      return (
                        <div
                          key={seg.label}
                          className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                          style={{ width: `${pct}%`, backgroundColor: seg.color }}
                          title={`${seg.label}: ${seg.value} (${Math.round(pct)}%)`}
                        />
                      )
                    })}
                  </div>
                  {/* Legend */}
                  <div className="grid grid-cols-2 gap-2">
                    {segments.map((seg) => (
                      <div key={seg.label} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                        <span className="text-xs text-gray-400">{seg.label}</span>
                        <span className="text-xs text-white font-medium ml-auto">{seg.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-500 pt-1 border-t border-white/5">
                    {total} total searches
                  </div>
                </div>
              )
            })()}
          </Card>
        </div>

        {/* Row 7: Conversion Funnel */}
        {data.conversionFunnel && (
          <div className="grid grid-cols-1 gap-4">
            <Card title="Conversion Funnel (7d)">
              {(() => {
                const funnel = data.conversionFunnel!
                const steps = [
                  { label: 'Mystery Page Views', value: funnel.page_views, color: '#6b7280' },
                  { label: 'Searches', value: funnel.searches, color: '#3b82f6' },
                  { label: 'Reveals', value: funnel.reveals, color: '#22c55e' },
                ]
                const maxVal = Math.max(...steps.map(s => s.value), 1)
                return (
                  <div className="flex items-end gap-6 justify-center py-2">
                    {steps.map((step, i) => {
                      const heightPct = Math.max((step.value / maxVal) * 100, 8)
                      const convRate = i > 0 && steps[i - 1].value > 0
                        ? Math.round((step.value / steps[i - 1].value) * 100)
                        : null
                      return (
                        <div key={step.label} className="flex flex-col items-center gap-2 flex-1 max-w-[200px]">
                          {convRate !== null && (
                            <div className="text-xs text-gray-500">{convRate}% conv.</div>
                          )}
                          <div className="w-full flex justify-center">
                            <div
                              className="w-16 rounded-t-lg transition-all duration-500"
                              style={{
                                height: `${heightPct}px`,
                                minHeight: '8px',
                                maxHeight: '100px',
                                backgroundColor: step.color,
                              }}
                            />
                          </div>
                          <div className="text-lg font-bold text-white">{step.value}</div>
                          <div className="text-xs text-gray-400 text-center">{step.label}</div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </Card>
          </div>
        )}

        {/* Row 8: Feedback + Top Cached Destinations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="Feedback Summary">
            <div className="space-y-4">
              {/* Average rating */}
              {data.avgRating && data.avgRating.count > 0 ? (
                <div className="flex items-center gap-4 pb-3 border-b border-white/5">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className="text-lg"
                        style={{ color: star <= Math.round(data.avgRating!.avg) ? '#eab308' : '#374151' }}
                      >
                        &#9733;
                      </span>
                    ))}
                  </div>
                  <div>
                    <span className="text-xl font-bold text-white">{data.avgRating.avg}</span>
                    <span className="text-sm text-gray-500 ml-1">/ 5</span>
                  </div>
                  <div className="text-xs text-gray-500 ml-auto">{data.avgRating.count} ratings</div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm pb-3 border-b border-white/5">No ratings yet.</div>
              )}

              {/* Recent feedback entries */}
              {!data.feedbackSummary || data.feedbackSummary.length === 0 ? (
                <div className="text-gray-500 text-sm py-2">No feedback yet.</div>
              ) : (
                <div className="space-y-3">
                  {data.feedbackSummary.slice(0, 5).map((entry, i) => {
                    const typeBg = entry.type === 'bug'
                      ? 'rgba(239,68,68,0.15)'
                      : 'rgba(59,130,246,0.15)'
                    const typeColor = entry.type === 'bug' ? '#f87171' : '#60a5fa'
                    return (
                      <div key={i} className="flex items-start gap-3 py-1">
                        <span
                          className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-0.5"
                          style={{ backgroundColor: typeBg, color: typeColor }}
                        >
                          {entry.type}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-300 line-clamp-2">{entry.message}</div>
                          <div className="flex items-center gap-3 mt-1">
                            {entry.rating && (
                              <span className="text-xs text-yellow-500">
                                {Array.from({ length: entry.rating }, () => '\u2605').join('')}
                              </span>
                            )}
                            {entry.page_url && (
                              <span className="text-xs text-gray-600 truncate max-w-[150px]">{entry.page_url}</span>
                            )}
                            <span className="text-xs text-gray-600 shrink-0">
                              {formatTimeAgo(entry.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </Card>

          <Card title="Top Cached Destinations">
            {!data.topCachedDestinations || data.topCachedDestinations.length === 0 ? (
              <div className="text-gray-500 text-sm py-4">No data yet.</div>
            ) : (
              <div className="space-y-2">
                {data.topCachedDestinations.map((dest, i) => {
                  const maxCount = data.topCachedDestinations![0]?.reveal_count || 1
                  const pct = Math.round((dest.reveal_count / maxCount) * 100)
                  return (
                    <div key={dest.iata} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-5 text-right">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-200">
                            <span className="font-mono text-sky-400 mr-1.5">{dest.iata}</span>
                            {dest.city}, {dest.country}
                          </span>
                          <span className="text-xs text-gray-400 ml-2 shrink-0">{dest.reveal_count} reveals</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-500/70 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 pb-8 pt-4">
          Server time: {data.system.timestamp ? new Date(data.system.timestamp).toLocaleString() : 'N/A'}
          {' / '}Saved trips: {data.trips.total}
        </div>
      </main>
    </div>
  )
}
