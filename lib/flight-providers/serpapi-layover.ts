/**
 * SerpApi-powered layover discovery engine.
 *
 * Strategy (3-5 API calls per search):
 * 1. Direct flight price (1 call) — baseline
 * 2. Multi-stop discovery (1 call) — find natural connecting cities
 * 3. Multi-city pricing for top stopover candidates (1-3 calls) — real prices
 *
 * Visa requirements are checked locally (no API call) to prioritize
 * visa-free/visa-on-arrival stopovers for the user's passport.
 */

import { getSerpApiUsage } from './serpapi'
import { checkVisaRequirement } from '@/lib/enrichment/visa'
import { getDestinationCost, type BudgetTier } from '@/lib/destination-costs'
import { calculateSideQuestValue } from '@/lib/flight-intelligence/side-quest'
import { getAirportCoords } from '@/data/airport-coordinates'

const SERPAPI_KEY = process.env.SERPAPI_KEY || ''
const BASE_URL = 'https://serpapi.com/search'

// Map IATA codes to country names for visa checks
const AIRPORT_COUNTRIES: Record<string, string> = {
  // Middle East
  DXB: 'UAE', DOH: 'Qatar', IST: 'Turkey', AUH: 'UAE', BAH: 'Bahrain',
  KWI: 'Kuwait', MCT: 'Oman', AMM: 'Jordan', CAI: 'Egypt', TLV: 'Israel',
  // Europe
  LHR: 'United Kingdom', CDG: 'France', AMS: 'Netherlands', FRA: 'Germany',
  MUC: 'Germany', MAD: 'Spain', BCN: 'Spain', FCO: 'Italy', MXP: 'Italy',
  VIE: 'Austria', ZRH: 'Switzerland', CPH: 'Denmark', OSL: 'Norway',
  ARN: 'Sweden', BRU: 'Belgium', DUB: 'Ireland', LIS: 'Portugal',
  ATH: 'Greece', PRG: 'Czech Republic', WAW: 'Poland', BUD: 'Hungary',
  BER: 'Germany', HEL: 'Finland', KRK: 'Poland',
  // Asia
  BKK: 'Thailand', SIN: 'Singapore', KUL: 'Malaysia', HKG: 'Hong Kong',
  NRT: 'Japan', HND: 'Japan', KIX: 'Japan', ICN: 'South Korea',
  PVG: 'China', PEK: 'China', DEL: 'India', BOM: 'India', GOI: 'India',
  CGK: 'Indonesia', DPS: 'Indonesia', MNL: 'Philippines', HAN: 'Vietnam',
  SGN: 'Vietnam', TPE: 'Taiwan', CMB: 'Sri Lanka', KTM: 'Nepal',
  PNH: 'Cambodia', REP: 'Cambodia', VTE: 'Laos', RGN: 'Myanmar',
  // Americas
  JFK: 'United States', LAX: 'United States', ORD: 'United States',
  MIA: 'United States', SFO: 'United States', ATL: 'United States',
  DFW: 'United States', SEA: 'United States', BOS: 'United States',
  DEN: 'United States', LAS: 'United States', YYZ: 'Canada', YVR: 'Canada',
  MEX: 'Mexico', CUN: 'Mexico', GRU: 'Brazil', EZE: 'Argentina',
  BOG: 'Colombia', LIM: 'Peru', SCL: 'Chile', PTY: 'Panama',
  SJO: 'Costa Rica',
  // Africa & Oceania
  RAK: 'Morocco', CPT: 'South Africa', NBO: 'Kenya',
  SYD: 'Australia', MEL: 'Australia', AKL: 'New Zealand',
  ADD: 'Ethiopia', ACC: 'Ghana', LOS: 'Nigeria',
}

function getCountryForAirport(iata: string): string | undefined {
  return AIRPORT_COUNTRIES[iata]
}

interface SerpApiFlightResult {
  flights: {
    departure_airport: { name: string; id: string; time: string }
    arrival_airport: { name: string; id: string; time: string }
    duration: number
    airline: string
    airline_logo?: string
    flight_number?: string
    airplane?: string
    travel_class?: string
  }[]
  layovers?: {
    duration: number
    name: string
    id: string
    overnight?: boolean
  }[]
  total_duration: number
  price: number
  type?: string
  departure_token?: string
  carbon_emissions?: { this_flight: number }
}

