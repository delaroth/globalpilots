/**
 * Unified Flight Search Engine — tiered API strategy.
 *
 * Replaces ad-hoc API calls scattered across multiple files with ONE smart
 * engine that all features use.  Three tiers:
 *
 *   Tier 1 (Free, always)  — TravelPayouts cached prices
 *   Tier 2 (SerpApi)       — Google Flights live data, runs selectively
 *   Tier 3 (FlightAPI.io)  — 700+ airlines incl. budget carriers, runs conditionally
 *
 * AI analysis (DeepSeek) is bolted on for stopover optimization only.
 *
 * Fall-back: if the new engine blows up, callers can still reach
 * serpapi-layover.ts (kept as-is).
 */

import { getSerpApiUsage, searchGoogleFlights } from './flight-providers/serpapi'
import { findCheapestDestinations } from './flight-providers/serpapi-explore'
import { searchFlightApi, isFlightApiAvailable } from './flightapi'
import { getAirportCoords } from '@/data/airport-coordinates'
import { lookupAirportByCode } from './geolocation'
import { checkVisaRequirement, checkBestVisaStatus } from './enrichment/visa'
import { getDestinationCost, type BudgetTier } from './destination-costs'
import { callAI, parseAIJSON } from './ai'
import { trackEvent } from './analytics'

// ─── Constants ──────────────────────────────────────────────────────────────

const TP_TOKEN = process.env.TRAVELPAYOUTS_TOKEN || ''

/** Airports where budget / LCC carriers dominate and Google Flights often
 *  under-represents them.  Presence of either endpoint in this set is
 *  enough to trigger Tier 3 when the other conditions are also met. */
export const BUDGET_AIRLINE_HUBS = new Set([
  // Southeast Asia LCC hubs
  'DMK', 'KUL', 'CGK', 'SUB', 'MNL', 'CEB', 'DEL', 'BOM', 'CCU',
  'HAN', 'SGN', 'DAD', 'RGN', 'LPQ', 'CNX', 'HKT', 'KBV',
  // European LCC airports
  'STN', 'LTN', 'BVA', 'NYO', 'CRL', 'HHN',
  // More EU LCC
  'ALC', 'GRO', 'RYG', 'TPS', 'BGY',
])

/** Airport IATA → country name (for visa checks in stopover flow). */
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
  DMK: 'Thailand', CNX: 'Thailand', HKT: 'Thailand', KBV: 'Thailand',
  CEB: 'Philippines', DAD: 'Vietnam', LPQ: 'Laos', SUB: 'Indonesia',
  CCU: 'India',
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

// ─── Public types ───────────────────────────────────────────────────────────

export interface FlightSearchOptions {
  origin: string
  destination: string
  departDate: string
  returnDate?: string
  /** Control which tiers to use: 1=free only, 2=free+serpapi, 3=all */
  maxTier?: 1 | 2 | 3
  /** Context helps the engine decide which tiers to engage. */
  routeType?: 'direct' | 'stopover-leg' | 'discovery' | 'price-check'
  /** Time-of-day filter: 0=morning(6-12), 1=afternoon(12-18), 2=evening(18-24), 3=night(0-6) */
  departTime?: number
  returnTime?: number
}

export interface FlightSearchResult {
  price: number | null
  source: 'travelpayouts' | 'serpapi' | 'flightapi' | 'ai-estimated'
  confidence: 'cached' | 'live' | 'estimated'
  airlines: string[]
  stops: number | null
  duration: string | null
  /** Prices retrieved from every source (null = that source wasn't called or failed). */
  allPrices: {
    travelpayouts: number | null
    serpapi: number | null
    flightapi: number | null
  }
}

export interface StopoverCandidate {
  hub: string
  hubCity: string
  hubCountry: string
  visaStatus: 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required'
  visaMaxStay?: number
  visaNote?: string
  leg1: FlightSearchResult
  leg2: FlightSearchResult
  totalFlightCost: number
  directPrice: number | null
  savings: number
  savingsPercent: number
  stopoverDays: number
  stopoverDepartDate: string
  stopoverReturnDate: string
  dailyCost: number
  totalGroundCost: number
  netValue: number
  verdict: 'free-vacation' | 'worth-it' | 'splurge' | 'skip'
  pitch: string
  costBreakdown: { hotel: number; food: number; transport: number; activities: number }
  googleFlightsUrl: string
}

