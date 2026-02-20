import { generateOGImage, SIZE } from '@/lib/og'

export const size = SIZE
export const contentType = 'image/png'

export default function OGImage() {
  return generateOGImage(
    'seira',
    'Track deliverables. Collect proof. Send branded recaps.',
  )
}
