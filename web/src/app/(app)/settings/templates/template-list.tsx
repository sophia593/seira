'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Copy, Pencil, Trash2, FileText, Globe, Building2, Link2, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { deleteTemplateAction, duplicateTemplateAction, generateShareTokenAction, revokeShareTokenAction } from '@/app/(app)/actions/templates'
import { CATEGORY_CONFIG } from '@/lib/constants'
import type { Template, DeliverableCategory } from '@/lib/types/database'
import { TemplateDialog } from './template-dialog'

const INDUSTRY_LABEL: Record<string, string> = {
  sports: 'Sports',
  venue: 'Venue',
  festival: 'Festival',
  film: 'Film',
}

interface TemplateListProps {
  templates: Template[]
  orgId: string
  isManager: boolean
}

export function TemplateList({ templates, orgId, isManager }: TemplateListProps) {
  const router = useRouter()
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [isPending, startTransition] = useTransition()

  const globalTemplates = templates.filter((t) => t.org_id === null)
  const orgTemplates = templates.filter((t) => t.org_id !== null)

  function handleDelete(template: Template) {
    if (!confirm(`Delete "${template.name}"? This cannot be undone.`)) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set('template_id', template.id)
      const result = await deleteTemplateAction(formData)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete template')
      } else {
        toast.success('Template deleted')
        router.refresh()
      }
    })
  }

  function handleDuplicate(template: Template) {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('template_id', template.id)
      const result = await duplicateTemplateAction(formData)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to duplicate template')
      } else {
        toast.success('Template duplicated')
        router.refresh()
      }
    })
  }

  return (
    <>
      {/* Create button */}
      {isManager && (
        <div className="mb-6">
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-kurobeni text-white hover:bg-blackberry rounded-md"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New template
          </Button>
        </div>
      )}

      {/* Custom templates */}
      {orgTemplates.length > 0 && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
            <Building2 className="w-3 h-3" />
            Custom
          </p>
          <div className="space-y-3">
            {orgTemplates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                isManager={isManager}
                isGlobal={false}
                isPending={isPending}
                onEdit={() => setEditingTemplate(t)}
                onDelete={() => handleDelete(t)}
                onDuplicate={() => handleDuplicate(t)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Global templates */}
      {globalTemplates.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            Built-in
          </p>
          <div className="space-y-3">
            {globalTemplates.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                isManager={isManager}
                isGlobal={true}
                isPending={isPending}
                onDuplicate={() => handleDuplicate(t)}
              />
            ))}
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <div className="border border-dashed border-gray-200 rounded-xl py-12 flex flex-col items-center justify-center">
          <FileText className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No templates yet</p>
          {isManager && (
            <Button
              onClick={() => setShowCreate(true)}
              variant="ghost"
              size="sm"
              className="mt-2"
            >
              Create your first template
            </Button>
          )}
        </div>
      )}

      {/* Create/Edit dialog */}
      {(showCreate || editingTemplate) && (
        <TemplateDialog
          template={editingTemplate ?? undefined}
          open={true}
          onClose={() => {
            setShowCreate(false)
            setEditingTemplate(null)
          }}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Template card
// ---------------------------------------------------------------------------

function TemplateCard({
  template,
  isManager,
  isGlobal,
  isPending,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  template: Template
  isManager: boolean
  isGlobal: boolean
  isPending: boolean
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
}) {
  const categories = [...new Set(template.deliverables.map((d) => d.category))]

  return (
    <div className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {/* Name + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-medium text-gray-900">{template.name}</h3>
            {template.industry && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                {INDUSTRY_LABEL[template.industry] ?? template.industry}
              </span>
            )}
          </div>

          {/* Stats */}
          <p className="text-xs text-gray-400 mt-1">
            {template.deliverables.length} deliverable{template.deliverables.length !== 1 ? 's' : ''}
          </p>

          {/* Category chips */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {categories.map((cat) => {
              const config = CATEGORY_CONFIG[cat as DeliverableCategory]
              return (
                <span
                  key={cat}
                  className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${config?.bgColor ?? 'bg-gray-100'} ${config?.color ?? 'text-gray-600'}`}
                >
                  {config?.icon && <span className="text-[10px]">{config.icon}</span>}
                  {config?.label ?? cat}
                </span>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        {isManager && (
          <div className="flex items-center gap-1 shrink-0">
            {onDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDuplicate}
                disabled={isPending}
                className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                title={isGlobal ? 'Duplicate to custom' : 'Duplicate'}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            )}
            {!isGlobal && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                disabled={isPending}
                className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600"
                title="Edit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
            )}
            {!isGlobal && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={isPending}
                className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Share link */}
      {!isGlobal && isManager && (
        <ShareButton template={template} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Share button
// ---------------------------------------------------------------------------

function ShareButton({ template }: { template: Template }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const shareUrl = template.share_token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/templates/shared/${template.share_token}`
    : null

  function handleGenerate() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('template_id', template.id)
      const result = await generateShareTokenAction(fd)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to generate link')
        return
      }
      toast.success('Share link created')
      router.refresh()
    })
  }

  function handleRevoke() {
    if (!confirm('Revoke the share link? Anyone with the current link will no longer be able to import.')) return
    startTransition(async () => {
      const fd = new FormData()
      fd.set('template_id', template.id)
      const result = await revokeShareTokenAction(fd)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to revoke link')
        return
      }
      toast.success('Share link revoked')
      router.refresh()
    })
  }

  function handleCopy() {
    if (!shareUrl) return
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    toast.success('Link copied')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!shareUrl) {
    return (
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isPending}
        className="mt-2 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
      >
        <Link2 className="w-3 h-3" />
        {isPending ? 'Creating...' : 'Create share link'}
      </button>
    )
  }

  return (
    <div className="mt-2 flex items-center gap-1.5 bg-gray-50 rounded-lg px-2.5 py-1.5">
      <Link2 className="w-3 h-3 text-gray-400 shrink-0" />
      <span className="text-xs text-gray-500 truncate flex-1 font-mono">{shareUrl}</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600 shrink-0"
        title="Copy link"
      >
        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleRevoke}
        disabled={isPending}
        className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 shrink-0"
        title="Revoke link"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  )
}
