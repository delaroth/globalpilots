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

// ── AI Itinerary (from /api/ai-itinerary) ──────────────────────────────

export const AIItinerarySchema = z.object({
  destination: str(''),
  days: z.coerce.number().default(0),
  vibe: str(''),
  itinerary: z.array(z.object({
    day: z.coerce.number(),
    title: str(''),
    activities: z.array(z.string()).default([]),
    meals: z.array(z.string()).default([]),
  })).default([]),
  tips: z.array(z.string()).default([]),
  budget_estimate: z.object({
    accommodation_per_night: num,
    food_per_day: num,
    activities_per_day: num,
    total: num,
  }).default({ accommodation_per_night: 0, food_per_day: 0, activities_per_day: 0, total: 0 }),
}).passthrough()

export type AIItineraryParsed = z.infer<typeof AIItinerarySchema>

// ── Predict (from /api/ai-predict) ──────────────────────────────────────

export const PredictResponseSchema = z.object({
  action: z.enum(['BUY_NOW', 'WAIT']).default('WAIT'),
  reason: str(''),
  confidence: z.enum(['low', 'medium', 'high']).default('medium'),
})

export type PredictResponseParsed = z.infer<typeof PredictResponseSchema>

// ── Parse (from /api/ai-parse) ──────────────────────────────────────────

export const ParseResponseSchema = z.object({
  origin: z.string().nullable().default(null),
  destination: z.string().nullable().default(null),
  budget: z.number().nullable().default(null),
  dates: z.string().nullable().default(null),
  vibe: z.array(z.string()).default([]),
  confidence: z.enum(['low', 'medium', 'high']).default('medium'),
})

export type ParseResponseParsed = z.infer<typeof ParseResponseSchema>

// ── Day Trip (from /api/day-trip) ───────────────────────────────────────

const DayTripActivitySchema = z.object({
  time: str(''),
  activity: str(''),
  cost: num,
  transport: str('').optional(),
})

const DayTripMealSchema = z.object({
  meal: str(''),
  suggestion: str(''),
  priceRange: str(''),
  cost: num,
})

const DayTripDaySchema = z.object({
  day: z.coerce.number(),
  morning: z.array(DayTripActivitySchema).default([]),
  afternoon: z.array(DayTripActivitySchema).default([]),
  evening: z.array(DayTripActivitySchema).default([]),
  meals: z.array(DayTripMealSchema).default([]),
  dailyTotal: num,
})

export const DayTripResponseSchema = z.object({
  itinerary: z.array(DayTripDaySchema).default([]),
  tips: z.array(z.string()).default([]),
  totalEstimatedCost: num,
}).passthrough()

export type DayTripResponseParsed = z.infer<typeof DayTripResponseSchema>

// ── Blog Content (from /api/blog/generate) ──────────────────────────────

export const BlogContentSchema = z.object({
  seo_title: str(''),
  meta_description: str(''),
  sections: z.object({
    why_visit: str(''),
    best_time_to_visit: str(''),
    budget_breakdown: str(''),
    top_attractions: str(''),
    local_food_guide: str(''),
    money_saving_tips: str(''),
    safety_tips: str(''),
    disclaimer: str('').optional(),
  }).default({
    why_visit: '', best_time_to_visit: '', budget_breakdown: '',
    top_attractions: '', local_food_guide: '', money_saving_tips: '',
    safety_tips: '',
  }),
})

export type BlogContentParsed = z.infer<typeof BlogContentSchema>

// ── Multi-City AI result (from /api/multi-city) ─────────────────────────

const MultiCityCityStopSchema = z.object({
  code: str(''),
  name: str(''),
  country: str(''),
  days: z.coerce.number().default(0),
  estimatedFlightCost: num,
  estimatedDailyCost: num,
  highlights: z.array(z.string()).default([]),
  arriveDate: str('').optional(),
  departDate: str('').optional(),
})

export const MultiCityAIResultSchema = z.object({
  cities: z.array(MultiCityCityStopSchema).default([]),
  totalEstimatedCost: num,
  returnFlightCost: num.optional(),
  reasoning: str(''),
}).passthrough()

export type MultiCityAIResultParsed = z.infer<typeof MultiCityAIResultSchema>

// ── Plan Trip AI result (from /api/plan-trip) ───────────────────────────
// The AI returns fields like whyThisPlace, bestTimeToGo, daily_itinerary, etc.
// Server adds destination, country, iata, flight costs, hotel_recommendations afterward.

export const PlanTripAIResultSchema = z.object({
  whyThisPlace: str(''),
  bestTimeToGo: str(''),
  localTip: str(''),
  best_local_food: z.array(z.string()).default([]),
  budgetBreakdown: z.object({
    flights: num,
    hotel: num,
    activities: num,
    food: num,
    total: num,
  }).optional(),
  daily_itinerary: z.array(DailyItineraryDaySchema).default([]),
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
}).passthrough() // Server adds destination, iata, flight costs, etc.

export type PlanTripAIResultParsed = z.infer<typeof PlanTripAIResultSchema>
