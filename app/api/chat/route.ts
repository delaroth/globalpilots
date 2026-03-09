import { NextRequest, NextResponse } from 'next/server'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_BASE = 'https://api.deepseek.com'
const MARKER = '708764'
const CAMPAIGN_ID = '100'
const TRS = '505363'

const SYSTEM_PROMPT = `You are GlobePilot, an expert AI travel planner specializing in budget travel.
You help users find amazing trips within their budget.

Always ask about:
- Budget (total trip cost)
- Departure city
- Travel dates or timeframe
- Travel style/preferences

Once you have these details, suggest 3 specific destinations with:
- Estimated flight cost
- Estimated accommodation cost per night
- Brief reason why it's a good fit
- A booking link

For booking links, use this format:
[Book flights from $X →](https://tp.media/r?campaign_id=${CAMPAIGN_ID}&marker=${MARKER}&p=4114&sub_id=GlobePilots&trs=${TRS}&u=https://aviasales.com)

Keep responses:
- Friendly and enthusiastic
- Specific with numbers and recommendations
- Actionable with clear next steps
- Concise (2-3 paragraphs max per response)

Example good response:
"Based on your $2000 budget from New York for a beach vacation in July:

1. **Cancún, Mexico** - Flights ~$350, Hotels ~$80/night. Perfect beaches, great food scene, easy from NYC.
2. **San Juan, Puerto Rico** - Flights ~$250, Hotels ~$90/night. No passport needed, beautiful Old San Juan.
3. **Turks & Caicos** - Flights ~$400, Hotels ~$120/night. Pristine beaches, world-class diving.

[Book flights from $250 →](link)"`

export async function POST(request: NextRequest) {
  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json(
      { error: 'DeepSeek API key not configured' },
      { status: 500 }
    )
  }

  try {
    const { messages } = await request.json()

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
            content: SYSTEM_PROMPT,
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    const aiMessage = data.choices?.[0]?.message?.content

    if (!aiMessage) {
      throw new Error('No response from AI')
    }

    return NextResponse.json({ message: aiMessage })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get AI response' },
      { status: 500 }
    )
  }
}
