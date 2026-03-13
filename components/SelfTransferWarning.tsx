'use client'

interface SelfTransferWarningProps {
  hub: string                    // Hub airport code, e.g., "IST"
  hubCity: string                // Human name, e.g., "Istanbul"
  connectionMinutes?: number     // -1 or undefined = unknown
  warnings: string[]             // Array of warning strings from StitchedItinerary
  isRisky: boolean               // If true, show in red instead of amber
  compact?: boolean              // Compact mode for use inside cards
}

function formatConnectionTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function WarningIcon({ isRisky, className }: { isRisky: boolean; className?: string }) {
  if (isRisky) {
    // Exclamation triangle for risky transfers
    return (
      <svg
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.499-2.599 4.499H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.004zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
          clipRule="evenodd"
        />
      </svg>
    )
  }

  // Standard warning triangle for normal self-transfers
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export default function SelfTransferWarning({
  hub,
  hubCity,
  connectionMinutes,
  warnings,
  isRisky,
  compact = false,
}: SelfTransferWarningProps) {
  const hasConnectionTime =
    connectionMinutes !== undefined && connectionMinutes !== -1 && connectionMinutes > 0
  const connectionText = hasConnectionTime
    ? formatConnectionTime(connectionMinutes!)
    : null

  // ---- Compact mode: single-line inline warning ----
  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 text-xs font-medium ${
          isRisky ? 'text-red-600' : 'text-amber-600'
        }`}
      >
        <WarningIcon isRisky={isRisky} className="w-3.5 h-3.5 shrink-0" />
        <span>
          Self-transfer at {hub}
          {connectionText ? ` (${connectionText})` : ''}
        </span>
      </div>
    )
  }

  // ---- Full mode: banner with details ----
  const bgColor = isRisky
    ? 'bg-red-50 border-red-300'
    : 'bg-amber-50 border-amber-300'
  const headingColor = isRisky ? 'text-red-700' : 'text-amber-700'
  const textColor = isRisky ? 'text-red-600' : 'text-amber-600'
  const iconColor = isRisky ? 'text-red-500' : 'text-amber-500'

  return (
    <div className={`rounded-xl border p-4 ${bgColor}`}>
      {/* Header row */}
      <div className="flex items-start gap-3">
        <WarningIcon isRisky={isRisky} className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold ${headingColor}`}>
            Self-Transfer at {hubCity} ({hub})
          </h4>

          {/* Connection time */}
          {connectionText && (
            <p className={`text-sm mt-1 ${textColor}`}>
              {connectionText} connection at {hubCity}
            </p>
          )}

          {/* Warning bullet list */}
          {warnings.length > 0 && (
            <ul className={`mt-2 space-y-1 text-sm ${textColor}`}>
              {warnings.map((w, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-current" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}

          {/* Bottom disclaimer */}
          <p className={`mt-3 text-xs font-medium ${headingColor}`}>
            These are separate tickets. If one flight is delayed, the other airline won&apos;t rebook you.
          </p>
        </div>
      </div>
    </div>
  )
}

export type { SelfTransferWarningProps }
