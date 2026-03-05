import { ContentArea } from '@/components/layout/content-area'

export default function TasksPage() {
  return (
    <ContentArea>
      <div
        className="bg-white p-5"
        style={{ borderRadius: 4, boxShadow: 'var(--shadow-card)' }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 600 }}>Tasks</h2>
        <p style={{ fontSize: 13, color: '#71717A', marginTop: 4 }}>
          Track and assign production tasks
        </p>
      </div>
    </ContentArea>
  )
}
