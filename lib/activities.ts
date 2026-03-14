// Activities affiliate — deep-links only for now

import { AFFILIATE_FLAGS } from './affiliate'

const SE_ASIA_IATA = [
  'BKK', 'HKT', 'KBV', 'CNX', 'USM', 'SIN', 'KUL', 'CGK', 'DPS',
  'MNL', 'SGN', 'HAN', 'RGN', 'REP', 'LPQ', 'CMB',
]

/**
 * GetYourGuide city search URL
 * When AFFILIATE_FLAGS.getyourguide = true: appends ?partner_id={GYG_PARTNER_ID}
 */
export function buildGetYourGuideUrl(cityName: string): string {
  let url = `https://www.getyourguide.com/s/?q=${encodeURIComponent(cityName)}&searchSource=1`

  if (AFFILIATE_FLAGS.getyourguide && process.env.GETYOURGUIDE_PARTNER_ID) {
    url += `&partner_id=${process.env.GETYOURGUIDE_PARTNER_ID}`
  }

  return url
}

/**
 * Klook city search URL (SE Asia focused)
 * When AFFILIATE_FLAGS.klook = true: appends affiliate params
 */
export function buildKlookUrl(cityName: string): string {
  const slug = cityName.toLowerCase().replace(/\s+/g, '-')
  let url = `https://www.klook.com/en-US/search/result/?query=${encodeURIComponent(cityName)}`

  if (AFFILIATE_FLAGS.klook && process.env.KLOOK_AFFILIATE_ID) {
    url += `&aid=${process.env.KLOOK_AFFILIATE_ID}`
  }

  return url
}

/**
 * Smart picker: use Klook for SE Asia cities, GYG for everywhere else
 */
export function buildActivitiesUrl(cityName: string, iata?: string): string {
  const isSEAsia = iata && SE_ASIA_IATA.includes(iata.toUpperCase())

  if (isSEAsia) {
    return buildKlookUrl(cityName)
  }

  return buildGetYourGuideUrl(cityName)
}
