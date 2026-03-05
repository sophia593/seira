'use client'

import { cn } from '@/lib/utils'

interface ContentAreaProps {
  children: React.ReactNode
  className?: string
}

export function ContentArea({ children, className }: ContentAreaProps) {
  return (
    <div className={cn('max-w-[1200px] mx-auto px-8 pt-6 pb-12 animate-content-in', className)}>
      {children}
    </div>
  )
}
