/**
 * Zod schemas for validating AI-generated JSON responses.
 *
 * Used with parseAIJSON(content, schema) to catch malformed AI output
 * before it reaches the client and breaks the UI.
 *
 * Schemas are intentionally lenient (coerce numbers, default arrays)
 * because AI output is unpredictable — we want to salvage as much
 * valid data as possible rather than rejecting entire responses.
 */

import { z } from 'zod'

// ── Helpers ──────────────────────────────────────────────────────────────

/** Coerce string/number to number, default 0 */
const num = z.coerce.number().default(0)

/** String with fallback */
const str = (fallback = '') => z.string().default(fallback)

// ── Generic AI Content (from /api/ai-mystery/generic) ────────────────────

export const GenericAIContentSchema = z.object({
  whyVisit: str(''),
  topAttractions: z.array(z.object({
    name: z.string(),
    description: str(''),
  })).default([]),
  localFood: z.array(z.string()).default([]),
  insiderTips: z.array(z.string()).default([]),
  culturalNotes: str(''),
  neighborhoods: z.array(z.string()).default([]),
})

export type GenericAIContentParsed = z.infer<typeof GenericAIContentSchema>

// ── Itinerary + destination info (from /api/ai-mystery/details) ──────────

const ActivitySchema = z.object({
  time: str('12:00 PM'),
  activity: z.string(),
  estimated_cost: num,
})

const DailyItineraryDaySchema = z.object({
  day: z.coerce.number(),
  activities: z.array(ActivitySchema).default([]),
  total_day_cost: num,
})

const SimpleItineraryDaySchema = z.object({
  day: z.coerce.number(),
  activities: z.array(z.string()).default([]),
})

export const ItineraryResponseSchema = z.object({
  daily_itinerary: z.array(DailyItineraryDaySchema).default([]),
  itinerary: z.array(SimpleItineraryDaySchema).optional(),
  whyThisPlace: str('').optional(),
  best_local_food: z.array(z.string()).default([]).optional(),
  insider_tip: str('').optional(),
  bestTimeToGo: str('').optional(),
})

export type ItineraryResponseParsed = z.infer<typeof ItineraryResponseSchema>

// ── Transport (from /api/ai-mystery/details) ─────────────────────────────

export const TransportSchema = z.object({
  local_transportation: z.object({
    airport_to_city: str(''),
    daily_transport: str(''),
    estimated_daily_cost: num,
  }).optional(),
})

export type TransportParsed = z.infer<typeof TransportSchema>

// ── Full mystery response (from /api/ai-mystery fallback) ────────────────

// .passthrough() allows extra fields (Google Flights data etc.) that aren't AI-generated
export const MysteryResponseSchema = z.object({
  destination: z.string(),
  country: z.string(),
  iata: str(''),
  city_code_IATA: str(''),
  indicativeFlightPrice: num,
  estimated_flight_cost: num,
  estimated_hotel_per_night: num,
  whyThisPlace: str(''),
  why_its_perfect: str(''),
  budgetBreakdown: z.object({
    flights: num,
    hotel: num,
    activities: num,
    food: num,
    total: num,
  }).optional(),
  itinerary: z.array(SimpleItineraryDaySchema).default([]),
  bestTimeToGo: str(''),
  localTip: str(''),
  day1: z.array(z.string()).default([]),
  day2: z.array(z.string()).default([]),
  day3: z.array(z.string()).default([]),
  best_local_food: z.array(z.string()).default([]),
  insider_tip: str(''),
  daily_itinerary: z.array(DailyItineraryDaySchema).optional(),
  local_transportation: z.object({
    airport_to_city: str(''),
    daily_transport: str(''),
    estimated_daily_cost: num,
  }).optional(),
  hotel_recommendations: z.array(z.object({
    name: z.string(),
    estimated_price_per_night: num,
    neighborhood: str(''),
    why_recommended: str(''),
  })).optional(),
}).passthrough() // Allow Google Flights fields and other server-added data

export type MysteryResponseParsed = z.infer<typeof MysteryResponseSchema>

// ── City guide (from /api/city-guide) ────────────────────────────────────

export const CityGuideSchema = z.object({
  overview: str(''),
  highlights: z.array(z.string()).default([]),
  neighborhoods: z.array(z.object({
    name: z.string(),
    description: str(''),
    vibe: str(''),
  })).default([]),
  dayPlans: z.array(z.object({
    day: z.coerce.number(),
    theme: str(''),
    activities: z.array(z.object({
      time: str(''),
      activity: z.string(),
      cost: num,
      tip: str(''),
    })).default([]),
  })).default([]),
  practicalTips: z.array(z.string()).default([]),
  budgetTips: z.array(z.string()).default([]),
}).passthrough()

export type CityGuideParsed = z.infer<typeof CityGuideSchema>
