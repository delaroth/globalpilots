import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { getCached, setCache } from '@/lib/cache'
import { calculateBudgetAllocation, PackageComponents, formatAllocationForAI, getBudgetTier } from '@/lib/budget-allocation'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const API_BASE = 'https://api.travelpayouts.com'
const TOKEN = process.env.TRAVELPAYOUTS_TOKEN

interface MysteryRequest {
  origin: string
  budget: number
  vibes: string[]
  dates: string
  tripDuration?: number
  packageComponents?: PackageComponents
  email?: string
}

interface DailyActivity {
  time: string
  activity: string
  estimated_cost: number
}

interface DailyItinerary {
  day: number
  activities: DailyActivity[]
  total_day_cost: number
}

interface HotelRecommendation {
  name: string
  estimated_price_per_night: number
  neighborhood: string
  why_recommended: string
}

interface MysteryResponse {
  destination: string
  country: string
  city_code_IATA: string
  estimated_flight_cost: number
  estimated_hotel_per_night: number
  why_its_perfect: string
  day1: string[]
  day2: string[]
  day3: string[]
  best_local_food: string[]
  insider_tip: string
  // NEW FIELDS
  budget_breakdown?: {
    flight: number
    hotel_total: number
    hotel_per_night: number
    activities: number
    local_transport: number
    food_estimate: number
    buffer: number
  }
  hotel_recommendations?: HotelRecommendation[]
  daily_itinerary?: DailyItinerary[]
  local_transportation?: {
    airport_to_city: string
    daily_transport: string
    estimated_daily_cost: number
  }
  blog_post_slug?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: MysteryRequest = await request.json()
    const { origin, budget, vibes, dates, tripDuration = 3, packageComponents, email } = body

