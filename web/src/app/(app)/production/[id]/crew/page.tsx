import { ContentArea } from '@/components/layout/content-area'

export default function CrewPage() {
  return (
    <ContentArea>
      <div
        className="bg-white p-5"
        style={{ borderRadius: 4, boxShadow: 'var(--shadow-card)' }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Crew</h2>
        <p style={{ fontSize: 13, color: '#71717A', marginTop: 4 }}>
          Manage crew members and roles
        </p>
      </div>
    </ContentArea>
  )
}