export interface StopoverSearchResult {
  origin: string
  destination: string
  departDate: string
  arrivalDeadline: string
  passportCountry: string
  directPrice: number | null
  directAirlines: string[]
  directDuration: string
  directStops: number
  stopovers: StopoverCandidate[]
  /** AI recommendation (DeepSeek), if available. */
  aiRecommendation: string | null
  serpApiCallsUsed: number
  serpApiRemaining: number
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h}h ${m}m`
}

function buildGoogleFlightsMultiCityUrl(
  origin: string, hub: string, destination: string,
  date1: string, date2: string,
): string {
  return `https://www.google.com/travel/flights?q=flights+${origin}+to+${hub}+on+${date1}+then+${hub}+to+${destination}+on+${date2}&curr=USD`
}

// ─── Distance helpers (Haversine) ───────────────────────────────────────────

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth radius km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getDistanceKm(origin: string, destination: string): number | null {
  const o = getAirportCoords(origin)
  const d = getAirportCoords(destination)
  if (!o || !d) return null
  return haversineKm(o.lat, o.lon, d.lat, d.lon)
}

// ─── Region classification (for anomaly heuristic) ─────────────────────────

const SE_ASIA_CODES = new Set([
  'BKK', 'DMK', 'CNX', 'HKT', 'KBV', 'USM', 'SIN', 'KUL', 'PEN', 'LGK',
  'CGK', 'DPS', 'SUB', 'JOG', 'SGN', 'HAN', 'DAD', 'PQC', 'MNL', 'CEB',
  'PNH', 'REP', 'VTE', 'LPQ', 'RGN',
])

const MIDDLE_EAST_CODES = new Set([
  'DXB', 'AUH', 'DOH', 'IST', 'SAW', 'AYT', 'TLV', 'AMM', 'CAI',
  'RUH', 'JED', 'MCT', 'KWI', 'BAH',
])

const EUROPE_CODES = new Set([
  'LHR', 'LGW', 'STN', 'CDG', 'ORY', 'AMS', 'MAD', 'BCN', 'LIS', 'OPO',
  'PRG', 'BUD', 'ATH', 'FCO', 'MXP', 'VCE', 'FRA', 'MUC', 'BER', 'VIE',
  'WAW', 'CPH', 'DUB', 'ZRH', 'GVA', 'ARN', 'OSL', 'HEL', 'BRU',
  'OTP', 'SOF', 'ZAG', 'BEG', 'LJU', 'KEF', 'EDI', 'MAN', 'KRK',
])

function getRegion(code: string): 'se-asia' | 'middle-east' | 'europe' | 'other' {
  if (SE_ASIA_CODES.has(code)) return 'se-asia'
  if (MIDDLE_EAST_CODES.has(code)) return 'middle-east'
  if (EUROPE_CODES.has(code)) return 'europe'
  return 'other'
}

/**
 * Simple distance-based price anomaly detection.
 *
 * Returns true when the given price looks suspiciously high relative to the
 * route distance / region pair.  Used to decide whether Tier 3 is worth
 * burning credits on.
 */
export function isPriceAnomalous(origin: string, destination: string, price: number): boolean {
  const oRegion = getRegion(origin)
  const dRegion = getRegion(destination)

  // SE Asia domestic
  if (oRegion === 'se-asia' && dRegion === 'se-asia' && price > 200) return true
  // SE Asia <-> Middle East
  if (
    (oRegion === 'se-asia' && dRegion === 'middle-east') ||
    (oRegion === 'middle-east' && dRegion === 'se-asia')
  ) {
    if (price > 600) return true
  }
  // SE Asia <-> Europe
  if (
    (oRegion === 'se-asia' && dRegion === 'europe') ||
    (oRegion === 'europe' && dRegion === 'se-asia')
  ) {
    if (price > 800) return true
  }

  // Generic: use a $/km heuristic for other pairs
  const dist = getDistanceKm(origin, destination)
  if (dist && dist > 0) {
    const centsPerKm = (price * 100) / dist
    // > 20 cents/km is on the high side for economy
    if (centsPerKm > 20) return true
  }

  return false
}

// ─── Tier 1: TravelPayouts (free, cached) ───────────────────────────────────

async function getTravelPayoutsPrice(
  origin: string,
  destination: string,
): Promise<number | null> {
  if (!TP_TOKEN) return null
  try {
    const res = await fetch(
      `https://api.travelpayouts.com/v2/prices/latest?origin=${origin}&destination=${destination}&currency=usd&one_way=false&limit=1&token=${TP_TOKEN}`,
      { signal: AbortSignal.timeout(5000) },
    )
    if (!res.ok) return null
    const data = await res.json()
    const cheapest = data?.data?.[0]
    return cheapest?.value ?? null
  } catch {
    return null
  }
}

