'use client'

import { cn } from '@/lib/utils'

export interface SortOption<T extends string> {
  value: T
  label: string
}

interface SortControlProps<T extends string> {
  options: SortOption<T>[]
  value: T
  onChange: (value: T) => void
}

export function SortControl<T extends string>({ options, value, onChange }: SortControlProps<T>) {
  return (
    <div className="flex items-center gap-1 print:hidden">
      <span className="text-[10px] text-gray-500 mr-1">Sort:</span>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'text-xs px-2 py-1 rounded-md transition-colors',
            value === opt.value ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
