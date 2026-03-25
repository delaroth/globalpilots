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

    const dest = sanitizeString(searchParams.get('dest'), 50, 'Mystery Destination')
    const country = sanitizeString(searchParams.get('country'), 50, 'Somewhere Amazing')
    const price = sanitizeNumber(searchParams.get('price'))
    const duration = sanitizeNumber(searchParams.get('duration'))
    const origin = sanitizeString(searchParams.get('origin'), 10, '')
    const flag = sanitizeString(searchParams.get('flag'), 4, '')

    // Scale font size for vertical layout — more room so we go bigger
    const destFontSize = dest.length > 20 ? 56 : dest.length > 12 ? 72 : 88

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            background: 'linear-gradient(180deg, #0A1F44 0%, #071630 60%, #050e20 100%)',
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
                'radial-gradient(circle, rgba(135,206,235,0.05) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* Top accent bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #a855f7, #87CEEB)',
              display: 'flex',
            }}
          />

          {/* Decorative glow behind destination */}
          <div
            style={{
              position: 'absolute',
              top: '35%',
              left: '50%',
              width: '600px',
              height: '600px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(135,206,235,0.08) 0%, transparent 70%)',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
            }}
          />

          {/* Top section: Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingTop: '80px',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#87CEEB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '16px',
                fontSize: '28px',
                fontWeight: 700,
                color: '#0a1628',
              }}
            >
              G
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 700,
                color: '#87CEEB',
                display: 'flex',
              }}
            >
              GlobePilot
            </div>
          </div>

          {/* "Mystery Vacation Revealed" badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '40px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(168, 85, 247, 0.15)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '24px',
                padding: '10px 28px',
              }}
            >
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#c084fc',
                  display: 'flex',
                }}
              >
                Mystery Vacation Revealed!
              </div>
            </div>
          </div>

          {/* Center content area */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              padding: '0 60px',
            }}
          >
            {/* "I got surprised with..." */}
            <div
              style={{
                fontSize: '24px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginBottom: '24px',
                display: 'flex',
                letterSpacing: '2px',
                textTransform: 'uppercase',
              }}
            >
              I got surprised with...
            </div>

            {/* Destination name — large and dramatic */}
            <div
              style={{
                fontSize: `${destFontSize}px`,
                fontWeight: 700,
                color: 'white',
                textAlign: 'center',
                lineHeight: 1.1,
                maxWidth: '900px',
                display: 'flex',
                letterSpacing: '-2px',
              }}
            >
              {dest}
            </div>

            {/* Country */}
            <div
              style={{
                fontSize: '28px',
                color: 'rgba(135, 206, 235, 0.85)',
                marginTop: '16px',
                display: 'flex',
                letterSpacing: '2px',
              }}
            >
              {country}
            </div>

            {/* Flag */}
            {flag && (
              <div
                style={{
                  fontSize: '52px',
                  marginTop: '16px',
                  display: 'flex',
                }}
              >
                {flag}
              </div>
            )}

            {/* Trip details */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                marginTop: '48px',
              }}
            >
              {duration && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div style={{ fontSize: '26px', display: 'flex' }}>🌙</div>
                  <div
                    style={{
                      fontSize: '24px',
                      color: 'rgba(255, 255, 255, 0.8)',
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
                    gap: '12px',
                  }}
                >
                  <div style={{ fontSize: '26px', display: 'flex' }}>💰</div>
                  <div
                    style={{
                      fontSize: '24px',
                      color: 'rgba(255, 255, 255, 0.8)',
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
                    gap: '12px',
                  }}
                >
                  <div style={{ fontSize: '26px', display: 'flex' }}>✈️</div>
                  <div
                    style={{
                      fontSize: '24px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontWeight: 600,
                      display: 'flex',
                    }}
                  >
                    from {origin}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom CTA section */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingBottom: '80px',
              gap: '16px',
            }}
          >
            {/* Divider line */}
            <div
              style={{
                width: '200px',
                height: '1px',
                background: 'rgba(135, 206, 235, 0.2)',
                marginBottom: '12px',
                display: 'flex',
              }}
            />

            <div
              style={{
                fontSize: '20px',
                color: 'rgba(255, 255, 255, 0.5)',
                display: 'flex',
              }}
            >
              Plan yours at
            </div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#87CEEB',
                display: 'flex',
                letterSpacing: '1px',
              }}
            >
              globepilots.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1920,
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    )
  } catch (error) {
    console.error('[OG Mystery Card] Error:', error)
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(180deg, #0A1F44 0%, #071630 60%, #050e20 100%)',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 700,
              color: 'white',
              display: 'flex',
            }}
          >
            Mystery Destination
          </div>
          <div
            style={{
              fontSize: '28px',
              color: '#87CEEB',
              marginTop: '24px',
              display: 'flex',
            }}
          >
            globepilots.com
          </div>
        </div>
      ),
      { width: 1080, height: 1920 }
    )
  }
}
