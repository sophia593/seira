import { generateOGImage, SIZE } from '@/lib/og'

export const size = SIZE
export const contentType = 'image/png'

export default function OGImage() {
  return generateOGImage(
    'Sample Recap Report',
    'See what a seira sponsorship recap looks like.',
  )
}
