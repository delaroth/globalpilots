'use client'

import { useMemo } from 'react'
import { motion } from 'motion/react'
import type { SavedTrip } from '@/lib/trip-history'

interface CompareRevealsProps {
  trips: SavedTrip[] // 2-3 trips
  onClose: () => void
  onBook: (trip: SavedTrip) => void
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

type BadgeColor = 'emerald' | 'amber' | 'sky' | 'purple'

function Badge({
  label,
  color = 'emerald',
}: {
  label: string
  color?: BadgeColor
}) {
  const colorMap: Record<BadgeColor, string> = {
    emerald: 'bg-emerald-500/20 text-emerald-400',
    amber: 'bg-amber-500/20 text-amber-300',
    sky: 'bg-sky-500/20 text-sky-400',
    purple: 'bg-purple-500/20 text-purple-400',
  }
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${colorMap[color]}`}
    >
      {label}
    </span>
  )
}

function formatDepartDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CompareReveals({
  trips,
  onClose,
  onBook,
}: CompareRevealsProps) {
  // Compute comparison highlights
  const highlights = useMemo(() => {
    if (trips.length < 2) return {}

    const cheapestId = trips.reduce((min, t) =>
      t.totalCost < min.totalCost ? t : min
    ).id

    const cheapestFlightId = trips.reduce((min, t) =>
      t.flightPrice < min.flightPrice ? t : min
    ).id

    // Warmest (by climate temp)
    const tripsWithTemp = trips.filter((t) => t.enrichment?.climate?.avgTempC != null)
    const warmestId =
      tripsWithTemp.length > 0
        ? tripsWithTemp.reduce((max, t) =>
            (t.enrichment?.climate?.avgTempC ?? 0) >
            (max.enrichment?.climate?.avgTempC ?? 0)
              ? t
              : max
          ).id
        : null

    // Visa-free
    const visaFreeIds = trips
      .filter(
        (t) =>
          t.enrichment?.visa?.status === 'visa-free' ||
          t.enrichment?.visa?.status === 'visa-on-arrival'
      )
      .map((t) => t.id)

    // Safest
    const tripsWithSafety = trips.filter(
      (t) => t.enrichment?.safety?.level != null
    )
    const safestId =
      tripsWithSafety.length > 0
        ? tripsWithSafety.reduce((best, t) =>
            (t.enrichment?.safety?.level ?? 4) <
            (best.enrichment?.safety?.level ?? 4)
              ? t
              : best
          ).id
        : null

    return { cheapestId, cheapestFlightId, warmestId, visaFreeIds, safestId }
  }, [trips])

  const colWidth =
    trips.length === 2 ? 'w-full sm:w-1/2' : 'w-full sm:w-1/3'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="relative z-10 w-full max-w-5xl mx-4 my-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Compare Your Reveals
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white transition"
            aria-label="Close comparison"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Columns */}
        <div className="flex flex-col sm:flex-row gap-4">
          {trips.map((trip, index) => (
            <motion.div
              key={trip.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`${colWidth} bg-white/[0.04] border border-white/10 rounded-xl p-5 flex flex-col`}
            >
              {/* City header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  {trip.enrichment?.flag && (
                    <span className="text-2xl">{trip.enrichment.flag}</span>
                  )}
                  <h3 className="text-xl font-bold text-white truncate">
                    {trip.destination}
                  </h3>
                </div>
                <p className="text-white/50 text-sm">{trip.country}</p>

                {/* Highlight badges */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {highlights.cheapestId === trip.id && (
                    <Badge label="Best Value" color="emerald" />
                  )}
                  {highlights.cheapestFlightId === trip.id &&
                    highlights.cheapestId !== trip.id && (
                      <Badge label="Cheapest Flight" color="sky" />
                    )}
                  {highlights.warmestId === trip.id && (
                    <Badge label="Warmest" color="amber" />
                  )}
                  {highlights.visaFreeIds?.includes(trip.id) && (
                    <Badge label="Easy Visa" color="purple" />
                  )}
                  {highlights.safestId === trip.id && (
                    <Badge label="Safest" color="emerald" />
                  )}
                </div>
              </div>

              {/* Details grid */}
              <div className="space-y-3 flex-1">
                {/* Flight price */}
                <CompareRow label="Flight">
                  <span className="text-emerald-400 font-bold">
                    ${trip.flightPrice.toLocaleString()}
                  </span>
                </CompareRow>

                {/* Total cost */}
                <CompareRow label="Total Cost">
                  <span
                    className={`font-bold text-lg ${
                      highlights.cheapestId === trip.id
                        ? 'text-emerald-400'
                        : 'text-white'
                    }`}
                  >
                    ${trip.totalCost.toLocaleString()}
                  </span>
                </CompareRow>

                {/* Trip duration */}
                <CompareRow label="Duration">
                  <span className="text-white">
                    {trip.tripDuration} day{trip.tripDuration !== 1 ? 's' : ''}
                  </span>
                </CompareRow>

                {/* Departure date */}
                <CompareRow label="Depart">
                  <span className="text-white/70">
                    {formatDepartDate(trip.departDate)}
                  </span>
                </CompareRow>

                {/* Climate */}
                {trip.enrichment?.climate && (
                  <CompareRow label="Climate">
                    <div>
                      <span
                        className={`font-semibold ${
                          highlights.warmestId === trip.id
                            ? 'text-amber-300'
                            : 'text-white'
                        }`}
                      >
                        {trip.enrichment.climate.avgTempC}&deg;C
                      </span>
                      <p className="text-white/50 text-xs mt-0.5">
                        {trip.enrichment.climate.description}
                      </p>
                    </div>
                  </CompareRow>
                )}

                {/* Visa */}
                {trip.enrichment?.visa && (
                  <CompareRow label="Visa">
                    <div>
                      <span
                        className={`font-semibold text-sm ${
                          trip.enrichment.visa.status === 'visa-free' ||
                          trip.enrichment.visa.status === 'visa-on-arrival'
                            ? 'text-emerald-400'
                            : 'text-amber-300'
                        }`}
                      >
                        {trip.enrichment.visa.status.replace(/-/g, ' ')}
                      </span>
                      {trip.enrichment.visa.maxStay && (
                        <p className="text-white/40 text-xs">
                          Up to {trip.enrichment.visa.maxStay} days
                        </p>
                      )}
                    </div>
                  </CompareRow>
                )}

                {/* Exchange rate */}
                {trip.enrichment?.exchangeRate && (
                  <CompareRow label="Exchange">
                    <span className="text-white/70 text-sm">
                      {trip.enrichment.exchangeRate.formatted}
                    </span>
                  </CompareRow>
                )}

                {/* Safety */}
                {trip.enrichment?.safety && (
                  <CompareRow label="Safety">
                    <span
                      className={`font-semibold text-sm ${
                        trip.enrichment.safety.level <= 2
                          ? 'text-emerald-400'
                          : 'text-amber-300'
                      }`}
                    >
                      {trip.enrichment.safety.label}
                    </span>
                  </CompareRow>
                )}
              </div>

              {/* CTA */}
              <button
                onClick={() => onBook(trip)}
                className="mt-4 w-full py-2.5 rounded-lg font-semibold text-sm
                  bg-emerald-500/20 text-emerald-400 border border-emerald-500/30
                  hover:bg-emerald-500/30 transition-all"
              >
                Choose This
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: single comparison row
// ---------------------------------------------------------------------------

function CompareRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-white/40 text-xs uppercase tracking-wide flex-shrink-0 pt-0.5">
        {label}
      </span>
      <div className="text-right">{children}</div>
    </div>
  )
}
