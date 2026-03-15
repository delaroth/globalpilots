'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'motion/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LeaderboardEntry {
  rank: number
  destination: string
  country: string
  totalCost: number
  discoveredAt: string
  travelerName: string
  badges: string[]
}

type Period = 'week' | 'month' | 'all'

const PERIOD_LABELS: Record<Period, string> = {
  week: 'This Week',
  month: 'This Month',
  all: 'All Time',
}

// Country to flag mapping for common destinations
const COUNTRY_FLAGS: Record<string, string> = {
  Vietnam: '\u{1F1FB}\u{1F1F3}',
  Georgia: '\u{1F1EC}\u{1F1EA}',
  Colombia: '\u{1F1E8}\u{1F1F4}',
  Thailand: '\u{1F1F9}\u{1F1ED}',
  Portugal: '\u{1F1F5}\u{1F1F9}',
  Hungary: '\u{1F1ED}\u{1F1FA}',
  Morocco: '\u{1F1F2}\u{1F1E6}',
  Indonesia: '\u{1F1EE}\u{1F1E9}',
  Mexico: '\u{1F1F2}\u{1F1FD}',
  'Czech Republic': '\u{1F1E8}\u{1F1FF}',
  Turkey: '\u{1F1F9}\u{1F1F7}',
  Greece: '\u{1F1EC}\u{1F1F7}',
  Malaysia: '\u{1F1F2}\u{1F1FE}',
  Argentina: '\u{1F1E6}\u{1F1F7}',
  Japan: '\u{1F1EF}\u{1F1F5}',
  'South Africa': '\u{1F1FF}\u{1F1E6}',
  Iceland: '\u{1F1EE}\u{1F1F8}',
  Australia: '\u{1F1E6}\u{1F1FA}',
  Spain: '\u{1F1EA}\u{1F1F8}',
  Peru: '\u{1F1F5}\u{1F1EA}',
  India: '\u{1F1EE}\u{1F1F3}',
  Croatia: '\u{1F1ED}\u{1F1F7}',
  Italy: '\u{1F1EE}\u{1F1F9}',
  France: '\u{1F1EB}\u{1F1F7}',
  Germany: '\u{1F1E9}\u{1F1EA}',
  Brazil: '\u{1F1E7}\u{1F1F7}',
  Tanzania: '\u{1F1F9}\u{1F1FF}',
  'New Zealand': '\u{1F1F3}\u{1F1FF}',
  Egypt: '\u{1F1EA}\u{1F1EC}',
  Cambodia: '\u{1F1F0}\u{1F1ED}',
  Philippines: '\u{1F1F5}\u{1F1ED}',
  Nepal: '\u{1F1F3}\u{1F1F5}',
  Singapore: '\u{1F1F8}\u{1F1EC}',
  'Sri Lanka': '\u{1F1F1}\u{1F1F0}',
  Romania: '\u{1F1F7}\u{1F1F4}',
  Poland: '\u{1F1F5}\u{1F1F1}',
  Ecuador: '\u{1F1EA}\u{1F1E8}',
  Chile: '\u{1F1E8}\u{1F1F1}',
  Kenya: '\u{1F1F0}\u{1F1EA}',
}

function getFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '\u{1F30D}'
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">{'\u{1F947}'}</span>
  if (rank === 2) return <span className="text-2xl">{'\u{1F948}'}</span>
  if (rank === 3) return <span className="text-2xl">{'\u{1F949}'}</span>
  return (
    <span className="text-lg font-bold text-white/40 w-8 text-center">
      {rank}
    </span>
  )
}

function EntryBadges({ badges }: { badges: string[] }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {badges.includes('cheapest') && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full px-2 py-0.5">
          {'\u{1F4B0}'} Cheapest
        </span>
      )}
      {badges.includes('adventurous') && (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full px-2 py-0.5">
          {'\u{1F9ED}'} Adventurous
        </span>
      )}
    </div>
  )
}

