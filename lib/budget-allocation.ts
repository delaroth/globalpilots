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

/**
 * Calculate smart budget allocation across selected package components
 * @param totalBudget - Total trip budget in USD
 * @param tripDuration - Number of days
 * @param components - Which components to include
 * @returns Budget allocation breakdown
 */
export function calculateBudgetAllocation(
  totalBudget: number,
  tripDuration: number,
  components: PackageComponents
): BudgetAllocation {
  // Reserve 8% buffer for unexpected costs
  const bufferPercent = 0.08
  const bufferAmount = Math.floor(totalBudget * bufferPercent)
  let remainingBudget = totalBudget - bufferAmount

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

  // Count how many components are selected
  const selectedCount = Object.values(components).filter(Boolean).length

  if (selectedCount === 0) {
    // No components selected - allocate everything to buffer
    allocation.buffer = totalBudget
    return allocation
  }

  // Determine allocation percentages based on selected components
  if (
    components.includeFlight &&
    components.includeHotel &&
    components.includeItinerary &&
    components.includeTransportation
  ) {
    // ALL COMPONENTS: Flight 35%, Hotel 35%, Activities 15%, Transport 5%, Food 10%
    allocation.flight = Math.floor(remainingBudget * 0.35)
    allocation.hotel_total = Math.floor(remainingBudget * 0.35)
    allocation.activities = Math.floor(remainingBudget * 0.15)
    allocation.local_transport = Math.floor(remainingBudget * 0.05)
    allocation.food_estimate = Math.floor(remainingBudget * 0.10)
  } else if (
    components.includeFlight &&
    components.includeHotel &&
    components.includeItinerary
  ) {
    // Flight + Hotel + Itinerary: 35% / 35% / 20% / 10% food
    allocation.flight = Math.floor(remainingBudget * 0.35)
    allocation.hotel_total = Math.floor(remainingBudget * 0.35)
    allocation.activities = Math.floor(remainingBudget * 0.20)
    allocation.food_estimate = Math.floor(remainingBudget * 0.10)
  } else if (components.includeFlight && components.includeHotel) {
    // Flight + Hotel: 45% each, 10% activities
    allocation.flight = Math.floor(remainingBudget * 0.45)
    allocation.hotel_total = Math.floor(remainingBudget * 0.45)
    allocation.activities = Math.floor(remainingBudget * 0.10)
  } else if (components.includeFlight && components.includeItinerary) {
    // Flight + Itinerary: 60% flight, 40% activities
    allocation.flight = Math.floor(remainingBudget * 0.60)
    allocation.activities = Math.floor(remainingBudget * 0.40)
  } else if (components.includeHotel && components.includeItinerary) {
    // Hotel + Itinerary: 60% hotel, 40% activities
    allocation.hotel_total = Math.floor(remainingBudget * 0.60)
    allocation.activities = Math.floor(remainingBudget * 0.40)
  } else if (components.includeFlight) {
    // Flight only: all budget
    allocation.flight = remainingBudget
  } else if (components.includeHotel) {
    // Hotel only: all budget
    allocation.hotel_total = remainingBudget
  } else if (components.includeItinerary) {
    // Itinerary only: all budget
    allocation.activities = remainingBudget
  } else if (components.includeTransportation) {
    // Transportation only: all budget
    allocation.local_transport = remainingBudget
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
