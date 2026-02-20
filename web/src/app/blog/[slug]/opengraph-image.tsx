import { generateOGImage, SIZE } from '@/lib/og'
import { getPostBySlug } from '@/lib/blog'

export const size = SIZE
export const contentType = 'image/png'

export default async function OGImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  return generateOGImage(
    post?.title ?? 'Blog Post',
    post ? 'seira blog' : undefined,
  )
}
