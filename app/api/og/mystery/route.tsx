import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

function sanitizeString(val: string | null, maxLen: number, fallback: string): string {
  if (!val) return fallback
  return val.slice(0, maxLen).trim()
}

function sanitizeNumber(val: string | null): number | null {
  if (!val) return null
  const n = parseInt(val, 10)
  if (isNaN(n) || n <= 0 || n > 100000) return null
  return n
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl

    const dest = sanitizeString(searchParams.get('dest'), 50, '')
    const country = sanitizeString(searchParams.get('country'), 50, '')
    const price = sanitizeNumber(searchParams.get('price'))
    const duration = sanitizeNumber(searchParams.get('duration'))
    const origin = sanitizeString(searchParams.get('origin'), 10, '')
    const flag = sanitizeString(searchParams.get('flag'), 4, '')

    if (!dest || !country) {
      return new Response('Missing required params: dest, country', { status: 400 })
    }

    // Scale font size based on destination name length
    const destFontSize = dest.length > 20 ? 48 : dest.length > 12 ? 56 : 64

    const hasDetails = price || duration || origin

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            background: 'linear-gradient(135deg, #0A1F44 0%, #071630 100%)',
            overflow: 'hidden',
          }}
        >
          {/* Dotted texture overlay */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              backgroundImage:
                'radial-gradient(circle, rgba(135,206,235,0.06) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* Top accent bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '5px',
              background: 'linear-gradient(90deg, #a855f7, #87CEEB)',
              display: 'flex',
            }}
          />

          {/* Top-left: Logo */}
          <div
            style={{
              position: 'absolute',
              top: '36px',
              left: '44px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#87CEEB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '14px',
                fontSize: '24px',
                fontWeight: 700,
                color: '#0a1628',
              }}
            >
              G
            </div>
            <div
              style={{
                fontSize: '26px',
                fontWeight: 700,
                color: '#87CEEB',
                display: 'flex',
              }}
            >
              GlobePilot
            </div>
          </div>

          {/* Top-right: Badge */}
          <div
            style={{
              position: 'absolute',
              top: '36px',
              right: '44px',
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(135, 206, 235, 0.12)',
              border: '1px solid rgba(135, 206, 235, 0.3)',
              borderRadius: '20px',
              padding: '8px 20px',
            }}
          >
            <div
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#87CEEB',
                display: 'flex',
              }}
            >
              Mystery Vacation Revealed!
            </div>
          </div>

          {/* Center content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              paddingTop: '40px',
            }}
          >
            {/* Destination name */}
            <div
              style={{
                fontSize: `${destFontSize}px`,
                fontWeight: 700,
                color: 'white',
                textAlign: 'center',
                lineHeight: 1.15,
                maxWidth: '1000px',
                display: 'flex',
                letterSpacing: '-1px',
              }}
            >
              {dest}
            </div>

            {/* Country name */}
            <div
              style={{
                fontSize: '24px',
                color: 'rgba(135, 206, 235, 0.85)',
                marginTop: '12px',
                display: 'flex',
                letterSpacing: '1px',
              }}
            >
              {country}
            </div>

            {/* Flag emoji */}
            {flag && (
              <div
                style={{
                  fontSize: '40px',
                  marginTop: '12px',
                  display: 'flex',
                }}
              >
                {flag}
              </div>
            )}
          </div>

          {/* Bottom section: trip details */}
          {hasDetails && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '40px',
                paddingBottom: '72px',
                paddingTop: '16px',
              }}
            >
              {duration && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '22px',
                      display: 'flex',
                    }}
                  >
                    🌙
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontWeight: 600,
                      display: 'flex',
                    }}
                  >
                    {duration} night{duration !== 1 ? 's' : ''}
                  </div>
                </div>
              )}

              {price && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '22px',
                      display: 'flex',
                    }}
                  >
                    💰
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontWeight: 600,
                      display: 'flex',
                    }}
                  >
                    ~${price} total
                  </div>
                </div>
              )}

              {origin && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '22px',
                      display: 'flex',
                    }}
                  >
                    ✈️
                  </div>
                  <div
                    style={{
                      fontSize: '20px',
                      color: 'rgba(255, 255, 255, 0.85)',
                      fontWeight: 600,
                      display: 'flex',
                    }}
                  >
                    from {origin}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom-right watermark */}
          <div
            style={{
              position: 'absolute',
              bottom: '28px',
              right: '44px',
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.35)',
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
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    )
  } catch (error) {
    console.error('[OG Mystery] Error:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
