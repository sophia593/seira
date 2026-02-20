import { generateOGImage, SIZE } from '@/lib/og'

export const size = SIZE
export const contentType = 'image/png'

export default function OGImage() {
  return generateOGImage(
    'Privacy Policy',
    'How Seira collects, uses, and protects your information.',
  )
}
