// ─── Mystery Travel Passport — Data Layer ───
// localStorage-based passport system. Works without auth, upgradeable to Supabase later.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PassportStamp {
  id: string
  destination: string
  country: string
  countryCode: string
  iata: string
  flag: string
  revealedAt: number
  departDate: string
  totalCost: number
  isBooked: boolean
  bookedAt?: number
  bookingClicks: BookingClick[]
  badge?: string
}

export interface BookingClick {
  type: 'flight' | 'hotel' | 'activity'
  provider: string
  timestamp: number
  url: string
}

export interface TravelPassport {
  stamps: PassportStamp[]
  stats: {
    totalReveals: number
    totalBooked: number
    countriesVisited: number
    continentsVisited: number
    totalSpent: number
    favoriteRegion: string
    adventureScore: number
  }
  badges: PassportBadge[]
}

export interface PassportBadge {
  id: string
  name: string
  emoji: string
  description: string
  earnedAt: number
}

// ---------------------------------------------------------------------------
// Continent mapping (country code → continent)
// ---------------------------------------------------------------------------

const COUNTRY_CONTINENT: Record<string, string> = {
  // Asia
  TH: 'Asia', ID: 'Asia', JP: 'Asia', KR: 'Asia', VN: 'Asia', PH: 'Asia',
  MY: 'Asia', SG: 'Asia', CN: 'Asia', TW: 'Asia', HK: 'Asia', IN: 'Asia',
  LK: 'Asia', NP: 'Asia', MM: 'Asia', KH: 'Asia', LA: 'Asia', BD: 'Asia',
  PK: 'Asia', MV: 'Asia', BN: 'Asia', MN: 'Asia', KZ: 'Asia', UZ: 'Asia',
  GE: 'Asia', AM: 'Asia', AZ: 'Asia', JO: 'Asia', LB: 'Asia', AE: 'Asia',
  QA: 'Asia', BH: 'Asia', OM: 'Asia', KW: 'Asia', SA: 'Asia', IL: 'Asia',
  TR: 'Europe', // Turkey straddles but Eurostat counts it as Europe

  // Europe
  ES: 'Europe', FR: 'Europe', IT: 'Europe', DE: 'Europe', PT: 'Europe',
  GB: 'Europe', IE: 'Europe', NL: 'Europe', BE: 'Europe', CH: 'Europe',
  AT: 'Europe', GR: 'Europe', HR: 'Europe', CZ: 'Europe', PL: 'Europe',
  HU: 'Europe', SE: 'Europe', NO: 'Europe', DK: 'Europe', FI: 'Europe',
  IS: 'Europe', EE: 'Europe', LV: 'Europe', LT: 'Europe', RO: 'Europe',
  BG: 'Europe', RS: 'Europe', ME: 'Europe', BA: 'Europe', MK: 'Europe',
  AL: 'Europe', SK: 'Europe', SI: 'Europe', MT: 'Europe', CY: 'Europe',
  LU: 'Europe', UA: 'Europe', MD: 'Europe', BY: 'Europe', RU: 'Europe',

  // North America
  US: 'North America', CA: 'North America', MX: 'North America',
  CU: 'North America', JM: 'North America', DO: 'North America',
  HT: 'North America', TT: 'North America', BS: 'North America',
  BB: 'North America', PR: 'North America', CR: 'North America',
  PA: 'North America', GT: 'North America', HN: 'North America',
  SV: 'North America', NI: 'North America', BZ: 'North America',

  // South America
  BR: 'South America', AR: 'South America', CL: 'South America',
  CO: 'South America', PE: 'South America', EC: 'South America',
  VE: 'South America', BO: 'South America', PY: 'South America',
  UY: 'South America', GY: 'South America', SR: 'South America',

  // Africa
  ZA: 'Africa', EG: 'Africa', MA: 'Africa', KE: 'Africa', TZ: 'Africa',
  NG: 'Africa', GH: 'Africa', ET: 'Africa', TN: 'Africa', SN: 'Africa',
  CI: 'Africa', CM: 'Africa', UG: 'Africa', RW: 'Africa', MZ: 'Africa',
  MG: 'Africa', MU: 'Africa', SC: 'Africa', NA: 'Africa', BW: 'Africa',
  ZW: 'Africa', DZ: 'Africa', AO: 'Africa', ZM: 'Africa', MW: 'Africa',
  CV: 'Africa',

  // Oceania
  AU: 'Oceania', NZ: 'Oceania', FJ: 'Oceania', PG: 'Oceania',
  WS: 'Oceania', TO: 'Oceania', VU: 'Oceania', NC: 'Oceania',
  PF: 'Oceania', GU: 'Oceania',
}

