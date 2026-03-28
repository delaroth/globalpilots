'use client'

/**
 * Small badge that shows whether a displayed price is live, estimated, or cached.
 * Zero API cost — purely uses flags already in the data.
 *
 * Usage:
 *   <PriceBadge isLive={true} />           → green "Live"
 *   <PriceBadge isEstimate={true} />       → amber "Estimate"
 *   <PriceBadge />                         → blue "Cached"
 *   <PriceBadge isLive={true} compact />   → small dot only
 */

export default function PriceBadge({
  isLive,
  isEstimate,
  compact,
  className = '',
}: {
  isLive?: boolean
  isEstimate?: boolean
  compact?: boolean
  className?: string
}) {
  if (isLive) {
    return compact ? (
      <span className={`inline-block w-2 h-2 rounded-full bg-emerald-400 ${className}`} title="Live price from Google Flights" />
    ) : (
      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        Live
      </span>
    )
  }

  if (isEstimate) {
    return compact ? (
      <span className={`inline-block w-2 h-2 rounded-full bg-amber-400 ${className}`} title="Estimated price — verify on booking site" />
    ) : (
      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 ${className}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Estimate
      </span>
    )
  }

  // Default: cached/unknown
  return compact ? (
    <span className={`inline-block w-2 h-2 rounded-full bg-sky-400 ${className}`} title="Cached price" />
  ) : (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
      Cached
    </span>
  )
}

/**
 * Light-theme version for white-background pages (search, deals).
 */
export function PriceBadgeLight({
  isLive,
  isEstimate,
}: {
  isLive?: boolean
  isEstimate?: boolean
}) {
  if (isLive) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Live
      </span>
    )
  }

  if (isEstimate) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Estimate
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700">
      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
      Cached
    </span>
  )
}
