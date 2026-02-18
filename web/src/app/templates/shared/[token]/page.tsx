import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { CATEGORY_CONFIG } from '@/lib/constants'
import { ImportTemplateButton } from './import-button'
import type { Template, DeliverableCategory } from '@/lib/types/database'

interface SharedTemplatePageProps {
  params: Promise<{ token: string }>
}

export default async function SharedTemplatePage({ params }: SharedTemplatePageProps) {
  const { token } = await params

  // Fetch template via admin client (public page, no auth required)
  const admin = createAdminClient()
  const { data: template, error } = await admin
    .from('templates')
    .select('*')
    .eq('share_token', token)
    .single()

  if (error || !template) {
    notFound()
  }

  const t = template as Template

  // Check if user is logged in
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {/* Header */}
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Shared Template</p>
          <h1 className="text-xl font-semibold text-gray-900">{t.name}</h1>
          {t.industry && (
            <span className="inline-block mt-1.5 text-xs uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              {t.industry}
            </span>
          )}
        </div>

        {/* Deliverables preview */}
        <div className="mb-6">
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
            {t.deliverables.length} Deliverable{t.deliverables.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2.5">
            {t.deliverables.map((d, i) => {
              const config = CATEGORY_CONFIG[d.category as DeliverableCategory]
              return (
                <div key={i} className="flex items-start gap-2">
                  <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${config?.bgColor ?? 'bg-gray-100'} ${config?.color ?? 'text-gray-600'}`}>
                    {config?.icon} {config?.label ?? d.category}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700">{d.title}</p>
                    {d.notes && <p className="text-xs text-gray-400 mt-0.5">{d.notes}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Import action */}
        {user ? (
          <ImportTemplateButton shareToken={token} />
        ) : (
          <a
            href={`/login?redirect=/templates/shared/${token}`}
            className="block w-full text-center bg-kurobeni text-white rounded-md py-2.5 text-sm font-medium hover:bg-blackberry transition-colors"
          >
            Log in to import this template
          </a>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          Importing creates a copy in your workspace.
        </p>
      </div>
    </div>
  )
}
