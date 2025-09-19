import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const WIDTH = 1200
const HEIGHT = 630

const clampText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value
  }

  return `${value.slice(0, maxLength - 1)}…`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = clampText(searchParams.get('title')?.trim() || 'UiQ Community', 90)
  const category = clampText(searchParams.get('category')?.trim() || 'Community Platform', 60)
  const type = clampText(searchParams.get('type')?.trim() || 'website', 32)

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(135deg, #7f1d1d, #dc2626 55%, #f87171)',
            color: '#fef2f2',
            padding: '64px',
            fontFamily: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '32px',
                fontWeight: 700
              }}
            >
              <span
                style={{
                  backgroundColor: '#fef2f2',
                  color: '#b91c1c',
                  borderRadius: '16px',
                  padding: '6px 16px'
                }}
              >
                UiQ
              </span>
              <span>Community</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '4px',
                fontSize: '20px',
                fontWeight: 600
              }}
            >
              <span style={{ opacity: 0.85 }}>{category}</span>
              <span style={{ fontSize: '16px', opacity: 0.7 }}>{type.toUpperCase()}</span>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <h1
              style={{
                fontSize: '64px',
                lineHeight: 1.1,
                fontWeight: 700,
                maxWidth: '900px',
                margin: 0
              }}
            >
              {title}
            </h1>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '20px',
              fontWeight: 500,
              color: '#fee2e2'
            }}
          >
            <span>Ugandans in Queensland</span>
            <span>uiq-community.com</span>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT
      }
    )
  } catch (error) {
    console.error('Failed to generate OG image', error)
    const fallbackSvg = `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#7f1d1d" />
            <stop offset="55%" stop-color="#dc2626" />
            <stop offset="100%" stop-color="#f87171" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#gradient)" />
        <text x="60" y="120" font-size="48" font-family="Inter, Helvetica, Arial, sans-serif" fill="#fee2e2" font-weight="700">UiQ Community</text>
        <text x="60" y="220" font-size="36" font-family="Inter, Helvetica, Arial, sans-serif" fill="#fef2f2" font-weight="600">${category}</text>
        <text x="60" y="320" font-size="72" font-family="Inter, Helvetica, Arial, sans-serif" fill="#ffffff" font-weight="700">${title}</text>
      </svg>`

    return new Response(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400'
      }
    })
  }
}
