import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#281822',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="11" cy="11" r="9" stroke="#C59C79" strokeWidth="1.5" />
          <ellipse cx="11" cy="11" rx="4" ry="9" stroke="#C59C79" strokeWidth="1.5" />
          <line x1="2" y1="11" x2="20" y2="11" stroke="#C59C79" strokeWidth="1.5" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