export interface StopoverOpportunity {
  hub: string
  hubCity: string
  hubCountry: string
  // Visa info
  visaStatus: 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required'
  visaMaxStay?: number
  visaNote?: string
  // Pricing
  directPrice: number
  leg1Price: number
  leg2Price: number
  totalFlightCost: number
  savings: number
  savingsPercent: number
  // Flight details
  leg1Airlines: string[]
  leg1Duration: string
  leg1Stops: number
  leg2Airlines: string[]
  leg2Duration: string
  leg2Stops: number
  // Stopover details
  stopoverDays: number
  stopoverDepartDate: string
  stopoverReturnDate: string
  // Ground costs
  dailyCost: number
  totalGroundCost: number
  netValue: number
  // Side quest
  verdict: 'free-vacation' | 'worth-it' | 'splurge' | 'skip'
  pitch: string
  costBreakdown: { hotel: number; food: number; transport: number; activities: number }
  // Metadata
  priceIsLive: true
  googleFlightsUrl: string
}

export interface LayoverSearchResult {
  origin: string
  destination: string
  departDate: string
  arrivalDeadline: string
  passportCountry: string
  directPrice: number | null
  directAirlines: string[]
  directDuration: string
  directStops: number
  stopovers: StopoverOpportunity[]
  serpApiCallsUsed: number
  serpApiRemaining: number
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

function buildGoogleFlightsMultiCityUrl(origin: string, hub: string, destination: string, date1: string, date2: string): string {
  return `https://www.google.com/travel/flights?q=flights+${origin}+to+${hub}+on+${date1}+then+${hub}+to+${destination}+on+${date2}&curr=USD`
}

async function serpApiSearch(params: Record<string, string>): Promise<any> {
  const searchParams = new URLSearchParams({
    engine: 'google_flights',
    api_key: SERPAPI_KEY,
    currency: 'USD',
    hl: 'en',
    ...params,
  })

  const response = await fetch(`${BASE_URL}?${searchParams.toString()}`, {
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`SerpApi HTTP ${response.status}`)
  }

  const data = await response.json()
  if (data.error) throw new Error(data.error)
  return data
}

/**
 * Discover stopover opportunities for a route.
 *
 * @param origin - Departure airport IATA
 * @param destination - Final destination IATA
 * @param departDate - Departure date YYYY-MM-DD
 * @param maxTravelDays - Total days available (e.g., 14 means they need to arrive within 14 days)
 * @param passportCountry - User's passport country code (e.g., 'US', 'UK', 'AU')
 * @param budgetTier - Budget level for ground cost estimates
 * @param maxStopoverDays - Max days to spend at stopover (default: calculated from maxTravelDays)
 */
export async function discoverStopovers(params: {
  origin: string
  destination: string
  departDate: string
  maxTravelDays: number
  passportCountry: string
  budgetTier?: BudgetTier
  maxStopoverDays?: number
}): Promise<LayoverSearchResult> {
  const {
    origin,
    destination,
    departDate,
    maxTravelDays,
    passportCountry,
    budgetTier = 'mid',
  } = params

  const maxStopoverDays = params.maxStopoverDays || Math.min(Math.floor(maxTravelDays / 3), 5)

  let callsUsed = 0
  const arrivalDeadline = new Date(new Date(departDate + 'T00:00:00').getTime() + maxTravelDays * 86400000).toISOString().split('T')[0]

  // ── STEP 1: Get direct flight price (1 API call) ──────────────────
  console.log(`[Layover] Step 1: Direct ${origin} → ${destination}`)
  let directPrice: number | null = null
  let directAirlines: string[] = []
  let directDuration = ''
  let directStops = 0

  try {
    const directData = await serpApiSearch({
      departure_id: origin,
      arrival_id: destination,
      outbound_date: departDate,
      type: '2', // one-way
      sort_by: '2', // sort by price
    })
    callsUsed++

    const cheapest = (directData.best_flights || directData.other_flights || [])[0]
    if (cheapest) {
      directPrice = cheapest.price
      directAirlines = [...new Set<string>(cheapest.flights.map((f: any) => f.airline))]
      directDuration = formatDuration(cheapest.total_duration)
      directStops = cheapest.layovers?.length || 0
      console.log(`[Layover] Direct: $${directPrice} (${directAirlines.join(', ')}, ${directDuration})`)
    }
  } catch (err) {
    console.warn('[Layover] Direct price fetch failed:', err instanceof Error ? err.message : err)
  }

  // ── STEP 2: Discover connecting cities (1 API call) ───────────────
  // Search with 1-2 stops to see which cities airlines naturally route through
  console.log(`[Layover] Step 2: Discovering connecting cities`)
  const connectingCities = new Map<string, { count: number; city: string }>()

  try {
    const discoveryData = await serpApiSearch({
      departure_id: origin,
      arrival_id: destination,
      outbound_date: departDate,
      type: '2', // one-way
      stops: '3', // up to 2 stops
      sort_by: '2',
    })
    callsUsed++

    const allFlights = [...(discoveryData.best_flights || []), ...(discoveryData.other_flights || [])]
    for (const flight of allFlights) {
      if (flight.layovers) {
        for (const layover of flight.layovers) {
          const code = layover.id
          if (code && code !== origin && code !== destination) {
            const existing = connectingCities.get(code) || { count: 0, city: layover.name.split(' ')[0] }
            connectingCities.set(code, { count: existing.count + 1, city: existing.city || layover.name })
          }
        }
      }
    }
    console.log(`[Layover] Found ${connectingCities.size} connecting cities: ${[...connectingCities.keys()].join(', ')}`)
  } catch (err) {
    console.warn('[Layover] Discovery search failed:', err instanceof Error ? err.message : err)
  }

  // ── STEP 3: Rank candidates by visa access + frequency ────────────
  // No API calls — all local data
  interface Candidate {
    code: string
    city: string
    country: string
    visaStatus: 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required'
    visaMaxStay?: number
    visaNote?: string
    frequency: number
    hasGroundCosts: boolean
    score: number
  }

  const candidates: Candidate[] = []

  for (const [code, info] of connectingCities) {
    const country = getCountryForAirport(code)
    if (!country) continue

    const visa = checkVisaRequirement(passportCountry, country)
    const hasCosts = !!getDestinationCost(code)

    // Score: visa-free=100, visa-on-arrival=75, e-visa=50, visa-required=0
    // + frequency bonus (more airlines route through = more options)
    // + ground cost data bonus (we can calculate side quest value)
    const visaScore = visa.status === 'visa-free' ? 100
      : visa.status === 'visa-on-arrival' ? 75
      : visa.status === 'e-visa' ? 50
      : 0
    const score = visaScore + (info.count * 5) + (hasCosts ? 20 : 0)

    candidates.push({
      code,
      city: info.city,
      country,
      visaStatus: visa.status,
      visaMaxStay: visa.maxStay,
      visaNote: visa.note,
      frequency: info.count,
      hasGroundCosts: hasCosts,
      score,
    })
  }

  // Sort by score (highest first), take top 3
  candidates.sort((a, b) => b.score - a.score)

  // Filter out visa-required destinations and take top 3
  const topCandidates = candidates
    .filter(c => c.visaStatus !== 'visa-required')
    .slice(0, 3)

  console.log(`[Layover] Top candidates: ${topCandidates.map(c => `${c.code}(${c.visaStatus}, score:${c.score})`).join(', ')}`)

  // If no visa-accessible candidates, include visa-required ones with a warning
  if (topCandidates.length === 0) {
    topCandidates.push(...candidates.slice(0, 2))
    console.log(`[Layover] No visa-free options, using: ${topCandidates.map(c => c.code).join(', ')}`)
  }

  // ── STEP 4: Price multi-city stopovers (1 call per candidate) ─────
  const stopovers: StopoverOpportunity[] = []

  for (const candidate of topCandidates) {
    // Check SerpApi budget
    const usage = getSerpApiUsage()
    if (usage.remaining <= 5) {
      console.log('[Layover] SerpApi budget low, stopping multi-city searches')
      break
    }

    const stopoverStart = departDate
    const stopoverEnd = new Date(
      new Date(departDate + 'T00:00:00').getTime() + maxStopoverDays * 86400000
    ).toISOString().split('T')[0]

    try {
      // Search leg 1: origin → hub
      console.log(`[Layover] Step 4: Pricing ${origin} → ${candidate.code} → ${destination}`)
      const leg1Data = await serpApiSearch({
        departure_id: origin,
        arrival_id: candidate.code,
        outbound_date: departDate,
        type: '2', // one-way
        sort_by: '2',
      })
      callsUsed++

      const leg1Cheapest = (leg1Data.best_flights || leg1Data.other_flights || [])[0]
      if (!leg1Cheapest) {
        console.log(`[Layover] No flights found for ${origin} → ${candidate.code}`)
        continue
      }

      // Search leg 2: hub → destination
      const leg2Data = await serpApiSearch({
        departure_id: candidate.code,
        arrival_id: destination,
        outbound_date: stopoverEnd,
        type: '2', // one-way
        sort_by: '2',
      })
      callsUsed++

      const leg2Cheapest = (leg2Data.best_flights || leg2Data.other_flights || [])[0]
      if (!leg2Cheapest) {
        console.log(`[Layover] No flights found for ${candidate.code} → ${destination}`)
        continue
      }

      const leg1Price = leg1Cheapest.price
      const leg2Price = leg2Cheapest.price
      const totalFlightCost = leg1Price + leg2Price
      const savings = directPrice ? directPrice - totalFlightCost : 0
      const savingsPercent = directPrice ? Math.round((savings / directPrice) * 100) : 0

      // Calculate ground costs
      const destCost = getDestinationCost(candidate.code)
      const tierCosts = destCost?.dailyCosts[budgetTier]
      const dailyCost = tierCosts
        ? tierCosts.hotel + tierCosts.food + tierCosts.transport + tierCosts.activities
        : 80 // default estimate
      const totalGroundCost = dailyCost * maxStopoverDays
      const netValue = savings - totalGroundCost

      // Determine verdict
      const verdict: StopoverOpportunity['verdict'] =
        netValue >= 0 ? 'free-vacation'
        : netValue >= -100 ? 'worth-it'
        : netValue >= -300 ? 'splurge'
        : 'skip'

      const costBreakdown = tierCosts || { hotel: 40, food: 20, transport: 10, activities: 10 }

      // Build pitch
      const pitchParts: string[] = []
      if (savings > 0) pitchParts.push(`Save $${savings} on flights`)
      else pitchParts.push(`Flights cost $${Math.abs(savings)} more`)
      pitchParts.push(`${maxStopoverDays} days in ${candidate.city} costs ~$${totalGroundCost}`)
      if (netValue >= 0) pitchParts.push(`Net savings: $${netValue}!`)
      else pitchParts.push(`Extra cost: $${Math.abs(netValue)}`)

      const leg1Airlines = [...new Set<string>(leg1Cheapest.flights.map((f: any) => f.airline))]
      const leg2Airlines = [...new Set<string>(leg2Cheapest.flights.map((f: any) => f.airline))]

      stopovers.push({
        hub: candidate.code,
        hubCity: candidate.city,
        hubCountry: candidate.country,
        visaStatus: candidate.visaStatus,
        visaMaxStay: candidate.visaMaxStay,
        visaNote: candidate.visaNote,
        directPrice: directPrice || 0,
        leg1Price,
        leg2Price,
        totalFlightCost,
        savings,
        savingsPercent,
        leg1Airlines,
        leg1Duration: formatDuration(leg1Cheapest.total_duration),
        leg1Stops: leg1Cheapest.layovers?.length || 0,
        leg2Airlines,
        leg2Duration: formatDuration(leg2Cheapest.total_duration),
        leg2Stops: leg2Cheapest.layovers?.length || 0,
        stopoverDays: maxStopoverDays,
        stopoverDepartDate: departDate,
        stopoverReturnDate: stopoverEnd,
        dailyCost,
        totalGroundCost,
        netValue,
        verdict,
        pitch: pitchParts.join('. ') + '.',
        costBreakdown,
        priceIsLive: true,
        googleFlightsUrl: buildGoogleFlightsMultiCityUrl(origin, candidate.code, destination, departDate, stopoverEnd),
      })

      console.log(`[Layover] ${candidate.city}: $${leg1Price}+$${leg2Price}=$${totalFlightCost} (${verdict}, net:$${netValue})`)
    } catch (err) {
      console.warn(`[Layover] Failed to price ${candidate.code}:`, err instanceof Error ? err.message : err)
    }
  }

  // Sort: visa-free first, then by net value (best financial deal)
  stopovers.sort((a, b) => {
    const visaOrder = { 'visa-free': 0, 'visa-on-arrival': 1, 'e-visa': 2, 'visa-required': 3 }
    const visaDiff = visaOrder[a.visaStatus] - visaOrder[b.visaStatus]
    if (visaDiff !== 0) return visaDiff
    return b.netValue - a.netValue
  })

  const usage = getSerpApiUsage()

  return {
    origin,
    destination,
    departDate,
    arrivalDeadline,
    passportCountry,
    directPrice,
    directAirlines,
    directDuration,
    directStops,
    stopovers,
    serpApiCallsUsed: callsUsed,
    serpApiRemaining: usage.remaining,
  }
}