/** Batch discovery: get ALL cheap destinations from an origin via TravelPayouts. */
async function getTravelPayoutsBatch(
  origin: string,
  limit = 30,
): Promise<{ destination: string; price: number }[]> {
  if (!TP_TOKEN) return []
  try {
    const res = await fetch(
      `https://api.travelpayouts.com/v2/prices/latest?origin=${origin}&currency=usd&one_way=false&limit=${limit}&token=${TP_TOKEN}`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data?.data || [])
      .filter((d: any) => d.destination && d.value > 0)
      .map((d: any) => ({ destination: d.destination as string, price: d.value as number }))
  } catch {
    return []
  }
}

// ─── Discovery: cheapest destinations from an origin (free-first) ────────────

export interface DiscoverDestination {
  destination: string
  city?: string
  country?: string
  price: number
  startDate?: string
  endDate?: string
  airline?: string
  stops?: number
  hotelPrice?: number | null
  thumbnail?: string | null
}

/**
 * Discover cheapest destinations from an origin. Uses TravelPayouts (free) first,
 * falls back to SerpApi Explore only if TravelPayouts returns nothing.
 */
export async function discoverCheapDestinations(params: {
  origin: string
  maxPrice?: number
  month?: number
  limit?: number
  /** SerpApi Explore params — only used if TravelPayouts returns empty */
  travelDuration?: 1 | 2 | 3
  interest?: string
}): Promise<{
  destinations: DiscoverDestination[]
  source: string
}> {
  const { origin, maxPrice, month, limit = 30, travelDuration, interest } = params

  // ── Tier 1: TravelPayouts batch (free) ──
  try {
    const tpResults = await getTravelPayoutsBatch(origin, Math.max(limit, 40))
    const filtered = maxPrice
      ? tpResults.filter(d => d.price <= maxPrice)
      : tpResults

    if (filtered.length > 0) {
      console.log(`[FlightEngine] discoverCheap: TravelPayouts returned ${filtered.length} destinations from ${origin}`)
      return {
        destinations: filtered.slice(0, limit).map(d => {
          const airport = lookupAirportByCode(d.destination)
          return {
            destination: d.destination,
            city: airport?.city || d.destination,
            country: airport?.country || '',
            price: d.price,
          }
        }),
        source: 'travelpayouts',
      }
    }
  } catch (err) {
    console.warn('[FlightEngine] discoverCheap: TravelPayouts failed:', err instanceof Error ? err.message : err)
  }

  // ── Fallback: SerpApi Explore (costs 1 credit) ──
  try {
    console.log(`[FlightEngine] discoverCheap: TravelPayouts empty, falling back to SerpApi Explore`)
    const exploreDests = await findCheapestDestinations({
      origin,
      maxPrice,
      month,
      travelDuration,
      interest,
    })

    if (exploreDests.length > 0) {
      console.log(`[FlightEngine] discoverCheap: SerpApi Explore returned ${exploreDests.length} destinations`)
      return {
        destinations: exploreDests.slice(0, limit).map(d => ({
          destination: d.airportCode,
          city: d.name,
          country: d.country,
          price: d.flightPrice,
          startDate: d.startDate,
          endDate: d.endDate,
          airline: d.airline,
          stops: d.stops,
          hotelPrice: d.hotelPrice,
          thumbnail: d.thumbnail,
        })),
        source: 'serpapi-explore',
      }
    }
  } catch (err) {
    console.warn('[FlightEngine] discoverCheap: SerpApi Explore failed:', err instanceof Error ? err.message : err)
  }

  console.log(`[FlightEngine] discoverCheap: No destinations found for ${origin}`)
  return { destinations: [], source: 'none' }
}

// ─── Validate-before-commit: check top candidates with SerpApi ────────────

export interface CandidateDestination {
  destination: string // IATA code
  city?: string
  country?: string
  tpPrice: number    // TravelPayouts estimate
  score: number      // vibe/visa/budget score
  originAirport?: string // Which origin airport found this deal (e.g., DMK)
}

export interface ValidatedCandidate extends CandidateDestination {
  livePrice: number | null
  airlines: string[]
  stops: number
  duration: string
  isLive: boolean
  status: 'accepted' | 'marginal' | 'rejected'
  rejectReason?: string
  validatedOrigin?: string // The origin airport used for validation
}

/**
 * Validate top candidates with SerpApi in parallel.
 * Returns the best validated destination, or null if all fail.
 *
 * Uses 1 SerpApi call per candidate (parallel). Default: validate top 3.
 * Cost: 3 credits per mystery search on average.
 */
