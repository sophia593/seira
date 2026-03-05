'use client'

import { useParams } from 'next/navigation'
import { ContentArea } from '@/components/layout/content-area'

const PRODUCTIONS: Record<string, { name: string; status: string; statusColor: string }> = {
  '1': { name: 'Untitled Horror Short', status: 'Pre-Production', statusColor: '#F59E0B' },
  '2': { name: 'Senior Thesis Film', status: 'Production', statusColor: '#10B981' },
  '3': { name: 'Nike Commercial', status: 'Development', statusColor: '#3B82F6' },
}

const CARDS = ['Upcoming Shoot Days', 'Tasks', 'Crew']

export default function ProductionPage() {
  const { id } = useParams<{ id: string }>()
  const prod = PRODUCTIONS[id] ?? { name: `Production ${id}`, status: 'Unknown', statusColor: '#71717A' }

  return (
    <ContentArea>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>{prod.name}</h1>
        <span
          className="inline-flex items-center rounded"
          style={{
            fontSize: 12,
            color: prod.statusColor,
            backgroundColor: `${prod.statusColor}1F`,
            padding: '4px 8px',
            borderRadius: 4,
          }}
        >
          {prod.status}
        </span>
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
