// Hardcoded cost-of-living data for 60+ popular travel destinations
// All costs in USD per day per person
// Budget = hostel/street food, Mid = 3-star hotel/restaurants, Comfort = 4-star/nice dining

export interface DailyCosts {
  hotel: number
  food: number
  transport: number
  activities: number
}

export interface DestinationCost {
  code: string       // IATA airport code
  city: string
  country: string
  region: string
  dailyCosts: {
    budget: DailyCosts
    mid: DailyCosts
    comfort: DailyCosts
  }
  currency: string
  bestMonths: number[]  // 1-12
  visaFreeFor: string[] // country codes that get visa-free or visa-on-arrival
  savingTips: string[]
}

export type BudgetTier = 'budget' | 'mid' | 'comfort'

const destinations: DestinationCost[] = [
  // ========== SOUTHEAST ASIA ==========
  {
    code: 'BKK',
    city: 'Bangkok',
    country: 'Thailand',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 15, food: 10, transport: 5, activities: 10 },
      mid: { hotel: 50, food: 25, transport: 10, activities: 20 },
      comfort: { hotel: 120, food: 50, transport: 20, activities: 40 },
    },
    currency: 'THB',
    bestMonths: [11, 12, 1, 2, 3],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat at street food stalls and local markets for $1-3 meals',
      'Use the BTS Skytrain and MRT instead of taxis',
      'Visit free temples like Wat Pho early morning',
      'Stay in Khao San Road area for cheapest hostels',
    ],
  },
  {
    code: 'CNX',
    city: 'Chiang Mai',
    country: 'Thailand',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 10, food: 8, transport: 3, activities: 8 },
      mid: { hotel: 35, food: 18, transport: 8, activities: 15 },
      comfort: { hotel: 80, food: 35, transport: 15, activities: 30 },
    },
    currency: 'THB',
    bestMonths: [11, 12, 1, 2],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Rent a scooter for $5/day to explore outside the old city',
      'Eat khao soi at local spots for under $2',
      'Visit temples for free or minimal donation',
      'Take a songthaew (shared taxi) for 30-60 baht anywhere in town',
    ],
  },
  {
    code: 'HKT',
    city: 'Phuket',
    country: 'Thailand',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 18, food: 12, transport: 8, activities: 12 },
      mid: { hotel: 60, food: 30, transport: 15, activities: 25 },
      comfort: { hotel: 150, food: 55, transport: 25, activities: 50 },
    },
    currency: 'THB',
    bestMonths: [11, 12, 1, 2, 3, 4],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Stay in Kata or Karon instead of Patong for better value',
      'Eat at local Thai restaurants away from the beach strip',
      'Use the Phuket Smart Bus for 50 baht rides',
      'Visit beaches for free — skip the private beach clubs',
    ],
  },
  {
    code: 'DPS',
    city: 'Bali',
    country: 'Indonesia',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 12, food: 8, transport: 5, activities: 10 },
      mid: { hotel: 45, food: 20, transport: 12, activities: 20 },
      comfort: { hotel: 120, food: 45, transport: 25, activities: 40 },
    },
    currency: 'IDR',
    bestMonths: [4, 5, 6, 7, 8, 9, 10],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Rent a scooter for $4-5/day instead of using Grab/taxis',
      'Eat at warungs (local restaurants) for $1-3 meals',
      'Stay in Ubud or Canggu for cheaper accommodation than Seminyak',
      'Visit free temples and rice terraces',
    ],
  },
  {
    code: 'SIN',
    city: 'Singapore',
    country: 'Singapore',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 30, food: 15, transport: 8, activities: 10 },
      mid: { hotel: 100, food: 35, transport: 15, activities: 25 },
      comfort: { hotel: 250, food: 70, transport: 25, activities: 50 },
    },
    currency: 'SGD',
    bestMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat at hawker centres for $3-5 meals — best food in the city',
      'Use EZ-Link card for MRT and bus discounts',
      'Gardens by the Bay outdoor areas are free',
      'Stay in hostels in Little India or Chinatown for $25-35/night',
    ],
  },
  {
    code: 'KUL',
    city: 'Kuala Lumpur',
    country: 'Malaysia',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 12, food: 8, transport: 4, activities: 8 },
      mid: { hotel: 40, food: 20, transport: 10, activities: 18 },
      comfort: { hotel: 100, food: 40, transport: 18, activities: 35 },
    },
    currency: 'MYR',
    bestMonths: [1, 2, 3, 6, 7, 8, 12],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat at mamak stalls for $1-2 meals 24/7',
      'Use the KL Monorail and LRT — very affordable',
      'Visit the Batu Caves for free',
      'Stay in Bukit Bintang area for best access to everything',
    ],
  },
  {
    code: 'HAN',
    city: 'Hanoi',
    country: 'Vietnam',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 10, food: 6, transport: 3, activities: 6 },
      mid: { hotel: 35, food: 15, transport: 8, activities: 15 },
      comfort: { hotel: 80, food: 35, transport: 15, activities: 30 },
    },
    currency: 'VND',
    bestMonths: [2, 3, 4, 10, 11],
    visaFreeFor: ['UK', 'JP', 'KR'],
    savingTips: [
      'Eat pho and banh mi from street stalls for under $2',
      'Use Grab bike for rides under $1 within the Old Quarter',
      'Many temples and the Old Quarter are free to explore',
      'Book homestays instead of hotels for authentic experience',
    ],
  },
  {
    code: 'SGN',
    city: 'Ho Chi Minh City',
    country: 'Vietnam',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 10, food: 6, transport: 3, activities: 7 },
      mid: { hotel: 35, food: 15, transport: 8, activities: 15 },
      comfort: { hotel: 85, food: 35, transport: 15, activities: 30 },
    },
    currency: 'VND',
    bestMonths: [12, 1, 2, 3, 4],
    visaFreeFor: ['UK', 'JP', 'KR'],
    savingTips: [
      'Street food in District 1 and Ben Thanh market is incredibly cheap',
      'Grab bike is the fastest and cheapest way to get around',
      'Visit the War Remnants Museum for under $2',
      'Stay in District 1 or District 3 for walkable budget stays',
    ],
  },
  {
    code: 'MNL',
    city: 'Manila',
    country: 'Philippines',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 12, food: 8, transport: 4, activities: 8 },
      mid: { hotel: 40, food: 18, transport: 10, activities: 15 },
      comfort: { hotel: 90, food: 40, transport: 18, activities: 30 },
    },
    currency: 'PHP',
    bestMonths: [12, 1, 2, 3, 4, 5],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat at carinderias (local eateries) for $1-2 meals',
      'Use jeepneys for rides under $0.50',
      'Visit Intramuros and Rizal Park for free or minimal cost',
      'Stay in Makati or BGC for safety and walkability',
    ],
  },
  {
    code: 'PNH',
    city: 'Phnom Penh',
    country: 'Cambodia',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 8, food: 5, transport: 3, activities: 5 },
      mid: { hotel: 30, food: 15, transport: 8, activities: 12 },
      comfort: { hotel: 70, food: 30, transport: 15, activities: 25 },
    },
    currency: 'USD',
    bestMonths: [11, 12, 1, 2, 3],
    visaFreeFor: [],
    savingTips: [
      'Cambodia uses USD — no need to exchange currency',
      'Tuk-tuks are cheap but negotiate price before riding',
      'Street food meals cost $1-2',
      'Visit the Royal Palace and riverside promenade',
    ],
  },
  {
    code: 'REP',
    city: 'Siem Reap',
    country: 'Cambodia',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 8, food: 5, transport: 4, activities: 15 },
      mid: { hotel: 30, food: 15, transport: 10, activities: 25 },
      comfort: { hotel: 80, food: 30, transport: 18, activities: 40 },
    },
    currency: 'USD',
    bestMonths: [11, 12, 1, 2, 3],
    visaFreeFor: [],
    savingTips: [
      'Buy a 3-day Angkor pass ($62) instead of single day ($37) for best value',
      'Rent a bicycle to explore temples at your own pace',
      'Eat on Pub Street for $2-4 meals',
      'Watch sunrise at Angkor Wat — it is free with your temple pass',
    ],
  },
  {
    code: 'VTE',
    city: 'Vientiane',
    country: 'Laos',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 8, food: 5, transport: 3, activities: 5 },
      mid: { hotel: 28, food: 12, transport: 6, activities: 10 },
      comfort: { hotel: 65, food: 28, transport: 12, activities: 22 },
    },
    currency: 'LAK',
    bestMonths: [11, 12, 1, 2, 3],
    visaFreeFor: ['JP', 'KR'],
    savingTips: [
      'Rent a bicycle to see the city for $2/day',
      'Eat at the night market along the Mekong for cheap meals',
      'Most temples are free to enter',
      'Take local buses instead of tourist shuttles',
    ],
  },

  // ========== EAST ASIA ==========
  {
    code: 'NRT',
    city: 'Tokyo',
    country: 'Japan',
    region: 'East Asia',
    dailyCosts: {
      budget: { hotel: 35, food: 15, transport: 10, activities: 10 },
      mid: { hotel: 100, food: 40, transport: 15, activities: 25 },
      comfort: { hotel: 250, food: 80, transport: 25, activities: 50 },
    },
    currency: 'JPY',
    bestMonths: [3, 4, 5, 10, 11],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'KR'],
    savingTips: [
      'Get a 7-day Japan Rail Pass if visiting multiple cities',
      'Eat at conveyor belt sushi and ramen shops for $5-10',
      'Stay in capsule hotels for $25-40/night',
      'Visit free shrines like Meiji Jingu and Senso-ji',
    ],
  },
  {
    code: 'KIX',
    city: 'Osaka',
    country: 'Japan',
    region: 'East Asia',
    dailyCosts: {
      budget: { hotel: 30, food: 12, transport: 8, activities: 10 },
      mid: { hotel: 85, food: 35, transport: 15, activities: 22 },
      comfort: { hotel: 200, food: 70, transport: 22, activities: 45 },
    },
    currency: 'JPY',
    bestMonths: [3, 4, 5, 10, 11],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'KR'],
    savingTips: [
      'Eat street food in Dotonbori — takoyaki and okonomiyaki under $5',
      'Get an Osaka Amazing Pass for free entry to 50+ attractions',
      'Stay in Namba or Shinsaibashi for walkable nightlife',
      'Visit Osaka Castle park for free (castle interior is $5)',
    ],
  },
  {
    code: 'ICN',
    city: 'Seoul',
    country: 'South Korea',
    region: 'East Asia',
    dailyCosts: {
      budget: { hotel: 25, food: 12, transport: 6, activities: 8 },
      mid: { hotel: 75, food: 30, transport: 12, activities: 20 },
      comfort: { hotel: 180, food: 60, transport: 20, activities: 40 },
    },
    currency: 'KRW',
    bestMonths: [3, 4, 5, 9, 10, 11],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP'],
    savingTips: [
      'Eat at kimbap shops and street markets for $3-5 meals',
      'Use T-money card for subway and bus — rides are $1.30',
      'Visit palaces for $3 or free if wearing hanbok',
      'Stay in guesthouses in Hongdae or Myeongdong',
    ],
  },
  {
    code: 'HKG',
    city: 'Hong Kong',
    country: 'Hong Kong',
    region: 'East Asia',
    dailyCosts: {
      budget: { hotel: 30, food: 12, transport: 6, activities: 8 },
      mid: { hotel: 100, food: 30, transport: 12, activities: 22 },
      comfort: { hotel: 250, food: 65, transport: 20, activities: 45 },
    },
    currency: 'HKD',
    bestMonths: [10, 11, 12, 1, 2, 3],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat at cha chaan tengs (local cafes) for $3-5 meals',
      'Use the Octopus card for MTR, buses, and ferries',
      'Take the Star Ferry for $0.50 — iconic and cheap',
      'Hike the Dragon Back trail for free panoramic views',
    ],
  },
  {
    code: 'TPE',
    city: 'Taipei',
    country: 'Taiwan',
    region: 'East Asia',
    dailyCosts: {
      budget: { hotel: 20, food: 10, transport: 5, activities: 8 },
      mid: { hotel: 60, food: 25, transport: 10, activities: 18 },
      comfort: { hotel: 150, food: 50, transport: 18, activities: 35 },
    },
    currency: 'TWD',
    bestMonths: [3, 4, 5, 10, 11],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Night markets are the best and cheapest way to eat — $2-4 meals',
      'Get an EasyCard for MRT and buses',
      'Visit free temples like Longshan Temple',
      'Take local trains instead of HSR for budget travel',
    ],
  },
  {
    code: 'PEK',
    city: 'Beijing',
    country: 'China',
    region: 'East Asia',
    dailyCosts: {
      budget: { hotel: 15, food: 8, transport: 4, activities: 8 },
      mid: { hotel: 55, food: 22, transport: 10, activities: 18 },
      comfort: { hotel: 140, food: 50, transport: 18, activities: 35 },
    },
    currency: 'CNY',
    bestMonths: [4, 5, 9, 10],
    visaFreeFor: [],
    savingTips: [
      'Eat at small local restaurants and street stalls for $2-4',
      'Use the Beijing Subway — rides are $0.50',
      'Book Forbidden City tickets online in advance to avoid queues',
      'Stay in hutong area hostels for authentic experience',
    ],
  },
  {
    code: 'PVG',
    city: 'Shanghai',
    country: 'China',
    region: 'East Asia',
    dailyCosts: {
      budget: { hotel: 18, food: 10, transport: 5, activities: 8 },
      mid: { hotel: 65, food: 25, transport: 12, activities: 20 },
      comfort: { hotel: 160, food: 55, transport: 20, activities: 40 },
    },
    currency: 'CNY',
    bestMonths: [3, 4, 5, 9, 10, 11],
    visaFreeFor: [],
    savingTips: [
      'Walk the Bund for free — best at night',
      'Use the Shanghai Metro — one of the cheapest in the world',
      'Eat dumplings at local spots for $1-3',
      'Visit free museums on certain days of the week',
    ],
  },

  // ========== SOUTH ASIA ==========
  {
    code: 'BOM',
    city: 'Mumbai',
    country: 'India',
    region: 'South Asia',
    dailyCosts: {
      budget: { hotel: 12, food: 5, transport: 3, activities: 5 },
      mid: { hotel: 45, food: 15, transport: 8, activities: 12 },
      comfort: { hotel: 120, food: 35, transport: 15, activities: 25 },
    },
    currency: 'INR',
    bestMonths: [10, 11, 12, 1, 2, 3],
    visaFreeFor: [],
    savingTips: [
      'Eat at local thali restaurants for $1-2 unlimited meals',
      'Use Mumbai local trains — the cheapest transport in any major city',
      'Visit the Gateway of India and Marine Drive for free',
      'Stay in Colaba or Fort area for walkable sightseeing',
    ],
  },
  {
    code: 'DEL',
    city: 'Delhi',
    country: 'India',
    region: 'South Asia',
    dailyCosts: {
      budget: { hotel: 10, food: 4, transport: 3, activities: 5 },
      mid: { hotel: 40, food: 12, transport: 6, activities: 10 },
      comfort: { hotel: 100, food: 30, transport: 12, activities: 22 },
    },
    currency: 'INR',
    bestMonths: [10, 11, 12, 1, 2, 3],
    visaFreeFor: [],
    savingTips: [
      'Eat at Chandni Chowk for the best and cheapest street food',
      'Use the Delhi Metro — clean, fast, and $0.20-0.50 per ride',
      'Visit Jama Masjid and India Gate for free',
      'Book trains to Agra (Taj Mahal) for $5-10 one way',
    ],
  },
  {
    code: 'GOI',
    city: 'Goa',
    country: 'India',
    region: 'South Asia',
    dailyCosts: {
      budget: { hotel: 10, food: 5, transport: 4, activities: 5 },
      mid: { hotel: 35, food: 15, transport: 8, activities: 12 },
      comfort: { hotel: 90, food: 30, transport: 15, activities: 25 },
    },
    currency: 'INR',
    bestMonths: [11, 12, 1, 2, 3],
    visaFreeFor: [],
    savingTips: [
      'Stay in North Goa (Anjuna, Vagator) for budget, South Goa for quieter vibes',
      'Rent a scooter for $4-5/day to explore beaches',
      'Eat at beach shacks for $3-5 meals with a view',
      'Visit old churches in Old Goa for free',
    ],
  },
  {
    code: 'CMB',
    city: 'Colombo',
    country: 'Sri Lanka',
    region: 'South Asia',
    dailyCosts: {
      budget: { hotel: 12, food: 5, transport: 4, activities: 6 },
      mid: { hotel: 40, food: 15, transport: 10, activities: 15 },
      comfort: { hotel: 95, food: 35, transport: 18, activities: 28 },
    },
    currency: 'LKR',
    bestMonths: [1, 2, 3, 4, 12],
    visaFreeFor: [],
    savingTips: [
      'Eat rice and curry at local restaurants for $1-2',
      'Take trains — the Colombo to Kandy train is one of the worlds most scenic',
      'Visit Gangaramaya Temple and Galle Face Green for free or low cost',
      'Stay in Negombo if arriving late — closer to the airport',
    ],
  },
  {
    code: 'KTM',
    city: 'Kathmandu',
    country: 'Nepal',
    region: 'South Asia',
    dailyCosts: {
      budget: { hotel: 8, food: 4, transport: 2, activities: 5 },
      mid: { hotel: 30, food: 12, transport: 6, activities: 12 },
      comfort: { hotel: 70, food: 25, transport: 12, activities: 22 },
    },
    currency: 'NPR',
    bestMonths: [3, 4, 5, 10, 11],
    visaFreeFor: [],
    savingTips: [
      'Eat dal bhat at local spots for $1-2 — usually unlimited refills',
      'Walk Thamel on foot — it is very compact',
      'Negotiate taxi and rickshaw prices before getting in',
      'Hire a local trekking guide directly instead of through agencies',
    ],
  },

  // ========== MIDDLE EAST ==========
  {
    code: 'DXB',
    city: 'Dubai',
    country: 'UAE',
    region: 'Middle East',
    dailyCosts: {
      budget: { hotel: 35, food: 15, transport: 8, activities: 15 },
      mid: { hotel: 100, food: 35, transport: 15, activities: 30 },
      comfort: { hotel: 280, food: 70, transport: 30, activities: 60 },
    },
    currency: 'AED',
    bestMonths: [11, 12, 1, 2, 3],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat at Indian and Pakistani restaurants in Deira for $3-5 meals',
      'Use the Dubai Metro — clean and cheap ($1-2 rides)',
      'Visit Dubai Mall and the fountain show for free',
      'Stay in Deira or Bur Dubai instead of JBR/Downtown for cheaper hotels',
    ],
  },
  {
    code: 'IST',
    city: 'Istanbul',
    country: 'Turkey',
    region: 'Middle East',
    dailyCosts: {
      budget: { hotel: 18, food: 8, transport: 3, activities: 8 },
      mid: { hotel: 60, food: 22, transport: 8, activities: 18 },
      comfort: { hotel: 150, food: 50, transport: 15, activities: 35 },
    },
    currency: 'TRY',
    bestMonths: [4, 5, 6, 9, 10],
    visaFreeFor: ['JP', 'KR'],
    savingTips: [
      'Eat doner kebabs, simit, and lahmacun from street vendors for $1-3',
      'Get an Istanbulkart for discounted metro, tram, and ferry rides',
      'Walk across the Galata Bridge and explore the Grand Bazaar for free',
      'Stay in Sultanahmet or Fatih for budget accommodation near major sights',
    ],
  },
  {
    code: 'DOH',
    city: 'Doha',
    country: 'Qatar',
    region: 'Middle East',
    dailyCosts: {
      budget: { hotel: 40, food: 15, transport: 8, activities: 12 },
      mid: { hotel: 110, food: 35, transport: 15, activities: 25 },
      comfort: { hotel: 280, food: 70, transport: 25, activities: 50 },
    },
    currency: 'QAR',
    bestMonths: [11, 12, 1, 2, 3],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Visit the Museum of Islamic Art for free',
      'Eat at Souq Waqif for affordable local food',
      'Use the Doha Metro — modern and cheap',
      'The Corniche walkway and Katara Cultural Village are free',
    ],
  },
  {
    code: 'TLV',
    city: 'Tel Aviv',
    country: 'Israel',
    region: 'Middle East',
    dailyCosts: {
      budget: { hotel: 35, food: 18, transport: 6, activities: 10 },
      mid: { hotel: 120, food: 40, transport: 12, activities: 25 },
      comfort: { hotel: 280, food: 80, transport: 22, activities: 50 },
    },
    currency: 'ILS',
    bestMonths: [3, 4, 5, 10, 11],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat falafel and shawarma from street vendors for $5-8',
      'Walk along the beach promenade and explore Jaffa for free',
      'Stay in hostels in Florentin for budget accommodation',
      'Use Rav-Kav card for bus discounts',
    ],
  },
  {
    code: 'AMM',
    city: 'Amman',
    country: 'Jordan',
    region: 'Middle East',
    dailyCosts: {
      budget: { hotel: 15, food: 8, transport: 4, activities: 8 },
      mid: { hotel: 50, food: 20, transport: 10, activities: 18 },
      comfort: { hotel: 120, food: 45, transport: 18, activities: 35 },
    },
    currency: 'JOD',
    bestMonths: [3, 4, 5, 10, 11],
    visaFreeFor: [],
    savingTips: [
      'Get the Jordan Pass ($70-80) — includes Petra entry and visa fee',
      'Eat mansaf and falafel at local restaurants for $3-5',
      'Visit the Citadel and Roman Theatre for minimal fees',
      'Use JETT buses for intercity travel instead of taxis',
    ],
  },
  {
    code: 'CAI',
    city: 'Cairo',
    country: 'Egypt',
    region: 'Middle East',
    dailyCosts: {
      budget: { hotel: 12, food: 5, transport: 3, activities: 8 },
      mid: { hotel: 40, food: 15, transport: 8, activities: 18 },
      comfort: { hotel: 100, food: 35, transport: 15, activities: 35 },
    },
    currency: 'EGP',
    bestMonths: [10, 11, 12, 1, 2, 3],
    visaFreeFor: [],
    savingTips: [
      'Eat koshari and ful medames from street stalls for under $1',
      'Use the Cairo Metro — rides are $0.25',
      'Negotiate hard with taxi drivers or use Uber/Careem',
      'Visit the Egyptian Museum early morning to avoid crowds',
    ],
  },

  // ========== EUROPE ==========
  {
    code: 'LHR',
    city: 'London',
    country: 'UK',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 40, food: 20, transport: 12, activities: 12 },
      mid: { hotel: 130, food: 45, transport: 18, activities: 30 },
      comfort: { hotel: 300, food: 90, transport: 30, activities: 55 },
    },
    currency: 'GBP',
    bestMonths: [5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Most major museums (British Museum, Tate Modern, National Gallery) are free',
      'Get an Oyster card and travel off-peak for cheaper tube rides',
      'Eat at markets like Borough Market and Brick Lane',
      'Walk everywhere in central London — it is very walkable',
    ],
  },
  {
    code: 'CDG',
    city: 'Paris',
    country: 'France',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 35, food: 18, transport: 8, activities: 12 },
      mid: { hotel: 120, food: 40, transport: 15, activities: 28 },
      comfort: { hotel: 280, food: 80, transport: 25, activities: 50 },
    },
    currency: 'EUR',
    bestMonths: [4, 5, 6, 9, 10],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Buy a carnet of 10 metro tickets for savings',
      'Visit free museums on the first Sunday of each month',
      'Eat at boulangeries for cheap sandwiches and pastries',
      'Picnic along the Seine with groceries from a supermarket',
    ],
  },
  {
    code: 'AMS',
    city: 'Amsterdam',
    country: 'Netherlands',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 35, food: 18, transport: 6, activities: 12 },
      mid: { hotel: 120, food: 40, transport: 12, activities: 25 },
      comfort: { hotel: 260, food: 75, transport: 18, activities: 45 },
    },
    currency: 'EUR',
    bestMonths: [4, 5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Rent a bike ($10-12/day) — the best way to see the city',
      'Get an I amsterdam City Card for museum discounts',
      'Eat at Albert Cuyp Market for cheap street food',
      'Walk along the canals for free — the city is very compact',
    ],
  },
  {
    code: 'BCN',
    city: 'Barcelona',
    country: 'Spain',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 25, food: 15, transport: 5, activities: 10 },
      mid: { hotel: 90, food: 35, transport: 10, activities: 22 },
      comfort: { hotel: 220, food: 65, transport: 18, activities: 45 },
    },
    currency: 'EUR',
    bestMonths: [4, 5, 6, 9, 10],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Walk La Rambla and the Gothic Quarter for free',
      'Eat at local tapas bars away from tourist areas for $10-15 meals',
      'Get a T-casual card for 10 metro/bus rides',
      'Visit Park Guell — free areas have great views too',
    ],
  },
  {
    code: 'LIS',
    city: 'Lisbon',
    country: 'Portugal',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 20, food: 12, transport: 4, activities: 8 },
      mid: { hotel: 70, food: 28, transport: 10, activities: 18 },
      comfort: { hotel: 170, food: 55, transport: 18, activities: 35 },
    },
    currency: 'EUR',
    bestMonths: [4, 5, 6, 9, 10],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat at tascas (local taverns) for $6-10 meals with wine',
      'Walk the city — hilly but beautiful and free',
      'Take tram 28 for a scenic ride through historic neighborhoods',
      'Visit Alfama and Belem for free street exploration',
    ],
  },
  {
    code: 'PRG',
    city: 'Prague',
    country: 'Czech Republic',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 18, food: 10, transport: 4, activities: 8 },
      mid: { hotel: 65, food: 25, transport: 8, activities: 18 },
      comfort: { hotel: 160, food: 50, transport: 15, activities: 35 },
    },
    currency: 'CZK',
    bestMonths: [4, 5, 6, 9, 10],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Walk across Charles Bridge and through Old Town for free',
      'Eat at local hospodas (pubs) for $5-8 meals with beer',
      'Get a 3-day transit pass for unlimited rides',
      'Avoid exchange shops — use ATMs for better rates',
    ],
  },
  {
    code: 'BUD',
    city: 'Budapest',
    country: 'Hungary',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 15, food: 10, transport: 4, activities: 8 },
      mid: { hotel: 60, food: 25, transport: 8, activities: 18 },
      comfort: { hotel: 150, food: 50, transport: 15, activities: 35 },
    },
    currency: 'HUF',
    bestMonths: [4, 5, 6, 9, 10],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Visit the Szechenyi thermal baths for $20 — worth it',
      'Walk along the Danube and across the Chain Bridge for free',
      'Eat at local ruin bars — food is surprisingly affordable',
      'Stay in the Jewish Quarter for budget hostels and nightlife',
    ],
  },
  {
    code: 'ATH',
    city: 'Athens',
    country: 'Greece',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 20, food: 12, transport: 4, activities: 10 },
      mid: { hotel: 70, food: 28, transport: 8, activities: 20 },
      comfort: { hotel: 170, food: 55, transport: 15, activities: 40 },
    },
    currency: 'EUR',
    bestMonths: [4, 5, 6, 9, 10],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Get a combined ticket for Acropolis and 6 other sites ($30)',
      'Eat souvlaki wraps for $3-4 — the ultimate budget meal',
      'Walk through Plaka and Monastiraki for free',
      'Use the metro — $1.40 per ride, or get a day pass',
    ],
  },
  {
    code: 'FCO',
    city: 'Rome',
    country: 'Italy',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 25, food: 15, transport: 5, activities: 10 },
      mid: { hotel: 90, food: 35, transport: 10, activities: 22 },
      comfort: { hotel: 220, food: 70, transport: 18, activities: 45 },
    },
    currency: 'EUR',
    bestMonths: [4, 5, 6, 9, 10],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Visit the Pantheon, Trevi Fountain, and Spanish Steps for free',
      'Eat pizza al taglio (by the slice) for $2-4',
      'Walk everywhere — Rome is surprisingly walkable',
      'Visit the Vatican Museums on the last Sunday of the month for free',
    ],
  },
  {
    code: 'BER',
    city: 'Berlin',
    country: 'Germany',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 22, food: 12, transport: 5, activities: 8 },
      mid: { hotel: 80, food: 30, transport: 10, activities: 20 },
      comfort: { hotel: 190, food: 55, transport: 18, activities: 40 },
    },
    currency: 'EUR',
    bestMonths: [5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat doner kebabs and currywurst from street stands for $3-5',
      'Visit the East Side Gallery and Brandenburg Gate for free',
      'Get a day pass for public transport ($8.80)',
      'Many clubs have cheap or free entry on weeknights',
    ],
  },
  {
    code: 'VIE',
    city: 'Vienna',
    country: 'Austria',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 25, food: 15, transport: 5, activities: 10 },
      mid: { hotel: 90, food: 35, transport: 10, activities: 22 },
      comfort: { hotel: 220, food: 65, transport: 18, activities: 45 },
    },
    currency: 'EUR',
    bestMonths: [4, 5, 6, 9, 10],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Visit museums on first Sundays for free entry',
      'Eat at a Beisl (traditional restaurant) for $8-12 meals',
      'Walk the Ringstrasse — all the major buildings are along it',
      'Get a Vienna Card for transit and museum discounts',
    ],
  },
  {
    code: 'WAW',
    city: 'Warsaw',
    country: 'Poland',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 15, food: 8, transport: 3, activities: 6 },
      mid: { hotel: 50, food: 20, transport: 8, activities: 15 },
      comfort: { hotel: 120, food: 40, transport: 15, activities: 30 },
    },
    currency: 'PLN',
    bestMonths: [5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat at milk bars (bar mleczny) for $2-4 meals',
      'Walk through the beautifully rebuilt Old Town for free',
      'Many museums are free on certain days',
      'Use the Warsaw city card for transit and attraction discounts',
    ],
  },
  {
    code: 'KRK',
    city: 'Krakow',
    country: 'Poland',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 12, food: 8, transport: 3, activities: 6 },
      mid: { hotel: 45, food: 18, transport: 6, activities: 14 },
      comfort: { hotel: 110, food: 38, transport: 12, activities: 28 },
    },
    currency: 'PLN',
    bestMonths: [5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Walk the Main Square and Wawel Castle grounds for free',
      'Eat pierogi at local restaurants for $3-5',
      'Visit Kazimierz (Jewish Quarter) for free street art and culture',
      'Take a day trip to the Wieliczka Salt Mine ($25 entry)',
    ],
  },
  {
    code: 'CPH',
    city: 'Copenhagen',
    country: 'Denmark',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 35, food: 20, transport: 8, activities: 10 },
      mid: { hotel: 130, food: 50, transport: 15, activities: 25 },
      comfort: { hotel: 300, food: 90, transport: 25, activities: 50 },
    },
    currency: 'DKK',
    bestMonths: [5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Get a Copenhagen Card for free transport and museum entry',
      'Eat at street food markets like Reffen',
      'Rent a bike — Copenhagen is built for cycling',
      'Visit free areas like Nyhavn waterfront and Christiania',
    ],
  },
  {
    code: 'DUB',
    city: 'Dublin',
    country: 'Ireland',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 30, food: 18, transport: 6, activities: 10 },
      mid: { hotel: 110, food: 40, transport: 12, activities: 22 },
      comfort: { hotel: 250, food: 75, transport: 20, activities: 45 },
    },
    currency: 'EUR',
    bestMonths: [5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Walk through Temple Bar and along the Liffey for free',
      'Visit the National Gallery and National Museum for free',
      'Eat at local pubs for $10-15 hearty meals',
      'Use the Leap Card for discounted bus and tram rides',
    ],
  },

  // ========== AMERICAS ==========
  {
    code: 'JFK',
    city: 'New York',
    country: 'USA',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 50, food: 20, transport: 10, activities: 12 },
      mid: { hotel: 180, food: 50, transport: 15, activities: 30 },
      comfort: { hotel: 400, food: 100, transport: 30, activities: 60 },
    },
    currency: 'USD',
    bestMonths: [4, 5, 6, 9, 10],
    visaFreeFor: ['UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Walk Central Park, Brooklyn Bridge, and Times Square for free',
      'Eat $1 pizza slices and street food from carts',
      'Get a 7-day MetroCard for unlimited subway rides',
      'Visit free museums like the Met (pay-what-you-wish for NY residents)',
    ],
  },
  {
    code: 'LAX',
    city: 'Los Angeles',
    country: 'USA',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 40, food: 18, transport: 10, activities: 10 },
      mid: { hotel: 150, food: 45, transport: 18, activities: 28 },
      comfort: { hotel: 350, food: 90, transport: 30, activities: 55 },
    },
    currency: 'USD',
    bestMonths: [3, 4, 5, 9, 10, 11],
    visaFreeFor: ['UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Visit Venice Beach, Santa Monica Pier, and Griffith Observatory for free',
      'Eat at taco trucks for $2-5 meals',
      'Use the Metro — it goes to Hollywood, DTLA, and Santa Monica',
      'Stay in hostels in Hollywood or Venice for budget options',
    ],
  },
  {
    code: 'MIA',
    city: 'Miami',
    country: 'USA',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 35, food: 18, transport: 8, activities: 10 },
      mid: { hotel: 140, food: 40, transport: 15, activities: 25 },
      comfort: { hotel: 320, food: 80, transport: 28, activities: 50 },
    },
    currency: 'USD',
    bestMonths: [11, 12, 1, 2, 3, 4],
    visaFreeFor: ['UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'South Beach and the Art Deco Historic District are free to explore',
      'Eat Cuban food in Little Havana for $8-12',
      'Use the Miami Metrorail and free trolleys',
      'Visit Wynwood Walls street art district for free',
    ],
  },
  {
    code: 'MEX',
    city: 'Mexico City',
    country: 'Mexico',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 15, food: 8, transport: 3, activities: 6 },
      mid: { hotel: 55, food: 22, transport: 8, activities: 15 },
      comfort: { hotel: 140, food: 50, transport: 15, activities: 30 },
    },
    currency: 'MXN',
    bestMonths: [3, 4, 5, 10, 11],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat tacos al pastor from street stands for $0.50-1 each',
      'Use the Metro — rides are $0.30',
      'Visit the free museums on Sundays (many are always free)',
      'Stay in Roma Norte or Condesa for best walkability',
    ],
  },
  {
    code: 'BOG',
    city: 'Bogota',
    country: 'Colombia',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 12, food: 6, transport: 3, activities: 5 },
      mid: { hotel: 45, food: 18, transport: 6, activities: 12 },
      comfort: { hotel: 110, food: 40, transport: 12, activities: 25 },
    },
    currency: 'COP',
    bestMonths: [12, 1, 2, 3, 7, 8],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat a menu del dia (set lunch) for $2-4 at local restaurants',
      'Use TransMilenio bus for $0.70 rides',
      'Walk through La Candelaria and visit free museums',
      'Take the Monserrate cable car for panoramic views ($5)',
    ],
  },
  {
    code: 'LIM',
    city: 'Lima',
    country: 'Peru',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 12, food: 6, transport: 3, activities: 5 },
      mid: { hotel: 50, food: 20, transport: 8, activities: 15 },
      comfort: { hotel: 130, food: 45, transport: 15, activities: 30 },
    },
    currency: 'PEN',
    bestMonths: [12, 1, 2, 3, 4],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat a menu ejecutivo (set lunch) for $2-4 at local restaurants',
      'Visit Miraflores and Barranco neighborhoods on foot for free',
      'Use Metropolitano bus system for $0.60 rides',
      'Try ceviche at local cevicherias — much cheaper than tourist restaurants',
    ],
  },
  {
    code: 'EZE',
    city: 'Buenos Aires',
    country: 'Argentina',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 15, food: 8, transport: 3, activities: 5 },
      mid: { hotel: 55, food: 22, transport: 8, activities: 15 },
      comfort: { hotel: 140, food: 50, transport: 15, activities: 30 },
    },
    currency: 'ARS',
    bestMonths: [3, 4, 5, 9, 10, 11],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat empanadas and choripan for $1-3',
      'Use the SUBE card for metro and bus discounts',
      'Walk through San Telmo, La Boca, and Recoleta for free',
      'Watch free tango shows on the street in San Telmo on Sundays',
    ],
  },
  {
    code: 'GRU',
    city: 'Sao Paulo',
    country: 'Brazil',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 15, food: 10, transport: 4, activities: 6 },
      mid: { hotel: 60, food: 25, transport: 10, activities: 18 },
      comfort: { hotel: 150, food: 55, transport: 18, activities: 35 },
    },
    currency: 'BRL',
    bestMonths: [4, 5, 6, 7, 8, 9, 10],
    visaFreeFor: ['UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat at por-kilo (buffet by weight) restaurants for $3-6',
      'Visit Ibirapuera Park and Paulista Avenue for free',
      'Use the Metro — clean and efficient',
      'Many museums are free on Saturdays or Tuesdays',
    ],
  },
  {
    code: 'SCL',
    city: 'Santiago',
    country: 'Chile',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 18, food: 10, transport: 4, activities: 6 },
      mid: { hotel: 60, food: 25, transport: 10, activities: 15 },
      comfort: { hotel: 150, food: 50, transport: 18, activities: 30 },
    },
    currency: 'CLP',
    bestMonths: [10, 11, 12, 1, 2, 3],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat a menu del dia (set lunch) at local restaurants for $4-6',
      'Walk through Bellavista and Lastarria neighborhoods for free',
      'Use the Metro — modern and efficient',
      'Take the funicular up Cerro San Cristobal for cheap panoramic views',
    ],
  },
  {
    code: 'PTY',
    city: 'Panama City',
    country: 'Panama',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 18, food: 10, transport: 4, activities: 8 },
      mid: { hotel: 65, food: 25, transport: 10, activities: 18 },
      comfort: { hotel: 160, food: 50, transport: 18, activities: 35 },
    },
    currency: 'USD',
    bestMonths: [12, 1, 2, 3, 4],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Walk Casco Viejo (Old Town) for free — beautiful colonial architecture',
      'Eat at fondas (local restaurants) for $3-5 meals',
      'Use the Metro — modern and cheap',
      'Visit the Miraflores Locks to see the Panama Canal ($15)',
    ],
  },
  {
    code: 'SJO',
    city: 'San Jose',
    country: 'Costa Rica',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 15, food: 10, transport: 4, activities: 10 },
      mid: { hotel: 55, food: 25, transport: 10, activities: 22 },
      comfort: { hotel: 140, food: 50, transport: 18, activities: 40 },
    },
    currency: 'CRC',
    bestMonths: [12, 1, 2, 3, 4],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat casados (set meals) at sodas (local eateries) for $4-6',
      'Use public buses instead of tourist shuttles to save 80%',
      'Visit free national parks and beaches',
      'Travel during green season (May-Nov) for lower prices',
    ],
  },
  {
    code: 'CUN',
    city: 'Cancun',
    country: 'Mexico',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 18, food: 10, transport: 4, activities: 10 },
      mid: { hotel: 70, food: 28, transport: 10, activities: 22 },
      comfort: { hotel: 200, food: 60, transport: 20, activities: 45 },
    },
    currency: 'MXN',
    bestMonths: [12, 1, 2, 3, 4],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Stay in downtown Cancun instead of the Hotel Zone for half the price',
      'Eat at local taquerias away from the tourist strip',
      'Take the ADO bus to Playa del Carmen or Tulum for $5-8',
      'Visit free public beaches — all Mexican beaches are public by law',
    ],
  },

  // ========== AFRICA ==========
  {
    code: 'RAK',
    city: 'Marrakech',
    country: 'Morocco',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 12, food: 6, transport: 3, activities: 5 },
      mid: { hotel: 50, food: 18, transport: 8, activities: 15 },
      comfort: { hotel: 130, food: 40, transport: 15, activities: 30 },
    },
    currency: 'MAD',
    bestMonths: [3, 4, 5, 10, 11],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Stay in a riad in the medina for authentic and affordable accommodation',
      'Eat at Jemaa el-Fna food stalls for $2-4 meals',
      'Walk the medina and souks — it is free and endlessly fascinating',
      'Negotiate hard at the souks — start at 30% of the asking price',
    ],
  },
  {
    code: 'CPT',
    city: 'Cape Town',
    country: 'South Africa',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 18, food: 10, transport: 5, activities: 10 },
      mid: { hotel: 65, food: 25, transport: 12, activities: 22 },
      comfort: { hotel: 160, food: 55, transport: 22, activities: 45 },
    },
    currency: 'ZAR',
    bestMonths: [10, 11, 12, 1, 2, 3],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Hike Table Mountain via Platteklip Gorge for free (skip the cable car)',
      'Visit the V&A Waterfront and Kirstenbosch gardens for free entry areas',
      'Eat at local braai spots and markets for affordable meals',
      'Use MyCiTi bus for cheap and safe transport',
    ],
  },
  {
    code: 'NBO',
    city: 'Nairobi',
    country: 'Kenya',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 15, food: 8, transport: 4, activities: 10 },
      mid: { hotel: 55, food: 20, transport: 10, activities: 25 },
      comfort: { hotel: 140, food: 45, transport: 20, activities: 50 },
    },
    currency: 'KES',
    bestMonths: [1, 2, 6, 7, 8, 9],
    visaFreeFor: [],
    savingTips: [
      'Eat nyama choma and ugali at local joints for $2-4',
      'Use matatus (minibuses) for $0.30-0.50 rides',
      'Visit the Nairobi National Museum for $5',
      'Book safari day trips from Nairobi to Nairobi National Park ($25-40)',
    ],
  },
  {
    code: 'JNB',
    city: 'Johannesburg',
    country: 'South Africa',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 15, food: 8, transport: 5, activities: 8 },
      mid: { hotel: 55, food: 22, transport: 12, activities: 18 },
      comfort: { hotel: 140, food: 48, transport: 22, activities: 38 },
    },
    currency: 'ZAR',
    bestMonths: [4, 5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Visit the Apartheid Museum and Constitution Hill for $8-10',
      'Eat at local restaurants in Maboneng district for $5-8',
      'Use the Gautrain for safe and efficient transport',
      'Explore Soweto on a guided tour for $15-25',
    ],
  },
  {
    code: 'DSS',
    city: 'Dakar',
    country: 'Senegal',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 15, food: 6, transport: 3, activities: 5 },
      mid: { hotel: 50, food: 18, transport: 8, activities: 12 },
      comfort: { hotel: 120, food: 40, transport: 15, activities: 25 },
    },
    currency: 'XOF',
    bestMonths: [11, 12, 1, 2, 3, 4],
    visaFreeFor: ['US', 'UK', 'EU'],
    savingTips: [
      'Eat thieboudienne (national dish) at local restaurants for $2-3',
      'Visit Goree Island by ferry for $5 round trip',
      'Walk through the Medina and Sandaga Market for free',
      'Use car rapides (local minibuses) for very cheap rides',
    ],
  },

  // ========== CAUCASUS ==========
  {
    code: 'TBS',
    city: 'Tbilisi',
    country: 'Georgia',
    region: 'Caucasus',
    dailyCosts: {
      budget: { hotel: 10, food: 6, transport: 2, activities: 5 },
      mid: { hotel: 35, food: 15, transport: 5, activities: 12 },
      comfort: { hotel: 80, food: 35, transport: 10, activities: 25 },
    },
    currency: 'GEL',
    bestMonths: [5, 6, 7, 9, 10],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat khachapuri and khinkali at local restaurants for $2-4',
      'Wine is incredibly cheap — $3-5 for a bottle at restaurants',
      'Walk the Old Town and visit sulfur baths for $5-10',
      'Take marshrutkas (minibuses) for $0.30 rides',
    ],
  },
  {
    code: 'BUS',
    city: 'Batumi',
    country: 'Georgia',
    region: 'Caucasus',
    dailyCosts: {
      budget: { hotel: 8, food: 5, transport: 2, activities: 4 },
      mid: { hotel: 30, food: 12, transport: 4, activities: 10 },
      comfort: { hotel: 70, food: 30, transport: 8, activities: 22 },
    },
    currency: 'GEL',
    bestMonths: [6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Stay in guesthouses for $8-15/night with breakfast included',
      'Eat at local restaurants for $3-5 per meal',
      'Walk the boulevard and visit the beach for free',
      'Take the cable car for $1 for panoramic views',
    ],
  },

  // ========== OCEANIA ==========
  {
    code: 'SYD',
    city: 'Sydney',
    country: 'Australia',
    region: 'Oceania',
    dailyCosts: {
      budget: { hotel: 35, food: 20, transport: 10, activities: 10 },
      mid: { hotel: 130, food: 45, transport: 18, activities: 25 },
      comfort: { hotel: 300, food: 90, transport: 30, activities: 50 },
    },
    currency: 'AUD',
    bestMonths: [10, 11, 12, 1, 2, 3],
    visaFreeFor: ['UK', 'CA', 'JP', 'KR'],
    savingTips: [
      'Visit Bondi Beach, the Botanical Gardens, and The Rocks for free',
      'Eat at food courts in the CBD for $8-12 meals',
      'Get an Opal card for capped daily transit fares',
      'Walk from Bondi to Coogee beach — one of the best free walks in the world',
    ],
  },
  {
    code: 'AKL',
    city: 'Auckland',
    country: 'New Zealand',
    region: 'Oceania',
    dailyCosts: {
      budget: { hotel: 30, food: 18, transport: 8, activities: 10 },
      mid: { hotel: 110, food: 40, transport: 15, activities: 25 },
      comfort: { hotel: 250, food: 75, transport: 25, activities: 45 },
    },
    currency: 'NZD',
    bestMonths: [12, 1, 2, 3],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Hike Rangitoto Island for free (ferry costs $30 return)',
      'Visit the Auckland Art Gallery and Auckland Museum for free/koha',
      'Eat at food trucks and Asian restaurants for $8-12',
      'Use the AT HOP card for cheaper bus and ferry rides',
    ],
  },
]