export async function validateCandidatesWithSerpApi(params: {
  origins: string[] // All origin airport codes (e.g., ['BKK', 'DMK'])
  candidates: CandidateDestination[]
  departDate: string
  returnDate?: string
  maxValidations?: number     // default 3
  priceToleranceRatio?: number // accept if live <= TP * this (default 1.5)
  maxBudget: number           // absolute flight budget ceiling
}): Promise<{
  validated: ValidatedCandidate | null
  all: ValidatedCandidate[]
  serpApiCallsUsed: number
}> {
  const {
    origins,
    candidates,
    departDate,
    returnDate,
    maxValidations = 3,
    priceToleranceRatio = 1.5,
    maxBudget,
  } = params

  const usage = getSerpApiUsage()
  // Budget guard: if low on credits, reduce validations
  const creditsAvailable = Math.max(0, usage.remaining - 5) // keep 5 in reserve
  const numToValidate = Math.min(maxValidations, candidates.length, creditsAvailable)

  if (numToValidate === 0) {
    console.log('[FlightEngine] SerpApi quota too low for validation, using TP estimates')
    return {
      validated: null,
      all: candidates.map(c => ({
        ...c, livePrice: null, airlines: [], stops: 0, duration: '',
        isLive: false, status: 'marginal' as const, rejectReason: 'no-serpapi-credits',
      })),
      serpApiCallsUsed: 0,
    }
  }

  const toValidate = candidates.slice(0, numToValidate)
  const primaryOrigin = origins[0]

  console.log(`[FlightEngine] Validating up to ${toValidate.length} candidates sequentially (${usage.remaining} credits remaining)`)

  // Validate SEQUENTIALLY — stop as soon as one is accepted.
  // Saves 1-2 SerpApi calls when the first candidate is accurate.
  const validated: ValidatedCandidate[] = []
  let callsUsed = 0
  let earlyWinner: ValidatedCandidate | null = null

  for (const candidate of toValidate) {
    // Stop if we already found an accepted candidate
    if (earlyWinner) break

    callsUsed++
    let result: Awaited<ReturnType<typeof getSerpApiPrice>> = null
    // Use the candidate's specific origin airport (e.g., DMK if that's where the deal was found)
    const searchOrigin = candidate.originAirport || primaryOrigin

    try {
      result = await getSerpApiPrice(
        searchOrigin,
        candidate.destination,
        departDate,
        returnDate,
      )
    } catch {
      validated.push({
        ...candidate,
        livePrice: null, airlines: [], stops: 0, duration: '',
        isLive: false, status: 'rejected', rejectReason: 'serpapi-failed',
      })
      continue
    }

    if (!result || result.price === null) {
      validated.push({
        ...candidate,
        livePrice: null, airlines: result?.airlines || [], stops: result?.stops || 0,
        duration: result?.duration || '', isLive: false,
        status: 'rejected', rejectReason: 'no-flights',
      })
      continue
    }

    const livePrice = result.price

    // Determine acceptance
    const withinTolerance = livePrice <= candidate.tpPrice * priceToleranceRatio
    const withinBudget = livePrice <= maxBudget
    const marginallyOk = livePrice <= candidate.tpPrice * 2.0 && livePrice <= maxBudget * 1.3

    let status: ValidatedCandidate['status']
    let rejectReason: string | undefined

    if (withinTolerance && withinBudget) {
      status = 'accepted'
    } else if (marginallyOk) {
      status = 'marginal'
      rejectReason = withinBudget ? 'price-higher-than-expected' : 'slightly-over-budget'
    } else {
      status = 'rejected'
      rejectReason = !withinBudget ? 'over-budget' : 'price-too-high'
    }

    const entry: ValidatedCandidate = {
      ...candidate,
      livePrice, airlines: result.airlines, stops: result.stops,
      duration: result.duration, isLive: true, status, rejectReason,
      validatedOrigin: searchOrigin,
    }
    validated.push(entry)

    console.log(`[FlightEngine] ${candidate.city || candidate.destination}: TP $${candidate.tpPrice} → Live $${livePrice} → ${status}${rejectReason ? ` (${rejectReason})` : ''}`)

    // If accepted, stop immediately — no need to check more candidates
    if (status === 'accepted') {
      earlyWinner = entry
      console.log(`[FlightEngine] Accepted on candidate ${callsUsed}/${toValidate.length} — saved ${toValidate.length - callsUsed} SerpApi calls`)
    }
  }

  // Pick best: early winner, or best marginal from those checked
  const winner = earlyWinner
    || validated.filter(v => v.status === 'marginal').sort((a, b) => b.score - a.score)[0]
    || null

  if (winner) {
    console.log(`[FlightEngine] Winner: ${winner.city || winner.destination} at $${winner.livePrice} (${winner.status}) — used ${callsUsed} SerpApi calls`)
  } else {
    console.log(`[FlightEngine] All ${callsUsed} candidates failed validation`)
  }

  return { validated: winner, all: validated, serpApiCallsUsed: callsUsed }
}

