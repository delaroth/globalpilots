// ─── Confidence Scoring Engine ───
// Piecewise decay model: source base × time decay × route volatility
// Used to determine how to display prices and when to trigger live re-fetches.

import type { FlightSource, PriceConfidence } from '@/lib/flight-providers/types'

export type RouteVolatility = 'stable' | 'moderate' | 'volatile'

export interface ConfidenceInput {
  source: FlightSource | string
  fetchedAt: number           // Timestamp (ms) when data was retrieved
  routeVolatility?: RouteVolatility
}

export interface ConfidenceResult {
  /** Numeric score 0.0–1.0 */
  score: number
  /** Three-tier bucket for the FlightOffer.confidence field */
  tier: PriceConfidence
  /** Human-readable label for the UI badge */
  label: string
  /** How to prefix the price in the UI */
  pricePrefix: string
  /** Whether this data is stale enough to prompt a live re-fetch */
  shouldRefetch: boolean
  /** CTA button text */
  actionLabel: string
}

// ─── Source Base Confidence ───
// Inherent reliability: how trustworthy is this provider's data on arrival?
const SOURCE_BASE: Record<string, number> = {
  'duffel':        0.98,  // Live bookable, highest trust, real inventory (future)
  'flightapi':     0.92,  // Live from 700+ airlines, high coverage
  'kiwi':          0.90,  // Live, includes LCCs, but aggregated from carriers
  'travelpayouts': 0.60,  // Cached 1-3 days, directional pricing only
  'estimated':     0.30,  // Hardcoded fallbacks, very rough
}

// ─── Volatility Modifiers ───
// Route-specific adjustment — niche routes swing more than trunk routes
const VOLATILITY_MOD: Record<RouteVolatility, number> = {
  'stable':   1.0,   // Major trunk routes (JFK-LHR, SIN-HKG)
  'moderate': 0.85,  // Regional routes, moderate demand
  'volatile': 0.70,  // Niche, seasonal, LCC-heavy, island routes
}

/**
 * Calculate confidence score for a flight price.
 *
 * The model: Confidence = SourceBase × DecayFactor × VolatilityModifier
 *
 * Decay is piecewise:
 * - Live sources (Duffel/Amadeus/Kiwi): exponential decay, half-life 15 min
 *   → 50% confidence lost in 15 minutes (live offers expire fast)
 * - Cached sources (TravelPayouts): slow linear decay over 6 hours
 *   → Data was already old when fetched, age matters less
 * - Estimated sources: flat 0.9 — always a rough guess, age irrelevant
 */
export function calculateConfidence(input: ConfidenceInput): ConfidenceResult {
  const now = Date.now()
  const ageMs = Math.max(0, now - input.fetchedAt)
  const ageMinutes = ageMs / 60_000

  const base = SOURCE_BASE[input.source] ?? 0.50

  // ─── Piecewise Decay ───
  let decay: number
  if (base >= 0.85) {
    // Live sources: exponential decay with 15-minute half-life
    // At t=0: 1.0, t=15min: 0.5, t=30min: 0.25, t=60min: ~0.06
    decay = Math.exp(-0.693 * ageMinutes / 15) // ln(2) ≈ 0.693
  } else if (base >= 0.55) {
    // Cached sources: linear decay over 6 hours (360 min)
    // At t=0: 1.0, t=3h: 0.5, t=6h: 0.0
    decay = Math.max(0, 1 - (ageMinutes / 360))
  } else {
    // Estimated/fallback: near-flat — always a rough guess
    decay = 0.90
  }

  const volMod = VOLATILITY_MOD[input.routeVolatility || 'moderate']
  const score = Math.max(0, Math.min(1, base * decay * volMod))

  // ─── Map to User-Facing Output ───
  let tier: PriceConfidence
  let label: string
  let pricePrefix: string
  let shouldRefetch: boolean
  let actionLabel: string

  if (score >= 0.80) {
    tier = 'live'
    label = 'Live Price'
    pricePrefix = '$'
    shouldRefetch = false
    actionLabel = 'Book Now'
  } else if (score >= 0.50) {
    tier = 'cached'
    label = 'Recent Price'
    pricePrefix = '~$'
    shouldRefetch = true  // Prompt live re-fetch but still show cached data
    actionLabel = 'Check Live Price'
  } else if (score >= 0.25) {
    tier = 'estimated'
    label = 'Estimated'
    pricePrefix = 'From ~$'
    shouldRefetch = true
    actionLabel = 'Search Flights'
  } else {
    tier = 'estimated'
    label = 'Guide Price'
    pricePrefix = '~$'
    shouldRefetch = true
    actionLabel = 'Explore Options'
  }

  return { score, tier, label, pricePrefix, shouldRefetch, actionLabel }
}

/**
 * Determine route volatility from known trunk routes.
 * In Phase 4, this will use price_history variance instead.
 */
const STABLE_ROUTES = new Set([
  'JFK-LHR', 'LHR-JFK', 'LAX-NRT', 'NRT-LAX', 'SIN-HKG', 'HKG-SIN',
  'DXB-LHR', 'LHR-DXB', 'CDG-JFK', 'JFK-CDG', 'SIN-SYD', 'SYD-SIN',
  'FRA-JFK', 'JFK-FRA', 'AMS-JFK', 'JFK-AMS', 'DOH-LHR', 'LHR-DOH',
  'ICN-NRT', 'NRT-ICN', 'BKK-SIN', 'SIN-BKK', 'HKG-NRT', 'NRT-HKG',
])

export function inferRouteVolatility(origin: string, destination: string): RouteVolatility {
  const key = `${origin}-${destination}`
  if (STABLE_ROUTES.has(key)) return 'stable'
  // Default to moderate — most routes fall here
  return 'moderate'
}
