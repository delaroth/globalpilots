// ─── Side Quest Value Calculator ───
// Determines whether a layover "side quest" is financially worth it.
// Pure math — no AI calls, no API calls. Runs on pre-fetched data.
//
// The core question: "If I save $X on flights by stopping in City Y,
// does that savings actually pay for a few days in City Y?"
//
// This is the engine behind the Side Quest model:
// 1. Layover API finds hub prices (existing)
// 2. This module cross-references with destination-costs.ts (existing data)
// 3. Returns a verdict: free-vacation / worth-it / splurge / skip
// 4. AI layer (optional) then ranks and explains the top picks

import { getDestinationCost, calculateTripCost, type BudgetTier } from '@/lib/destination-costs'

export type SideQuestVerdict = 'free-vacation' | 'worth-it' | 'splurge' | 'skip'

export interface SideQuestCandidate {
  hub: string              // IATA code
  hubCity: string
  region?: string

  // Flight economics (from layover API)
  directPrice: number      // Origin → Destination (direct)
  leg1Price: number         // Origin → Hub
  leg2Price: number         // Hub → Destination
  splitPrice: number        // leg1 + leg2
  flightSavings: number     // directPrice - splitPrice (can be negative)

  // Experience economics (from destination-costs.ts)
  dailyCost: number         // Per-day at user's budget tier
  layoverDays: number
  experienceCost: number    // Total ground cost for the stay

  // The verdict
  netValue: number          // flightSavings - experienceCost
  verdict: SideQuestVerdict

  // Cost breakdown for UI
  breakdown: {
    hotel: number
    food: number
    transport: number
    activities: number
  }

  // UI-ready
  pitch: string             // Human-readable value summary
}

/**
 * Calculate the Side Quest value for a single layover hub.
 *
 * Returns null if we don't have cost data for the hub city
 * (destination-costs.ts covers 60+ cities, all 18 major hubs included).
 */
export function calculateSideQuestValue(params: {
  hub: string
  hubCity: string
  region?: string
  directPrice: number
  leg1Price: number
  leg2Price: number
  layoverDays: number
  budgetTier: BudgetTier
}): SideQuestCandidate | null {
  const { hub, hubCity, region, directPrice, leg1Price, leg2Price, layoverDays, budgetTier } = params

  const destData = getDestinationCost(hub)
  if (!destData) return null

  const tripCost = calculateTripCost(hub, layoverDays, budgetTier)
  if (!tripCost) return null

  const splitPrice = leg1Price + leg2Price
  const flightSavings = directPrice - splitPrice
  const dailyCost = tripCost.dailyTotal
  const experienceCost = tripCost.totalCost
  const netValue = flightSavings - experienceCost

  const verdict = getVerdict(netValue)
  const pitch = buildPitch(hubCity, flightSavings, experienceCost, netValue, layoverDays, verdict)

  return {
    hub,
    hubCity,
    region: region || destData.region,
    directPrice,
    leg1Price,
    leg2Price,
    splitPrice,
    flightSavings,
    dailyCost,
    layoverDays,
    experienceCost,
    netValue,
    verdict,
    breakdown: tripCost.dailyCosts,
    pitch,
  }
}

/**
 * Calculate Side Quest values for multiple hub candidates.
 * Filters out hubs without cost data and sorts by netValue descending.
 */
export function rankSideQuests(params: {
  directPrice: number
  hubs: { hub: string; hubCity: string; region?: string; leg1Price: number; leg2Price: number }[]
  layoverDays: number
  budgetTier: BudgetTier
  /** Only include hubs at or above this verdict level */
  minVerdict?: SideQuestVerdict
}): SideQuestCandidate[] {
  const { directPrice, hubs, layoverDays, budgetTier, minVerdict } = params

  const verdictRank: Record<SideQuestVerdict, number> = {
    'free-vacation': 3,
    'worth-it': 2,
    'splurge': 1,
    'skip': 0,
  }
  const minRank = minVerdict ? verdictRank[minVerdict] : 0

  return hubs
    .map(h => calculateSideQuestValue({
      ...h,
      directPrice,
      layoverDays,
      budgetTier,
    }))
    .filter((c): c is SideQuestCandidate => c !== null)
    .filter(c => verdictRank[c.verdict] >= minRank)
    .sort((a, b) => b.netValue - a.netValue)
}

/**
 * Format Side Quest candidates as a compact summary for AI prompts.
 * Keeps token count low while giving the AI enough context to rank and explain.
 */
export function formatForAIPrompt(candidates: SideQuestCandidate[]): string {
  return candidates.map(c =>
    `${c.hubCity} (${c.hub}): Save $${c.flightSavings} on flights, ` +
    `${c.layoverDays}-day stay costs $${c.experienceCost} (${c.verdict}), ` +
    `net: ${c.netValue >= 0 ? '+' : ''}$${c.netValue}`
  ).join('\n')
}

// ─── Internal ───

function getVerdict(netValue: number): SideQuestVerdict {
  if (netValue >= 0) return 'free-vacation'   // Savings cover the entire stay
  if (netValue >= -100) return 'worth-it'     // Small premium for a real experience
  if (netValue >= -300) return 'splurge'      // Costs extra but could be worth it
  return 'skip'                                // Doesn't make financial sense
}

function buildPitch(
  city: string,
  flightSavings: number,
  experienceCost: number,
  netValue: number,
  days: number,
  verdict: SideQuestVerdict
): string {
  const abs = Math.abs(netValue)

  switch (verdict) {
    case 'free-vacation':
      return `Save $${flightSavings} on flights — that covers ${days} days in ${city} ($${experienceCost}) with $${abs} left over.`
    case 'worth-it':
      return `Save $${flightSavings} on flights. ${days} days in ${city} costs ~$${experienceCost} — only $${abs} more than flying direct.`
    case 'splurge':
      return `${days} days in ${city} adds ~$${abs} to your trip, but you get a real ${city} experience.`
    default:
      return `${city} doesn't save enough to justify the stop — $${abs} more than flying direct.`
  }
}
