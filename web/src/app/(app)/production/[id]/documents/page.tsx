import { ContentArea } from '@/components/layout/content-area'

export default function DocumentsPage() {
  return (
    <ContentArea>
      <div
        className="bg-white p-5"
        style={{ borderRadius: 4, boxShadow: 'var(--shadow-card)' }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Documents</h2>
        <p style={{ fontSize: 13, color: '#71717A', marginTop: 4 }}>
          Scripts, contracts, and production documents
        </p>
      </div>
    </ContentArea>
  )
}
