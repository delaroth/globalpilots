'use client'

interface ConfidenceBadgeProps {
  score: number         // 0.0 to 1.0
  label: string         // "Verified Price", "Recent Estimate", "Estimated", "Guide Price"
  badgeColor: 'green' | 'blue' | 'amber' | 'gray'
  showScore?: boolean   // If true, show the numeric score (e.g., "0.92") — for debug only
  size?: 'sm' | 'md'   // default 'sm'
}

const colorStyles = {
  green: {
    badge: 'bg-green-100 text-green-700 border border-green-300',
    dotFill: 'bg-green-500',
  },
  blue: {
    badge: 'bg-blue-100 text-blue-700 border border-blue-300',
    dotFill: 'bg-blue-300',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-700 border border-amber-300',
    dotFill: 'bg-amber-300',
  },
  gray: {
    badge: 'bg-gray-100 text-gray-600 border border-gray-300',
    dotFill: 'bg-gray-300',
  },
} as const

const sizeStyles = {
  sm: {
    badge: 'text-xs px-2 py-0.5',
    dot: 'w-1.5 h-1.5',
  },
  md: {
    badge: 'text-sm px-3 py-1',
    dot: 'w-2 h-2',
  },
} as const

export default function ConfidenceBadge({
  score,
  label,
  badgeColor,
  showScore = false,
  size = 'sm',
}: ConfidenceBadgeProps) {
  const colors = colorStyles[badgeColor]
  const sizes = sizeStyles[size]
  const isFilled = badgeColor === 'green'

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${colors.badge} ${sizes.badge}`}
    >
      <span
        className={`inline-block rounded-full shrink-0 ${sizes.dot} ${
          isFilled ? colors.dotFill : 'border border-current bg-transparent'
        }`}
        aria-hidden="true"
      />
      <span>{label}</span>
      {showScore && (
        <span className="opacity-60 font-mono">{score.toFixed(2)}</span>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// PriceWithConfidence — composite display of price + badge + optional action
// ---------------------------------------------------------------------------

interface PriceWithConfidenceProps {
  price: number
  pricePrefix: string       // "$", "~$", "From ~$"
  confidence: ConfidenceBadgeProps
  actionLabel: string       // "Book Now", "Check on Aviasales", etc.
  onAction?: () => void     // Click handler for the action button
  showAction?: boolean      // Whether to show the action button
}

export function PriceWithConfidence({
  price,
  pricePrefix,
  confidence,
  actionLabel,
  onAction,
  showAction = false,
}: PriceWithConfidenceProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-2xl font-bold text-navy">
        {pricePrefix}{Math.round(price)}
      </span>

      <ConfidenceBadge {...confidence} />

      {showAction && (
        <button
          onClick={onAction}
          className="ml-auto bg-skyblue hover:bg-skyblue-dark text-white font-semibold text-sm py-1.5 px-4 rounded-lg transition shadow-md hover:shadow-lg"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export type { ConfidenceBadgeProps, PriceWithConfidenceProps }
