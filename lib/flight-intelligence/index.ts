// ─── Globepilots Intelligence Layer ───
// Central barrel export for the API-agnostic flight middleware.
//
// Usage:
//   import { mergeOffers, calculateConfidence, stitchItinerary } from '@/lib/flight-intelligence'

// Deduplication
export { simpleHash, physicalFlightHash, bookableOfferHash, stampHashes, groupByOfferHash } from './dedup'

// Confidence scoring
export { calculateConfidence, inferRouteVolatility } from './confidence'
export type { ConfidenceInput, ConfidenceResult, RouteVolatility } from './confidence'

// Offer normalization & merging
export { mergeOffers, mergeMultiProviderResults } from './merge'
export type { MergedOffer, AlternativePrice } from './merge'

// Stopover arbitrage engine
export { stitchItinerary, layoverRouteToStitchedItinerary } from './stopover'
export type { StitchedItinerary, ConnectionInfo, ItineraryType } from './stopover'

// 2-tier search gating (with Duffel sandbox enforcement)
export { getSearchTier, getDuffelConfig, isCacheValid, annotateForUI, shouldShowLivePriceBanner } from './search-gate'
export type { SearchTier, TieredSearchConfig, AnnotatedOffer, UIAnnotation } from './search-gate'

// Metadata enrichment (Phase 4 placeholder)
export { enrichOffers, enrichSegment, calculateReliabilityScore } from './enrichment'
export type { AircraftSpec, OnTimePerformance, GateStatus, EnrichedOffer, EnrichedSegment } from './enrichment'

// Side Quest value calculator (layover economics)
export { calculateSideQuestValue, rankSideQuests, formatForAIPrompt } from './side-quest'
export type { SideQuestCandidate, SideQuestVerdict } from './side-quest'

// Trip & package data model (with stealth status guards)
export {
  buildMysteryTrip, buildMultiCityTrip, buildLayoverTrip,
  safeTripStatus, safeSegmentStatus,
} from './trips'
export type {
  Trip, TripSegment, TripStatus, TripType, SegmentType, SegmentStatus,
  FlightSegmentDetails, HotelSegmentDetails, ActivitySegmentDetails, TransportSegmentDetails,
} from './trips'
