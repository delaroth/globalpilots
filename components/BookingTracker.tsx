// DISABLED: Re-enable when affiliate links are activated
// Tracking logic (Supabase writes, localStorage updates, activity feed posts)
// has been removed. The component now acts as a simple pass-through link wrapper.

'use client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingTrackerProps {
  stampId: string
  type: 'flight' | 'hotel' | 'activity'
  provider: string
  href: string
  children: React.ReactNode
  className?: string
}

// ---------------------------------------------------------------------------
// Component — pass-through mode (no tracking)
// ---------------------------------------------------------------------------

export default function BookingTracker({
  href,
  children,
  className = '',
}: BookingTrackerProps) {
  return (
    <div className="relative">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    </div>
  )
}