// ========== HELPER FUNCTIONS ==========

/**
 * Get destination cost data by IATA airport code
 */
export function getDestinationCost(code: string): DestinationCost | undefined {
  return destinations.find(d => d.code === code.toUpperCase())
}

/**
 * Calculate total trip cost for a destination
 */
export function calculateTripCost(
  code: string,
  days: number,
  tier: BudgetTier
): {
  dailyCosts: DailyCosts
  dailyTotal: number
  totalCost: number
  breakdown: { hotel: number; food: number; transport: number; activities: number }
  destination: DestinationCost | undefined
} | null {
  const dest = getDestinationCost(code)
  if (!dest) return null

  const daily = dest.dailyCosts[tier]
  const dailyTotal = daily.hotel + daily.food + daily.transport + daily.activities

  return {
    dailyCosts: daily,
    dailyTotal,
    totalCost: dailyTotal * days,
    breakdown: {
      hotel: daily.hotel * days,
      food: daily.food * days,
      transport: daily.transport * days,
      activities: daily.activities * days,
    },
    destination: dest,
  }
}

/**
 * Get all destinations
 */
export function getAllDestinations(): DestinationCost[] {
  return destinations
}

/**
 * Get destinations by region
 */
export function getDestinationsByRegion(region: string): DestinationCost[] {
  return destinations.filter(d => d.region === region)
}

/**
 * Get all unique regions
 */
export function getAllRegions(): string[] {
  return [...new Set(destinations.map(d => d.region))].sort()
}

/**
 * Search destinations by city or country name
 */
export function searchDestinations(query: string): DestinationCost[] {
  const q = query.toLowerCase().trim()
  return destinations.filter(
    d =>
      d.city.toLowerCase().includes(q) ||
      d.country.toLowerCase().includes(q) ||
      d.code.toLowerCase() === q
  )
}

/**
 * Get cheapest destinations sorted by daily cost for a given tier
 */
export function getCheapestDestinations(tier: BudgetTier, limit: number = 10): DestinationCost[] {
  return [...destinations]
    .sort((a, b) => {
      const aCost = a.dailyCosts[tier]
      const bCost = b.dailyCosts[tier]
      const aTotal = aCost.hotel + aCost.food + aCost.transport + aCost.activities
      const bTotal = bCost.hotel + bCost.food + bCost.transport + bCost.activities
      return aTotal - bTotal
    })
    .slice(0, limit)
}
