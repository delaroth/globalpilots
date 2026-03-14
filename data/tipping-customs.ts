// Static tipping customs data for travel destinations
// Practical guidelines for travelers — norms vary by establishment

export interface TippingInfo {
  restaurants: string    // e.g. "10-15% at sit-down restaurants"
  taxis: string          // e.g. "Round up to nearest 10 THB"
  hotels: string         // e.g. "20-50 THB per bag for porters"
  tours: string          // e.g. "100-300 THB for full-day guides"
  general: string        // e.g. "Tipping is appreciated but not mandatory"
}

export const TIPPING_DATA: Record<string, TippingInfo> = {
  // ========== SOUTHEAST ASIA ==========
  TH: {
    restaurants: '10% if no service charge included. Street food: no tip expected.',
    taxis: 'Round up the fare (e.g. 73 THB → 80 THB).',
    hotels: '20-50 THB per bag for porters. 20 THB/day for housekeeping.',
    tours: '100-300 THB/day for guides. 50-100 THB for drivers.',
    general: 'Appreciated but not mandatory. Small tips go a long way.',
  },
  ID: {
    restaurants: '5-10% at upscale restaurants. Not expected at warungs (local eateries).',
    taxis: 'Round up to the nearest 5,000 IDR.',
    hotels: '10,000-20,000 IDR per bag. 10,000 IDR/day for housekeeping.',
    tours: '50,000-100,000 IDR/day for guides.',
    general: 'Tipping is becoming more common in tourist areas but not obligatory.',
  },
  SG: {
    restaurants: 'Not expected — 10% service charge is typically included in the bill.',
    taxis: 'Not expected. Metered fares, no need to round up.',
    hotels: 'S$2-5 per bag for porters. Housekeeping tips not expected.',
    tours: 'S$10-20 for half-day, S$20-50 for full-day guides.',
    general: 'Tipping is not part of the culture. Service charges cover gratuity.',
  },
  MY: {
    restaurants: 'Not expected — most bills include a 10% service charge.',
    taxis: 'Round up to the nearest RM. Not expected.',
    hotels: 'RM2-5 per bag for porters.',
    tours: 'RM20-50/day for guides is appreciated.',
    general: 'Tipping is not customary but appreciated at tourist-oriented places.',
  },
  VN: {
    restaurants: '5-10% at upscale restaurants. Not expected at local spots.',
    taxis: 'Round up to the nearest 10,000 VND.',
    hotels: '20,000-50,000 VND per bag. 20,000 VND/day for housekeeping.',
    tours: '100,000-200,000 VND/day for guides.',
    general: 'Tipping is not traditional but increasingly appreciated in tourist areas.',
  },
  PH: {
    restaurants: '10% at restaurants if no service charge. 5% on top if service charge included and service was excellent.',
    taxis: 'Round up to the nearest 10 PHP.',
    hotels: 'PHP 20-50 per bag for porters.',
    tours: 'PHP 200-500/day for guides.',
    general: 'Tipping is appreciated and relatively common.',
  },
  KH: {
    restaurants: '10% at restaurants. Many places accept USD.',
    taxis: 'Round up the fare. Tuk-tuk drivers: round up or add $1.',
    hotels: '$1-2 per bag. $1/day for housekeeping.',
    tours: '$5-10/day for guides.',
    general: 'Tips in USD are common and appreciated. Small denominations helpful.',
  },
  LA: {
    restaurants: '10% at tourist restaurants. Not expected at local eateries.',
    taxis: 'Round up the fare.',
    hotels: '10,000-20,000 LAK per bag.',
    tours: '50,000-100,000 LAK/day for guides.',
    general: 'Tipping is not traditional but welcome in tourist areas.',
  },

  // ========== EAST ASIA ==========
  JP: {
    restaurants: 'Do NOT tip — it can be considered rude. Service is included.',
    taxis: 'No tip. Drivers may refuse it.',
    hotels: 'Not expected. At ryokans, place 1,000-3,000 JPY in an envelope for the nakai (attendant).',
    tours: '1,000-3,000 JPY/day in an envelope for guides is appreciated.',
    general: 'Tipping is not part of Japanese culture and can cause confusion.',
  },
  KR: {
    restaurants: 'Not expected — service charge is included.',
    taxis: 'Not expected. Keep your change.',
    hotels: '1,000-2,000 KRW per bag for porters at luxury hotels.',
    tours: '10,000-20,000 KRW for full-day guides at high-end tours.',
    general: 'Tipping is not customary. Exceptional service may warrant a small tip.',
  },
  HK: {
    restaurants: '10% service charge usually included. Round up or add small change.',
    taxis: 'Round up to the nearest HK$5-10.',
    hotels: 'HK$10-20 per bag for porters.',
    tours: 'HK$50-100/day for guides.',
    general: 'Service charges are standard. Additional tips optional but appreciated.',
  },
  TW: {
    restaurants: 'Not expected — 10% service charge common at restaurants.',
    taxis: 'Not expected. Keep your change.',
    hotels: 'NT$50-100 per bag for porters at high-end hotels.',
    tours: 'NT$200-500/day for guides is a nice gesture.',
    general: 'Tipping is not customary but graciously received at upscale places.',
  },
  CN: {
    restaurants: 'Not expected — tipping is uncommon. Upscale international hotels may expect it.',
    taxis: 'Not expected. Drivers will not expect tips.',
    hotels: 'CNY 10-20 per bag at luxury hotels.',
    tours: 'CNY 50-100/day for private guides.',
    general: 'Tipping was traditionally not done but is becoming accepted in tourist areas.',
  },

  // ========== SOUTH ASIA ==========
  IN: {
    restaurants: '10% at restaurants if no service charge. INR 50-100 at mid-range places.',
    taxis: 'Round up to the nearest INR 10-20.',
    hotels: 'INR 50-100 per bag. INR 50-100/day for housekeeping.',
    tours: 'INR 300-500/day for guides. INR 200-300 for drivers.',
    general: 'Tipping (baksheesh) is expected and an important part of the service economy.',
  },
  LK: {
    restaurants: '10% at restaurants — check if service charge is included.',
    taxis: 'Round up by LKR 50-100.',
    hotels: 'LKR 200-500 per bag. LKR 200/day for housekeeping.',
    tours: 'LKR 1,000-2,000/day for guides.',
    general: 'Tipping is appreciated and helps supplement low local wages.',
  },
  NP: {
    restaurants: '10% at tourist restaurants. Not expected at local spots.',
    taxis: 'Round up the fare.',
    hotels: 'NPR 50-100 per bag.',
    tours: 'NPR 500-1,000/day for trekking guides. NPR 300-500 for porters.',
    general: 'Tipping is expected for trekking guides and porters — it is a significant part of their income.',
  },

  // ========== MIDDLE EAST ==========
  AE: {
    restaurants: '10-15% at restaurants. Service charge may be included.',
    taxis: 'Round up to the nearest AED 5.',
    hotels: 'AED 5-10 per bag. AED 5-10/day for housekeeping.',
    tours: 'AED 50-100/day for guides.',
    general: 'Tipping is expected and appreciated, especially in Dubai.',
  },
  TR: {
    restaurants: '5-10% at restaurants. Round up at casual spots.',
    taxis: 'Round up to the nearest TRY 5-10.',
    hotels: 'TRY 20-50 per bag. TRY 20-30/day for housekeeping.',
    tours: 'TRY 100-200/day for guides.',
    general: 'Tipping is customary and appreciated.',
  },
  QA: {
    restaurants: '10-15%. Many upscale restaurants add a service charge.',
    taxis: 'Round up to the nearest QAR 5.',
    hotels: 'QAR 10-20 per bag.',
    tours: 'QAR 50-100/day for guides.',
    general: 'Tipping is common, especially in hospitality settings.',
  },
  IL: {
    restaurants: '10-15% at restaurants. Service charge not usually included.',
    taxis: 'Round up to the nearest ILS 5.',
    hotels: 'ILS 10-20 per bag.',
    tours: 'ILS 50-100/day for guides.',
    general: 'Tipping is expected at restaurants and customary for services.',
  },
  JO: {
    restaurants: '10% at restaurants. Some add a service charge.',
    taxis: 'Round up to the nearest JOD 0.5.',
    hotels: 'JOD 1-2 per bag.',
    tours: 'JOD 5-10/day for guides.',
    general: 'Tipping is expected and part of the culture.',
  },
  EG: {
    restaurants: '10-15%. Service charge on the bill often goes to the restaurant, not staff.',
    taxis: 'Round up by EGP 10-20.',
    hotels: 'EGP 20-50 per bag. EGP 20-30/day for housekeeping.',
    tours: 'EGP 100-200/day for guides. EGP 50-100 for drivers.',
    general: 'Tipping (baksheesh) is a way of life — expected for nearly every service.',
  },

  // ========== EUROPE ==========
  GB: {
    restaurants: '10-12.5% at sit-down restaurants if service not included.',
    taxis: 'Round up to the nearest pound.',
    hotels: '£1-2 per bag for porters.',
    tours: '£5-10/day for guides.',
    general: 'Tipping is appreciated but not obligatory. Check for service charge on the bill.',
  },
  FR: {
    restaurants: 'Service included by law (service compris). Round up or leave 1-2 EUR for good service.',
    taxis: 'Round up to the nearest euro or add 5-10%.',
    hotels: '1-2 EUR per bag.',
    tours: '5-10 EUR/day for guides.',
    general: 'Service is included in prices. Small tips for exceptional service are appreciated.',
  },
  NL: {
    restaurants: 'Service included. Round up or leave 5-10% for good service.',
    taxis: 'Round up to the nearest euro.',
    hotels: '1-2 EUR per bag.',
    tours: '5-10 EUR/day for guides.',
    general: 'Tipping is not mandatory but rounding up is common practice.',
  },
  ES: {
    restaurants: 'Leave small change or 5-10% at restaurants. Not obligatory.',
    taxis: 'Round up to the nearest euro.',
    hotels: '1 EUR per bag.',
    tours: '5-10 EUR/day for guides.',
    general: 'Tipping is appreciated but not expected. Spaniards often just leave coins.',
  },
  PT: {
    restaurants: '5-10% at restaurants. Leave coins or round up.',
    taxis: 'Round up to the nearest euro.',
    hotels: '1 EUR per bag.',
    tours: '5-10 EUR/day for guides.',
    general: 'Tipping is appreciated but modest amounts are fine.',
  },
  CZ: {
    restaurants: '10% at restaurants. Round up the bill.',
    taxis: 'Round up to the nearest CZK 10.',
    hotels: 'CZK 30-50 per bag.',
    tours: 'CZK 200-300/day for guides.',
    general: 'Tipping is customary. Round up or add 10% at restaurants.',
  },
  HU: {
    restaurants: '10% at restaurants. Some add a service charge.',
    taxis: 'Round up to the nearest HUF 200-500.',
    hotels: 'HUF 500-1,000 per bag.',
    tours: 'HUF 2,000-5,000/day for guides.',
    general: 'Tipping 10% is standard. Always tip in cash, even if paying by card.',
  },
  GR: {
    restaurants: '5-10% at restaurants. Leave coins on the table.',
    taxis: 'Round up to the nearest euro.',
    hotels: '1 EUR per bag.',
    tours: '5-10 EUR/day for guides.',
    general: 'Tipping is appreciated but casual — leave small change.',
  },
  IT: {
    restaurants: 'Coperto (cover charge) is common. Small tip of 1-2 EUR optional for good service.',
    taxis: 'Round up to the nearest euro.',
    hotels: '1-2 EUR per bag.',
    tours: '5-10 EUR/day for guides.',
    general: 'Tipping is not expected due to coperto/service charge. Small amounts appreciated.',
  },
  DE: {
    restaurants: '5-10% at restaurants. Round up when paying (say the total you want to pay).',
    taxis: 'Round up to the nearest euro or add 5-10%.',
    hotels: '1-2 EUR per bag.',
    tours: '5-10 EUR/day for guides.',
    general: 'Tipping is customary but modest. Round up the bill rather than leaving coins on the table.',
  },
  AT: {
    restaurants: '5-10% at restaurants. Same rounding-up practice as Germany.',
    taxis: 'Round up to the nearest euro.',
    hotels: '1-2 EUR per bag.',
    tours: '5-10 EUR/day for guides.',
    general: 'Similar to Germany. Rounding up is standard practice.',
  },
  PL: {
    restaurants: '10% at restaurants.',
    taxis: 'Round up to the nearest PLN 5.',
    hotels: 'PLN 5-10 per bag.',
    tours: 'PLN 30-50/day for guides.',
    general: 'Tipping 10% is standard at restaurants. Cash tips preferred.',
  },
  DK: {
    restaurants: 'Service included. Tipping not expected but you can round up.',
    taxis: 'Round up to the nearest DKK 10. Not expected.',
    hotels: 'DKK 10-20 per bag. Not expected.',
    tours: 'DKK 50-100/day for guides if service was excellent.',
    general: 'Tipping is not part of Danish culture — service workers are well paid.',
  },
  IE: {
    restaurants: '10-12.5% at sit-down restaurants if no service charge.',
    taxis: 'Round up to the nearest euro.',
    hotels: '1-2 EUR per bag.',
    tours: '5-10 EUR/day for guides.',
    general: 'Tipping is appreciated but not obligatory. Similar norms to the UK.',
  },

  // ========== AMERICAS ==========
  US: {
    restaurants: '15-20% at sit-down restaurants. 18-20% is now standard.',
    taxis: '15-20% of the fare.',
    hotels: '$1-2 per bag. $2-5/day for housekeeping.',
    tours: '$10-20/day for guides.',
    general: 'Tipping is essential and expected. Service workers rely on tips.',
  },
  MX: {
    restaurants: '10-15% at restaurants.',
    taxis: 'Round up or add 10%. Not strictly expected.',
    hotels: 'MXN 20-50 per bag. MXN 20-50/day for housekeeping.',
    tours: 'MXN 100-200/day for guides.',
    general: 'Tipping (propina) is expected in tourist areas. Tip in pesos, not USD.',
  },
  CO: {
    restaurants: '10% service charge (propina voluntaria) usually added to the bill — you can decline but it is customary to accept.',
    taxis: 'Not expected. Round up if you wish.',
    hotels: 'COP 5,000-10,000 per bag.',
    tours: 'COP 20,000-50,000/day for guides.',
    general: 'The 10% propina on restaurant bills is standard. Additional tips appreciated for excellent service.',
  },
  PE: {
    restaurants: '10% at restaurants. Some add a service charge.',
    taxis: 'Not expected — fares are negotiated upfront.',
    hotels: 'PEN 3-5 per bag.',
    tours: 'PEN 20-40/day for guides.',
    general: 'Tipping is appreciated, especially in tourist areas.',
  },
  AR: {
    restaurants: '10% at restaurants.',
    taxis: 'Round up to the nearest ARS 100.',
    hotels: 'ARS 500-1,000 per bag (adjust for inflation).',
    tours: 'ARS 2,000-5,000/day for guides.',
    general: 'Tipping 10% is standard. Due to high inflation, check current norms.',
  },
  BR: {
    restaurants: '10% service charge (gorjeta) usually included in the bill.',
    taxis: 'Round up to the nearest BRL 1-2. Not expected.',
    hotels: 'BRL 5-10 per bag.',
    tours: 'BRL 30-50/day for guides.',
    general: 'The 10% gorjeta on restaurant bills is standard. Additional tipping not expected.',
  },
  CL: {
    restaurants: '10% at restaurants — usually not included in the bill.',
    taxis: 'Not expected. Round up if you wish.',
    hotels: 'CLP 1,000-2,000 per bag.',
    tours: 'CLP 5,000-10,000/day for guides.',
    general: 'Tipping 10% at restaurants is customary.',
  },
  PA: {
    restaurants: '10% at restaurants. Some add a service charge.',
    taxis: 'Not expected.',
    hotels: '$1-2 per bag.',
    tours: '$5-10/day for guides.',
    general: 'Tipping norms similar to the US but at lower percentages. USD is the currency.',
  },
  CR: {
    restaurants: '10% service charge usually included. Additional tip optional.',
    taxis: 'Not expected.',
    hotels: '$1-2 per bag.',
    tours: '$10-20/day for guides.',
    general: 'The 10% service charge covers gratuity. Extra tips for exceptional service.',
  },

  // ========== AFRICA ==========
  MA: {
    restaurants: '10% at restaurants. Leave small change at cafes.',
    taxis: 'Round up by MAD 5-10.',
    hotels: 'MAD 10-20 per bag.',
    tours: 'MAD 100-200/day for guides.',
    general: 'Tipping is expected and an important part of the service economy.',
  },
  ZA: {
    restaurants: '10-15% at restaurants.',
    taxis: 'Round up by ZAR 10-20.',
    hotels: 'ZAR 20-50 per bag.',
    tours: 'ZAR 100-200/day for guides. ZAR 50-100 for safari game drive staff.',
    general: 'Tipping is expected and important. Car guards at parking lots: ZAR 5-10.',
  },
  KE: {
    restaurants: '10% at restaurants if no service charge.',
    taxis: 'Round up by KES 50-100.',
    hotels: 'KES 100-200 per bag.',
    tours: 'KES 500-1,000/day for safari guides. KES 200-500 for camp staff.',
    general: 'Tipping is expected, especially on safaris. Small denominations are helpful.',
  },
  SN: {
    restaurants: '10% at restaurants. Not expected at casual spots.',
    taxis: 'Round up by CFA 200-500.',
    hotels: 'CFA 500-1,000 per bag.',
    tours: 'CFA 2,000-5,000/day for guides.',
    general: 'Tipping is appreciated in tourist areas.',
  },

  // ========== CAUCASUS ==========
  GE: {
    restaurants: '10% at restaurants if no service charge. Not expected at casual spots.',
    taxis: 'Round up to the nearest GEL 1.',
    hotels: 'GEL 2-5 per bag.',
    tours: 'GEL 20-40/day for guides.',
    general: 'Tipping is not deeply ingrained but becoming more common in Tbilisi.',
  },

  // ========== OCEANIA ==========
  AU: {
    restaurants: 'Not expected — service workers are well paid. 10% at fine dining for excellent service.',
    taxis: 'Round up to the nearest A$1. Not expected.',
    hotels: 'A$2-5 per bag at luxury hotels. Not expected at others.',
    tours: 'A$10-20/day for guides at your discretion.',
    general: 'Tipping is not part of Australian culture. Appreciated but never expected.',
  },
  NZ: {
    restaurants: 'Not expected. 10% at upscale restaurants for excellent service.',
    taxis: 'Round up to the nearest NZ$1. Not expected.',
    hotels: 'NZ$2-5 per bag at luxury hotels. Not expected at others.',
    tours: 'NZ$10-20/day for guides at your discretion.',
    general: 'Tipping is not customary. New Zealand has fair wages for service workers.',
  },
}

/**
 * Get tipping customs for a country.
 * @param countryCode - ISO 3166-1 alpha-2 code (e.g. "TH", "JP")
 * @returns TippingInfo or null if country not found
 */
export function getTippingInfo(countryCode: string): TippingInfo | null {
  const code = countryCode.toUpperCase()
  return TIPPING_DATA[code] ?? null
}
