// Fetches travel safety information from US State Department API (free, no key)
// https://cadataapi.state.gov/api/CountryTravelInformation
// Cached in-memory for 24 hours

export interface SafetyInfo {
  level: 1 | 2 | 3 | 4
  label: string
  advisory: string
  lastUpdated: string
}

// In-memory cache: country name -> { info, fetchedAt }
const safetyCache = new Map<string, { info: SafetyInfo; fetchedAt: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// Advisory level labels
const LEVEL_LABELS: Record<number, string> = {
  1: 'Exercise Normal Precautions',
  2: 'Exercise Increased Caution',
  3: 'Reconsider Travel',
  4: 'Do Not Travel',
}

/**
 * Get travel safety advisory for a country from the US State Department.
 * Returns null if the API fails or the country is not found.
 * Results are cached for 24 hours.
 */
export async function getSafetyInfo(
  countryName: string
): Promise<SafetyInfo | null> {
  const name = countryName.trim()

  // Check cache
  const cached = safetyCache.get(name.toLowerCase())
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.info
  }

  const url = 'https://cadataapi.state.gov/api/CountryTravelInformation'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) return null

    const data = await res.json() as StateDeptEntry[]

    if (!Array.isArray(data)) return null

    // Find the matching country (case-insensitive, handle common name variants)
    const nameLower = name.toLowerCase()
    const aliases = getCountryAliases(nameLower)

    const entry = data.find((item) => {
      const entryName = (item.CountryName || '').toLowerCase()
      return aliases.some((alias) => entryName.includes(alias) || alias.includes(entryName))
    })

    if (!entry) return null

    // Parse the advisory level from the advisory text
    const level = parseAdvisoryLevel(entry.AdvisoryText || '')
    const label = LEVEL_LABELS[level] || 'Unknown'

    // Extract a brief advisory description
    const advisory = extractBriefAdvisory(entry.AdvisoryText || '')

    const info: SafetyInfo = {
      level: level as 1 | 2 | 3 | 4,
      label,
      advisory,
      lastUpdated: entry.DateUpdated || entry.DatePublished || 'Unknown',
    }

    // Cache the result
    safetyCache.set(nameLower, { info, fetchedAt: Date.now() })

    return info
  } catch {
    // Return stale cache if available
    const stale = safetyCache.get(name.toLowerCase())
    if (stale) return stale.info
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function parseAdvisoryLevel(text: string): number {
  // Look for "Level X" pattern
  const match = text.match(/Level\s+(\d)/i)
  if (match) {
    const level = parseInt(match[1], 10)
    if (level >= 1 && level <= 4) return level
  }
  // Default to level 2 if we can't parse
  return 2
}

function extractBriefAdvisory(text: string): string {
  if (!text) return 'Check travel.state.gov for details'

  // Get first sentence or first 200 chars
  const firstSentence = text.split(/\.\s/)[0]
  if (firstSentence && firstSentence.length <= 200) {
    return firstSentence + '.'
  }
  return text.substring(0, 200) + '...'
}

function getCountryAliases(nameLower: string): string[] {
  const aliases: string[] = [nameLower]

  // Handle common name differences between our data and State Dept
  const aliasMap: Record<string, string[]> = {
    'uk': ['united kingdom'],
    'united kingdom': ['uk'],
    'usa': ['united states'],
    'united states': ['usa'],
    'uae': ['united arab emirates'],
    'united arab emirates': ['uae'],
    'south korea': ['korea, republic of', 'korea republic'],
    'czech republic': ['czechia'],
    'hong kong': ['hong kong'],
    'taiwan': ['taiwan'],
  }

  const extra = aliasMap[nameLower]
  if (extra) aliases.push(...extra)

  return aliases
}

// State Department API response type (minimal)
interface StateDeptEntry {
  CountryName: string
  AdvisoryText: string
  DateUpdated?: string
  DatePublished?: string
}
