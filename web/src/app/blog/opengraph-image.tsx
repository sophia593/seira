import { generateOGImage, SIZE } from '@/lib/og'

export const size = SIZE
export const contentType = 'image/png'

export default function OGImage() {
  return generateOGImage(
    'Seira Blog',
    'Insights and guides for sponsorship teams.',
  )
}
