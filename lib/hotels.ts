// Hotel search — currently deep-links only, will add API when available

import { AFFILIATE_FLAGS, AFFILIATE_IDS } from './affiliate'
import { canEarnCommissions } from './stealth'

/**
 * Build Agoda search URL
 * Appends &cid={NEXT_PUBLIC_AGODA_CID} when the ID is set and stealth is off
 */
export function buildAgodaUrl(params: {
  cityName: string
  checkIn: string    // YYYY-MM-DD
  checkOut: string   // YYYY-MM-DD
  adults?: number
}): string {
  const { cityName, checkIn, checkOut, adults = 1 } = params

  let url = `https://www.agoda.com/search?textToSearch=${encodeURIComponent(cityName)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`

  if (canEarnCommissions() && AFFILIATE_FLAGS.agoda) {
    url += `&cid=${AFFILIATE_IDS.agoda}`
  }

  return url
}
