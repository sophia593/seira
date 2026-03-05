import { ContentArea } from '@/components/layout/content-area'

const SECTIONS = [
  { title: 'Profile', description: 'Manage your profile and preferences' },
  { title: 'Account', description: 'Account settings and security' },
]

export default function SettingsPage() {
  return (
    <ContentArea>
      <h1 style={{ fontSize: 20, fontWeight: 600 }} className="mb-6">Settings</h1>

      <div className="flex flex-col gap-4">
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className="bg-white p-5"
            style={{ borderRadius: 4, boxShadow: 'var(--shadow-card)' }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 600 }}>{section.title}</h2>
            <p style={{ fontSize: 13, color: '#71717A', marginTop: 4 }}>{section.description}</p>
          </div>
        ))}
      </div>
    </ContentArea>
  )
}
