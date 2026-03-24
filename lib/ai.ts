// AI utilities with DeepSeek primary and Claude fallback
import { z, type ZodType } from 'zod'

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const DEEPSEEK_API_BASE = 'https://api.deepseek.com'
const ANTHROPIC_API_BASE = 'https://api.anthropic.com'

interface AIResponse {
  content: string
  tokensUsed: number
  provider: 'deepseek' | 'claude'
}

// Timeout duration for AI calls (15 seconds per provider, 30s total max)
const AI_TIMEOUT_MS = 15000

/**
 * Fetch with a timeout. Rejects with a clear error if the request takes too long.
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`AI request timed out after ${timeoutMs / 1000}s`)
    }
    throw err
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Call AI with DeepSeek primary and Claude fallback.
 * Both calls are subject to a 30-second timeout.
 */
export async function callAI(
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 0.7,
  maxTokens: number = 1500
): Promise<AIResponse> {
  // Try DeepSeek first
  try {
    if (!DEEPSEEK_API_KEY) {
      throw new Error('DeepSeek API key not configured')
    }

    const response = await fetchWithTimeout(`${DEEPSEEK_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    }, AI_TIMEOUT_MS)

    if (!response.ok) {
      console.error(`DeepSeek API error: ${response.status}`)
      throw new Error('AI service error')
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      console.error('No response from DeepSeek')
      throw new Error('AI service error')
    }

    const tokensUsed = data.usage?.total_tokens || 0

    console.log(`[AI] DeepSeek used ${tokensUsed} tokens`)

    return {
      content,
      tokensUsed,
      provider: 'deepseek',
    }
  } catch (deepseekError) {
    console.error('[AI] DeepSeek failed:', deepseekError)

    // Fallback to Claude
    try {
      if (!ANTHROPIC_API_KEY) {
        throw new Error('Claude API key not configured')
      }

      console.log('[AI] Falling back to Claude...')

      const response = await fetchWithTimeout(`${ANTHROPIC_API_BASE}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [
            { role: 'user', content: userPrompt },
          ],
        }),
      }, AI_TIMEOUT_MS)

      if (!response.ok) {
        console.error(`Claude API error: ${response.status}`)
        throw new Error('AI service error')
      }

      const data = await response.json()
      const content = data.content?.[0]?.text

      if (!content) {
        console.error('No response from Claude')
        throw new Error('AI service error')
      }

      const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)

      console.log(`[AI] Claude used ${tokensUsed} tokens`)

      return {
        content,
        tokensUsed,
        provider: 'claude',
      }
    } catch (claudeError) {
      console.error('[AI] Claude also failed:', claudeError)
      throw new Error('Both AI providers failed. Please try again later.')
    }
  }
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 * Optionally validates against a Zod schema.
 */
export function parseAIJSON<T>(content: string, schema?: ZodType<T>): T {
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/)
    const jsonString = jsonMatch ? jsonMatch[1] : content
    const parsed = JSON.parse(jsonString.trim())
    if (schema) {
      return schema.parse(parsed)
    }
    return parsed as T
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`AI response validation failed: ${error.issues.map((e: { message: string }) => e.message).join(', ')}`)
    }
    throw new Error(`Failed to parse AI JSON response: ${content.slice(0, 200)}`)
  }
}
