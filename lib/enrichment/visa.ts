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
