import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'

interface ParseResponse {
  origin: string | null
  destination: string | null
  budget: number | null
  dates: string | null
  vibe: string[]
  confidence: 'low' | 'medium' | 'high'
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Missing required parameter: query' },
        { status: 400 }
      )
    }

    // Call AI to parse natural language
    const systemPrompt = `You are a query parser. Extract travel search parameters from natural language. You MUST respond with valid JSON only.`

    const userPrompt = `Parse this travel query and extract parameters:

"${query}"

Extract:
- origin (departure city/airport code, null if not mentioned)
- destination (arrival city/airport code, null if not mentioned)
- budget (total amount in USD, null if not mentioned)
- dates (any date/time info, null if not mentioned)
- vibe (array of vibes like "beach", "adventure", "city", "food", "nature", empty array if none)
- confidence (low/medium/high based on how clear the query is)

Examples:
"Beach vacation under $1500" → origin:null, destination:null, budget:1500, dates:null, vibe:["beach"], confidence:"medium"
"NYC to Tokyo in July" → origin:"NYC", destination:"Tokyo", budget:null, dates:"July", vibe:[], confidence:"high"
"Cheap weekend getaway from LA" → origin:"LA", destination:null, budget:null, dates:"weekend", vibe:[], confidence:"high"

Return this EXACT JSON structure:
{
  "origin": string or null,
  "destination": string or null,
  "budget": number or null,
  "dates": string or null,
  "vibe": string array,
  "confidence": "low", "medium", or "high"
}`

    const aiResponse = await callAI(systemPrompt, userPrompt, 0.3, 300)
    const result = parseAIJSON<ParseResponse>(aiResponse.content)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[AI-Parse] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse query' },
      { status: 500 }
    )
  }
}
