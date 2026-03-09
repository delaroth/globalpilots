// AI utilities with DeepSeek primary and Claude fallback

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const DEEPSEEK_API_BASE = 'https://api.deepseek.com'
const ANTHROPIC_API_BASE = 'https://api.anthropic.com'

interface AIResponse {
  content: string
  tokensUsed: number
  provider: 'deepseek' | 'claude'
}

/**
 * Call AI with DeepSeek primary and Claude fallback
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

    const response = await fetch(`${DEEPSEEK_API_BASE}/chat/completions`, {
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
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No response from DeepSeek')
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

      const response = await fetch(`${ANTHROPIC_API_BASE}/v1/messages`, {
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
      })

      if (!response.ok) {
        throw new Error(`Claude API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.content?.[0]?.text

      if (!content) {
        throw new Error('No response from Claude')
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
      throw new Error('Both AI providers failed')
    }
  }
}

/**
 * Parse JSON from AI response (handles markdown code blocks)
 */
export function parseAIJSON<T>(content: string): T {
  try {
    // Try to extract JSON if it's wrapped in markdown code blocks
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/)
    const jsonString = jsonMatch ? jsonMatch[1] : content
    return JSON.parse(jsonString.trim())
  } catch (error) {
    throw new Error(`Failed to parse AI JSON response: ${content.slice(0, 200)}`)
  }
}
