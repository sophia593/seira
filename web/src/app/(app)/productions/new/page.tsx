import { ContentArea } from '@/components/layout/content-area'

const FIELDS = ['Production Name', 'Type', 'Logline']

export default function NewProductionPage() {
  return (
    <ContentArea>
      <h1 style={{ fontSize: 20, fontWeight: 600 }} className="mb-6">New Production</h1>

      <div
        className="bg-white p-5"
        style={{ borderRadius: 4, boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex flex-col gap-5">
          {FIELDS.map((label) => (
            <div key={label}>
              <label
                className="block mb-1.5"
                style={{ fontSize: 12, fontWeight: 500, color: '#18181B' }}
              >
                {label}
              </label>
              <div
                className="h-10 flex items-center px-3 rounded border border-dashed border-[#E4E4E7]"
                style={{ fontSize: 13, color: '#A1A1AA' }}
              >
                Coming soon
              </div>
            </div>
          ))}
        </div>
      </div>
    </ContentArea>
  )
}
