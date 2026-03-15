// Budget allocation utilities for mystery vacation packages

export interface PackageComponents {
  includeFlight: boolean
  includeHotel: boolean
  includeItinerary: boolean
  includeTransportation: boolean
}

export interface BudgetAllocation {
  flight: number
  hotel_total: number
  hotel_per_night: number
  activities: number
  local_transport: number
  food_estimate: number
  buffer: number
  total: number
}

/** Budget split percentages (0-100, must sum to ~100) */
export interface BudgetSplit {
  flights: number
  hotels: number
  activities: number
}

/** Preset splits for budget priority options */
export const PRIORITY_SPLITS: Record<string, BudgetSplit> = {
  flights:    { flights: 50, hotels: 25, activities: 25 },
  balanced:   { flights: 35, hotels: 35, activities: 30 },
  hotels:     { flights: 20, hotels: 50, activities: 30 },
  activities: { flights: 25, hotels: 25, activities: 50 },
}

/**
 * Calculate smart budget allocation across selected package components.
 *
 * Accepts an optional `customSplit` to override the default percentages.
 * When provided, the user's custom flight/hotel/activities percentages
 * are used instead of the priority-based defaults.
 */
export function calculateBudgetAllocation(
  totalBudget: number,
  tripDuration: number,
  components: PackageComponents,
  options?: {
    budgetPriority?: string
    customSplit?: BudgetSplit
  }
): BudgetAllocation {
  // Reserve 8% buffer for unexpected costs
  const bufferPercent = 0.08
  const bufferAmount = Math.floor(totalBudget * bufferPercent)
  const remainingBudget = totalBudget - bufferAmount

  const allocation: BudgetAllocation = {
    flight: 0,
    hotel_total: 0,
    hotel_per_night: 0,
    activities: 0,
    local_transport: 0,
    food_estimate: 0,
    buffer: bufferAmount,
    total: totalBudget,
  }

  const selectedCount = Object.values(components).filter(Boolean).length
  if (selectedCount === 0) {
    allocation.buffer = totalBudget
    return allocation
  }

  // Determine split percentages
  const split = options?.customSplit
    || PRIORITY_SPLITS[options?.budgetPriority || 'balanced']
    || PRIORITY_SPLITS.balanced

  // Normalize split to ensure it sums to 100
  const total = split.flights + split.hotels + split.activities
  const flightPct = split.flights / total
  const hotelPct = split.hotels / total
  const activityPct = split.activities / total

  if (components.includeFlight) {
    allocation.flight = Math.floor(remainingBudget * flightPct)
  }
  if (components.includeHotel) {
    allocation.hotel_total = Math.floor(remainingBudget * hotelPct)
  }
  if (components.includeItinerary || components.includeTransportation) {
    const actBudget = Math.floor(remainingBudget * activityPct)
    if (components.includeItinerary && components.includeTransportation) {
      allocation.activities = Math.floor(actBudget * 0.7)
      allocation.local_transport = Math.floor(actBudget * 0.15)
      allocation.food_estimate = Math.floor(actBudget * 0.15)
    } else if (components.includeItinerary) {
      allocation.activities = Math.floor(actBudget * 0.6)
      allocation.food_estimate = Math.floor(actBudget * 0.4)
    } else {
      allocation.local_transport = actBudget
    }
  }

  // If a component is off, redistribute its share proportionally
  if (!components.includeFlight && (components.includeHotel || components.includeItinerary)) {
    const extra = Math.floor(remainingBudget * flightPct)
    if (components.includeHotel && components.includeItinerary) {
      allocation.hotel_total += Math.floor(extra * 0.5)
      allocation.activities += Math.floor(extra * 0.5)
    } else if (components.includeHotel) {
      allocation.hotel_total += extra
    } else {
      allocation.activities += extra
    }
  }
  if (!components.includeHotel && (components.includeFlight || components.includeItinerary)) {
    const extra = Math.floor(remainingBudget * hotelPct)
    if (components.includeFlight && components.includeItinerary) {
      allocation.flight += Math.floor(extra * 0.5)
      allocation.activities += Math.floor(extra * 0.5)
    } else if (components.includeFlight) {
      allocation.flight += extra
    } else {
      allocation.activities += extra
    }
  }

  // Calculate per-night hotel cost
  if (allocation.hotel_total > 0 && tripDuration > 0) {
    allocation.hotel_per_night = Math.floor(allocation.hotel_total / tripDuration)
  }

  return allocation
}

/**
 * Validate if the budget allocation is feasible for a destination
 * @param allocation - Budget allocation
 * @param destinationName - Name of destination (for context in warnings)
 * @returns Array of warning messages (empty if all good)
 */
export function validateBudgetFeasibility(
  allocation: BudgetAllocation,
  destinationName: string = 'this destination'
): string[] {
  const warnings: string[] = []

  // Warn if total budget is very low (< $100)
  if (allocation.total < 100) {
    warnings.push(
      `Total budget of $${allocation.total} may be too low for a realistic trip. Consider increasing to at least $200.`
    )
  }

  // Warn if hotel per night is very low (< $10) - may indicate unrealistic expectations
  if (allocation.hotel_per_night > 0 && allocation.hotel_per_night < 10) {
    warnings.push(
      `Hotel budget of $${allocation.hotel_per_night}/night is extremely low. Consider increasing trip budget or shortening duration.`
    )
  }

  // Warn if flight budget is very low (< $20) - likely unrealistic except for very short regional flights
  if (allocation.flight > 0 && allocation.flight < 20) {
    warnings.push(
      `Flight budget of $${allocation.flight} is very low. Consider nearby destinations or increase budget.`
    )
  }

  // Warn if activities budget is $0 but itinerary is requested
  if (allocation.activities === 0 && allocation.hotel_total > 0 && allocation.flight > 0) {
    warnings.push(
      `No budget allocated for activities. Trip may be very restrictive.`
    )
  }

  return warnings
}

/**
 * Get budget allocation as formatted text for AI prompts
 * @param allocation - Budget allocation
 * @param tripDuration - Number of days
 * @returns Formatted text describing the allocation
 */
export function formatAllocationForAI(
  allocation: BudgetAllocation,
  tripDuration: number
): string {
  const parts: string[] = []

  if (allocation.flight > 0) {
    parts.push(`Flight: $${allocation.flight}`)
  }

  if (allocation.hotel_total > 0) {
    parts.push(`Hotel: $${allocation.hotel_total} total ($${allocation.hotel_per_night}/night for ${tripDuration} nights)`)
  }

  if (allocation.activities > 0) {
    parts.push(`Activities: $${allocation.activities}`)
  }

  if (allocation.local_transport > 0) {
    parts.push(`Local Transport: $${allocation.local_transport}`)
  }

  if (allocation.food_estimate > 0) {
    parts.push(`Food: $${allocation.food_estimate}`)
  }

  parts.push(`Buffer: $${allocation.buffer}`)
  parts.push(`TOTAL: $${allocation.total}`)

  return parts.join(', ')
}

/**
 * Determine budget tier for a destination (budget/mid-range/luxury)
 * @param totalBudget - Total trip budget
 * @param tripDuration - Number of days
 * @returns Budget tier
 */
export function getBudgetTier(
  totalBudget: number,
  tripDuration: number
): 'budget' | 'mid-range' | 'luxury' {
  const perDayBudget = tripDuration > 0 ? totalBudget / tripDuration : totalBudget

  if (perDayBudget < 100) return 'budget'
  if (perDayBudget < 250) return 'mid-range'
  return 'luxury'
}
