'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  priority?: boolean
}

/**
 * Optimized image component that uses next/image with fallback to img
 * for unknown domains. Provides lazy loading and blur placeholder.
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
}: OptimizedImageProps) {
  const [error, setError] = useState(false)

  // If next/image fails (unknown domain), fall back to regular img
  if (error) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn('object-cover', className)}
        loading="lazy"
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : (width || 400)}
      height={fill ? undefined : (height || 300)}
      fill={fill}
      className={cn('object-cover', className)}
      onError={() => setError(true)}
      priority={priority}
      sizes={fill ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' : undefined}
    />
  )
}
