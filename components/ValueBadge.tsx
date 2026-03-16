'use client'

interface ValueBadgeProps {
  score: number   // 1-10
  label: string   // "Incredible Value", etc.
}

/**
 * Compact colored badge showing value score.
 * Green (7+), amber (4-6), red (1-3).
 */
export default function ValueBadge({ score, label }: ValueBadgeProps) {
  let bgClass: string
  let textClass: string
  let borderClass: string

  if (score >= 7) {
    bgClass = 'bg-emerald-500/20'
    textClass = 'text-emerald-400'
    borderClass = 'border-emerald-500/30'
  } else if (score >= 4) {
    bgClass = 'bg-amber-500/20'
    textClass = 'text-amber-400'
    borderClass = 'border-amber-500/30'
  } else {
    bgClass = 'bg-red-500/20'
    textClass = 'text-red-400'
    borderClass = 'border-red-500/30'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium border ${bgClass} ${textClass} ${borderClass}`}
      title={`Value Score: ${score}/10`}
    >
      <span className="font-bold">{score}</span>
      <span className="hidden sm:inline">{label}</span>
    </span>
  )
}
