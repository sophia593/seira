import { generateOGImage, SIZE } from '@/lib/og'

export const size = SIZE
export const contentType = 'image/png'

export default function OGImage() {
  return generateOGImage(
    'Simple Pricing for Every Team',
    '$190/mo — unlimited events, partners, and deliverables.',
  )
}
