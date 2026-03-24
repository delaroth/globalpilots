// Hardcoded cost-of-living data for 120+ popular travel destinations
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

  // ========== SOUTHEAST ASIA (ADDITIONAL) ==========
  {
    code: 'RGN',
    city: 'Yangon',
    country: 'Myanmar',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 8, food: 3, transport: 2, activities: 3 },
      mid: { hotel: 30, food: 10, transport: 5, activities: 8 },
      comfort: { hotel: 70, food: 25, transport: 10, activities: 18 },
    },
    currency: 'MMK',
    bestMonths: [11, 12, 1, 2, 3],
    visaFreeFor: [],
    savingTips: [
      'Eat mohinga (fish noodle soup) at street stalls for under $0.50',
      'Take the Yangon Circular Railway for a 3-hour loop of the city for $0.20',
      'Visit Shwedagon Pagoda at sunset — $8 entry but absolutely worth it',
      'Stay in guesthouses in Chinatown for $8-15/night',
      'Use local buses for $0.15-0.30 rides — routes can be confusing but incredibly cheap',
    ],
  },
  {
    code: 'LPQ',
    city: 'Luang Prabang',
    country: 'Laos',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 8, food: 4, transport: 2, activities: 5 },
      mid: { hotel: 30, food: 12, transport: 6, activities: 12 },
      comfort: { hotel: 75, food: 28, transport: 12, activities: 25 },
    },
    currency: 'LAK',
    bestMonths: [11, 12, 1, 2, 3],
    visaFreeFor: ['JP', 'KR'],
    savingTips: [
      'Eat at the night market buffet — fill a plate for $1.50',
      'Rent a bicycle for $2/day to explore temples and the peninsula',
      'Watch the daily alms giving ceremony at dawn for free',
      'Swim at Kuang Si Falls — $3 entry, one of the best waterfalls in Asia',
      'Stay in guesthouses on the peninsula for $8-12/night',
    ],
  },
  {
    code: 'KBV',
    city: 'Krabi',
    country: 'Thailand',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 12, food: 8, transport: 4, activities: 8 },
      mid: { hotel: 40, food: 20, transport: 10, activities: 18 },
      comfort: { hotel: 100, food: 40, transport: 20, activities: 35 },
    },
    currency: 'THB',
    bestMonths: [11, 12, 1, 2, 3, 4],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Stay in Ao Nang instead of Railay for cheaper accommodation',
      'Eat at the Krabi night market for $1-3 meals',
      'Take longtail boats to islands — split costs with other travelers',
      'Rent a scooter for $5/day to explore Tiger Cave Temple and hot springs',
      'Book island-hopping tours locally instead of online for 30-50% less',
    ],
  },
  {
    code: 'DVO',
    city: 'Davao',
    country: 'Philippines',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 8, food: 5, transport: 2, activities: 5 },
      mid: { hotel: 30, food: 15, transport: 6, activities: 12 },
      comfort: { hotel: 70, food: 30, transport: 12, activities: 25 },
    },
    currency: 'PHP',
    bestMonths: [1, 2, 3, 4, 5, 10, 11, 12],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat at local carinderias for $1-2 per meal — try kinilaw (Filipino ceviche)',
      'Take jeepneys around the city for $0.20 per ride',
      'Visit Eden Nature Park and Samal Island for affordable day trips',
      'Buy durian at the fruit market for a fraction of export prices',
      'Stay in pension houses in the city center for $8-15/night',
    ],
  },
  {
    code: 'BWN',
    city: 'Bandar Seri Begawan',
    country: 'Brunei',
    region: 'Southeast Asia',
    dailyCosts: {
      budget: { hotel: 18, food: 6, transport: 4, activities: 3 },
      mid: { hotel: 50, food: 18, transport: 10, activities: 10 },
      comfort: { hotel: 110, food: 35, transport: 18, activities: 22 },
    },
    currency: 'BND',
    bestMonths: [1, 2, 3, 4, 5, 6, 7, 8],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR', 'SG', 'NZ'],
    savingTips: [
      'Visit the Omar Ali Saifuddien Mosque and Jame Asr Hassanil Bolkiah Mosque for free',
      'Eat at the Gadong Night Market for $1-3 meals',
      'Explore Kampong Ayer (water village) by water taxi for $1',
      'Brunei has no alcohol tax because alcohol is banned — save by not drinking',
      'Take public buses for $1 per ride — routes cover the main sights',
    ],
  },

  // ========== SOUTH ASIA (ADDITIONAL) ==========
  {
    code: 'DAC',
    city: 'Dhaka',
    country: 'Bangladesh',
    region: 'South Asia',
    dailyCosts: {
      budget: { hotel: 5, food: 2, transport: 1, activities: 2 },
      mid: { hotel: 20, food: 8, transport: 4, activities: 6 },
      comfort: { hotel: 55, food: 20, transport: 10, activities: 15 },
    },
    currency: 'BDT',
    bestMonths: [11, 12, 1, 2, 3],
    visaFreeFor: [],
    savingTips: [
      'Eat biryani, dal, and roti at local restaurants for under $1 per meal',
      'Take rickshaws for short trips — negotiate $0.30-0.50 per ride',
      'Visit Lalbagh Fort and Ahsan Manzil for under $1 entry each',
      'Take the Sadarghat river ferry for $0.10 to see the Buriganga River',
      'Stay in Old Dhaka guesthouses for $5-10/night for authentic experience',
    ],
  },
  {
    code: 'CCU',
    city: 'Kolkata',
    country: 'India',
    region: 'South Asia',
    dailyCosts: {
      budget: { hotel: 6, food: 3, transport: 1, activities: 3 },
      mid: { hotel: 25, food: 10, transport: 4, activities: 8 },
      comfort: { hotel: 65, food: 25, transport: 10, activities: 18 },
    },
    currency: 'INR',
    bestMonths: [10, 11, 12, 1, 2, 3],
    visaFreeFor: [],
    savingTips: [
      'Eat at local Bengali restaurants — a full thali costs $0.80-1.50',
      'Ride the Kolkata tram (oldest in Asia) for $0.10 per trip',
      'Visit the Victoria Memorial gardens for free (museum entry $3)',
      'Walk along the Hooghly River and Howrah Bridge for free',
      'Use the Kolkata Metro for $0.15-0.30 per ride — cheapest metro in India',
    ],
  },
  {
    code: 'KHI',
    city: 'Karachi',
    country: 'Pakistan',
    region: 'South Asia',
    dailyCosts: {
      budget: { hotel: 6, food: 2, transport: 1, activities: 2 },
      mid: { hotel: 25, food: 8, transport: 4, activities: 6 },
      comfort: { hotel: 60, food: 20, transport: 10, activities: 15 },
    },
    currency: 'PKR',
    bestMonths: [11, 12, 1, 2, 3],
    visaFreeFor: [],
    savingTips: [
      'Eat biryani from street stalls for under $1 — Karachi is the biryani capital',
      'Take rickshaws and local buses for $0.20-0.50 rides',
      'Visit Clifton Beach and Sea View for free — great sunset spots',
      'Explore the Saddar bazaar area for cheap shopping and street food',
      'Stay in guesthouses near Saddar for $6-12/night',
    ],
  },
  {
    code: 'MLE',
    city: 'Male',
    country: 'Maldives',
    region: 'South Asia',
    dailyCosts: {
      budget: { hotel: 25, food: 10, transport: 5, activities: 15 },
      mid: { hotel: 70, food: 25, transport: 15, activities: 35 },
      comfort: { hotel: 250, food: 60, transport: 30, activities: 80 },
    },
    currency: 'MVR',
    bestMonths: [1, 2, 3, 4, 11, 12],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR', 'SG', 'NZ'],
    savingTips: [
      'Stay on local islands (Maafushi, Thulusdhoo) in guesthouses for $25-50/night instead of resorts',
      'Eat at local cafes (hotaa) for $3-5 instead of resort restaurants',
      'Book snorkeling trips from local islands for $20-30 vs $100+ from resorts',
      'Take public ferries between islands for $1-3 instead of speedboats',
      'Visit during shoulder season (May, October) for 30-50% lower guesthouse rates',
    ],
  },

  // ========== CENTRAL ASIA ==========
  {
    code: 'ALA',
    city: 'Almaty',
    country: 'Kazakhstan',
    region: 'Central Asia',
    dailyCosts: {
      budget: { hotel: 10, food: 6, transport: 2, activities: 4 },
      mid: { hotel: 40, food: 18, transport: 6, activities: 12 },
      comfort: { hotel: 90, food: 38, transport: 12, activities: 25 },
    },
    currency: 'KZT',
    bestMonths: [5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR', 'SG', 'NZ'],
    savingTips: [
      'Eat plov, lagman, and beshbarmak at local canteens for $2-4',
      'Take the Almaty Metro for $0.30 per ride — small but efficient',
      'Hike to Big Almaty Lake for free — stunning alpine scenery',
      'Visit the Green Bazaar for cheap produce, nuts, and dried fruit',
      'Take a bus to Medeu and Shymbulak for affordable mountain day trips ($5-10)',
    ],
  },
  {
    code: 'TAS',
    city: 'Tashkent',
    country: 'Uzbekistan',
    region: 'Central Asia',
    dailyCosts: {
      budget: { hotel: 8, food: 4, transport: 1, activities: 3 },
      mid: { hotel: 30, food: 12, transport: 4, activities: 8 },
      comfort: { hotel: 70, food: 28, transport: 8, activities: 18 },
    },
    currency: 'UZS',
    bestMonths: [4, 5, 9, 10],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR', 'SG', 'NZ'],
    savingTips: [
      'Eat plov at local choyxona (teahouses) for $1-2 — Uzbekistan national dish',
      'Ride the Tashkent Metro for $0.10 — the stations are architectural gems worth visiting',
      'Visit Chorsu Bazaar for the cheapest and freshest food in the city',
      'Take shared taxis to Samarkand or Bukhara for $5-10 instead of trains',
      'Stay in guesthouses near Amir Timur Square for $8-15/night',
    ],
  },
  {
    code: 'FRU',
    city: 'Bishkek',
    country: 'Kyrgyzstan',
    region: 'Central Asia',
    dailyCosts: {
      budget: { hotel: 6, food: 3, transport: 1, activities: 3 },
      mid: { hotel: 25, food: 10, transport: 4, activities: 8 },
      comfort: { hotel: 60, food: 25, transport: 8, activities: 18 },
    },
    currency: 'KGS',
    bestMonths: [6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR', 'SG', 'NZ'],
    savingTips: [
      'Eat lagman and samsa at local cafes for $1-2 per meal',
      'Stay in community-based tourism yurts at Son-Kul Lake for $10-15/night with meals',
      'Take marshrutkas (shared minivans) anywhere in the city for $0.15',
      'Hike in Ala-Archa National Park for $2 entry — spectacular mountains 40 min from the city',
      'Book horse treks through CBT (Community Based Tourism) for affordable prices',
    ],
  },

  // ========== EASTERN EUROPE (ADDITIONAL) ==========
  {
    code: 'SOF',
    city: 'Sofia',
    country: 'Bulgaria',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 10, food: 6, transport: 2, activities: 4 },
      mid: { hotel: 35, food: 15, transport: 5, activities: 10 },
      comfort: { hotel: 85, food: 32, transport: 10, activities: 22 },
    },
    currency: 'BGN',
    bestMonths: [5, 6, 7, 8, 9, 10],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat at local mehanas (taverns) for $3-5 meals with huge portions',
      'Take the metro or tram for $0.80 per ride',
      'Visit the Alexander Nevsky Cathedral and Vitosha Boulevard for free',
      'Hike Vitosha Mountain from the city — free and easily accessible',
      'Buy a 1-day transit pass for $2 for unlimited rides',
    ],
  },
  {
    code: 'SKP',
    city: 'Skopje',
    country: 'North Macedonia',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 8, food: 4, transport: 2, activities: 3 },
      mid: { hotel: 30, food: 12, transport: 4, activities: 8 },
      comfort: { hotel: 70, food: 28, transport: 8, activities: 18 },
    },
    currency: 'MKD',
    bestMonths: [4, 5, 6, 9, 10],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR', 'NZ'],
    savingTips: [
      'Eat kebapi and tavche gravche at local restaurants for $2-3 per meal',
      'Walk through the Old Bazaar — one of the oldest in the Balkans, free to explore',
      'Take the bus anywhere in the city for $0.50',
      'Visit Matka Canyon for free hiking and $5 boat rides through the gorge',
      'Stay in the Old Bazaar area for the cheapest hostels and best atmosphere',
    ],
  },
  {
    code: 'TIA',
    city: 'Tirana',
    country: 'Albania',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 8, food: 4, transport: 2, activities: 3 },
      mid: { hotel: 30, food: 12, transport: 5, activities: 8 },
      comfort: { hotel: 70, food: 28, transport: 10, activities: 20 },
    },
    currency: 'ALL',
    bestMonths: [4, 5, 6, 9, 10],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR', 'NZ'],
    savingTips: [
      'Eat byrek (stuffed pastry) and qofte for $1-2 at local bakeries',
      'Walk Skanderbeg Square and the Blloku neighborhood for free',
      'Take the city bus for $0.35 per ride',
      'Day trip to Berat or Durres beach by bus for $3-5 each way',
      'Visit the Bunk Art museums — only $3 entry for fascinating Cold War history',
    ],
  },
  {
    code: 'SJJ',
    city: 'Sarajevo',
    country: 'Bosnia and Herzegovina',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 10, food: 5, transport: 2, activities: 4 },
      mid: { hotel: 35, food: 15, transport: 5, activities: 10 },
      comfort: { hotel: 80, food: 32, transport: 10, activities: 22 },
    },
    currency: 'BAM',
    bestMonths: [5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR', 'NZ'],
    savingTips: [
      'Eat cevapi at Bascarsija for $2-3 — the iconic Bosnian dish',
      'Walk the Bascarsija old town and Latin Bridge for free',
      'Take the tram for $0.80 per ride — one of the oldest tram systems in Europe',
      'Visit the Tunnel of Hope museum for $5 — essential Sarajevo history',
      'Drink Bosnian coffee at local cafes for $0.50-1',
    ],
  },
  {
    code: 'BEG',
    city: 'Belgrade',
    country: 'Serbia',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 10, food: 6, transport: 2, activities: 4 },
      mid: { hotel: 38, food: 16, transport: 5, activities: 10 },
      comfort: { hotel: 85, food: 35, transport: 10, activities: 22 },
    },
    currency: 'RSD',
    bestMonths: [5, 6, 7, 8, 9, 10],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR', 'NZ'],
    savingTips: [
      'Eat pljeskavica and burek at local joints for $2-3',
      'Walk the Kalemegdan Fortress and Knez Mihailova Street for free',
      'Experience Belgrade nightlife on splavovi (river barges) — many have free entry',
      'Take buses and trams for $0.80 per ride with a BusPlus card',
      'Visit Skadarlija (bohemian quarter) for free street atmosphere and cheap cafes',
    ],
  },
  {
    code: 'OTP',
    city: 'Bucharest',
    country: 'Romania',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 10, food: 6, transport: 2, activities: 4 },
      mid: { hotel: 38, food: 16, transport: 5, activities: 12 },
      comfort: { hotel: 90, food: 35, transport: 10, activities: 25 },
    },
    currency: 'RON',
    bestMonths: [5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat at local restaurants — a full meal with soup costs $3-5',
      'Visit the Palace of the Parliament for $8 — the heaviest building in the world',
      'Walk through the Old Town (Lipscani) for free — lively day and night',
      'Use the metro and trams for $0.50 per ride',
      'Take a day trip to Bran Castle (Dracula Castle) by bus for $5 each way',
    ],
  },
  {
    code: 'KIV',
    city: 'Chisinau',
    country: 'Moldova',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 8, food: 4, transport: 1, activities: 3 },
      mid: { hotel: 28, food: 10, transport: 3, activities: 6 },
      comfort: { hotel: 60, food: 22, transport: 6, activities: 14 },
    },
    currency: 'MDL',
    bestMonths: [5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR', 'NZ'],
    savingTips: [
      'Eat at local canteens for $2-3 per meal — Moldovan food is hearty and cheap',
      'Visit the Cricova or Milestii Mici wine cellars — tastings start at $5-10',
      'Take trolleybuses for $0.15 per ride — one of the cheapest transit systems in Europe',
      'Walk through Stefan cel Mare Park and the central market for free',
      'Day trip to Orheiul Vechi (cave monastery) by marshrutka for $2 each way',
    ],
  },
  {
    code: 'RIX',
    city: 'Riga',
    country: 'Latvia',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 12, food: 8, transport: 3, activities: 5 },
      mid: { hotel: 45, food: 20, transport: 6, activities: 12 },
      comfort: { hotel: 110, food: 42, transport: 12, activities: 25 },
    },
    currency: 'EUR',
    bestMonths: [5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat at Lido — a self-service chain with hearty Latvian meals for $4-6',
      'Walk the Art Nouveau district and Old Town for free — a UNESCO site',
      'Take the tram or bus for $1.20 per ride with an e-ticket',
      'Visit Riga Central Market in old Zeppelin hangars for cheap produce and street food',
      'Day trip to Jurmala beach by train for $2 each way',
    ],
  },
  {
    code: 'VNO',
    city: 'Vilnius',
    country: 'Lithuania',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 10, food: 6, transport: 2, activities: 4 },
      mid: { hotel: 40, food: 18, transport: 5, activities: 10 },
      comfort: { hotel: 95, food: 38, transport: 10, activities: 22 },
    },
    currency: 'EUR',
    bestMonths: [5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat cepelinai (potato dumplings) at local restaurants for $3-5',
      'Walk through the Old Town — one of the largest medieval old towns in Europe, free',
      'Visit the Republic of Uzupis (self-declared artist republic) for free',
      'Take buses for $0.65 per ride with an e-ticket',
      'Climb Gediminas Tower for panoramic views — $5 entry or walk up the hill for free',
    ],
  },
  {
    code: 'TLL',
    city: 'Tallinn',
    country: 'Estonia',
    region: 'Europe',
    dailyCosts: {
      budget: { hotel: 12, food: 8, transport: 3, activities: 5 },
      mid: { hotel: 50, food: 22, transport: 6, activities: 12 },
      comfort: { hotel: 120, food: 45, transport: 12, activities: 25 },
    },
    currency: 'EUR',
    bestMonths: [5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Walk through the medieval Old Town — a UNESCO World Heritage Site, free to explore',
      'Eat at Rataskaevu 16 or local pubs for $5-8 meals',
      'Visit Telliskivi Creative City for free street art and markets',
      'Take the tram for $1.10 per ride or get a day pass for $3.50',
      'View the city from Toompea Hill observation platforms for free',
    ],
  },

  // ========== MIDDLE EAST / NORTH AFRICA (ADDITIONAL) ==========
  {
    code: 'TUN',
    city: 'Tunis',
    country: 'Tunisia',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 8, food: 4, transport: 1, activities: 3 },
      mid: { hotel: 30, food: 12, transport: 4, activities: 8 },
      comfort: { hotel: 70, food: 28, transport: 8, activities: 18 },
    },
    currency: 'TND',
    bestMonths: [3, 4, 5, 9, 10, 11],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP'],
    savingTips: [
      'Eat brik, couscous, and lablabi at local restaurants for $1-3',
      'Walk through the Medina of Tunis — a UNESCO site, free to explore',
      'Take the TGM train to Sidi Bou Said for $0.30 — a stunning blue-and-white village',
      'Visit the Bardo Museum for $4 — one of the finest mosaic collections in the world',
      'Use louages (shared taxis) for intercity travel at very cheap fixed prices',
    ],
  },
  {
    code: 'CMN',
    city: 'Casablanca',
    country: 'Morocco',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 10, food: 5, transport: 2, activities: 4 },
      mid: { hotel: 40, food: 15, transport: 6, activities: 10 },
      comfort: { hotel: 100, food: 35, transport: 12, activities: 22 },
    },
    currency: 'MAD',
    bestMonths: [3, 4, 5, 9, 10, 11],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Visit the Hassan II Mosque — $14 entry but one of the most stunning mosques in the world',
      'Eat at local restaurants in the Habous Quarter for $2-4 per meal',
      'Walk the Corniche waterfront and old medina for free',
      'Take the tramway for $0.60 per ride',
      'Take the train to Rabat for $5 — cheap and scenic day trip',
    ],
  },
  {
    code: 'FEZ',
    city: 'Fez',
    country: 'Morocco',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 10, food: 4, transport: 2, activities: 4 },
      mid: { hotel: 38, food: 14, transport: 5, activities: 10 },
      comfort: { hotel: 90, food: 32, transport: 10, activities: 22 },
    },
    currency: 'MAD',
    bestMonths: [3, 4, 5, 9, 10, 11],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Get lost in the Fez Medina for free — the largest car-free urban area in the world',
      'Eat at hole-in-the-wall restaurants in the medina for $1-3 meals',
      'Stay in budget riads inside the medina for $10-20/night',
      'Visit the Chouara Tannery from a nearby terrace — tip $1 instead of paying a guide',
      'Take a grand taxi to Meknes for $2 — another imperial city just 45 min away',
    ],
  },
  {
    code: 'ALG',
    city: 'Algiers',
    country: 'Algeria',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 10, food: 4, transport: 1, activities: 3 },
      mid: { hotel: 35, food: 12, transport: 4, activities: 8 },
      comfort: { hotel: 80, food: 28, transport: 8, activities: 18 },
    },
    currency: 'DZD',
    bestMonths: [3, 4, 5, 9, 10, 11],
    visaFreeFor: [],
    savingTips: [
      'Eat at local restaurants for $1-3 — try chorba, couscous, and makroudh',
      'Walk through the Casbah of Algiers — a UNESCO World Heritage site, free to explore',
      'Take the Algiers Metro for $0.15 per ride — one of the cheapest in the world',
      'Visit the Notre Dame dAfrique basilica for free panoramic views',
      'Use intercity trains — very cheap but book ahead as they fill up fast',
    ],
  },

  // ========== AFRICA (ADDITIONAL) ==========
  {
    code: 'ADD',
    city: 'Addis Ababa',
    country: 'Ethiopia',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 8, food: 3, transport: 1, activities: 3 },
      mid: { hotel: 30, food: 10, transport: 4, activities: 8 },
      comfort: { hotel: 75, food: 25, transport: 10, activities: 18 },
    },
    currency: 'ETB',
    bestMonths: [10, 11, 12, 1, 2, 3],
    visaFreeFor: [],
    savingTips: [
      'Eat injera with wot at local restaurants for $1-2 — share a platter for even cheaper',
      'Take minibus taxis anywhere in the city for $0.15-0.30',
      'Visit the National Museum (home of Lucy) for $2',
      'Drink Ethiopian coffee at a traditional ceremony — $0.30-0.50 per cup',
      'Explore Merkato (largest open-air market in Africa) for free — watch your belongings',
    ],
  },
  {
    code: 'DAR',
    city: 'Dar es Salaam',
    country: 'Tanzania',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 10, food: 4, transport: 2, activities: 5 },
      mid: { hotel: 40, food: 15, transport: 6, activities: 15 },
      comfort: { hotel: 95, food: 35, transport: 12, activities: 35 },
    },
    currency: 'TZS',
    bestMonths: [6, 7, 8, 9, 1, 2],
    visaFreeFor: [],
    savingTips: [
      'Eat at local restaurants for $1-2 per meal — try ugali with fish',
      'Take dalla dalla (minibuses) for $0.20-0.40 per ride',
      'Visit Coco Beach and the Fish Market for free',
      'Take a ferry to Zanzibar for $35 instead of flying ($100+)',
      'Book budget safaris from Dar to Mikumi National Park for much less than Serengeti',
    ],
  },
  {
    code: 'EBB',
    city: 'Entebbe',
    country: 'Uganda',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 10, food: 4, transport: 3, activities: 8 },
      mid: { hotel: 40, food: 15, transport: 8, activities: 25 },
      comfort: { hotel: 100, food: 35, transport: 15, activities: 50 },
    },
    currency: 'UGX',
    bestMonths: [1, 2, 6, 7, 8, 9, 12],
    visaFreeFor: [],
    savingTips: [
      'Eat rolex (chapati egg wrap) from street vendors for $0.50 — the ultimate Uganda street food',
      'Take matatus (shared taxis) for $0.50-1 between Entebbe and Kampala',
      'Visit the Uganda Wildlife Education Centre for $5',
      'Book gorilla permits well in advance — $700 but a once-in-a-lifetime experience',
      'Stay in Entebbe backpackers for $10-15/night instead of Kampala hotels',
    ],
  },
  {
    code: 'KGL',
    city: 'Kigali',
    country: 'Rwanda',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 12, food: 4, transport: 2, activities: 5 },
      mid: { hotel: 45, food: 15, transport: 6, activities: 15 },
      comfort: { hotel: 110, food: 35, transport: 12, activities: 35 },
    },
    currency: 'RWF',
    bestMonths: [6, 7, 8, 9, 1, 2],
    visaFreeFor: [],
    savingTips: [
      'Eat buffet lunches at local restaurants for $1-3 per meal',
      'Take moto-taxis (motorcycle taxis) for $0.50-1 per ride — fastest way around',
      'Visit the Kigali Genocide Memorial for free — powerful and essential',
      'Walk through Kimironko Market for free — great for local crafts and produce',
      'Book gorilla permits ($1500) well in advance — cheaper than the experience may ever be again',
    ],
  },
  {
    code: 'TNR',
    city: 'Antananarivo',
    country: 'Madagascar',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 6, food: 3, transport: 1, activities: 4 },
      mid: { hotel: 25, food: 10, transport: 4, activities: 10 },
      comfort: { hotel: 65, food: 25, transport: 10, activities: 22 },
    },
    currency: 'MGA',
    bestMonths: [4, 5, 6, 7, 8, 9, 10],
    visaFreeFor: [],
    savingTips: [
      'Eat at local hotely restaurants for $0.50-1 per meal — rice with laoka (side dishes)',
      'Take taxi-brousses (bush taxis) for very cheap intercity travel',
      'Visit Lemur Park just outside the city for $10 — guaranteed lemur sightings',
      'Walk through the Haute-Ville (upper town) and Analakely Market for free',
      'Hire a local guide directly instead of through a tour company for 50-70% savings',
    ],
  },
  {
    code: 'ZNZ',
    city: 'Zanzibar',
    country: 'Tanzania',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 12, food: 5, transport: 3, activities: 8 },
      mid: { hotel: 45, food: 18, transport: 8, activities: 20 },
      comfort: { hotel: 120, food: 40, transport: 18, activities: 40 },
    },
    currency: 'TZS',
    bestMonths: [6, 7, 8, 9, 1, 2],
    visaFreeFor: [],
    savingTips: [
      'Stay on the east coast (Paje, Jambiani) for budget beach guesthouses at $10-20/night',
      'Eat at Forodhani Gardens night market in Stone Town for $2-4 seafood meals',
      'Walk through Stone Town — a UNESCO World Heritage Site, free to explore',
      'Take dalla dallas (local minibuses) for $0.50 instead of tourist taxis ($20+)',
      'Snorkel from the beach at Mnemba Atoll view points instead of booking a boat',
    ],
  },
  {
    code: 'LOS',
    city: 'Lagos',
    country: 'Nigeria',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 12, food: 4, transport: 3, activities: 4 },
      mid: { hotel: 45, food: 15, transport: 8, activities: 10 },
      comfort: { hotel: 110, food: 35, transport: 18, activities: 25 },
    },
    currency: 'NGN',
    bestMonths: [11, 12, 1, 2, 3],
    visaFreeFor: [],
    savingTips: [
      'Eat jollof rice, suya, and puff puff from street vendors for $1-2',
      'Take danfo buses and BRT for $0.30-0.60 per ride',
      'Visit Lekki Conservation Centre for $3 — walk the canopy walkway',
      'Explore the Nike Art Gallery for free — the largest in West Africa',
      'Stay on Victoria Island or Lekki for safer and better-connected accommodation',
    ],
  },
  {
    code: 'ACC',
    city: 'Accra',
    country: 'Ghana',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 12, food: 5, transport: 2, activities: 5 },
      mid: { hotel: 45, food: 18, transport: 6, activities: 12 },
      comfort: { hotel: 110, food: 38, transport: 14, activities: 28 },
    },
    currency: 'GHS',
    bestMonths: [11, 12, 1, 2, 3, 7, 8],
    visaFreeFor: [],
    savingTips: [
      'Eat waakye, banku, and jollof rice at local chop bars for $1-2',
      'Take tro-tros (shared minibuses) for $0.20-0.50 per ride',
      'Visit Jamestown and the Kwame Nkrumah Mausoleum for $2-3',
      'Walk along Labadi Beach for free — buy coconuts from vendors for $0.50',
      'Stay in Osu or Adabraka for budget guesthouses at $12-20/night',
    ],
  },
  {
    code: 'MPM',
    city: 'Maputo',
    country: 'Mozambique',
    region: 'Africa',
    dailyCosts: {
      budget: { hotel: 8, food: 3, transport: 1, activities: 3 },
      mid: { hotel: 35, food: 12, transport: 4, activities: 8 },
      comfort: { hotel: 80, food: 28, transport: 10, activities: 20 },
    },
    currency: 'MZN',
    bestMonths: [4, 5, 6, 7, 8, 9, 10],
    visaFreeFor: [],
    savingTips: [
      'Eat piri-piri prawns and matapa at local restaurants for $2-4',
      'Take chapas (minibuses) for $0.15-0.30 per ride',
      'Walk along the Marginal (waterfront promenade) and visit the Central Market for free',
      'Visit the Maputo Railway Station — a beautiful building, free to admire',
      'Day trip to Inhaca Island by ferry for $5 — great snorkeling and beaches',
    ],
  },

  // ========== LATIN AMERICA (ADDITIONAL) ==========
  {
    code: 'GYE',
    city: 'Guayaquil',
    country: 'Ecuador',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 10, food: 5, transport: 2, activities: 4 },
      mid: { hotel: 38, food: 15, transport: 5, activities: 10 },
      comfort: { hotel: 90, food: 35, transport: 12, activities: 25 },
    },
    currency: 'USD',
    bestMonths: [6, 7, 8, 9, 10, 11],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Walk the Malecon 2000 waterfront and Las Penas neighborhood for free',
      'Eat almuerzos (set lunches) at local restaurants for $2-3',
      'Use the Metrovia bus system for $0.30 per ride',
      'Visit Parque Seminario (Iguana Park) for free — iguanas everywhere',
      'Fly to the Galapagos from here — cheaper flights than from Quito',
    ],
  },
  {
    code: 'UIO',
    city: 'Quito',
    country: 'Ecuador',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 10, food: 5, transport: 2, activities: 5 },
      mid: { hotel: 40, food: 15, transport: 5, activities: 12 },
      comfort: { hotel: 95, food: 35, transport: 12, activities: 28 },
    },
    currency: 'USD',
    bestMonths: [6, 7, 8, 9, 10, 11],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Walk through the UNESCO-listed Old Town — the best preserved historic center in South America',
      'Eat almuerzos (set lunches) for $2-3 at local comedores',
      'Take the TeleferiQo cable car for $8 — views of the Andes at 4,000m',
      'Use the Ecovia and Trolebus for $0.25 per ride',
      'Visit the Mitad del Mundo (equator monument) by bus for $0.50 each way',
    ],
  },
  {
    code: 'LPB',
    city: 'La Paz',
    country: 'Bolivia',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 6, food: 3, transport: 1, activities: 3 },
      mid: { hotel: 25, food: 10, transport: 3, activities: 8 },
      comfort: { hotel: 65, food: 25, transport: 8, activities: 18 },
    },
    currency: 'BOB',
    bestMonths: [5, 6, 7, 8, 9, 10],
    visaFreeFor: ['UK', 'EU', 'JP', 'KR'],
    savingTips: [
      'Eat salteñas (Bolivian empanadas) for breakfast for $0.50 each',
      'Ride the Mi Teleferico cable car network for $0.40 per ride — incredible city views',
      'Walk through the Witches Market and colonial center for free',
      'Eat a menu del dia (set lunch) for $1-2 at local market eateries',
      'Day trip to Tiwanaku ruins by minibus for $3 each way',
    ],
  },
  {
    code: 'ASU',
    city: 'Asuncion',
    country: 'Paraguay',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 8, food: 4, transport: 1, activities: 3 },
      mid: { hotel: 30, food: 12, transport: 4, activities: 8 },
      comfort: { hotel: 75, food: 28, transport: 8, activities: 18 },
    },
    currency: 'PYG',
    bestMonths: [4, 5, 6, 7, 8, 9],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Eat empanadas and sopa paraguaya at local restaurants for $1-3',
      'Walk along the Costanera waterfront and visit the Panteon de los Heroes for free',
      'Take local buses for $0.40 per ride',
      'Visit the Mercado 4 market for cheap food, clothes, and local goods',
      'Drink terere (cold yerba mate) everywhere — Paraguayans will often share with you for free',
    ],
  },
  {
    code: 'MVD',
    city: 'Montevideo',
    country: 'Uruguay',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 15, food: 10, transport: 3, activities: 5 },
      mid: { hotel: 55, food: 25, transport: 8, activities: 15 },
      comfort: { hotel: 130, food: 50, transport: 15, activities: 30 },
    },
    currency: 'UYU',
    bestMonths: [11, 12, 1, 2, 3],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Walk the Rambla (waterfront promenade) — 22 km of free scenic walking',
      'Eat chivitos (Uruguayan steak sandwiches) at local restaurants for $5-8',
      'Visit the Mercado del Puerto on Saturdays for atmosphere (food is pricey — eat nearby instead)',
      'Take local buses for $1 per ride with an STM card',
      'Visit Ciudad Vieja (Old Town) and its free museums and plazas',
    ],
  },
  {
    code: 'HAV',
    city: 'Havana',
    country: 'Cuba',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 15, food: 6, transport: 2, activities: 5 },
      mid: { hotel: 50, food: 18, transport: 6, activities: 12 },
      comfort: { hotel: 120, food: 40, transport: 12, activities: 25 },
    },
    currency: 'CUP',
    bestMonths: [11, 12, 1, 2, 3, 4],
    visaFreeFor: ['UK', 'EU', 'AU', 'CA'],
    savingTips: [
      'Stay in casas particulares (private homestays) for $15-30/night instead of hotels',
      'Eat at paladares (private restaurants) for $3-6 instead of state restaurants',
      'Walk the Malecon and explore Old Havana for free — the architecture is stunning',
      'Take colectivos (shared taxis) for $0.50-1 instead of tourist taxis',
      'Bring cash — ATMs are unreliable and US bank cards often do not work',
    ],
  },
  {
    code: 'GUA',
    city: 'Guatemala City',
    country: 'Guatemala',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 8, food: 4, transport: 2, activities: 4 },
      mid: { hotel: 30, food: 12, transport: 5, activities: 10 },
      comfort: { hotel: 75, food: 28, transport: 12, activities: 22 },
    },
    currency: 'GTQ',
    bestMonths: [11, 12, 1, 2, 3, 4],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Base yourself in Antigua instead of Guatemala City — safer, cheaper, and more beautiful',
      'Eat at comedores (local eateries) for $2-3 per meal',
      'Take chicken buses (old US school buses) for $1-3 intercity rides',
      'Visit Lake Atitlan by bus for $5 each way — one of the most beautiful lakes in the world',
      'Learn Spanish in Antigua — private lessons cost $5-8/hour, cheapest in the Americas',
    ],
  },
  {
    code: 'MGA',
    city: 'Managua',
    country: 'Nicaragua',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 7, food: 3, transport: 1, activities: 3 },
      mid: { hotel: 28, food: 10, transport: 4, activities: 8 },
      comfort: { hotel: 70, food: 25, transport: 8, activities: 18 },
    },
    currency: 'NIO',
    bestMonths: [11, 12, 1, 2, 3, 4],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR'],
    savingTips: [
      'Head to Granada or Leon instead of Managua — cheaper, safer, and more interesting',
      'Eat gallo pinto (rice and beans) and nacatamales at local comedores for $1-2',
      'Take local buses for $0.30 per ride — even intercity buses rarely cost more than $3',
      'Surf in San Juan del Sur — board rental is $5-10/day',
      'Visit Ometepe Island by ferry for $2 — hike two volcanoes on a budget',
    ],
  },
  {
    code: 'BZE',
    city: 'Belize City',
    country: 'Belize',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 15, food: 8, transport: 4, activities: 10 },
      mid: { hotel: 55, food: 22, transport: 10, activities: 25 },
      comfort: { hotel: 130, food: 48, transport: 20, activities: 50 },
    },
    currency: 'BZD',
    bestMonths: [11, 12, 1, 2, 3, 4],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA'],
    savingTips: [
      'Head to Caye Caulker instead of Ambergris Caye — much cheaper and more backpacker-friendly',
      'Eat at local Creole restaurants for $4-6 per meal — try stew chicken with rice and beans',
      'Take water taxis between islands for $10-15 instead of flying',
      'Snorkel the Belize Barrier Reef from Caye Caulker for $25-35 per trip',
      'Use ADO and local buses for cheap mainland transport at $2-8 per ride',
    ],
  },
  {
    code: 'SDQ',
    city: 'Santo Domingo',
    country: 'Dominican Republic',
    region: 'Americas',
    dailyCosts: {
      budget: { hotel: 12, food: 5, transport: 2, activities: 4 },
      mid: { hotel: 45, food: 18, transport: 6, activities: 12 },
      comfort: { hotel: 110, food: 40, transport: 14, activities: 28 },
    },
    currency: 'DOP',
    bestMonths: [12, 1, 2, 3, 4],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA'],
    savingTips: [
      'Walk through the Zona Colonial — a UNESCO World Heritage Site, free to explore',
      'Eat at comedores for $2-4 per meal — try la bandera (rice, beans, and meat)',
      'Take guaguas (local buses) for $0.50 per ride',
      'Visit the Alcazar de Colon and the first cathedral in the Americas for $3-5',
      'Take a bus to the beaches at Boca Chica or Juan Dolio for $1-2 each way',
    ],
  },

  // ========== CAUCASUS (ADDITIONAL) ==========
  {
    code: 'EVN',
    city: 'Yerevan',
    country: 'Armenia',
    region: 'Caucasus',
    dailyCosts: {
      budget: { hotel: 8, food: 5, transport: 2, activities: 4 },
      mid: { hotel: 32, food: 14, transport: 4, activities: 10 },
      comfort: { hotel: 75, food: 32, transport: 8, activities: 22 },
    },
    currency: 'AMD',
    bestMonths: [5, 6, 7, 9, 10],
    visaFreeFor: ['US', 'UK', 'EU', 'AU', 'CA', 'JP', 'KR', 'NZ'],
    savingTips: [
      'Eat khorovats (Armenian BBQ), lavash, and dolma at local restaurants for $3-5',
      'Walk the Cascade complex for free — art installations and panoramic views of Ararat',
      'Take the metro or marshrutkas for $0.20-0.30 per ride',
      'Visit the Genocide Memorial and Museum for free — essential and moving',
      'Day trip to Garni Temple and Geghard Monastery by shared taxi for $3-5 per person',
    ],
  },
  {
    code: 'GYD',
    city: 'Baku',
    country: 'Azerbaijan',
    region: 'Caucasus',
    dailyCosts: {
      budget: { hotel: 10, food: 5, transport: 2, activities: 4 },
      mid: { hotel: 38, food: 15, transport: 5, activities: 10 },
      comfort: { hotel: 90, food: 35, transport: 10, activities: 25 },
    },
    currency: 'AZN',
    bestMonths: [4, 5, 6, 9, 10],
    visaFreeFor: [],
    savingTips: [
      'Walk through the UNESCO-listed Old City (Icherisheher) for free',
      'Eat at local restaurants — plov, kebabs, and dolma for $3-5 per meal',
      'Take the Baku Metro for $0.15 per ride — modern and clean',
      'Visit the Flame Towers viewpoint and Heydar Aliyev Center exterior for free',
      'Apply for the e-visa online ($20) — much cheaper and faster than visa on arrival',
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

// ── Seasonal price adjustments ───────────────────────────────────────────
// Multipliers applied to hotel + activity costs by month.
// 1.0 = base price, 1.3 = peak season (+30%), 0.8 = low season (-20%)
// Only hotels and activities vary seasonally; food and transport stay stable.

interface SeasonalPattern {
  /** Months (1-12) with peak pricing */
  peak: number[]
  /** Months (1-12) with low/shoulder pricing */
  low: number[]
  /** Peak multiplier (default 1.3) */
  peakMultiplier?: number
  /** Low multiplier (default 0.8) */
  lowMultiplier?: number
}

const SEASONAL_PATTERNS: Record<string, SeasonalPattern> = {
  // Southeast Asia — peak = northern hemisphere winter (dry season)
  'Southeast Asia': { peak: [12, 1, 2], low: [5, 6, 7, 8, 9] },
  // South Asia — peak = winter, monsoon = low
  'South Asia': { peak: [11, 12, 1, 2, 3], low: [6, 7, 8, 9] },
  // East Asia — peak = cherry blossom + autumn leaves
  'East Asia': { peak: [3, 4, 10, 11], low: [1, 2, 6, 7] },
  // Europe — peak = summer
  'Europe': { peak: [6, 7, 8], low: [11, 12, 1, 2], peakMultiplier: 1.35 },
  // Middle East — peak = winter (cooler), low = summer (extreme heat)
  'Middle East': { peak: [11, 12, 1, 2, 3], low: [6, 7, 8], lowMultiplier: 0.7 },
  // Central America + Caribbean — peak = dry season
  'Central America': { peak: [12, 1, 2, 3], low: [9, 10] },
  'Caribbean': { peak: [12, 1, 2, 3, 4], low: [8, 9, 10] },
  // South America — varies by country but generally summer (Dec-Feb) is peak
  'South America': { peak: [12, 1, 2], low: [5, 6, 7] },
  // Africa — dry season peak
  'East Africa': { peak: [7, 8, 9, 10], low: [3, 4, 5], peakMultiplier: 1.4 },
  'North Africa': { peak: [3, 4, 5, 10, 11], low: [7, 8] },
  // Oceania — peak = southern summer
  'Oceania': { peak: [12, 1, 2], low: [6, 7, 8] },
}

/**
 * Get the seasonal price multiplier for a destination in a given month.
 * Returns a number like 1.0 (normal), 1.3 (peak), or 0.8 (low season).
 */
export function getSeasonalMultiplier(code: string, month: number): number {
  const dest = getDestinationCost(code)
  if (!dest) return 1.0

  const pattern = SEASONAL_PATTERNS[dest.region]
  if (!pattern) return 1.0

  if (pattern.peak.includes(month)) return pattern.peakMultiplier ?? 1.3
  if (pattern.low.includes(month)) return pattern.lowMultiplier ?? 0.8
  return 1.0
}

/**
 * Get seasonally-adjusted daily costs for a destination.
 * Applies seasonal multiplier to hotel and activity costs only.
 */
export function getSeasonalCost(
  code: string,
  tier: BudgetTier,
  month?: number,
): DailyCosts | null {
  const dest = getDestinationCost(code)
  if (!dest) return null

  const base = dest.dailyCosts[tier]
  const m = month ?? (new Date().getMonth() + 1)
  const multiplier = getSeasonalMultiplier(code, m)

  return {
    hotel: Math.round(base.hotel * multiplier),
    food: base.food, // food doesn't vary seasonally
    transport: base.transport, // transport doesn't vary
    activities: Math.round(base.activities * multiplier),
  }
}

/**
 * Get a human-readable season label for a destination in a given month.
 */
export function getSeasonLabel(code: string, month?: number): 'peak' | 'shoulder' | 'low' | null {
  const dest = getDestinationCost(code)
  if (!dest) return null

  const pattern = SEASONAL_PATTERNS[dest.region]
  if (!pattern) return null

  const m = month ?? (new Date().getMonth() + 1)
  if (pattern.peak.includes(m)) return 'peak'
  if (pattern.low.includes(m)) return 'low'
  return 'shoulder'
}
