'use client'

import { useParams } from 'next/navigation'
import { ContentArea } from '@/components/layout/content-area'
import { Badge } from '@/components/ui/badge'
import { getProductionById } from '@/lib/constants/test-productions'

const CARDS = ['Upcoming Shoot Days', 'Tasks', 'Crew']

export default function ProductionPage() {
  const { id } = useParams<{ id: string }>()
  const prod = getProductionById(id) ?? { name: `Production ${id}`, status: 'unknown' }

  return (
    <ContentArea>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>{prod.name}</h1>
        <Badge type="status" value={prod.status} />
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CARDS.map((title) => (
          <div
            key={title}
            className="bg-white p-5"
            style={{
              borderRadius: 4,
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h2>
          </div>
        ))}
      </div>
    </ContentArea>
  )
}