    if (!origin || !budget || !vibes || vibes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Default package components if not provided
    const components: PackageComponents = packageComponents || {
      includeFlight: true,
      includeHotel: true,
      includeItinerary: true,
      includeTransportation: false,
    }

    // Calculate budget allocation
    const allocation = calculateBudgetAllocation(budget, tripDuration, components)
    const budgetTier = getBudgetTier(budget, tripDuration)
    const allocationText = formatAllocationForAI(allocation, tripDuration)

    console.log('[AI-Mystery] Budget allocation:', allocationText)

    // Check cache first (1 hour TTL)
    const cacheKey = `mystery:${origin}:${budget}:${vibes.join(',')}:${dates}:${tripDuration}:${JSON.stringify(components)}`
    const cached = getCached<MysteryResponse>(cacheKey)
    if (cached) {
      console.log('[AI-Mystery] Cache hit')
      // Still capture email if provided
      if (email) {
        await captureEmail(email, 'mystery').catch(err => console.error('[AI-Mystery] Email capture failed:', err))
      }
      return NextResponse.json(cached)
    }

    // Fetch real prices from TravelPayouts
    if (!TOKEN) {
      return NextResponse.json(
        { error: 'TravelPayouts API token not configured' },
        { status: 500 }
      )
    }

    const pricesUrl = `${API_BASE}/v2/prices/latest?origin=${origin}&currency=usd&limit=20&token=${TOKEN}`
    const pricesResponse = await fetch(pricesUrl, {
      next: { revalidate: 3600 },
    })

    if (!pricesResponse.ok) {
      throw new Error('Failed to fetch price data')
    }

    const pricesData = await pricesResponse.json()
    const destinations = pricesData.data || []

    if (destinations.length === 0) {
      throw new Error('No destinations found')
    }

    // Format price data for AI
    const priceInfo = destinations
      .slice(0, 20)
      .map((d: any) => ({
        destination: d.destination,
        gate: d.gate,
        price: d.value,
      }))
      .sort((a: any, b: any) => a.price - b.price)

    // Build enhanced AI prompt
    const systemPrompt = `You are a travel expert specializing in budget-conscious mystery vacation planning. You MUST respond with valid JSON only, no additional text.`

    const userPrompt = `Given:
- Total Budget: ${budget} USD for ${tripDuration} days
- Budget Tier: ${budgetTier}
- Budget Allocation: ${allocationText}
- Departing from: ${origin}
- Travel dates: ${dates}
- Vibes: ${vibes.join(', ')}
- Package includes: ${components.includeFlight ? 'Flight' : ''} ${components.includeHotel ? 'Hotel' : ''} ${components.includeItinerary ? 'Itinerary' : ''} ${components.includeTransportation ? 'Transport' : ''}
- Real available destinations with flight prices: ${JSON.stringify(priceInfo)}

CRITICAL BUDGET RULES:
1. Flight cost MUST be <= $${allocation.flight} (from the available destinations list)
2. Hotel per night MUST be <= $${allocation.hotel_per_night}
3. Daily activities MUST fit within $${Math.floor(allocation.activities / tripDuration)} per day
4. NEVER exceed the total budget of $${budget}
5. All prices must be realistic for the destination

Select ONE destination from the available destinations list that:
1. Has a flight price that fits the allocated budget
2. Matches the selected vibes perfectly
3. Is surprising but perfect for their budget tier
4. Has realistic hotel and activity costs

Return this EXACT JSON structure:
{
  "destination": "City name",
  "country": "Country name",
  "city_code_IATA": "Use exact IATA code from destinations list",
  "estimated_flight_cost": exact flight price from list,
  "estimated_hotel_per_night": realistic price for this destination,
  "why_its_perfect": "2 sentences explaining why this destination matches their vibes and budget",
  "day1": ["Activity 1", "Activity 2", "Activity 3"],
  "day2": ["Activity 1", "Activity 2", "Activity 3"],
  "day3": ["Activity 1", "Activity 2", "Activity 3"],
  "best_local_food": ["Dish 1", "Dish 2", "Dish 3"],
  "insider_tip": "One insider tip for budget travelers",
  ${components.includeFlight && components.includeHotel && components.includeItinerary ? `
  "budget_breakdown": {
    "flight": ${allocation.flight},
    "hotel_total": ${allocation.hotel_total},
    "hotel_per_night": ${allocation.hotel_per_night},
    "activities": ${allocation.activities},
    "local_transport": ${allocation.local_transport},
    "food_estimate": ${allocation.food_estimate},
    "buffer": ${allocation.buffer}
  },` : ''}
  ${components.includeHotel ? `
  "hotel_recommendations": [
    {
      "name": "Hotel name (real or realistic)",
      "estimated_price_per_night": price matching budget,
      "neighborhood": "Area name",
      "why_recommended": "Why this hotel for their budget tier"
    },
    {
      "name": "Hotel name 2",
      "estimated_price_per_night": price matching budget,
      "neighborhood": "Different area",
      "why_recommended": "Alternative option"
    }
  ],` : ''}
  ${components.includeItinerary ? `
  "daily_itinerary": [
    {
      "day": 1,
      "activities": [
        { "time": "9:00 AM", "activity": "Activity name", "estimated_cost": cost in USD },
        { "time": "1:00 PM", "activity": "Activity name", "estimated_cost": cost in USD },
        { "time": "6:00 PM", "activity": "Activity name", "estimated_cost": cost in USD }
      ],
      "total_day_cost": sum of activity costs
    },
    {
      "day": 2,
      "activities": [
        { "time": "9:00 AM", "activity": "Activity name", "estimated_cost": cost in USD },
        { "time": "1:00 PM", "activity": "Activity name", "estimated_cost": cost in USD },
        { "time": "6:00 PM", "activity": "Activity name", "estimated_cost": cost in USD }
      ],
      "total_day_cost": sum of activity costs
    },
    {
      "day": 3,
      "activities": [
        { "time": "9:00 AM", "activity": "Activity name", "estimated_cost": cost in USD },
        { "time": "1:00 PM", "activity": "Activity name", "estimated_cost": cost in USD },
        { "time": "6:00 PM", "activity": "Activity name", "estimated_cost": cost in USD }
      ],
      "total_day_cost": sum of activity costs
    }
  ],` : ''}
  ${components.includeTransportation ? `
  "local_transportation": {
    "airport_to_city": "Transportation method and cost",
    "daily_transport": "Recommended daily transportation (metro/bus/taxi)",
    "estimated_daily_cost": cost per day in USD
  }` : ''}
}`

    const aiResponse = await callAI(systemPrompt, userPrompt, 0.9, 2500)
    const result = parseAIJSON<MysteryResponse>(aiResponse.content)

    // Capture email if provided
    if (email) {
      await captureEmail(email, 'mystery').catch(err => console.error('[AI-Mystery] Email capture failed:', err))
    }

    // Trigger blog post generation in background (don't wait)
    generateBlogPost(result.city_code_IATA, result.destination, result.country)
      .then(slug => {
        console.log('[AI-Mystery] Blog post generated:', slug)
      })
      .catch(err => console.error('[AI-Mystery] Blog generation failed:', err))

    // Cache for 1 hour
    setCache(cacheKey, result, 60 * 60 * 1000)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[AI-Mystery] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate destination' },
      { status: 500 }
    )
  }
}

// Helper function to capture email
async function captureEmail(email: string, source: string): Promise<void> {
  try {
    const { error } = await (supabase as any)
      .from('email_subscribers')
      .upsert({
        email,
        source,
        last_active_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })

    if (error) {
      console.error('[AI-Mystery] Email capture error:', error)
    } else {
      console.log('[AI-Mystery] Email captured:', email)
    }
  } catch (err) {
    console.error('[AI-Mystery] Email capture exception:', err)
  }
}

// Helper function to trigger blog post generation
async function generateBlogPost(destinationCode: string, destinationName: string, country: string): Promise<string | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/blog/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destinationCode,
        destinationName,
        country
      })
    })

    if (response.ok) {
      const data = await response.json()
      return data.slug || null
    }

    return null
  } catch (err) {
    console.error('[AI-Mystery] Blog generation exception:', err)
    return null
  }
}
