// Static visa requirement lookup — no API call needed
// Uses the hardcoded matrix from data/visa-requirements.ts

import { visaMatrix, EU_PASSPORT_ALIASES, type VisaInfo } from '@/data/visa-requirements'

export type { VisaInfo }

/**
 * Check visa requirements for a given passport country traveling to a destination country.
 *
 * @param passportCountry - ISO alpha-2 code (e.g. 'US', 'UK', 'DE') or 'EU' for generic EU
 * @param destinationCountry - Country name as it appears in destination-costs.ts (e.g. 'Thailand', 'Japan')
 * @returns VisaInfo with status, maxStay, and optional note
 */
export function checkVisaRequirement(
  passportCountry: string,
  destinationCountry: string
): VisaInfo {
  const passportCode = passportCountry.toUpperCase().trim()

  // Resolve EU aliases (FR -> DE, NL -> DE, etc.)
  const resolvedPassport = EU_PASSPORT_ALIASES[passportCode] || passportCode

  // Look up in the visa matrix
  const passportEntry = visaMatrix[resolvedPassport]
  if (!passportEntry) {
    return {
      status: 'visa-required',
      note: 'Check embassy for details — passport country not in database',
    }
  }

  const visaInfo = passportEntry[destinationCountry]
  if (!visaInfo) {
    return {
      status: 'visa-required',
      note: 'Check embassy for details',
    }
  }

  return visaInfo
}

/**
 * Check visa requirements across multiple passports and return the BEST status.
 * e.g., if US passport needs visa but EU passport is visa-free, returns visa-free.
 *
 * @param passportCountries - Array of ISO alpha-2 codes (e.g. ['US', 'DE'])
 * @param destinationCountry - Country name as it appears in destination-costs.ts
 * @returns The best VisaInfo across all passports
 */
export function checkBestVisaStatus(
  passportCountries: string[],
  destinationCountry: string
): VisaInfo {
  if (!passportCountries || passportCountries.length === 0) {
    return {
      status: 'visa-required',
      note: 'No passport specified — check embassy for details',
    }
  }

  // Rank: lower = better
  const statusRank: Record<string, number> = {
    'visa-free': 0,
    'visa-on-arrival': 1,
    'e-visa': 2,
    'visa-required': 3,
  }

  let bestResult: VisaInfo = { status: 'visa-required', note: 'Check embassy for details' }
  let bestRank = 4

  for (const passport of passportCountries) {
    const result = checkVisaRequirement(passport, destinationCountry)
    const rank = statusRank[result.status] ?? 3
    if (rank < bestRank) {
      bestRank = rank
      bestResult = result
    }
  }

  return bestResult
}
