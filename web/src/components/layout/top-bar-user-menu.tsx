'use client'

import { useState, useRef, useEffect } from 'react'

const ITEMS = [
  { label: 'Profile', destructive: false },
  { label: 'Preferences', destructive: false },
  { label: 'Sign Out', destructive: true },
]

export function TopBarUserMenu() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-full cursor-pointer"
        style={{
          width: 32,
          height: 32,
          backgroundColor: '#6366F1',
          fontSize: 13,
          fontWeight: 600,
          color: '#FFFFFF',
        }}
        aria-label="User menu"
      >
        SO
      </button>

      {open && (
        <div
          className="absolute right-0"
          style={{
            top: 'calc(100% + 8px)',
            width: 200,
            backgroundColor: '#FFFFFF',
            borderRadius: 4,
            boxShadow: 'var(--shadow-dropdown)',
            border: '1px solid var(--seira-border)',
            zIndex: 50,
          }}
        >
          {ITEMS.map((item) => (
            <button
              key={item.label}
              className="block w-full text-left transition-colors duration-150 hover:bg-[#F4F4F5] cursor-pointer"
              style={{
                padding: '8px 12px',
                fontSize: 13,
                color: item.destructive ? '#E5484D' : '#18181B',
              }}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
