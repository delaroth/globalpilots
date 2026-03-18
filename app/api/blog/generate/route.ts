import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'
import { getCached, setCache } from '@/lib/cache'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

interface GenerateBlogRequest {
  destinationCode: string // IATA code
  destinationName: string // City name
  country: string
}

interface BlogContent {
  seo_title: string
  meta_description: string
  sections: {
    why_visit: string
    best_time_to_visit: string
    budget_breakdown: string
    top_attractions: string
    local_food_guide: string
    money_saving_tips: string
    safety_tips: string
    disclaimer?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateBlogRequest = await request.json()
    const { destinationCode, destinationName, country } = body

    if (!destinationCode || !destinationName || !country) {
      return NextResponse.json(
        { error: 'Missing required fields: destinationCode, destinationName, country' },
        { status: 400 }
      )
    }

    console.log('[Blog Generate] Generating blog for:', { destinationCode, destinationName, country })

    // Check if blog post already exists
    const { data: existing } = await (supabase as any)
      .from('blog_posts')
      .select('*')
      .eq('destination_code', destinationCode)
      .single()

    if (existing) {
      console.log('[Blog Generate] Blog already exists, returning cached version')
      return NextResponse.json({
        success: true,
        slug: existing.slug,
        blog: existing
      })
    }

    // Check cache
    const cacheKey = `blog:${destinationCode}`
    const cached = getCached<any>(cacheKey)
    if (cached) {
      console.log('[Blog Generate] Cache hit')
      return NextResponse.json({
        success: true,
        slug: cached.slug,
        blog: cached
      })
    }

    // Generate blog post with AI
    const systemPrompt = `You are a professional travel writer specializing in SEO-optimized destination guides for budget-conscious travelers. You MUST respond with valid JSON only, no additional text.`

    const userPrompt = `Create a comprehensive, engaging travel guide for ${destinationName}, ${country}.

Write in a friendly, informative tone that appeals to budget travelers, digital nomads, and adventure seekers. Include practical tips and insider knowledge.

Include these sections:
1. why_visit (200-250 words): 3-4 compelling reasons to visit this destination. Focus on unique experiences, culture, and value for money.

2. best_time_to_visit (150-200 words): Month-by-month breakdown of weather, peak/off-peak seasons, and best times for budget travelers.

3. budget_breakdown (200-250 words): Realistic daily costs for budget ($30-50/day), mid-range ($50-100/day), and luxury ($100+/day) travelers. Include accommodation, food, transport, and activities.

4. top_attractions (250-300 words): 7-10 must-see places with brief descriptions. Mix of paid and free activities. Include approximate costs.

5. local_food_guide (150-200 words): 5-7 dishes to try, where to find them, and approximate prices. Include street food and restaurant recommendations.

6. money_saving_tips (200-250 words): 10-12 specific, actionable tips for saving money in this destination. Include transportation hacks, free activities, and local secrets.

7. safety_tips (100-150 words): 5-7 important safety considerations specific to this destination.

8. disclaimer (50-80 words): A brief note stating that prices, visa requirements, and availability are estimates that may change. Recommend readers verify current information before booking. Mention that visa requirements vary by nationality.

Also generate:
- SEO title (60 chars max): Use format "${destinationName} Travel Guide 2026: Budget Tips & Best Things to Do"
- Meta description (160 chars max): Focus on budget travel, best time to visit, and top attractions.

Return this EXACT JSON structure:
{
  "seo_title": "SEO optimized title",
  "meta_description": "SEO optimized meta description",
  "sections": {
    "why_visit": "markdown formatted text",
    "best_time_to_visit": "markdown formatted text",
    "budget_breakdown": "markdown formatted text",
    "top_attractions": "markdown formatted text",
    "local_food_guide": "markdown formatted text",
    "money_saving_tips": "markdown formatted text",
    "safety_tips": "markdown formatted text",
    "disclaimer": "Brief note that prices/visa/availability are estimates and may change — verify before booking"
  }
}`

    console.log('[Blog Generate] Calling AI to generate blog content...')

    const aiResponse = await callAI(systemPrompt, userPrompt, 0.7, 3000)
    const blogContent = parseAIJSON<BlogContent>(aiResponse.content)

    // Ensure disclaimer exists
    if (!blogContent.sections.disclaimer) {
      blogContent.sections.disclaimer = `*Prices, visa requirements, and availability mentioned in this guide are estimates based on data available at the time of writing and may have changed. Visa requirements vary by nationality. Always verify current information with official sources before booking your trip.*`
    }

    console.log('[Blog Generate] AI generation complete, saving to database...')

    // Create URL-friendly slug
    const slug = destinationName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    // Save to database
    const { data, error } = await (supabase as any)
      .from('blog_posts')
      .insert({
        destination_code: destinationCode,
        destination_name: destinationName,
        country,
        title: blogContent.seo_title,
        meta_description: blogContent.meta_description,
        content: blogContent.sections,
        slug,
        view_count: 0
      })
      .select()
      .single()

    if (error) {
      console.error('[Blog Generate] Database error:', error)
      throw new Error('Failed to save blog post')
    }

    console.log('[Blog Generate] ✅ Blog post created successfully:', slug)

    // Cache for 7 days
    setCache(cacheKey, data, 7 * 24 * 60 * 60 * 1000)

    return NextResponse.json({
      success: true,
      slug,
      blog: data
    })

  } catch (error) {
    console.error('[Blog Generate] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate blog post. Please try again.' },
      { status: 500 }
    )
  }
}
