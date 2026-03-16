/**
 * Destination cache — persists enriched destination data in Supabase
 * `destination_cache` table for faster mystery reveals.
 *
 * Falls back gracefully: if Supabase is unavailable or the table
 * doesn't exist, all functions return null / no-op.
 */

import { getSupabase } from '@/lib/supabase'
import { getDestinationCost } from '@/lib/destination-costs'
import { getClimateData } from '@/lib/enrichment/climate'
import { getTimezone } from '@/data/airport-coordinates'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CachedDestination {
  iata: string
  city: string
  country: string
  basicInfo: {
    climateHint: string
    languages: string[]
    currency: string
    timezone: string
    dailyCosts: { budget: number; mid: number; comfort: number }
    topAttractions: string[]
    bestMonths: number[]
    localFood: string[]
    safetyLevel: string
    plugType: string
    tippingCustom: string
  }
  aiContent: {
    whyVisit: string
    genericItinerary: { day: number; activities: string[] }[]
    neighborhoods: string[]
    localTips: string[]
    culturalNotes: string
  } | null
  flightStats: {
    commonAirlines: string[]
    bestMonthsToFly: number[]
  } | null
  revealCount: number
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

/** Get cached destination (returns null if not cached). */
export async function getCachedDestination(iata: string): Promise<CachedDestination | null> {
  try {
    const supabase = getSupabase()
    const { data, error } = await (supabase.from('destination_cache') as any)
      .select('*')
      .eq('iata', iata.toUpperCase())
      .single()

    if (error || !data) return null

    return {
      iata: data.iata,
      city: data.city,
      country: data.country,
      basicInfo: data.basic_info,
      aiContent: data.ai_content ?? null,
      flightStats: data.flight_stats ?? null,
      revealCount: data.reveal_count ?? 0,
    }
  } catch {
    return null
  }
}

/** Save/update destination cache. */
export async function cacheDestination(dest: CachedDestination): Promise<void> {
  try {
    const supabase = getSupabase()
    await (supabase.from('destination_cache') as any).upsert(
      {
        iata: dest.iata.toUpperCase(),
        city: dest.city,
        country: dest.country,
        basic_info: dest.basicInfo,
        ai_content: dest.aiContent,
        flight_stats: dest.flightStats,
        reveal_count: dest.revealCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'iata' },
    )
  } catch {
    // silently fail — cache is non-critical
  }
}

/** Increment reveal count for a destination. */
export async function incrementRevealCount(iata: string): Promise<void> {
  try {
    const supabase = getSupabase()
    await (supabase.rpc as any)('increment_reveal_count', {
      dest_iata: iata.toUpperCase(),
    })
  } catch {
    // Fallback: try a manual update if the RPC doesn't exist
    try {
      const supabase = getSupabase()
      const { data } = await (supabase.from('destination_cache') as any)
        .select('reveal_count')
        .eq('iata', iata.toUpperCase())
        .single()

      if (data) {
        await (supabase.from('destination_cache') as any)
          .update({ reveal_count: (data.reveal_count || 0) + 1 })
          .eq('iata', iata.toUpperCase())
      }
    } catch {
      // silently fail
    }
  }
}

/** Get top N most revealed destinations. */
export async function getTopDestinations(limit: number): Promise<CachedDestination[]> {
  try {
    const supabase = getSupabase()
    const { data, error } = await (supabase.from('destination_cache') as any)
      .select('*')
      .order('reveal_count', { ascending: false })
      .limit(limit)

    if (error || !data) return []

    return data.map((row: any) => ({
      iata: row.iata,
      city: row.city,
      country: row.country,
      basicInfo: row.basic_info,
      aiContent: row.ai_content ?? null,
      flightStats: row.flight_stats ?? null,
      revealCount: row.reveal_count ?? 0,
    }))
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Build basic info from static data sources (no AI / no API calls)
// ---------------------------------------------------------------------------

// Static plug type data by country
const PLUG_TYPES: Record<string, string> = {
  Thailand: 'A, B, C, O',
  Vietnam: 'A, C',
  Cambodia: 'A, C, G',
  Indonesia: 'C, F',
  Malaysia: 'G',
  Singapore: 'G',
  Philippines: 'A, B, C',
  Japan: 'A, B',
  'South Korea': 'C, F',
  India: 'C, D, M',
  'Sri Lanka': 'D, M, G',
  Nepal: 'C, D, M',
  Turkey: 'C, F',
  Greece: 'C, F',
  Italy: 'C, F, L',
  Spain: 'C, F',
  Portugal: 'C, F',
  France: 'C, E',
  Germany: 'C, F',
  UK: 'G',
  'United Kingdom': 'G',
  Netherlands: 'C, F',
  'Czech Republic': 'C, E',
  Hungary: 'C, F',
  Poland: 'C, E',
  Croatia: 'C, F',
  Iceland: 'C, F',
  Sweden: 'C, F',
  Norway: 'C, F',
  Denmark: 'C, E, F, K',
  Finland: 'C, F',
  Ireland: 'G',
  Switzerland: 'C, J',
  Austria: 'C, F',
  Belgium: 'C, E',
  Romania: 'C, F',
  Serbia: 'C, F',
  Slovenia: 'C, F',
  Bulgaria: 'C, F',
  USA: 'A, B',
  'United States': 'A, B',
  Canada: 'A, B',
  Mexico: 'A, B',
  'Costa Rica': 'A, B',
  Colombia: 'A, B',
  Brazil: 'C, N',
  Argentina: 'C, I',
  Peru: 'A, C',
  Chile: 'C, L',
  Ecuador: 'A, B',
  Morocco: 'C, E',
  Egypt: 'C',
  'South Africa': 'C, D, M, N',
  Kenya: 'G',
  Tanzania: 'D, G',
  Australia: 'I',
  'New Zealand': 'I',
  Fiji: 'I',
  Jordan: 'B, C, D, F, G, J',
  Israel: 'C, H, M',
  UAE: 'C, D, G',
  'United Arab Emirates': 'C, D, G',
  Qatar: 'D, G',
  Oman: 'C, G',
  Georgia: 'C, F',
  Maldives: 'A, D, G, J, K, L',
}

// Static tipping customs by country
const TIPPING: Record<string, string> = {
  Thailand: 'Not expected, but 20-50 THB for good service appreciated',
  Vietnam: 'Not expected, small tips (10-20k VND) for good service',
  Cambodia: '$1-2 tips common, USD widely accepted',
  Indonesia: '5-10% at restaurants, rounding up is common',
  Japan: 'No tipping — considered rude',
  'South Korea': 'No tipping expected',
  India: '10% at restaurants, small tips for services',
  USA: '15-20% at restaurants, $1-2 per drink at bars',
  'United States': '15-20% at restaurants, $1-2 per drink at bars',
  Canada: '15-20% at restaurants',
  Mexico: '10-15% at restaurants',
  UK: '10-12.5% at restaurants if not included',
  'United Kingdom': '10-12.5% at restaurants if not included',
  France: 'Service included, round up for good service',
  Germany: 'Round up 5-10%',
  Italy: 'Coperto (cover charge) included, small rounding up',
  Spain: 'Not expected, round up or leave small change',
  Greece: '5-10% at restaurants',
  Turkey: '5-10% at restaurants, round up taxis',
  Portugal: '5-10% at restaurants',
  Iceland: 'Not expected — included in prices',
  Australia: 'Not expected, 10% for exceptional service',
  'New Zealand': 'Not expected',
  'Costa Rica': '10% service charge usually included',
  Colombia: '10% propina suggested at restaurants',
  Brazil: '10% service charge usually included',
  Argentina: '10% at restaurants',
  Peru: '10% at restaurants',
  Morocco: '10% at restaurants, small tips for guides',
  Egypt: '10-15%, baksheesh culture for small services',
  'South Africa': '10-15% at restaurants',
  Jordan: '10% at restaurants',
  Israel: '10-15% at restaurants',
  UAE: '10-15% if no service charge',
  'United Arab Emirates': '10-15% if no service charge',
}

// Static language data by country
const LANGUAGES: Record<string, string[]> = {
  Thailand: ['Thai', 'English (tourism areas)'],
  Vietnam: ['Vietnamese', 'English (limited)'],
  Cambodia: ['Khmer', 'English'],
  Indonesia: ['Indonesian', 'English (tourism)'],
  Malaysia: ['Malay', 'English', 'Chinese'],
  Singapore: ['English', 'Mandarin', 'Malay', 'Tamil'],
  Philippines: ['Filipino', 'English'],
  Japan: ['Japanese'],
  'South Korea': ['Korean'],
  India: ['Hindi', 'English', 'Regional languages'],
  'Sri Lanka': ['Sinhala', 'Tamil', 'English'],
  Nepal: ['Nepali', 'English'],
  Turkey: ['Turkish'],
  Greece: ['Greek', 'English'],
  Italy: ['Italian'],
  Spain: ['Spanish', 'Catalan', 'Basque'],
  Portugal: ['Portuguese'],
  France: ['French'],
  Germany: ['German'],
  UK: ['English'],
  'United Kingdom': ['English'],
  Netherlands: ['Dutch', 'English'],
  'Czech Republic': ['Czech'],
  Hungary: ['Hungarian'],
  Poland: ['Polish'],
  Croatia: ['Croatian'],
  Iceland: ['Icelandic', 'English'],
  Sweden: ['Swedish', 'English'],
  Norway: ['Norwegian', 'English'],
  Denmark: ['Danish', 'English'],
  Finland: ['Finnish', 'Swedish', 'English'],
  Ireland: ['English', 'Irish'],
  Switzerland: ['German', 'French', 'Italian'],
  Austria: ['German'],
  Belgium: ['Dutch', 'French', 'German'],
  Romania: ['Romanian'],
  Serbia: ['Serbian'],
  Slovenia: ['Slovenian'],
  Bulgaria: ['Bulgarian'],
  USA: ['English', 'Spanish'],
  'United States': ['English', 'Spanish'],
  Canada: ['English', 'French'],
  Mexico: ['Spanish'],
  'Costa Rica': ['Spanish'],
  Colombia: ['Spanish'],
  Brazil: ['Portuguese'],
  Argentina: ['Spanish'],
  Peru: ['Spanish', 'Quechua'],
  Chile: ['Spanish'],
  Ecuador: ['Spanish', 'Quechua'],
  Morocco: ['Arabic', 'Berber', 'French'],
  Egypt: ['Arabic'],
  'South Africa': ['English', 'Afrikaans', 'Zulu', 'Xhosa'],
  Kenya: ['Swahili', 'English'],
  Tanzania: ['Swahili', 'English'],
  Jordan: ['Arabic', 'English'],
  Israel: ['Hebrew', 'Arabic', 'English'],
  UAE: ['Arabic', 'English'],
  'United Arab Emirates': ['Arabic', 'English'],
  Qatar: ['Arabic', 'English'],
  Oman: ['Arabic', 'English'],
  Georgia: ['Georgian', 'Russian', 'English'],
  Maldives: ['Dhivehi', 'English'],
  Australia: ['English'],
  'New Zealand': ['English', 'Maori'],
  Fiji: ['English', 'Fijian', 'Hindi'],
  'Hong Kong': ['Cantonese', 'English', 'Mandarin'],
  Taiwan: ['Mandarin', 'Taiwanese'],
}

// Top attractions by IATA code (static, curated top 3)
const TOP_ATTRACTIONS: Record<string, string[]> = {
  BKK: ['Grand Palace', 'Wat Arun', 'Chatuchak Weekend Market'],
  CNX: ['Doi Suthep Temple', 'Old City Night Market', 'Elephant Nature Park'],
  HKT: ['Phang Nga Bay', 'Patong Beach', 'Big Buddha'],
  DPS: ['Tanah Lot Temple', 'Ubud Rice Terraces', 'Uluwatu Temple'],
  SGN: ['Cu Chi Tunnels', 'War Remnants Museum', 'Ben Thanh Market'],
  HAN: ['Ha Long Bay', 'Hoan Kiem Lake', 'Temple of Literature'],
  NRT: ['Senso-ji Temple', 'Shibuya Crossing', 'Tokyo Skytree'],
  ICN: ['Gyeongbokgung Palace', 'Myeongdong', 'N Seoul Tower'],
  SIN: ['Marina Bay Sands', 'Gardens by the Bay', 'Sentosa Island'],
  KUL: ['Petronas Twin Towers', 'Batu Caves', 'Central Market'],
  IST: ['Hagia Sophia', 'Grand Bazaar', 'Blue Mosque'],
  ATH: ['Acropolis', 'Parthenon', 'Plaka neighborhood'],
  PRG: ['Charles Bridge', 'Prague Castle', 'Old Town Square'],
  BUD: ['Buda Castle', 'Szechenyi Thermal Baths', 'Parliament Building'],
  LIS: ['Belem Tower', 'Alfama neighborhood', 'Time Out Market'],
  BCN: ['Sagrada Familia', 'Park Guell', 'La Rambla'],
  FCO: ['Colosseum', 'Vatican Museums', 'Trevi Fountain'],
  CDG: ['Eiffel Tower', 'Louvre Museum', 'Montmartre'],
  AMS: ['Rijksmuseum', 'Anne Frank House', 'Canal Ring'],
  LHR: ['Tower of London', 'British Museum', 'Buckingham Palace'],
  CUN: ['Chichen Itza', 'Playa del Carmen', 'Isla Mujeres'],
  SJO: ['Arenal Volcano', 'Manuel Antonio', 'Monteverde Cloud Forest'],
  BOG: ['Monserrate', 'La Candelaria', 'Gold Museum'],
  LIM: ['Machu Picchu (via Cusco)', 'Miraflores', 'Larco Museum'],
  GIG: ['Christ the Redeemer', 'Sugarloaf Mountain', 'Copacabana Beach'],
  EZE: ['La Boca', 'Recoleta Cemetery', 'San Telmo Market'],
  CAI: ['Pyramids of Giza', 'Egyptian Museum', 'Khan el-Khalili'],
  RAK: ['Jemaa el-Fnaa', 'Majorelle Garden', 'Bahia Palace'],
  NBO: ['Nairobi National Park', 'David Sheldrick Trust', 'Giraffe Centre'],
  CPT: ['Table Mountain', 'Cape of Good Hope', 'V&A Waterfront'],
  DXB: ['Burj Khalifa', 'Dubai Mall', 'Palm Jumeirah'],
  AMM: ['Petra (day trip)', 'Jerash', 'Dead Sea'],
  TLV: ['Old City of Jerusalem', 'Jaffa', 'Dead Sea'],
  JFK: ['Statue of Liberty', 'Central Park', 'Times Square'],
  LAX: ['Hollywood Sign', 'Santa Monica Pier', 'Griffith Observatory'],
  SYD: ['Sydney Opera House', 'Harbour Bridge', 'Bondi Beach'],
  AKL: ['Sky Tower', 'Waiheke Island', 'Hobbiton (day trip)'],
  DEL: ['Taj Mahal (via Agra)', 'Red Fort', 'Qutub Minar'],
  CMB: ['Sigiriya Rock', 'Temple of the Tooth', 'Galle Fort'],
  KTM: ['Pashupatinath Temple', 'Boudhanath Stupa', 'Durbar Square'],
  TBS: ['Old Town', 'Narikala Fortress', 'Sulfur Baths'],
  KEF: ['Golden Circle', 'Blue Lagoon', 'Northern Lights'],
  MLE: ['Male Fish Market', 'Hulhumale Beach', 'Snorkeling excursions'],
}

// Local food by IATA
const LOCAL_FOOD: Record<string, string[]> = {
  BKK: ['Pad Thai', 'Som Tum (papaya salad)', 'Tom Yum Goong'],
  CNX: ['Khao Soi', 'Sai Oua (sausage)', 'Khanom Jeen'],
  HKT: ['Moo Hong (braised pork)', 'Hokkien Noodles', 'Fresh seafood'],
  DPS: ['Nasi Goreng', 'Babi Guling (suckling pig)', 'Satay'],
  SGN: ['Pho', 'Banh Mi', 'Com Tam (broken rice)'],
  HAN: ['Bun Cha', 'Pho', 'Egg Coffee'],
  NRT: ['Sushi', 'Ramen', 'Tempura'],
  ICN: ['Korean BBQ', 'Kimchi Jjigae', 'Tteokbokki'],
  SIN: ['Hainanese Chicken Rice', 'Chilli Crab', 'Laksa'],
  KUL: ['Nasi Lemak', 'Char Kway Teow', 'Roti Canai'],
  IST: ['Kebab', 'Lahmacun', 'Baklava'],
  ATH: ['Souvlaki', 'Moussaka', 'Greek Salad'],
  PRG: ['Trdelnik', 'Svickova', 'Czech Goulash'],
  BUD: ['Goulash', 'Langos', 'Chimney Cake'],
  LIS: ['Pastel de Nata', 'Bacalhau', 'Bifana'],
  BCN: ['Paella', 'Tapas', 'Crema Catalana'],
  FCO: ['Carbonara', 'Cacio e Pepe', 'Supplì'],
  CDG: ['Croissants', 'Coq au Vin', 'Crème Brûlée'],
  AMS: ['Stroopwafel', 'Bitterballen', 'Herring'],
  CUN: ['Tacos al Pastor', 'Ceviche', 'Cochinita Pibil'],
  CAI: ['Koshari', 'Ful Medames', 'Shawarma'],
  RAK: ['Tagine', 'Couscous', 'Pastilla'],
  DXB: ['Shawarma', 'Al Machboos', 'Luqaimat'],
}

/**
 * Build basic destination info from static data sources.
 * Does NOT make any API calls — purely local lookups.
 */
export function buildBasicInfo(
  iata: string,
  city: string,
  country: string,
): CachedDestination['basicInfo'] {
  const costData = getDestinationCost(iata)
  const currentMonth = new Date().getMonth() + 1
  const climate = getClimateData(iata, currentMonth)
  const tz = getTimezone(iata)

  // Build daily cost totals from destination-costs
  const dailyCosts = costData
    ? {
        budget:
          costData.dailyCosts.budget.hotel +
          costData.dailyCosts.budget.food +
          costData.dailyCosts.budget.transport +
          costData.dailyCosts.budget.activities,
        mid:
          costData.dailyCosts.mid.hotel +
          costData.dailyCosts.mid.food +
          costData.dailyCosts.mid.transport +
          costData.dailyCosts.mid.activities,
        comfort:
          costData.dailyCosts.comfort.hotel +
          costData.dailyCosts.comfort.food +
          costData.dailyCosts.comfort.transport +
          costData.dailyCosts.comfort.activities,
      }
    : { budget: 40, mid: 100, comfort: 250 }

  // Climate hint
  const climateHint = climate
    ? `${climate.avgTempC}°C — ${climate.description}`
    : getStaticClimateHint(country)

  return {
    climateHint,
    languages: LANGUAGES[country] || [],
    currency: costData?.currency || '',
    timezone: tz || '',
    dailyCosts,
    topAttractions: TOP_ATTRACTIONS[iata] || [],
    bestMonths: costData?.bestMonths || [],
    localFood: LOCAL_FOOD[iata] || [],
    safetyLevel: '', // Requires API — left empty, filled by enrichment
    plugType: PLUG_TYPES[country] || '',
    tippingCustom: TIPPING[country] || '',
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function getStaticClimateHint(country: string): string {
  const c = country.toLowerCase()
  const tropical = [
    'thailand', 'vietnam', 'cambodia', 'laos', 'myanmar', 'indonesia',
    'malaysia', 'philippines', 'singapore', 'india', 'sri lanka', 'maldives',
    'costa rica', 'panama', 'colombia', 'ecuador', 'peru', 'brazil',
    'mexico', 'cuba', 'kenya', 'tanzania', 'fiji',
  ]
  const desert = [
    'egypt', 'morocco', 'tunisia', 'jordan', 'israel', 'oman',
    'uae', 'united arab emirates', 'qatar', 'saudi arabia',
  ]
  const cold = ['iceland', 'norway', 'sweden', 'finland', 'russia', 'canada']
  const med = [
    'greece', 'italy', 'spain', 'portugal', 'croatia', 'turkey',
    'cyprus', 'malta', 'montenegro',
  ]

  if (tropical.some(t => c.includes(t))) return 'Tropical — warm & humid'
  if (desert.some(t => c.includes(t))) return 'Arid & warm — sunscreen essential'
  if (cold.some(t => c.includes(t))) return 'Cool climate — pack warm layers'
  if (med.some(t => c.includes(t))) return 'Mediterranean — sunny & pleasant'
  return 'Temperate — pack layers'
}
