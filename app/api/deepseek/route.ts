import { NextRequest, NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_BASE = 'https://api.deepseek.com'

export async function POST(request: NextRequest) {
  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json(
      { error: 'DeepSeek API key not configured' },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { budget, origin, dates, vibes, travellerType } = body

    const prompt = `You are a travel expert. Given budget: ${budget} USD, departing from: ${origin}, travel dates: ${dates}, vibes: ${vibes.join(', ')}, traveller type: ${travellerType}.

Suggest ONE surprising but perfect destination that fits this profile.

Return your response as a valid JSON object with this exact structure:
{
  "destination": "City name",
  "country": "Country name",
  "city_code_IATA": "3-letter airport code",
  "estimated_flight_cost": number,
  "estimated_hotel_per_night": number,
  "why_its_perfect": "2 sentences explaining why this destination is perfect",
  "day1": ["Activity 1", "Activity 2", "Activity 3"],
  "day2": ["Activity 1", "Activity 2", "Activity 3"],
  "day3": ["Activity 1", "Activity 2", "Activity 3"],
  "best_local_food": ["Dish 1", "Dish 2", "Dish 3"],
  "insider_tip": "One insider tip for this destination"
}

Make sure the destination is realistic for the budget and matches the selected vibes. Ensure the response is valid JSON only, with no additional text.`

    const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful travel expert that always responds with valid JSON only.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9, // Higher creativity
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DeepSeek API error:', errorText)
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    const aiResponse = data.choices?.[0]?.message?.content

    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    // Parse JSON from AI response
    let destination
    try {
      // Try to extract JSON if it's wrapped in markdown code blocks
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/```\n?([\s\S]*?)\n?```/)
      const jsonString = jsonMatch ? jsonMatch[1] : aiResponse
      destination = JSON.parse(jsonString.trim())
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse)
      throw new Error('Failed to parse AI response')
    }

    return NextResponse.json(destination)
  } catch (error) {
    console.error('DeepSeek API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate destination' },
      { status: 500 }
    )
  }
}
