// Price analysis utilities for flight price tracking

export type PriceStatus = 'great_deal' | 'good_deal' | 'average' | 'above_average' | 'unknown'

export interface PriceStatusInfo {
  status: PriceStatus
  text: string
  color: string
  description: string
}

/**
 * Calculate price status based on current price vs historical low
 * @param currentPrice - Current flight price
 * @param historicalLow - Lowest price seen in historical data
 * @returns Price status category
 */
export function calculatePriceStatus(
  currentPrice: number | null,
  historicalLow: number | null
): PriceStatus {
  if (!currentPrice || !historicalLow) {
    return 'unknown'
  }

  // Calculate percentage above historical low
  const percentAboveLow = ((currentPrice - historicalLow) / historicalLow) * 100

  // Categorize based on percentage
  if (percentAboveLow <= 5) {
    return 'great_deal' // Within 5% of historical low
  } else if (percentAboveLow <= 15) {
    return 'good_deal' // Within 15% of historical low
  } else if (percentAboveLow <= 30) {
    return 'average' // Within 30% of historical low
  } else {
    return 'above_average' // More than 30% above historical low
  }
}

/**
 * Get human-readable label and styling info for a price status
 * @param status - Price status category
 * @returns Label, color, and description
 */
export function getPriceStatusLabel(status: PriceStatus): PriceStatusInfo {
  const labels: Record<PriceStatus, PriceStatusInfo> = {
    great_deal: {
      status: 'great_deal',
      text: 'Great Deal!',
      color: 'green',
      description: 'This price is within 5% of the historical low. Book now!',
    },
    good_deal: {
      status: 'good_deal',
      text: 'Good Price',
      color: 'blue',
      description: 'This is a competitive price, within 15% of the historical low.',
    },
    average: {
      status: 'average',
      text: 'Fair Price',
      color: 'yellow',
      description: 'This price is reasonable but not exceptional. You might wait for a better deal.',
    },
    above_average: {
      status: 'above_average',
      text: 'Above Average',
      color: 'orange',
      description: 'This price is more than 30% above the historical low. Consider waiting.',
    },
    unknown: {
      status: 'unknown',
      text: 'Unknown',
      color: 'gray',
      description: 'Not enough price data to determine status.',
    },
  }

  return labels[status]
}

/**
 * Calculate savings compared to historical average
 * @param currentPrice - Current price
 * @param historicalPrices - Array of historical prices
 * @returns Savings amount (negative if paying more than average)
 */
export function calculateSavings(
  currentPrice: number,
  historicalPrices: number[]
): number {
  if (historicalPrices.length === 0) {
    return 0
  }

  const average = historicalPrices.reduce((sum, price) => sum + price, 0) / historicalPrices.length
  return Math.round(average - currentPrice)
}

/**
 * Get price trend direction based on recent historical data
 * @param historicalPrices - Array of prices ordered by date (most recent first)
 * @param windowSize - Number of recent prices to analyze (default: 7)
 * @returns Trend direction and percentage change
 */
export function getPriceTrend(
  historicalPrices: number[],
  windowSize: number = 7
): { direction: 'up' | 'down' | 'stable'; change: number } {
  if (historicalPrices.length < 2) {
    return { direction: 'stable', change: 0 }
  }

  // Get recent window
  const recentPrices = historicalPrices.slice(0, Math.min(windowSize, historicalPrices.length))

  // Calculate average of first half vs second half
  const midPoint = Math.floor(recentPrices.length / 2)
  const recentAvg = recentPrices.slice(0, midPoint).reduce((sum, p) => sum + p, 0) / midPoint
  const olderAvg = recentPrices.slice(midPoint).reduce((sum, p) => sum + p, 0) / (recentPrices.length - midPoint)

  const percentChange = ((recentAvg - olderAvg) / olderAvg) * 100

  if (percentChange > 5) {
    return { direction: 'up', change: percentChange }
  } else if (percentChange < -5) {
    return { direction: 'down', change: percentChange }
  } else {
    return { direction: 'stable', change: percentChange }
  }
}

/**
 * Predict likelihood of price drop based on historical data
 * @param currentPrice - Current price
 * @param historicalPrices - Array of historical prices
 * @returns Likelihood percentage (0-100)
 */
export function predictPriceDropLikelihood(
  currentPrice: number,
  historicalPrices: number[]
): number {
  if (historicalPrices.length < 10) {
    return 50 // Not enough data
  }

  // Count how many times historical prices were lower than current
  const lowerCount = historicalPrices.filter(p => p < currentPrice).length

  // Calculate percentage
  const likelihood = Math.round((lowerCount / historicalPrices.length) * 100)

  return Math.max(0, Math.min(100, likelihood))
}

/**
 * Format price difference as text
 * @param difference - Price difference
 * @returns Formatted text (e.g., "$50 below average" or "$20 above average")
 */
export function formatPriceDifference(difference: number): string {
  const absDiff = Math.abs(difference)

  if (difference > 0) {
    return `$${absDiff} below average`
  } else if (difference < 0) {
    return `$${absDiff} above average`
  } else {
    return 'at average price'
  }
}

/**
 * Get recommended action based on price status and trend
 * @param status - Price status
 * @param trend - Price trend direction
 * @returns Recommended action text
 */
export function getRecommendedAction(
  status: PriceStatus,
  trend: 'up' | 'down' | 'stable'
): string {
  if (status === 'great_deal') {
    return 'Book now! This is an excellent price.'
  }

  if (status === 'good_deal' && trend === 'up') {
    return 'Good price and trending up - consider booking soon.'
  }

  if (status === 'good_deal' && trend === 'down') {
    return 'Good price but trending down - you might wait a few days.'
  }

  if (status === 'average' && trend === 'down') {
    return 'Price is fair and trending down - monitor for better deals.'
  }

  if (status === 'above_average') {
    return 'Price is high - wait for a better deal or consider alternative dates.'
  }

  return 'Monitor prices and book when you see a good deal.'
}
