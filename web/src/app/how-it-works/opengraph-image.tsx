import { generateOGImage, SIZE } from '@/lib/og'

export const size = SIZE
export const contentType = 'image/png'

export default function OGImage() {
  return generateOGImage(
    'How It Works',
    'From setup to recap in four steps.',
  )
}
