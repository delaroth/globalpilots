// DISABLED: Re-enable when affiliate links are activated
// Tracking logic (Supabase writes, localStorage updates, activity feed posts)
// has been removed. The component now acts as a simple pass-through link wrapper.

'use client'

import { trackBookingClick } from '@/lib/track-client'

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
  destination?: string
}

// ---------------------------------------------------------------------------
// Component — Vercel Analytics tracking on click
// ---------------------------------------------------------------------------

export default function BookingTracker({
  type,
  href,
  children,
  className = '',
  destination = '',
}: BookingTrackerProps) {
  return (
    <div className="relative">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={() => trackBookingClick({ type, destination })}
      >
        {children}
      </a>
    </div>
  )
}