export function getContinentForCountry(countryCode: string): string {
  return COUNTRY_CONTINENT[countryCode.toUpperCase()] || 'Unknown'
}

// ---------------------------------------------------------------------------
// Badge definitions
// ---------------------------------------------------------------------------

interface BadgeDefinition {
  id: string
  name: string
  emoji: string
  description: string
  condition: ((p: TravelPassport) => boolean) | null
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first-mystery',
    name: 'First Mystery',
    emoji: '\u{1F3AF}',
    description: 'Revealed your first mystery destination',
    condition: (p) => p.stamps.length >= 1,
  },
  {
    id: 'globe-trotter',
    name: 'Globe Trotter',
    emoji: '\u{1F30D}',
    description: 'Destinations on 3+ continents',
    condition: (p) => p.stats.continentsVisited >= 3,
  },
  {
    id: 'budget-ninja',
    name: 'Budget Ninja',
    emoji: '\u{1F4B0}',
    description: '3 trips under $500',
    condition: (p) => p.stamps.filter((s) => s.totalCost < 500).length >= 3,
  },
  {
    id: 'serial-explorer',
    name: 'Serial Explorer',
    emoji: '\u{1F5FA}\u{FE0F}',
    description: '5 mystery destinations revealed',
    condition: (p) => p.stamps.length >= 5,
  },
  {
    id: 'booking-boss',
    name: 'Booking Boss',
    emoji: '\u{2708}\u{FE0F}',
    description: 'Booked 3 mystery trips',
    condition: (p) => p.stats.totalBooked >= 3,
  },
  {
    id: 'world-traveler',
    name: 'World Traveler',
    emoji: '\u{1F3C6}',
    description: 'Destinations in 10+ countries',
    condition: (p) => p.stats.countriesVisited >= 10,
  },
  {
    id: 'lucky-guesser',
    name: 'Lucky Guesser',
    emoji: '\u{1F52E}',
    description: 'Guessed a destination before the reveal',
    condition: null, // awarded manually
  },
]

export { BADGE_DEFINITIONS }

// ---------------------------------------------------------------------------
// Storage key
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'gp_passport'

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

function loadRaw(): { stamps: PassportStamp[]; badges: PassportBadge[] } {
  if (typeof window === 'undefined') return { stamps: [], badges: [] }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { stamps: [], badges: [] }
    const parsed = JSON.parse(raw)
    return {
      stamps: Array.isArray(parsed.stamps) ? parsed.stamps : [],
      badges: Array.isArray(parsed.badges) ? parsed.badges : [],
    }
  } catch {
    return { stamps: [], badges: [] }
  }
}

function saveRaw(data: { stamps: PassportStamp[]; badges: PassportBadge[] }) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

/**
 * Compute aggregate stats from a list of stamps.
 */
