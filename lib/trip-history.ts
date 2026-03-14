// ---------------------------------------------------------------------------
// Trip Persistence — localStorage-based system for saving mystery reveals
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'gp_trips'
const MAX_TRIPS = 50

export interface SavedTrip {
  id: string
  destination: string
  country: string
  iata: string
  flightPrice: number
  totalCost: number
  tripDuration: number
  departDate: string
  origin: string
  vibes: string[]
  timestamp: number
  isBooked: boolean
  enrichment?: {
    flag?: string
    climate?: { avgTempC: number; description: string }
    visa?: { status: string; maxStay?: number }
    exchangeRate?: { formatted: string }
    safety?: { level: number; label: string }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function readTrips(): SavedTrip[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeTrips(trips: SavedTrip[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Save a trip to localStorage. Auto-prunes oldest when over MAX_TRIPS. */
export function saveTrip(trip: SavedTrip): void {
  const trips = readTrips()

  // Prevent exact duplicates (same iata + departDate)
  const existingIndex = trips.findIndex(
    (t) => t.iata === trip.iata && t.departDate === trip.departDate
  )
  if (existingIndex !== -1) {
    // Update in place
    trips[existingIndex] = { ...trip, id: trips[existingIndex].id }
  } else {
    trips.unshift(trip)
  }

  // Auto-prune: keep only the newest MAX_TRIPS
  const pruned = trips.slice(0, MAX_TRIPS)
  writeTrips(pruned)
}

/** Get all saved trips, newest first. */
export function getSavedTrips(): SavedTrip[] {
  return readTrips()
}

/** Get a specific trip by id. */
export function getTrip(id: string): SavedTrip | null {
  return readTrips().find((t) => t.id === id) ?? null
}

/** Delete a trip by id. */
export function deleteTrip(id: string): void {
  const trips = readTrips().filter((t) => t.id !== id)
  writeTrips(trips)
}

/** Mark a trip as booked. */
export function markTripBooked(id: string): void {
  const trips = readTrips()
  const trip = trips.find((t) => t.id === id)
  if (trip) {
    trip.isBooked = true
    writeTrips(trips)
  }
}

/** Get total number of saved trips. */
export function getTripCount(): number {
  return readTrips().length
}

/** Clear all saved trips. */
export function clearTrips(): void {
  writeTrips([])
}

/** Check if a trip already exists (by iata + departDate). */
export function tripExists(iata: string, departDate: string): boolean {
  return readTrips().some((t) => t.iata === iata && t.departDate === departDate)
}
