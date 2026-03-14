// Static plug/adapter data for travel destinations
// Based on IEC World Plugs standard (https://www.iec.ch/world-plugs)
// Reference baseline: US standard (Types A/B, 120V, 60Hz)

export interface PlugInfo {
  types: string[]        // e.g. ["A", "B"]
  voltage: number        // e.g. 120
  frequency: number      // e.g. 60
  description: string    // practical advice for travelers
  adapterNeeded: boolean // relative to US standard (types A/B, 120V)
}

export const PLUG_DATA: Record<string, PlugInfo> = {
  // ========== SOUTHEAST ASIA ==========
  TH: {
    types: ['A', 'B', 'C', 'O'],
    voltage: 220,
    frequency: 50,
    description: 'Mixed outlets — Type A (US flat prongs) works in many sockets, but Type C adapter recommended for universal coverage. 220V — check device compatibility.',
    adapterNeeded: true,
  },
  ID: {
    types: ['C', 'F'],
    voltage: 230,
    frequency: 50,
    description: 'European-style round pins (Type C/F). US plugs will not fit. 230V — use a voltage converter for non-dual-voltage devices.',
    adapterNeeded: true,
  },
  SG: {
    types: ['G'],
    voltage: 230,
    frequency: 50,
    description: 'UK-style three-pin rectangular (Type G). Adapter required. 230V — most modern electronics are dual-voltage.',
    adapterNeeded: true,
  },
  MY: {
    types: ['G'],
    voltage: 240,
    frequency: 50,
    description: 'UK-style three-pin rectangular (Type G). Adapter required. 240V — verify your devices support this voltage.',
    adapterNeeded: true,
  },
  VN: {
    types: ['A', 'C'],
    voltage: 220,
    frequency: 50,
    description: 'Mixed outlets — many accept US Type A flat prongs. Bring a Type C adapter as backup. 220V — check device voltage ratings.',
    adapterNeeded: true,
  },
  PH: {
    types: ['A', 'B', 'C'],
    voltage: 220,
    frequency: 60,
    description: 'Uses same plug shape as US (Type A/B), so your plugs will fit. However, voltage is 220V — verify device compatibility.',
    adapterNeeded: false,
  },
  KH: {
    types: ['A', 'C', 'G'],
    voltage: 230,
    frequency: 50,
    description: 'Mixed outlets — Type A (US) sockets are common but not universal. Bring a universal adapter. 230V.',
    adapterNeeded: true,
  },
  LA: {
    types: ['A', 'B', 'C', 'E', 'F'],
    voltage: 230,
    frequency: 50,
    description: 'Mixed outlet types. US Type A/B plugs work in some sockets. Bring a universal adapter to be safe. 230V.',
    adapterNeeded: true,
  },

  // ========== EAST ASIA ==========
  JP: {
    types: ['A', 'B'],
    voltage: 100,
    frequency: 50,
    description: 'Same plug shape as US (Type A/B) — no adapter needed. Voltage is only 100V, which is fine for all modern electronics.',
    adapterNeeded: false,
  },
  KR: {
    types: ['C', 'F'],
    voltage: 220,
    frequency: 60,
    description: 'European-style round pins (Type C/F). US plugs will not fit — adapter required. 220V.',
    adapterNeeded: true,
  },
  HK: {
    types: ['G'],
    voltage: 220,
    frequency: 50,
    description: 'UK-style three-pin rectangular (Type G). Adapter required. Hotels often provide universal outlets. 220V.',
    adapterNeeded: true,
  },
  TW: {
    types: ['A', 'B'],
    voltage: 110,
    frequency: 60,
    description: 'Same as US — Type A/B plugs at 110V/60Hz. No adapter needed. Fully compatible with US devices.',
    adapterNeeded: false,
  },
  CN: {
    types: ['A', 'C', 'I'],
    voltage: 220,
    frequency: 50,
    description: 'Mixed outlets — many accept US Type A flat prongs, but some use Type I (angled). Universal adapter recommended. 220V.',
    adapterNeeded: true,
  },

  // ========== SOUTH ASIA ==========
  IN: {
    types: ['C', 'D', 'M'],
    voltage: 230,
    frequency: 50,
    description: 'Type D (large round pins) is most common. US plugs will not fit. Adapter required. 230V.',
    adapterNeeded: true,
  },
  LK: {
    types: ['D', 'G'],
    voltage: 230,
    frequency: 50,
    description: 'Mix of Type D (Indian) and Type G (UK) outlets. Universal adapter needed. 230V.',
    adapterNeeded: true,
  },
  NP: {
    types: ['C', 'D', 'M'],
    voltage: 230,
    frequency: 50,
    description: 'Same plug types as India (Type C/D/M). Adapter required. 230V. Power outages are common — bring a power bank.',
    adapterNeeded: true,
  },

  // ========== MIDDLE EAST ==========
  AE: {
    types: ['C', 'G'],
    voltage: 220,
    frequency: 50,
    description: 'Primarily UK-style Type G, some European Type C. Adapter required. Hotels often provide universal outlets. 220V.',
    adapterNeeded: true,
  },
  TR: {
    types: ['C', 'F'],
    voltage: 230,
    frequency: 50,
    description: 'European-style round pins (Type C/F). Adapter required. 230V.',
    adapterNeeded: true,
  },
  QA: {
    types: ['G'],
    voltage: 240,
    frequency: 50,
    description: 'UK-style three-pin rectangular (Type G). Adapter required. Many hotels provide adapters. 240V.',
    adapterNeeded: true,
  },
  IL: {
    types: ['C', 'H'],
    voltage: 230,
    frequency: 50,
    description: 'Type H (unique to Israel, 3 round pins in V-shape) and Type C. Adapter required. 230V.',
    adapterNeeded: true,
  },
  JO: {
    types: ['B', 'C', 'D', 'F', 'G', 'J'],
    voltage: 230,
    frequency: 50,
    description: 'Mixed outlet types. Some accept US Type B. Bring a universal adapter. 230V.',
    adapterNeeded: true,
  },
  EG: {
    types: ['C', 'F'],
    voltage: 220,
    frequency: 50,
    description: 'European-style round pins (Type C/F). Adapter required. 220V.',
    adapterNeeded: true,
  },

  // ========== EUROPE ==========
  GB: {
    types: ['G'],
    voltage: 230,
    frequency: 50,
    description: 'UK-style three-pin rectangular (Type G). Adapter required. Widely available at airports. 230V.',
    adapterNeeded: true,
  },
  FR: {
    types: ['C', 'E'],
    voltage: 230,
    frequency: 50,
    description: 'European round pins with grounding pin (Type E). Type C works too. Adapter required. 230V.',
    adapterNeeded: true,
  },
  NL: {
    types: ['C', 'F'],
    voltage: 230,
    frequency: 50,
    description: 'European-style round pins (Type C/F). Adapter required. 230V.',
    adapterNeeded: true,
  },
  ES: {
    types: ['C', 'F'],
    voltage: 230,
    frequency: 50,
    description: 'European-style round pins (Type C/F). Adapter required. 230V.',
    adapterNeeded: true,
  },
  PT: {
    types: ['C', 'F'],
    voltage: 230,
    frequency: 50,
    description: 'European-style round pins (Type C/F). Adapter required. 230V.',
    adapterNeeded: true,
  },
  CZ: {
    types: ['C', 'E'],
    voltage: 230,
    frequency: 50,
    description: 'European round pins (Type C/E). Adapter required. 230V.',
    adapterNeeded: true,
  },
  HU: {
    types: ['C', 'F'],
    voltage: 230,
    frequency: 50,
    description: 'European-style round pins (Type C/F). Adapter required. 230V.',
    adapterNeeded: true,
  },
  GR: {
    types: ['C', 'F'],
    voltage: 230,
    frequency: 50,
    description: 'European-style round pins (Type C/F). Adapter required. 230V.',
    adapterNeeded: true,
  },
  IT: {
    types: ['C', 'F', 'L'],
    voltage: 230,
    frequency: 50,
    description: 'Type L (3 round pins in a line) is unique to Italy. Type C also works. Adapter required. 230V.',
    adapterNeeded: true,
  },
  DE: {
    types: ['C', 'F'],
    voltage: 230,
    frequency: 50,
    description: 'European-style round pins with grounding clips (Type F/Schuko). Type C works too. Adapter required. 230V.',
    adapterNeeded: true,
  },
  AT: {
    types: ['C', 'F'],
    voltage: 230,
    frequency: 50,
    description: 'European-style round pins (Type C/F). Same as Germany. Adapter required. 230V.',
    adapterNeeded: true,
  },
  PL: {
    types: ['C', 'E'],
    voltage: 230,
    frequency: 50,
    description: 'European round pins (Type C/E). Same as France. Adapter required. 230V.',
    adapterNeeded: true,
  },
  DK: {
    types: ['C', 'E', 'F', 'K'],
    voltage: 230,
    frequency: 50,
    description: 'Type K (unique to Denmark, 3 round pins) plus standard European. Type C adapter works. 230V.',
    adapterNeeded: true,
  },
  IE: {
    types: ['G'],
    voltage: 230,
    frequency: 50,
    description: 'UK-style three-pin rectangular (Type G). Same adapter as UK. 230V.',
    adapterNeeded: true,
  },

  // ========== AMERICAS ==========
  US: {
    types: ['A', 'B'],
    voltage: 120,
    frequency: 60,
    description: 'Standard US outlets — no adapter needed for US travelers.',
    adapterNeeded: false,
  },
  MX: {
    types: ['A', 'B'],
    voltage: 127,
    frequency: 60,
    description: 'Same as US — Type A/B plugs at 127V/60Hz. No adapter needed. Fully compatible with US devices.',
    adapterNeeded: false,
  },
  CO: {
    types: ['A', 'B'],
    voltage: 110,
    frequency: 60,
    description: 'Same as US — Type A/B plugs at 110V/60Hz. No adapter needed.',
    adapterNeeded: false,
  },
  PE: {
    types: ['A', 'B', 'C'],
    voltage: 220,
    frequency: 60,
    description: 'Mixed outlets — Type A/B (US) and Type C (European). US plugs fit most outlets. Voltage is 220V — check device compatibility.',
    adapterNeeded: false,
  },
  AR: {
    types: ['C', 'I'],
    voltage: 220,
    frequency: 50,
    description: 'Type I (angled flat pins) is standard. US plugs will not fit. Adapter required. 220V.',
    adapterNeeded: true,
  },
  BR: {
    types: ['C', 'N'],
    voltage: 127,
    frequency: 60,
    description: 'Type N (unique to Brazil, 3 round pins). Type C also used. Adapter required. Voltage varies by region (127V or 220V).',
    adapterNeeded: true,
  },
  CL: {
    types: ['C', 'L'],
    voltage: 220,
    frequency: 50,
    description: 'Type L (Italian-style, 3 round pins in a line) and Type C. Adapter required. 220V.',
    adapterNeeded: true,
  },
  PA: {
    types: ['A', 'B'],
    voltage: 120,
    frequency: 60,
    description: 'Same as US — Type A/B plugs at 120V/60Hz. No adapter needed.',
    adapterNeeded: false,
  },
  CR: {
    types: ['A', 'B'],
    voltage: 120,
    frequency: 60,
    description: 'Same as US — Type A/B plugs at 120V/60Hz. No adapter needed.',
    adapterNeeded: false,
  },

  // ========== AFRICA ==========
  MA: {
    types: ['C', 'E'],
    voltage: 220,
    frequency: 50,
    description: 'European-style round pins (Type C/E). Same as France. Adapter required. 220V.',
    adapterNeeded: true,
  },
  ZA: {
    types: ['C', 'D', 'M', 'N'],
    voltage: 230,
    frequency: 50,
    description: 'Type M (large 3 round pins) is most common — unique to South Africa. Universal adapter highly recommended. 230V.',
    adapterNeeded: true,
  },
  KE: {
    types: ['G'],
    voltage: 240,
    frequency: 50,
    description: 'UK-style three-pin rectangular (Type G). Adapter required. 240V. Power outages possible — bring a power bank.',
    adapterNeeded: true,
  },
  SN: {
    types: ['C', 'D', 'E', 'K'],
    voltage: 230,
    frequency: 50,
    description: 'Mix of European Type C/E and Type D/K. Universal adapter recommended. 230V.',
    adapterNeeded: true,
  },

  // ========== CAUCASUS ==========
  GE: {
    types: ['C', 'F'],
    voltage: 220,
    frequency: 50,
    description: 'European-style round pins (Type C/F). Adapter required. 220V.',
    adapterNeeded: true,
  },

  // ========== OCEANIA ==========
  AU: {
    types: ['I'],
    voltage: 230,
    frequency: 50,
    description: 'Type I (angled flat pins in V-shape). Unique to Australia/NZ. Adapter required. 230V.',
    adapterNeeded: true,
  },
  NZ: {
    types: ['I'],
    voltage: 230,
    frequency: 50,
    description: 'Type I (same as Australia — angled flat pins). Adapter required. 230V.',
    adapterNeeded: true,
  },
}

/**
 * Get plug/adapter information for a country.
 * @param countryCode - ISO 3166-1 alpha-2 code (e.g. "TH", "JP")
 * @returns PlugInfo or null if country not found
 */
export function getPlugInfo(countryCode: string): PlugInfo | null {
  const code = countryCode.toUpperCase()
  return PLUG_DATA[code] ?? null
}