export function computeStats(stamps: PassportStamp[]): TravelPassport['stats'] {
  const totalReveals = stamps.length
  const totalBooked = stamps.filter((s) => s.isBooked).length
  const totalSpent = stamps.reduce((sum, s) => sum + s.totalCost, 0)

  // Unique countries
  const countries = new Set(stamps.map((s) => s.countryCode.toUpperCase()))
  const countriesVisited = countries.size

  // Unique continents
  const continents = new Set<string>()
  countries.forEach((cc) => {
    const continent = getContinentForCountry(cc)
    if (continent !== 'Unknown') continents.add(continent)
  })
  const continentsVisited = continents.size

  // Favorite region (continent with the most stamps)
  const regionCounts: Record<string, number> = {}
  stamps.forEach((s) => {
    const c = getContinentForCountry(s.countryCode)
    if (c !== 'Unknown') regionCounts[c] = (regionCounts[c] || 0) + 1
  })
  const favoriteRegion =
    Object.entries(regionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None yet'

  // Adventure score: 0-10
  // Factors: unique countries (0-4), unique continents (0-3), budget efficiency (0-3)
  const countryScore = Math.min(countriesVisited, 8) * 0.5 // 0-4
  const continentScore = Math.min(continentsVisited, 6) * 0.5 // 0-3
  const avgCost = totalReveals > 0 ? totalSpent / totalReveals : 0
  const budgetScore =
    avgCost === 0
      ? 0
      : avgCost < 300
        ? 3
        : avgCost < 500
          ? 2.5
          : avgCost < 800
            ? 2
            : avgCost < 1200
              ? 1
              : 0.5
  const adventureScore = Math.min(
    10,
    Math.round((countryScore + continentScore + budgetScore) * 10) / 10,
  )

  return {
    totalReveals,
    totalBooked,
    countriesVisited,
    continentsVisited,
    totalSpent,
    favoriteRegion,
    adventureScore,
  }
}

/**
 * Check badge conditions and award any newly-earned badges.
 * Returns the list of NEWLY awarded badges (not previously earned).
 */
export function checkAndAwardBadges(passport: TravelPassport): PassportBadge[] {
  const existingIds = new Set(passport.badges.map((b) => b.id))
  const newBadges: PassportBadge[] = []

  for (const def of BADGE_DEFINITIONS) {
    if (existingIds.has(def.id)) continue
    if (!def.condition) continue // manual-only badges
    if (def.condition(passport)) {
      newBadges.push({
        id: def.id,
        name: def.name,
        emoji: def.emoji,
        description: def.description,
        earnedAt: Date.now(),
      })
    }
  }

  return newBadges
}

/**
 * Get the full passport with computed stats and badge checks.
 */
export function getPassport(): TravelPassport {
  const raw = loadRaw()
  const stats = computeStats(raw.stamps)
  const passport: TravelPassport = {
    stamps: raw.stamps,
    stats,
    badges: raw.badges,
  }

  // Auto-check badges
  const newBadges = checkAndAwardBadges(passport)
  if (newBadges.length > 0) {
    passport.badges = [...passport.badges, ...newBadges]
    saveRaw({ stamps: passport.stamps, badges: passport.badges })
  }

  return passport
}

/**
 * Add a new stamp to the passport. Returns the created stamp.
 */
export function addStamp(
  stamp: Omit<PassportStamp, 'id' | 'bookingClicks'>,
): PassportStamp {
  const raw = loadRaw()

  const newStamp: PassportStamp = {
    ...stamp,
    id: crypto.randomUUID(),
    bookingClicks: [],
  }

  raw.stamps.push(newStamp)
  saveRaw(raw)

  // Re-check badges after adding stamp
  getPassport()

  return newStamp
}

/**
 * Track a booking click (flight/hotel/activity) for a given stamp.
 */
export function trackBookingClick(
  stampId: string,
  click: Omit<BookingClick, 'timestamp'>,
): void {
  const raw = loadRaw()
  const stamp = raw.stamps.find((s) => s.id === stampId)
  if (!stamp) return

  stamp.bookingClicks.push({
    ...click,
    timestamp: Date.now(),
  })

  saveRaw(raw)
}

/**
 * Mark a stamp as booked.
 */
export function markAsBooked(stampId: string): void {
  const raw = loadRaw()
  const stamp = raw.stamps.find((s) => s.id === stampId)
  if (!stamp) return

  stamp.isBooked = true
  stamp.bookedAt = Date.now()

  saveRaw(raw)
}

/**
 * Remove a stamp from the passport.
 */
export function removeStamp(stampId: string): void {
  const raw = loadRaw()
  raw.stamps = raw.stamps.filter((s) => s.id !== stampId)
  saveRaw(raw)
}

/**
 * Manually award a badge (e.g., "Lucky Guesser").
 * Returns the badge if awarded, null if already earned or not found.
 */
export function awardBadge(badgeId: string): PassportBadge | null {
  const raw = loadRaw()
  if (raw.badges.some((b) => b.id === badgeId)) return null

  const def = BADGE_DEFINITIONS.find((d) => d.id === badgeId)
  if (!def) return null

  const badge: PassportBadge = {
    id: def.id,
    name: def.name,
    emoji: def.emoji,
    description: def.description,
    earnedAt: Date.now(),
  }

  raw.badges.push(badge)
  saveRaw(raw)
  return badge
}