// ─── Tier 2: SerpApi Google Flights (live) ──────────────────────────────────

async function getSerpApiPrice(
  origin: string,
  destination: string,
  departDate: string,
  returnDate?: string,
  departTime?: number,
  returnTime?: number,
): Promise<{
  price: number | null
  airlines: string[]
  stops: number
  duration: string
} | null> {
  const usage = getSerpApiUsage()
  if (usage.remaining < 10) {
    console.log(`[FlightEngine] SerpApi quota low (${usage.remaining}), skipping`)
    return null
  }
  try {
    const { bestFlights, otherFlights } = await searchGoogleFlights({
      origin,
      destination,
      outboundDate: departDate,
      returnDate,
      outboundTimes: departTime,
      returnTimes: returnTime,
    })
    const all = [...bestFlights, ...otherFlights]
    if (all.length === 0) return null
    const cheapest = all[0]
    return {
      price: cheapest.price,
      airlines: [...new Set<string>(cheapest.flights.map((f: any) => f.airline))],
      stops: cheapest.layovers?.length || 0,
      duration: formatDuration(cheapest.total_duration),
    }
  } catch (err) {
    console.warn('[FlightEngine] SerpApi error:', err instanceof Error ? err.message : err)
    return null
  }
}

// ─── Tier 3: FlightAPI.io (budget-airline coverage) ─────────────────────────

async function getFlightApiPrice(
  origin: string,
  destination: string,
  date: string,
): Promise<number | null> {
  if (!isFlightApiAvailable()) return null
  try {
    const results = await searchFlightApi({ origin, destination, departDate: date, adults: 1, currency: 'USD' })
    if (results.length === 0) return null
    return Math.min(...results.map((r) => r.price))
  } catch {
    return null
  }
}

// ─── Tier decision logic ────────────────────────────────────────────────────

function shouldRunTier2(opts: FlightSearchOptions, tpPrice: number | null): boolean {
  if ((opts.maxTier ?? 3) < 2) return false

  // Always for price-check and direct baselines
  if (opts.routeType === 'price-check' || opts.routeType === 'direct') return true

  // If TravelPayouts returned nothing we need live data
  if (tpPrice === null) return true

  // Discovery uses TP only
  if (opts.routeType === 'discovery') return false

  // Stopover legs: run tier 2 so we get reliable per-leg prices
  if (opts.routeType === 'stopover-leg') return true

  // Default: run tier 2 for exact searches
  return true
}

function shouldRunTier3(
  opts: FlightSearchOptions,
  tpPrice: number | null,
  serpPrice: number | null,
): boolean {
  if ((opts.maxTier ?? 3) < 3) return false
  if (!isFlightApiAvailable()) return false

  const { origin, destination } = opts

  // Budget airline hub → likely missing LCCs in Google Flights
  if (BUDGET_AIRLINE_HUBS.has(origin) || BUDGET_AIRLINE_HUBS.has(destination)) {
    return true
  }

  // Tier 1 + 2 prices disagree by >40 %
  if (tpPrice !== null && serpPrice !== null) {
    const diff = Math.abs(tpPrice - serpPrice)
    const avg = (tpPrice + serpPrice) / 2
    if (avg > 0 && diff / avg > 0.4) return true
  }

  // Tier 2 returned nothing but Tier 1 did (budget-airline-only route?)
  if (serpPrice === null && tpPrice !== null) return true

  // Price seems anomalously high
  const referencePrice = serpPrice ?? tpPrice
  if (referencePrice !== null && isPriceAnomalous(origin, destination, referencePrice)) {
    return true
  }

  return false
}

// ─── Core search function ───────────────────────────────────────────────────

/**
 * Search for flights using a tiered API strategy.
 *
 * Tier 1 always fires (free).  Tier 2 and 3 are gated by `maxTier`,
 * `routeType`, quota availability, and smart heuristics.
 */
