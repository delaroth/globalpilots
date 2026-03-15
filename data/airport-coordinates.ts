// IATA airport code to lat/lon coordinates and timezone
// Top 150+ airports covering all continents
// Sources: OurAirports, Great Circle Mapper

interface AirportInfo {
  lat: number
  lon: number
  tz: string // IANA timezone identifier
}

const AIRPORTS: Record<string, AirportInfo> = {
  // ========== SOUTHEAST ASIA ==========
  BKK: { lat: 13.6900, lon: 100.7501, tz: 'Asia/Bangkok' },
  DMK: { lat: 13.9126, lon: 100.6068, tz: 'Asia/Bangkok' },
  CNX: { lat: 18.7668, lon: 98.9626, tz: 'Asia/Bangkok' },
  HKT: { lat: 8.1132, lon: 98.3169, tz: 'Asia/Bangkok' },
  USM: { lat: 9.5478, lon: 100.0623, tz: 'Asia/Bangkok' },
  CEI: { lat: 19.9523, lon: 99.8828, tz: 'Asia/Bangkok' },
  CGK: { lat: -6.1256, lon: 106.6559, tz: 'Asia/Jakarta' },
  DPS: { lat: -8.7482, lon: 115.1672, tz: 'Asia/Makassar' },
  JOG: { lat: -7.7882, lon: 110.4317, tz: 'Asia/Jakarta' },
  SUB: { lat: -7.3798, lon: 112.7868, tz: 'Asia/Jakarta' },
  SIN: { lat: 1.3502, lon: 103.9940, tz: 'Asia/Singapore' },
  KUL: { lat: 2.7456, lon: 101.7099, tz: 'Asia/Kuala_Lumpur' },
  PEN: { lat: 5.2972, lon: 100.2768, tz: 'Asia/Kuala_Lumpur' },
  LGK: { lat: 6.3297, lon: 99.7287, tz: 'Asia/Kuala_Lumpur' },
  BKI: { lat: 5.9372, lon: 116.0515, tz: 'Asia/Kuching' },
  SGN: { lat: 10.8188, lon: 106.6520, tz: 'Asia/Ho_Chi_Minh' },
  HAN: { lat: 21.2212, lon: 105.8072, tz: 'Asia/Ho_Chi_Minh' },
  DAD: { lat: 16.0439, lon: 108.1992, tz: 'Asia/Ho_Chi_Minh' },
  PQC: { lat: 10.1698, lon: 103.9931, tz: 'Asia/Ho_Chi_Minh' },
  MNL: { lat: 14.5086, lon: 121.0197, tz: 'Asia/Manila' },
  CEB: { lat: 10.3076, lon: 123.9789, tz: 'Asia/Manila' },
  PNH: { lat: 11.5466, lon: 104.8442, tz: 'Asia/Phnom_Penh' },
  REP: { lat: 13.4107, lon: 103.8128, tz: 'Asia/Phnom_Penh' },
  VTE: { lat: 17.9883, lon: 102.5633, tz: 'Asia/Vientiane' },
  LPQ: { lat: 19.8973, lon: 102.1614, tz: 'Asia/Vientiane' },
  RGN: { lat: 16.9073, lon: 96.1332, tz: 'Asia/Yangon' },

  // ========== EAST ASIA ==========
  NRT: { lat: 35.7647, lon: 140.3864, tz: 'Asia/Tokyo' },
  HND: { lat: 35.5494, lon: 139.7798, tz: 'Asia/Tokyo' },
  KIX: { lat: 34.4347, lon: 135.2440, tz: 'Asia/Tokyo' },
  FUK: { lat: 33.5859, lon: 130.4513, tz: 'Asia/Tokyo' },
  CTS: { lat: 42.7752, lon: 141.6924, tz: 'Asia/Tokyo' },
  NGO: { lat: 34.8584, lon: 136.8124, tz: 'Asia/Tokyo' },
  ICN: { lat: 37.4691, lon: 126.4505, tz: 'Asia/Seoul' },
  GMP: { lat: 37.5583, lon: 126.7906, tz: 'Asia/Seoul' },
  PUS: { lat: 35.1796, lon: 128.9382, tz: 'Asia/Seoul' },
  HKG: { lat: 22.3080, lon: 113.9185, tz: 'Asia/Hong_Kong' },
  TPE: { lat: 25.0777, lon: 121.2328, tz: 'Asia/Taipei' },
  PEK: { lat: 40.0799, lon: 116.6031, tz: 'Asia/Shanghai' },
  PVG: { lat: 31.1443, lon: 121.8083, tz: 'Asia/Shanghai' },
  CAN: { lat: 23.3924, lon: 113.2988, tz: 'Asia/Shanghai' },
  CTU: { lat: 30.5785, lon: 103.9471, tz: 'Asia/Shanghai' },
  SZX: { lat: 22.6393, lon: 113.8107, tz: 'Asia/Shanghai' },
  MFM: { lat: 22.1496, lon: 113.5920, tz: 'Asia/Macau' },

  // ========== SOUTH ASIA ==========
  DEL: { lat: 28.5562, lon: 77.1000, tz: 'Asia/Kolkata' },
  BOM: { lat: 19.0896, lon: 72.8656, tz: 'Asia/Kolkata' },
  BLR: { lat: 13.1979, lon: 77.7063, tz: 'Asia/Kolkata' },
  MAA: { lat: 12.9941, lon: 80.1709, tz: 'Asia/Kolkata' },
  CCU: { lat: 22.6547, lon: 88.4467, tz: 'Asia/Kolkata' },
  COK: { lat: 10.1520, lon: 76.4019, tz: 'Asia/Kolkata' },
  CMB: { lat: 7.1808, lon: 79.8841, tz: 'Asia/Colombo' },
  KTM: { lat: 27.6966, lon: 85.3591, tz: 'Asia/Kathmandu' },
  DAC: { lat: 23.8433, lon: 90.3978, tz: 'Asia/Dhaka' },
  KHI: { lat: 24.9065, lon: 67.1610, tz: 'Asia/Karachi' },
  ISB: { lat: 33.6167, lon: 73.0992, tz: 'Asia/Karachi' },
  MLE: { lat: 4.1918, lon: 73.5290, tz: 'Indian/Maldives' },

  // ========== MIDDLE EAST ==========
  DXB: { lat: 25.2532, lon: 55.3657, tz: 'Asia/Dubai' },
  AUH: { lat: 24.4330, lon: 54.6511, tz: 'Asia/Dubai' },
  DOH: { lat: 25.2731, lon: 51.6081, tz: 'Asia/Qatar' },
  IST: { lat: 41.2753, lon: 28.7519, tz: 'Europe/Istanbul' },
  SAW: { lat: 40.8986, lon: 29.3092, tz: 'Europe/Istanbul' },
  AYT: { lat: 36.8987, lon: 30.8005, tz: 'Europe/Istanbul' },
  TLV: { lat: 32.0114, lon: 34.8867, tz: 'Asia/Jerusalem' },
  AMM: { lat: 31.7226, lon: 35.9932, tz: 'Asia/Amman' },
  CAI: { lat: 30.1219, lon: 31.4056, tz: 'Africa/Cairo' },
  RUH: { lat: 24.9576, lon: 46.6988, tz: 'Asia/Riyadh' },
  JED: { lat: 21.6796, lon: 39.1565, tz: 'Asia/Riyadh' },
  MCT: { lat: 23.5933, lon: 58.2844, tz: 'Asia/Muscat' },
  KWI: { lat: 29.2266, lon: 47.9689, tz: 'Asia/Kuwait' },
  BAH: { lat: 26.2708, lon: 50.6336, tz: 'Asia/Bahrain' },
  TBS: { lat: 41.6692, lon: 44.9547, tz: 'Asia/Tbilisi' },

  // ========== EUROPE ==========
  LHR: { lat: 51.4700, lon: -0.4543, tz: 'Europe/London' },
  LGW: { lat: 51.1537, lon: -0.1821, tz: 'Europe/London' },
  STN: { lat: 51.8860, lon: 0.2389, tz: 'Europe/London' },
  CDG: { lat: 49.0097, lon: 2.5479, tz: 'Europe/Paris' },
  ORY: { lat: 48.7262, lon: 2.3652, tz: 'Europe/Paris' },
  AMS: { lat: 52.3086, lon: 4.7639, tz: 'Europe/Amsterdam' },
  MAD: { lat: 40.4936, lon: -3.5668, tz: 'Europe/Madrid' },
  BCN: { lat: 41.2971, lon: 2.0785, tz: 'Europe/Madrid' },
  LIS: { lat: 38.7813, lon: -9.1359, tz: 'Europe/Lisbon' },
  OPO: { lat: 41.2481, lon: -8.6814, tz: 'Europe/Lisbon' },
  PRG: { lat: 50.1008, lon: 14.2600, tz: 'Europe/Prague' },
  BUD: { lat: 47.4369, lon: 19.2556, tz: 'Europe/Budapest' },
  ATH: { lat: 37.9364, lon: 23.9445, tz: 'Europe/Athens' },
  FCO: { lat: 41.8003, lon: 12.2389, tz: 'Europe/Rome' },
  MXP: { lat: 45.6306, lon: 8.7281, tz: 'Europe/Rome' },
  VCE: { lat: 45.5053, lon: 12.3519, tz: 'Europe/Rome' },
  FRA: { lat: 50.0379, lon: 8.5622, tz: 'Europe/Berlin' },
  MUC: { lat: 48.3538, lon: 11.7861, tz: 'Europe/Berlin' },
  TXL: { lat: 52.5597, lon: 13.2877, tz: 'Europe/Berlin' },
  BER: { lat: 52.3667, lon: 13.5033, tz: 'Europe/Berlin' },
  VIE: { lat: 48.1103, lon: 16.5697, tz: 'Europe/Vienna' },
  WAW: { lat: 52.1657, lon: 20.9671, tz: 'Europe/Warsaw' },
  CPH: { lat: 55.6180, lon: 12.6560, tz: 'Europe/Copenhagen' },
  DUB: { lat: 53.4213, lon: -6.2701, tz: 'Europe/Dublin' },
  ZRH: { lat: 47.4647, lon: 8.5492, tz: 'Europe/Zurich' },
  GVA: { lat: 46.2381, lon: 6.1090, tz: 'Europe/Zurich' },
  ARN: { lat: 59.6519, lon: 17.9186, tz: 'Europe/Stockholm' },
  OSL: { lat: 60.1976, lon: 11.1004, tz: 'Europe/Oslo' },
  HEL: { lat: 60.3172, lon: 24.9633, tz: 'Europe/Helsinki' },
  BRU: { lat: 50.9014, lon: 4.4844, tz: 'Europe/Brussels' },
  OTP: { lat: 44.5722, lon: 26.1022, tz: 'Europe/Bucharest' },
  SOF: { lat: 42.6952, lon: 23.4062, tz: 'Europe/Sofia' },
  ZAG: { lat: 45.7429, lon: 16.0688, tz: 'Europe/Zagreb' },
  BEG: { lat: 44.8184, lon: 20.3091, tz: 'Europe/Belgrade' },
  LJU: { lat: 46.2237, lon: 14.4576, tz: 'Europe/Ljubljana' },
  KEF: { lat: 63.9850, lon: -22.6056, tz: 'Atlantic/Reykjavik' },
  EDI: { lat: 55.9508, lon: -3.3726, tz: 'Europe/London' },
  MAN: { lat: 53.3537, lon: -2.2750, tz: 'Europe/London' },

  // ========== NORTH AMERICA ==========
  JFK: { lat: 40.6413, lon: -73.7781, tz: 'America/New_York' },
  EWR: { lat: 40.6895, lon: -74.1745, tz: 'America/New_York' },
  LGA: { lat: 40.7769, lon: -73.8740, tz: 'America/New_York' },
  LAX: { lat: 33.9416, lon: -118.4085, tz: 'America/Los_Angeles' },
  SFO: { lat: 37.6213, lon: -122.3790, tz: 'America/Los_Angeles' },
  ORD: { lat: 41.9742, lon: -87.9073, tz: 'America/Chicago' },
  ATL: { lat: 33.6407, lon: -84.4277, tz: 'America/New_York' },
  DFW: { lat: 32.8998, lon: -97.0403, tz: 'America/Chicago' },
  MIA: { lat: 25.7959, lon: -80.2870, tz: 'America/New_York' },
  SEA: { lat: 47.4502, lon: -122.3088, tz: 'America/Los_Angeles' },
  BOS: { lat: 42.3656, lon: -71.0096, tz: 'America/New_York' },
  DEN: { lat: 39.8561, lon: -104.6737, tz: 'America/Denver' },
  IAD: { lat: 38.9531, lon: -77.4565, tz: 'America/New_York' },
  MSP: { lat: 44.8848, lon: -93.2223, tz: 'America/Chicago' },
  DTW: { lat: 42.2124, lon: -83.3534, tz: 'America/Detroit' },
  PHX: { lat: 33.4373, lon: -112.0078, tz: 'America/Phoenix' },
  IAH: { lat: 29.9902, lon: -95.3368, tz: 'America/Chicago' },
  LAS: { lat: 36.0840, lon: -115.1537, tz: 'America/Los_Angeles' },
  MCO: { lat: 28.4312, lon: -81.3081, tz: 'America/New_York' },
  HNL: { lat: 21.3187, lon: -157.9225, tz: 'Pacific/Honolulu' },
  YYZ: { lat: 43.6777, lon: -79.6248, tz: 'America/Toronto' },
  YVR: { lat: 49.1967, lon: -123.1815, tz: 'America/Vancouver' },
  YUL: { lat: 45.4706, lon: -73.7408, tz: 'America/Montreal' },
  MEX: { lat: 19.4363, lon: -99.0721, tz: 'America/Mexico_City' },
  CUN: { lat: 21.0365, lon: -86.8771, tz: 'America/Cancun' },
  GDL: { lat: 20.5218, lon: -103.3111, tz: 'America/Mexico_City' },
  SJO: { lat: 9.9939, lon: -84.2088, tz: 'America/Costa_Rica' },
  PTY: { lat: 9.0714, lon: -79.3835, tz: 'America/Panama' },
  HAV: { lat: 22.9892, lon: -82.4091, tz: 'America/Havana' },

  // ========== SOUTH AMERICA ==========
  GRU: { lat: -23.4356, lon: -46.4731, tz: 'America/Sao_Paulo' },
  GIG: { lat: -22.8100, lon: -43.2505, tz: 'America/Sao_Paulo' },
  EZE: { lat: -34.8222, lon: -58.5358, tz: 'America/Argentina/Buenos_Aires' },
  BOG: { lat: 4.7016, lon: -74.1469, tz: 'America/Bogota' },
  MDE: { lat: 6.1645, lon: -75.4231, tz: 'America/Bogota' },
  CTG: { lat: 10.4424, lon: -75.5130, tz: 'America/Bogota' },
  LIM: { lat: -12.0219, lon: -77.1143, tz: 'America/Lima' },
  CUZ: { lat: -13.5357, lon: -71.9388, tz: 'America/Lima' },
  SCL: { lat: -33.3930, lon: -70.7858, tz: 'America/Santiago' },
  UIO: { lat: -0.1292, lon: -78.3575, tz: 'America/Guayaquil' },
  MVD: { lat: -34.8384, lon: -56.0308, tz: 'America/Montevideo' },

  // ========== AFRICA ==========
  JNB: { lat: -26.1392, lon: 28.2460, tz: 'Africa/Johannesburg' },
  CPT: { lat: -33.9715, lon: 18.6017, tz: 'Africa/Johannesburg' },
  NBO: { lat: -1.3192, lon: 36.9278, tz: 'Africa/Nairobi' },
  DSS: { lat: 14.7397, lon: -17.4902, tz: 'Africa/Dakar' },
  CMN: { lat: 33.3675, lon: -7.5898, tz: 'Africa/Casablanca' },
  RAK: { lat: 31.6069, lon: -8.0363, tz: 'Africa/Casablanca' },
  ADD: { lat: 8.9779, lon: 38.7993, tz: 'Africa/Addis_Ababa' },
  DAR: { lat: -6.8781, lon: 39.2026, tz: 'Africa/Dar_es_Salaam' },
  LOS: { lat: 6.5774, lon: 3.3213, tz: 'Africa/Lagos' },
  ACC: { lat: 5.6052, lon: -0.1668, tz: 'Africa/Accra' },
  WDH: { lat: -22.4799, lon: 17.4709, tz: 'Africa/Windhoek' },
  MRU: { lat: -20.4302, lon: 57.6836, tz: 'Indian/Mauritius' },
  TUN: { lat: 36.8510, lon: 10.2272, tz: 'Africa/Tunis' },

  // ========== OCEANIA ==========
  SYD: { lat: -33.9461, lon: 151.1772, tz: 'Australia/Sydney' },
  MEL: { lat: -37.6733, lon: 144.8430, tz: 'Australia/Melbourne' },
  BNE: { lat: -27.3842, lon: 153.1175, tz: 'Australia/Brisbane' },
  PER: { lat: -31.9403, lon: 115.9672, tz: 'Australia/Perth' },
  AKL: { lat: -37.0082, lon: 174.7850, tz: 'Pacific/Auckland' },
  CHC: { lat: -43.4894, lon: 172.5322, tz: 'Pacific/Auckland' },
  NAN: { lat: -17.7554, lon: 177.4431, tz: 'Pacific/Fiji' },
  PPT: { lat: -17.5537, lon: -149.6071, tz: 'Pacific/Tahiti' },
}

/**
 * Look up lat/lon coordinates for an IATA airport code.
 * Returns null if the code is not in our database.
 */
export function getAirportCoords(iata: string): { lat: number; lon: number } | null {
  const info = AIRPORTS[iata.toUpperCase()]
  if (!info) return null
  return { lat: info.lat, lon: info.lon }
}

/**
 * Look up IANA timezone identifier for an IATA airport code.
 * Returns null if the code is not in our database.
 */
export function getTimezone(iata: string): string | null {
  const info = AIRPORTS[iata.toUpperCase()]
  return info?.tz ?? null
}
