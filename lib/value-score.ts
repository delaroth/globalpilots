// Value score calculator for budget travelers
// Score = quality proxy / (flightPrice + dailyCost * 5)
// Quality proxy is based on destination-costs data (savingTips count as proxy for attractions,
// bestMonths length as proxy for year-round appeal)

import { getDestinationCost } from '@/lib/destination-costs'

export interface ValueScoreInput {
  flightPrice: number
  dailyCost: number
  attractionCount?: number
  rating?: number
  airportCode?: string
}

export interface ValueScoreResult {
  score: number        // 1-10
  label: string        // "Incredible Value", "Great Value", etc.
  rawScore: number     // raw calculated score before normalization
}

/**
 * Calculate a value score for a destination.
 *
 * Score = qualityProxy / (flightPrice + dailyCost * 5)
 * Then normalized to a 1-10 scale.
 *
 * Quality proxy factors:
 * - More saving tips = more to do (proxy for attractions)
 * - More best months = year-round destination
 * - Lower daily cost = better bang for buck
 * - Explicit attractionCount / rating if provided
 */
export function calculateValueScore(destination: ValueScoreInput): ValueScoreResult {
  const { flightPrice, dailyCost, attractionCount, rating, airportCode } = destination

  // Prevent division by zero
  const totalCost = Math.max(flightPrice + dailyCost * 5, 1)

  // Build quality proxy
  let qualityProxy = 50 // base quality

  // If we have destination data, use it for quality enrichment
  if (airportCode) {
    const destData = getDestinationCost(airportCode)
    if (destData) {
      // More saving tips = more stuff to do (proxy for attractions)
      qualityProxy += destData.savingTips.length * 8

      // Year-round appeal: more best months = higher quality
      qualityProxy += destData.bestMonths.length * 3

      // Visa-free access is a quality signal (ease of travel)
      qualityProxy += destData.visaFreeFor.length * 2
    }
  }

  // Explicit quality signals override/augment
  if (attractionCount != null) {
    qualityProxy += attractionCount * 5
  }
  if (rating != null) {
    qualityProxy += rating * 10
  }

  // Raw score: quality per dollar spent
  const rawScore = (qualityProxy / totalCost) * 100

  // Normalize to 1-10 scale
  // Calibrated so that cheap SE Asia destinations score 8-10,
  // mid-range European ones score 5-7, expensive destinations score 1-4
  const normalizedScore = Math.min(10, Math.max(1, Math.round(rawScore * 2.5)))

  return {
    score: normalizedScore,
    label: getValueLabel(normalizedScore),
    rawScore,
  }
}

function getValueLabel(score: number): string {
  if (score >= 9) return 'Incredible Value'
  if (score >= 7) return 'Great Value'
  if (score >= 5) return 'Good Value'
  if (score >= 3) return 'Fair'
  return 'Pricey'
}
