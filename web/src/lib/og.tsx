import { ImageResponse } from 'next/og'

const SIZE = { width: 1200, height: 630 }

export { SIZE }

export function generateOGImage(title: string, subtitle?: string) {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#281822',
          padding: '60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Copper gradient accent — top-right corner */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background:
              'radial-gradient(circle, rgba(197,156,121,0.25) 0%, rgba(197,156,121,0) 70%)',
          }}
        />

        {/* Top: wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: 'white',
              letterSpacing: '-0.02em',
            }}
          >
            seira
          </span>
        </div>

        {/* Center: title + subtitle */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: '12px',
          }}
        >
          <div
            style={{
              fontSize: title.length > 40 ? '40px' : '48px',
              fontWeight: 700,
              color: 'white',
              textAlign: 'center',
              lineHeight: 1.15,
              maxWidth: '900px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: '22px',
                color: 'rgba(255,255,255,0.55)',
                textAlign: 'center',
                maxWidth: '700px',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>

        {/* Bottom: copper line + label */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              width: '120px',
              height: '2px',
              backgroundColor: '#C59C79',
            }}
          />
          <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.4)' }}>
            Commercial Ops for Live Entertainment
          </div>
        </div>
      </div>
    ),
    { ...SIZE },
  )
}
