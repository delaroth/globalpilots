'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  getPassport,
  removeStamp,
  markAsBooked,
  BADGE_DEFINITIONS,
  type TravelPassport as TravelPassportType,
  type PassportStamp,
  type PassportBadge,
} from '@/lib/travel-passport'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TravelPassportProps {
  isOpen: boolean
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function adventureScoreColor(score: number): string {
  if (score >= 7) return 'bg-emerald-500'
  if (score >= 4) return 'bg-amber-500'
  return 'bg-red-500'
}

function adventureScoreLabel(score: number): string {
  if (score >= 8) return 'Legendary'
  if (score >= 7) return 'Expert'
  if (score >= 5) return 'Adventurer'
  if (score >= 3) return 'Explorer'
  return 'Beginner'
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Stats bar: 4 horizontal pills */
function StatsBar({ stats }: { stats: TravelPassportType['stats'] }) {
  const pills = [
    { icon: '\u{2728}', value: stats.totalReveals, label: 'Reveals' },
    { icon: '\u{2708}\u{FE0F}', value: stats.totalBooked, label: 'Booked' },
    { icon: '\u{1F30D}', value: stats.countriesVisited, label: 'Countries' },
    { icon: '\u{1F3AF}', value: stats.adventureScore, label: 'Score' },
  ]

  return (
    <div className="grid grid-cols-4 gap-2">
      {pills.map((pill) => (
        <div
          key={pill.label}
          className="flex flex-col items-center bg-white/[0.04] border border-white/[0.06] rounded-xl px-2 py-3"
        >
          <span className="text-lg">{pill.icon}</span>
          <span className="text-xl font-bold text-white mt-1">{pill.value}</span>
          <span className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
            {pill.label}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Adventure score progress bar */
function AdventureScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-white/50 font-medium">Adventure Score</span>
          <span className="text-xs font-bold text-white/70">
            {score}/10 &middot; {adventureScoreLabel(score)}
          </span>
        </div>
        <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${adventureScoreColor(score)}`}
            initial={{ width: 0 }}
            animate={{ width: `${(score / 10) * 100}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  )
}

/** Badges section */
function BadgesSection({ earned }: { earned: PassportBadge[] }) {
  const earnedIds = new Set(earned.map((b) => b.id))

  return (
    <div>
      <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
        Badges
      </h3>
      <div className="flex flex-wrap gap-2">
        {BADGE_DEFINITIONS.map((def) => {
          const isEarned = earnedIds.has(def.id)
          const badge = earned.find((b) => b.id === def.id)

          return (
            <motion.div
              key={def.id}
              className="group relative"
              initial={false}
              animate={isEarned ? { scale: [0.8, 1.15, 1] } : {}}
              transition={{ duration: 0.4 }}
            >
              <div
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
                  transition-all cursor-default
                  ${
                    isEarned
                      ? 'bg-white/[0.08] border border-white/15 text-white'
                      : 'bg-white/[0.02] border border-white/[0.06] text-white/25'
                  }
                `}
              >
                <span className={isEarned ? '' : 'grayscale opacity-30'}>
                  {isEarned ? def.emoji : '?'}
                </span>
                <span className={isEarned ? '' : 'text-white/20'}>{def.name}</span>
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy-dark border border-white/10 rounded-lg text-xs text-white/70 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                {isEarned ? (
                  <>
                    <span className="text-white font-medium">{def.emoji} {def.name}</span>
                    <br />
                    {def.description}
                    {badge && (
                      <>
                        <br />
                        <span className="text-white/40">Earned {formatTimestamp(badge.earnedAt)}</span>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <span className="text-white/50">Locked</span>
                    <br />
                    {def.description}
                  </>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

/** Individual stamp card */
function StampCard({
  stamp,
  onRemove,
  onMarkBooked,
}: {
  stamp: PassportStamp
  onRemove: (id: string) => void
  onMarkBooked: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`
        bg-white/[0.04] border rounded-xl p-4 cursor-pointer
        transition-colors hover:bg-white/[0.06]
        ${stamp.isBooked ? 'border-emerald-500/30 shadow-[0_0_15px_-3px_rgba(16,185,129,0.15)]' : 'border-white/10'}
      `}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Flag background */}
      <div className="relative">
        <span className="absolute -top-1 -right-1 text-4xl opacity-[0.08] select-none pointer-events-none">
          {stamp.flag}
        </span>

        {/* Header */}
        <div className="flex items-start justify-between relative">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{stamp.flag}</span>
              <h4 className="text-sm font-bold text-white truncate">
                {stamp.destination}
              </h4>
            </div>
            <p className="text-xs text-white/40 mt-0.5">{stamp.country}</p>
          </div>
        </div>

        {/* Cost & date */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-lg font-bold text-emerald-400">${stamp.totalCost}</span>
          <span className="text-[10px] text-white/30">{formatDate(stamp.departDate)}</span>
        </div>

        {/* Status badge */}
        <div className="mt-2">
          {stamp.isBooked ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
              {'\u{2708}\u{FE0F}'} Booked
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-skyblue bg-skyblue/10 border border-skyblue/20 rounded-full px-2 py-0.5">
              Revealed
            </span>
          )}
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-white/[0.06] space-y-2">
              {/* IATA code */}
              <p className="text-xs text-white/40">
                Airport: <span className="text-white/60 font-mono">{stamp.iata}</span>
              </p>

              {/* Booking clicks */}
              {stamp.bookingClicks.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 mb-1">Booking clicks:</p>
                  {stamp.bookingClicks.map((click, idx) => (
                    <div
                      key={idx}
                      className="text-[10px] text-white/30 flex justify-between"
                    >
                      <span>
                        {click.type} via {click.provider}
                      </span>
                      <span>{formatTimestamp(click.timestamp)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {!stamp.isBooked && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarkBooked(stamp.id)
                    }}
                    className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-md px-2 py-1 transition"
                  >
                    Mark Booked
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(stamp.id)
                  }}
                  className="text-[10px] font-medium text-red-400/60 hover:text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-md px-2 py-1 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TravelPassport({ isOpen, onClose }: TravelPassportProps) {
  const [passport, setPassport] = useState<TravelPassportType | null>(null)
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle')

  // Load passport data when opened
  useEffect(() => {
    if (isOpen) {
      setPassport(getPassport())
    }
  }, [isOpen])

  // Refresh passport data
  const refresh = useCallback(() => {
    setPassport(getPassport())
  }, [])

  const handleRemove = useCallback(
    (stampId: string) => {
      removeStamp(stampId)
      refresh()
      // Notify other components
      window.dispatchEvent(new CustomEvent('passport-updated'))
    },
    [refresh],
  )

  const handleMarkBooked = useCallback(
    (stampId: string) => {
      markAsBooked(stampId)
      refresh()
      window.dispatchEvent(new CustomEvent('passport-updated'))
    },
    [refresh],
  )

  // Generate shareable text summary
  const shareText = useMemo(() => {
    if (!passport || passport.stamps.length === 0) return ''

    const lines = [
      `My Mystery Travel Passport`,
      ``,
      `${passport.stats.totalReveals} destinations revealed | ${passport.stats.totalBooked} booked | ${passport.stats.countriesVisited} countries`,
      `Adventure Score: ${passport.stats.adventureScore}/10`,
      ``,
    ]

    passport.stamps.slice(0, 10).forEach((s) => {
      lines.push(`${s.flag} ${s.destination}, ${s.country} — $${s.totalCost}${s.isBooked ? ' (Booked!)' : ''}`)
    })

    if (passport.stamps.length > 10) {
      lines.push(`...and ${passport.stamps.length - 10} more destinations`)
    }

    lines.push('')
    lines.push('Plan your mystery trip at globepilots.com/mystery')

    return lines.join('\n')
  }, [passport])

  const handleShare = useCallback(async () => {
    if (!shareText) return

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: 'My Mystery Travel Passport',
          text: shareText,
          url: 'https://globepilots.com/mystery',
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        setShareStatus('copied')
        setTimeout(() => setShareStatus('idle'), 2500)
      }
    } catch {
      // User cancelled or clipboard failed — try clipboard as fallback
      try {
        await navigator.clipboard.writeText(shareText)
        setShareStatus('copied')
        setTimeout(() => setShareStatus('idle'), 2500)
      } catch {
        // silently fail
      }
    }
  }, [shareText])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && passport && (
        <motion.div
          key="passport-overlay"
          className="fixed inset-0 z-50 flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-navy-dark/[0.98] backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            className="relative flex-1 overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="max-w-2xl mx-auto px-4 py-8 pb-24">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>{'\u{1F30D}'}</span>
                    <span>My Mystery Passport</span>
                  </h2>
                  {passport.stats.favoriteRegion !== 'None yet' && (
                    <p className="text-sm text-white/40 mt-1">
                      Favorite region: {passport.stats.favoriteRegion}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-white/40 hover:text-white/80 transition p-2 -mr-2"
                  aria-label="Close passport"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Empty state */}
              {passport.stamps.length === 0 ? (
                <div className="text-center py-16">
                  <span className="text-6xl block mb-4">{'\u{1F5FA}\u{FE0F}'}</span>
                  <h3 className="text-xl font-bold text-white mb-2">
                    No stamps yet
                  </h3>
                  <p className="text-white/50 text-sm max-w-xs mx-auto">
                    Reveal mystery destinations to start filling your passport with stamps.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Stats bar */}
                  <StatsBar stats={passport.stats} />

                  {/* Adventure score bar */}
                  <AdventureScoreBar score={passport.stats.adventureScore} />

                  {/* Badges */}
                  <BadgesSection earned={passport.badges} />

                  {/* Stamps grid */}
                  <div>
                    <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-3">
                      Destinations ({passport.stamps.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <AnimatePresence mode="popLayout">
                        {passport.stamps.map((stamp) => (
                          <StampCard
                            key={stamp.id}
                            stamp={stamp}
                            onRemove={handleRemove}
                            onMarkBooked={handleMarkBooked}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Total spent */}
                  {passport.stats.totalSpent > 0 && (
                    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                      <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                        Total Trip Value
                      </p>
                      <p className="text-3xl font-bold text-emerald-400">
                        ${passport.stats.totalSpent.toLocaleString()}
                      </p>
                      <p className="text-xs text-white/30 mt-1">
                        across {passport.stats.totalReveals} destination{passport.stats.totalReveals !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleShare}
                      className="flex-1 bg-white/[0.06] hover:bg-white/[0.10] border border-white/10 text-white/80 hover:text-white font-medium rounded-xl py-3 px-4 text-sm transition flex items-center justify-center gap-2"
                    >
                      {shareStatus === 'copied' ? (
                        <>
                          <span>{'\u{2705}'}</span>
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                            <polyline points="16 6 12 2 8 6" />
                            <line x1="12" y1="2" x2="12" y2="15" />
                          </svg>
                          <span>Share Passport</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
