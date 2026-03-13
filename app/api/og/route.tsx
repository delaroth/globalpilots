import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const ACCENT_COLORS: Record<string, string> = {
  mystery: '#a855f7',    // purple
  search: '#3b82f6',     // blue
  explore: '#22c55e',    // green
  discover: '#06b6d4',   // cyan
  'trip-cost': '#f59e0b', // amber
  'multi-city': '#f59e0b', // amber
  default: '#87CEEB',     // skyblue
}

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = req.nextUrl
  const title = (searchParams.get('title') || 'GlobePilot').slice(0, 100)
  const subtitle = (searchParams.get('subtitle') || 'Budget in. Adventure out.').slice(0, 200)
  const type = searchParams.get('type') || 'default'

  const accent = ACCENT_COLORS[type] || ACCENT_COLORS.default

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0a1628 0%, #0A1F44 50%, #071630 100%)',
          padding: '60px',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: `linear-gradient(90deg, ${accent}, #87CEEB)`,
            display: 'flex',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#87CEEB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '20px',
              fontSize: '36px',
              fontWeight: 700,
              color: '#0a1628',
            }}
          >
            G
          </div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 700,
              color: 'white',
              display: 'flex',
            }}
          >
            GlobePilot
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: '900px',
            display: 'flex',
          }}
        >
          {title}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '28px',
            color: accent,
            textAlign: 'center',
            marginTop: '20px',
            maxWidth: '800px',
            lineHeight: 1.4,
            display: 'flex',
          }}
        >
          {subtitle}
        </div>

        {/* Bottom watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            fontSize: '18px',
            color: 'rgba(135, 206, 235, 0.5)',
            display: 'flex',
          }}
        >
          globepilots.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
  } catch (error) {
    console.error('[OG Image] Error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