export async function searchFlight(opts: FlightSearchOptions): Promise<FlightSearchResult> {
  const { origin, destination, departDate, returnDate } = opts

  // ── Tier 1: TravelPayouts (always) ──
  const tpPrice = await getTravelPayoutsPrice(origin, destination)

  // ── Tier 2: SerpApi (selective) ──
  let serpResult: Awaited<ReturnType<typeof getSerpApiPrice>> = null
  if (shouldRunTier2(opts, tpPrice)) {
    serpResult = await getSerpApiPrice(origin, destination, departDate, returnDate, opts.departTime, opts.returnTime)
  }
  const serpPrice = serpResult?.price ?? null

  // ── Tier 3: FlightAPI.io (conditional) ──
  let faPrice: number | null = null
  let faTriggerReason: string | null = null
  if (shouldRunTier3(opts, tpPrice, serpPrice)) {
    faTriggerReason =
      BUDGET_AIRLINE_HUBS.has(origin) || BUDGET_AIRLINE_HUBS.has(destination)
        ? 'budget_hub'
        : serpPrice === null && tpPrice !== null
          ? 'serpapi_miss'
          : tpPrice !== null && serpPrice !== null && Math.abs(tpPrice - serpPrice) / ((tpPrice + serpPrice) / 2) > 0.4
            ? 'price_disagreement'
            : 'price_anomaly'
    faPrice = await getFlightApiPrice(origin, destination, departDate)
  }

  // ── Pick winner ──
  const allPrices = { travelpayouts: tpPrice, serpapi: serpPrice, flightapi: faPrice }
  const validPrices: { price: number; source: FlightSearchResult['source']; confidence: FlightSearchResult['confidence'] }[] = []

  if (tpPrice !== null) validPrices.push({ price: tpPrice, source: 'travelpayouts', confidence: 'cached' })
  if (serpPrice !== null) validPrices.push({ price: serpPrice, source: 'serpapi', confidence: 'live' })
  if (faPrice !== null) validPrices.push({ price: faPrice, source: 'flightapi', confidence: 'live' })

  validPrices.sort((a, b) => a.price - b.price)
  const winner = validPrices[0] ?? null

  const result: FlightSearchResult = {
    price: winner?.price ?? null,
    source: winner?.source ?? 'travelpayouts',
    confidence: winner?.confidence ?? 'estimated',
    airlines: serpResult?.airlines ?? [],
    stops: serpResult?.stops ?? null,
    duration: serpResult?.duration ?? null,
    allPrices,
  }

  // ── Track ──
  const tierUsed = faPrice !== null ? 3 : serpPrice !== null ? 2 : 1
  trackEvent('flight_search_tiered', {
    route: `${origin}-${destination}`,
    tier_used: tierUsed,
    prices_by_source: allPrices,
    winner: winner?.source ?? 'none',
    flightapi_triggered_reason: faTriggerReason,
    credits_used: faPrice !== null ? 2 : 0,
  })

  console.log(
    `[FlightEngine] ${origin}->${destination}: TP=$${tpPrice ?? 'N/A'} Serp=$${serpPrice ?? 'N/A'} FA=$${faPrice ?? 'N/A'} → $${result.price ?? 'N/A'} (${result.source}, tier ${tierUsed})`,
  )

  return result
}

// ─── Stopover search ────────────────────────────────────────────────────────

/**
 * Discover and price stopover opportunities using the tiered engine.
 *
 * 1. Discovery (free) — TravelPayouts batch
 * 2. Visa filter (free)
 * 3. Price legs (tiered)
 * 4. AI analysis (DeepSeek, cheap) — ranks the final candidates
 */
