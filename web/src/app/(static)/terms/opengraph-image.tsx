import { generateOGImage, SIZE } from '@/lib/og'

export const size = SIZE
export const contentType = 'image/png'

export default function OGImage() {
  return generateOGImage(
    'Terms of Service',
    'Terms and conditions for using Seira.',
  )
}
