import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 36,
          background: '#281822',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width="110"
          height="110"
          viewBox="0 0 110 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="55" cy="55" r="45" stroke="#C59C79" strokeWidth="5" />
          <ellipse cx="55" cy="55" rx="20" ry="45" stroke="#C59C79" strokeWidth="5" />
          <line x1="10" y1="55" x2="100" y2="55" stroke="#C59C79" strokeWidth="5" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
