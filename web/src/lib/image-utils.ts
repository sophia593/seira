/**
 * Supabase Storage image transformation utilities.
 * Appends resize/quality params to storage URLs for server-side transforms.
 *
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */

export function supabaseImageUrl(
  url: string,
  opts: { width: number; height?: number; resize?: 'cover' | 'contain' | 'fill'; quality?: number },
): string {
  if (!url.includes('.supabase.co/storage/')) return url

  try {
    const u = new URL(url)
    // Supabase transforms use /render/image/ instead of /object/
    u.pathname = u.pathname.replace(
      '/storage/v1/object/public/',
      '/storage/v1/render/image/public/',
    )
    u.searchParams.set('width', String(opts.width))
    if (opts.height) u.searchParams.set('height', String(opts.height))
    if (opts.resize) u.searchParams.set('resize', opts.resize)
    if (opts.quality) u.searchParams.set('quality', String(opts.quality))
    return u.toString()
  } catch {
    // If URL parsing fails (e.g. data: URIs), return as-is
    return url
  }
}