export async function searchStopoverRoutes(params: {
  origin: string
  destination: string
  departDate: string
  maxTravelDays: number
  passportCountry: string
  passportCountries?: string[]
  budgetTier?: BudgetTier
}): Promise<StopoverSearchResult> {
  const {
    origin,
    destination,
    departDate,
    maxTravelDays,
    passportCountry,
    passportCountries,
    budgetTier = 'mid',
  } = params

  const maxStopoverDays = Math.min(Math.floor(maxTravelDays / 3), 5)
  const arrivalDeadline = new Date(
    new Date(departDate + 'T00:00:00').getTime() + maxTravelDays * 86400000,
  ).toISOString().split('T')[0]

  let serpApiCallsUsed = 0

  // ── STEP 1: Direct price (tiered) ──
  console.log(`[FlightEngine] Step 1: Direct ${origin} -> ${destination}`)
  const directResult = await searchFlight({
    origin,
    destination,
    departDate,
    routeType: 'direct',
    maxTier: 3,
  })
  // SerpApi used 1 call for the direct search if tier 2 was engaged
  if (directResult.allPrices.serpapi !== null) serpApiCallsUsed++

  const directPrice = directResult.price
  const directAirlines = directResult.airlines
  const directDuration = directResult.duration || ''
  const directStops = directResult.stops ?? 0

  // ── STEP 2: Discovery (free) — find natural hub cities via TravelPayouts ──
  console.log(`[FlightEngine] Step 2: Discovering hub cities from ${origin}`)
  const tpBatch = await getTravelPayoutsBatch(origin, 50)

  // Also get SerpApi connecting cities if we have quota
  const connectingCities = new Map<string, { count: number; city: string }>()
  const usage = getSerpApiUsage()
  if (usage.remaining > 15) {
    try {
      const discoveryData = await searchGoogleFlights({
        origin,
        destination,
        outboundDate: departDate,
      })
      serpApiCallsUsed++
      const allFlights = [...(discoveryData.bestFlights || []), ...(discoveryData.otherFlights || [])]
      for (const flight of allFlights) {
        if ((flight as any).layovers) {
          for (const layover of (flight as any).layovers) {
            const code = layover.id
            if (code && code !== origin && code !== destination) {
              const existing = connectingCities.get(code) || { count: 0, city: layover.name?.split(' ')[0] || code }
              connectingCities.set(code, { count: existing.count + 1, city: existing.city })
            }
          }
        }
      }
    } catch (err) {
      console.warn('[FlightEngine] Discovery SerpApi failed:', err instanceof Error ? err.message : err)
    }
  }

  // Merge TP batch destinations and SerpApi connecting cities into one candidate list
  const hubPool = new Set<string>()
  for (const { destination: dest } of tpBatch) {
    if (dest !== origin && dest !== destination) hubPool.add(dest)
  }
  for (const code of connectingCities.keys()) {
    hubPool.add(code)
  }

  console.log(`[FlightEngine] Hub pool: ${hubPool.size} candidates`)

  // ── STEP 3: Visa filter + rank candidates ──
  interface Candidate {
    code: string
    city: string
    country: string
    visaStatus: 'visa-free' | 'visa-on-arrival' | 'e-visa' | 'visa-required'
    visaMaxStay?: number
    visaNote?: string
    frequency: number
    tpPrice: number | null
    score: number
  }

  const candidates: Candidate[] = []

  for (const code of hubPool) {
    const country = getCountryForAirport(code)
    if (!country) continue

    const visa = passportCountries && passportCountries.length > 1
      ? checkBestVisaStatus(passportCountries, country)
      : checkVisaRequirement(passportCountry, country)

    const connectInfo = connectingCities.get(code)
    const frequency = connectInfo?.count ?? 0
    const city = connectInfo?.city ?? code
    const hasCosts = !!getDestinationCost(code)
    const tpEntry = tpBatch.find(e => e.destination === code)
    const tpPrice = tpEntry?.price ?? null

    const visaScore =
      visa.status === 'visa-free' ? 100
        : visa.status === 'visa-on-arrival' ? 75
          : visa.status === 'e-visa' ? 50
            : 0
    const score = visaScore + frequency * 5 + (hasCosts ? 20 : 0) + (tpPrice !== null ? 10 : 0)

    candidates.push({
      code,
      city,
      country,
      visaStatus: visa.status,
      visaMaxStay: visa.maxStay,
      visaNote: visa.note,
      frequency,
      tpPrice,
      score,
    })
  }

  candidates.sort((a, b) => b.score - a.score)
  const topCandidates = candidates
    .filter(c => c.visaStatus !== 'visa-required')
    .slice(0, 3)

  // If no visa-accessible candidates, take the top 2 regardless
  if (topCandidates.length === 0) {
    topCandidates.push(...candidates.slice(0, 2))
  }

  console.log(`[FlightEngine] Top candidates: ${topCandidates.map(c => `${c.code}(${c.visaStatus},score:${c.score})`).join(', ')}`)

  // ── STEP 4: Price each stopover leg (tiered) ──
  const stopovers: StopoverCandidate[] = []

  for (const candidate of topCandidates) {
    const stopoverEnd = new Date(
      new Date(departDate + 'T00:00:00').getTime() + maxStopoverDays * 86400000,
    ).toISOString().split('T')[0]

    try {
      console.log(`[FlightEngine] Step 4: Pricing ${origin}->${candidate.code}->${destination}`)

      // Price both legs in parallel via the tiered engine
      const [leg1, leg2] = await Promise.all([
        searchFlight({
          origin,
          destination: candidate.code,
          departDate,
          routeType: 'stopover-leg',
          maxTier: 3,
        }),
        searchFlight({
          origin: candidate.code,
          destination,
          departDate: stopoverEnd,
          routeType: 'stopover-leg',
          maxTier: 3,
        }),
      ])

      // Track SerpApi calls used by the legs
      if (leg1.allPrices.serpapi !== null) serpApiCallsUsed++
      if (leg2.allPrices.serpapi !== null) serpApiCallsUsed++

      if (leg1.price === null || leg2.price === null) {
        console.log(`[FlightEngine] No price for ${candidate.code} legs, skipping`)
        continue
      }

      const totalFlightCost = leg1.price + leg2.price
      const savings = directPrice ? directPrice - totalFlightCost : 0
      const savingsPercent = directPrice ? Math.round((savings / directPrice) * 100) : 0

      // Ground costs
      const destCost = getDestinationCost(candidate.code)
      const tierCosts = destCost?.dailyCosts[budgetTier]
      const dailyCost = tierCosts
        ? tierCosts.hotel + tierCosts.food + tierCosts.transport + tierCosts.activities
        : 80
      const totalGroundCost = dailyCost * maxStopoverDays
      const netValue = savings - totalGroundCost

      const verdict: StopoverCandidate['verdict'] =
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

      stopovers.push({
        hub: candidate.code,
        hubCity: candidate.city,
        hubCountry: candidate.country,
        visaStatus: candidate.visaStatus,
        visaMaxStay: candidate.visaMaxStay,
        visaNote: candidate.visaNote,
        leg1,
        leg2,
        totalFlightCost,
        directPrice,
        savings,
        savingsPercent,
        stopoverDays: maxStopoverDays,
        stopoverDepartDate: departDate,
        stopoverReturnDate: stopoverEnd,
        dailyCost,
        totalGroundCost,
        netValue,
        verdict,
        pitch: pitchParts.join('. ') + '.',
        costBreakdown,
        googleFlightsUrl: buildGoogleFlightsMultiCityUrl(origin, candidate.code, destination, departDate, stopoverEnd),
      })

      console.log(`[FlightEngine] ${candidate.city}: $${leg1.price}+$${leg2.price}=$${totalFlightCost} (${verdict}, net:$${netValue})`)
    } catch (err) {
      console.warn(`[FlightEngine] Failed to price ${candidate.code}:`, err instanceof Error ? err.message : err)
    }
  }

  // Sort: visa-free first, then by net value
  stopovers.sort((a, b) => {
    const visaOrder: Record<string, number> = { 'visa-free': 0, 'visa-on-arrival': 1, 'e-visa': 2, 'visa-required': 3 }
    const visaDiff = (visaOrder[a.visaStatus] ?? 3) - (visaOrder[b.visaStatus] ?? 3)
    if (visaDiff !== 0) return visaDiff
    return b.netValue - a.netValue
  })

  // ── STEP 5: AI analysis (DeepSeek — cheap, stopover only) ──
  let aiRecommendation: string | null = null
  if (stopovers.length >= 2) {
    try {
      const aiInput = stopovers.map(s => ({
        city: s.hubCity,
        country: s.hubCountry,
        visa: s.visaStatus,
        leg1Price: s.leg1.price,
        leg2Price: s.leg2.price,
        totalFlight: s.totalFlightCost,
        directPrice: s.directPrice,
        savings: s.savings,
        dailyCost: s.dailyCost,
        stopoverDays: s.stopoverDays,
        groundCost: s.totalGroundCost,
        netValue: s.netValue,
      }))

      const systemPrompt = 'You are a travel optimization expert. Respond with a JSON object: { "recommendation": "<city>", "reasoning": "<1-2 sentences>" }'
      const userPrompt = `Given these stopover options for a flight from ${origin} to ${destination} (direct price: $${directPrice ?? 'unknown'}), which offers the best value? Consider: flight savings, visa requirements, daily costs, connection logistics.\n\nOptions:\n${JSON.stringify(aiInput, null, 2)}`

      const aiResponse = await callAI(systemPrompt, userPrompt, 0.3, 200)
      try {
        const parsed = parseAIJSON<{ recommendation: string; reasoning: string }>(aiResponse.content)
        aiRecommendation = `${parsed.recommendation}: ${parsed.reasoning}`
      } catch {
        // If JSON parsing fails, use the raw content truncated
        aiRecommendation = aiResponse.content.slice(0, 300)
      }
      console.log(`[FlightEngine] AI recommendation: ${aiRecommendation}`)
    } catch (err) {
      console.warn('[FlightEngine] AI analysis failed:', err instanceof Error ? err.message : err)
    }
  }

  const finalUsage = getSerpApiUsage()

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
    aiRecommendation,
    serpApiCallsUsed,
    serpApiRemaining: finalUsage.remaining,
  }
}
