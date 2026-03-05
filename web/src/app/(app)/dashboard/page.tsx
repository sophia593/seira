import Link from 'next/link'
import { ContentArea } from '@/components/layout/content-area'

const PRODUCTIONS = [
  { id: '1', name: 'Untitled Horror Short', status: 'Pre-Production', statusColor: '#F59E0B' },
  { id: '2', name: 'Senior Thesis Film', status: 'Production', statusColor: '#10B981' },
  { id: '3', name: 'Nike Commercial', status: 'Development', statusColor: '#3B82F6' },
]

export default function DashboardPage() {
  return (
    <ContentArea>
      <h1 style={{ fontSize: 20, fontWeight: 600 }} className="mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PRODUCTIONS.map((prod) => (
          <Link
            key={prod.id}
            href={`/production/${prod.id}`}
            className="block bg-white p-5 transition-all duration-150 ease hover:-translate-y-0.5"
            style={{
              borderRadius: 4,
              boxShadow: 'var(--shadow-card)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-card-hover)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'var(--shadow-card)'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{prod.name}</h2>
              <span
                className="inline-flex items-center"
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
            <p style={{ fontSize: 13, color: '#71717A' }}>5 shoot days · 2 call sheets</p>
          </Link>
        ))}
      </div>
    </ContentArea>
  )
}
