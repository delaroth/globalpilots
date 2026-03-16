'use client'

import { getDestinationCost } from '@/lib/destination-costs'

interface TripCostBadgeProps {
  iata: string
  flightPrice: number
  nights?: number
  className?: string
}

export default function TripCostBadge({
  iata,
  flightPrice,
  nights = 5,
  className = '',
}: TripCostBadgeProps) {
  const dest = getDestinationCost(iata)
  if (!dest) return null

  const daily = dest.dailyCosts.budget
  const dailyTotal = daily.hotel + daily.food + daily.transport + daily.activities
  const totalTrip = Math.round(flightPrice + dailyTotal * nights)

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-violet-500/20 border border-violet-500/30 text-violet-300 ${className}`}
      title={`Flight $${flightPrice} + $${daily.hotel}/nt hotel + $${daily.food}/day food + $${daily.transport}/day transport + $${daily.activities}/day activities x ${nights} nights`}
    >
      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      {nights}-day trip: ~${totalTrip.toLocaleString()}
    </span>
  )
}
