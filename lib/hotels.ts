// Hotel search — currently deep-links only, will add API when available

import { AFFILIATE_FLAGS } from './affiliate'

/**
 * Build Agoda search URL
 * When AFFILIATE_FLAGS.agoda = true: appends &cid={AGODA_AFFILIATE_ID}
 */
export function buildAgodaUrl(params: {
  cityName: string
  checkIn: string    // YYYY-MM-DD
  checkOut: string   // YYYY-MM-DD
  adults?: number
}): string {
  const { cityName, checkIn, checkOut, adults = 1 } = params

  let url = `https://www.agoda.com/search?city=${encodeURIComponent(cityName)}&checkIn=${checkIn}&checkOut=${checkOut}&adults=${adults}`

  if (AFFILIATE_FLAGS.agoda && process.env.AGODA_AFFILIATE_ID) {
    url += `&cid=${process.env.AGODA_AFFILIATE_ID}`
  }

  return url
}