function StatsHeader({
  entries,
  period,
}: {
  entries: LeaderboardEntry[]
  period: Period
}) {
  if (entries.length === 0) return null

  const totalTrips = entries.length
  const avgCost =
    entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.totalCost, 0) / entries.length)
      : 0

  // Most popular destination
  const destCounts = new Map<string, number>()
  for (const e of entries) {
    destCounts.set(e.destination, (destCounts.get(e.destination) || 0) + 1)
  }
  const mostPopular =
    Array.from(destCounts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    'N/A'

  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[
        { label: `Trips ${PERIOD_LABELS[period]}`, value: totalTrips.toString(), color: 'text-skyblue' },
        { label: 'Avg Cost', value: `$${avgCost}`, color: 'text-emerald-400' },
        { label: 'Most Popular', value: mostPopular, color: 'text-purple-300' },
      ].map((stat) => (
        <div
          key={stat.label}
          className="bg-white/[0.04] backdrop-blur-lg border border-white/10 rounded-xl p-4 text-center"
        >
          <p className="text-xs uppercase tracking-widest text-white/30 mb-1">
            {stat.label}
          </p>
          <p className={`text-xl md:text-2xl font-bold ${stat.color} truncate`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('week')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [isFallback, setIsFallback] = useState(false)

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leaderboard?period=${p}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setEntries(json.entries || [])
      setIsFallback(json.isFallback || false)
    } catch {
      setEntries([])
      setIsFallback(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData(period)
  }, [period, fetchData])

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />

      <section className="flex-1 px-6 py-16">
        <div className="max-w-3xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3">
              Mystery Trip{' '}
              <span className="text-skyblue">Leaderboard</span>
            </h1>
            <p className="text-skyblue-light max-w-xl mx-auto">
              Real trip discoveries ranked by cost. Can you find a cheaper deal?
            </p>
          </div>

          {/* Period tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  period === p
                    ? 'bg-skyblue text-navy'
                    : 'bg-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.1]'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>

          {/* Stats header */}
          {!loading && entries.length > 0 && (
            <StatsHeader entries={entries} period={period} />
          )}

          {/* Fallback notice */}
          {isFallback && !loading && (
            <div className="text-center mb-6">
              <p className="text-xs text-white/30 bg-white/[0.03] inline-block px-3 py-1 rounded-full">
                Showing sample data — real rankings populate as travelers discover trips
              </p>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white/[0.04] rounded-xl p-4 animate-pulse h-20"
                />
              ))}
            </div>
          )}

          {/* Leaderboard entries */}
          {!loading && entries.length > 0 && (
            <AnimatePresence mode="wait">
              <motion.div
                key={period}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="space-y-3"
              >
                {entries.map((entry, i) => (
                  <motion.div
                    key={`${entry.destination}-${entry.rank}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                    className={`bg-white/[0.04] backdrop-blur-lg border rounded-xl p-4 flex items-center gap-4 ${
                      entry.rank <= 3
                        ? 'border-skyblue/20'
                        : 'border-white/10'
                    }`}
                  >
                    {/* Rank */}
                    <div className="shrink-0 w-10 flex justify-center">
                      <RankBadge rank={entry.rank} />
                    </div>

                    {/* Destination info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-lg">{getFlag(entry.country)}</span>
                        <span className="font-semibold text-white truncate">
                          {entry.destination}
                        </span>
                        <span className="text-white/30 text-sm hidden sm:inline">
                          {entry.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-white/30">
                          {entry.travelerName}
                        </span>
                        <span className="text-xs text-white/20">
                          {entry.discoveredAt}
                        </span>
                        <EntryBadges badges={entry.badges} />
                      </div>
                    </div>

                    {/* Cost */}
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-bold text-emerald-400">
                        ${entry.totalCost}
                      </p>
                      <p className="text-[10px] uppercase text-white/20">
                        total
                      </p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {/* Empty state */}
          {!loading && entries.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">{'\u{1F30D}'}</p>
              <p className="text-white/50">
                No trips discovered yet for this period. Be the first!
              </p>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="text-center mt-12 bg-gradient-to-br from-skyblue/10 to-purple-500/10 border border-skyblue/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Can you find a cheaper trip?
            </h2>
            <p className="text-skyblue-light mb-6 max-w-md mx-auto">
              Try Mystery Vacation and see if you can beat the leaderboard. Set
              your budget and let AI surprise you.
            </p>
            <Link
              href="/mystery"
              className="inline-block px-8 py-3 bg-skyblue text-navy font-bold rounded-xl hover:bg-skyblue-light transition-colors"
            >
              Try Mystery Vacation
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
