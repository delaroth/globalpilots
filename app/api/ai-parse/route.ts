import { NextRequest, NextResponse } from 'next/server'
import { callAI, parseAIJSON } from '@/lib/ai'

export const dynamic = 'force-dynamic'

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
- origin (3-letter IATA airport code ONLY, null if not mentioned. Convert city names to IATA codes)
- destination (3-letter IATA airport code ONLY, null if not mentioned. Convert city names to IATA codes)
- budget (total amount in USD, null if not mentioned)
- dates (any date/time info, null if not mentioned)
- vibe (array of vibes like "beach", "adventure", "city", "food", "nature", empty array if none)
- confidence (low/medium/high based on how clear the query is)

IMPORTANT: Always use 3-letter IATA codes for airports:
- NYC, New York → JFK
- LA, Los Angeles → LAX
- Bangkok → BKK
- London → LHR
- Paris → CDG
- Tokyo → NRT
- Singapore → SIN
- Dubai → DXB

Examples:
"Beach vacation under $1500" → origin:null, destination:null, budget:1500, dates:null, vibe:["beach"], confidence:"medium"
"NYC to Tokyo in July" → origin:"JFK", destination:"NRT", budget:null, dates:"July", vibe:[], confidence:"high"
"Cheap weekend getaway from LA" → origin:"LAX", destination:null, budget:null, dates:"weekend", vibe:[], confidence:"high"
"Bangkok to Singapore" → origin:"BKK", destination:"SIN", budget:null, dates:null, vibe:[], confidence:"high"

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
