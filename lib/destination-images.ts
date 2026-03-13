/**
 * Curated destination images from Unsplash for major airports.
 * Uses Unsplash Source format for optimized, cropped images.
 * All photo IDs are real, permanent Unsplash identifiers.
 */

const UNSPLASH_BASE = 'https://images.unsplash.com'

function unsplashUrl(photoId: string): string {
  return `${UNSPLASH_BASE}/${photoId}?w=800&h=500&fit=crop&auto=format`
}

/** Map of IATA airport codes to Unsplash photo URLs */
export const destinationImages: Record<string, string> = {
  // Southeast Asia
  BKK: unsplashUrl('photo-1508009603885-50cf7c579365'),
  SIN: unsplashUrl('photo-1525625293386-3f8f99389edd'),
  KUL: unsplashUrl('photo-1596422846543-75c6fc197f07'),
  DPS: unsplashUrl('photo-1537996194471-e657df975ab4'),
  HAN: unsplashUrl('photo-1509030450996-dd1a26dda07a'),
  SGN: unsplashUrl('photo-1583417319070-4a69db38a482'),
  CNX: unsplashUrl('photo-1512553319705-593d8b0e5cc2'),
  HKT: unsplashUrl('photo-1537956965359-7573183d1f57'),

  // East Asia
  NRT: unsplashUrl('photo-1540959733332-eab4deabeeaf'),
  HND: unsplashUrl('photo-1540959733332-eab4deabeeaf'),
  ICN: unsplashUrl('photo-1534274867514-d5b47ef89ed7'),
  HKG: unsplashUrl('photo-1536599018102-9f803c4ae8b0'),
  TPE: unsplashUrl('photo-1470004914212-05527e49370b'),
  PVG: unsplashUrl('photo-1547981609-4b6bfe67ca0b'),
  PEK: unsplashUrl('photo-1547981609-4b6bfe67ca0b'),

  // Middle East
  DXB: unsplashUrl('photo-1512453913616-cc66e2d50070'),
  IST: unsplashUrl('photo-1524231757912-21f4fe3a7200'),
  DOH: unsplashUrl('photo-1518684079166-cb02e2458e9b'),
  MCT: unsplashUrl('photo-1547483238-f400e65ccd56'),
  AMM: unsplashUrl('photo-1547483238-f400e65ccd56'),

  // Western Europe
  LHR: unsplashUrl('photo-1513635269975-59663e0ac1ad'),
  CDG: unsplashUrl('photo-1502602898657-3e91760cbb34'),
  AMS: unsplashUrl('photo-1534351590666-13e3e96b5017'),
  FRA: unsplashUrl('photo-1467269204594-9661b134dd2b'),
  BCN: unsplashUrl('photo-1583422409516-2895a77efded'),
  FCO: unsplashUrl('photo-1552832230-c0197dd311b5'),
  MAD: unsplashUrl('photo-1543783207-ec64e8d95325'),
  LIS: unsplashUrl('photo-1555881400-74d7acaacd6b'),

  // Central & Eastern Europe
  PRG: unsplashUrl('photo-1519677100203-a0e668c92439'),
  BUD: unsplashUrl('photo-1541849546-216549ae216d'),
  ATH: unsplashUrl('photo-1555993539-1732b0258235'),
  BER: unsplashUrl('photo-1560969184-10fe8719e047'),
  VIE: unsplashUrl('photo-1516550893923-42d28e5677af'),
  MUC: unsplashUrl('photo-1595867818082-083862f3d630'),
  ZRH: unsplashUrl('photo-1515488764276-beab7607c1e6'),
  CPH: unsplashUrl('photo-1513622470522-26c3c8a854bc'),

  // North America
  JFK: unsplashUrl('photo-1496442226666-8d4d0e62e6e9'),
  EWR: unsplashUrl('photo-1496442226666-8d4d0e62e6e9'),
  LAX: unsplashUrl('photo-1534190760961-74e8c1c5c3da'),
  MIA: unsplashUrl('photo-1533106497176-45ae19e68ba2'),
  SFO: unsplashUrl('photo-1501594907352-04cda38ebc29'),
  ORD: unsplashUrl('photo-1494522855154-9297ac14b55f'),
  DEN: unsplashUrl('photo-1546156929-a4c0ac411f47'),
  SEA: unsplashUrl('photo-1502175353174-a7a0ec36b93f'),
  YYZ: unsplashUrl('photo-1517090504611-19cc2b26a1f2'),

  // Latin America
  MEX: unsplashUrl('photo-1518105779142-d975f22f1b0a'),
  GRU: unsplashUrl('photo-1554168848-986d2d23c198'),
  EZE: unsplashUrl('photo-1589909202802-8f4aadce1849'),
  BOG: unsplashUrl('photo-1536751048178-0845bfea3e49'),
  LIM: unsplashUrl('photo-1531065208531-4036c0dba3ca'),
  SCL: unsplashUrl('photo-1510399080498-8bba4f3dc393'),

  // Africa & Middle East
  CAI: unsplashUrl('photo-1572252009286-268acec5ca0a'),
  TLV: unsplashUrl('photo-1544967082-d26dba57c430'),
  NBO: unsplashUrl('photo-1611348524140-53c9a25263d6'),
  CPT: unsplashUrl('photo-1580060839134-75a5edca2e99'),
  RAK: unsplashUrl('photo-1489749798305-4fea3ae63d43'),
  MRR: unsplashUrl('photo-1489749798305-4fea3ae63d43'),

  // South Asia
  DEL: unsplashUrl('photo-1515091943-3d762c50e442'),
  BOM: unsplashUrl('photo-1529253355930-ddbe423a2ac7'),
  CMB: unsplashUrl('photo-1552055568-93de21be114c'),
  KTM: unsplashUrl('photo-1544735716-392fe2489ffa'),
  MLE: unsplashUrl('photo-1514282401047-d79a71a590e8'),
}

/**
 * Returns the Unsplash destination image URL for a given IATA code,
 * or null if no curated image exists.
 */
export function getDestinationImage(code: string): string | null {
  const upper = code?.toUpperCase?.() ?? ''
  return destinationImages[upper] || null
}

/**
 * Returns image data with a fallback-awareness flag.
 * If a curated image exists, returns the URL and hasImage: true.
 * Otherwise returns null URL and hasImage: false.
 */
export function getDestinationImageWithFallback(
  code: string,
  cityName?: string
): { url: string | null; hasImage: boolean } {
  const upper = code?.toUpperCase?.() ?? ''
  const url = destinationImages[upper] || null
  return { url, hasImage: !!url }
}

/**
 * Returns true if the library has a curated image for this IATA code.
 */
export function hasDestinationImage(code: string): boolean {
  const upper = code?.toUpperCase?.() ?? ''
  return upper in destinationImages
}
