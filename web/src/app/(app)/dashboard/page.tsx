import Link from 'next/link'
import { ContentArea } from '@/components/layout/content-area'
import { Badge } from '@/components/ui/badge'
import { TEST_PRODUCTIONS } from '@/lib/constants/test-productions'

export default function DashboardPage() {
  return (
    <ContentArea>
      <h1 style={{ fontSize: 20, fontWeight: 600 }} className="mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TEST_PRODUCTIONS.map((prod) => (
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
              <Badge type="status" value={prod.status} />
            </div>
            <p style={{ fontSize: 13, color: '#71717A' }}>5 shoot days · 2 call sheets</p>
          </Link>
        ))}
      </div>
    </ContentArea>
  )
}
