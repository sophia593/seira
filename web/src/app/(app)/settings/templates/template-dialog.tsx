'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { toast } from '@/components/ui/sonner'
import { createTemplateAction, updateTemplateAction } from '@/app/(app)/actions/templates'
import { CATEGORY_CONFIG } from '@/lib/constants'
import type { Template, DeliverableCategory, ProofRequired, TemplateDeliverable } from '@/lib/types/database'

const CATEGORIES: DeliverableCategory[] = ['in-venue', 'digital', 'hospitality', 'signage', 'talent', 'content']
const PROOF_TYPES: { value: ProofRequired; label: string }[] = [
  { value: 'photo', label: 'Photo' },
  { value: 'screenshot', label: 'Screenshot' },
  { value: 'file', label: 'File' },
  { value: 'link', label: 'Link' },
  { value: 'multiple', label: 'Multiple' },
]
const INDUSTRY_SUGGESTIONS = ['Sports', 'Venue', 'Festival', 'Film', 'Music', 'Tech Conference', 'Nonprofit', 'Corporate']

interface TemplateDialogProps {
  template?: Template
  open: boolean
  onClose: () => void
}

function emptyDeliverable(): TemplateDeliverable {
  return { title: '', category: 'in-venue', proof_required: 'photo' }
}

export function TemplateDialog({ template, open, onClose }: TemplateDialogProps) {
  const router = useRouter()
  const isEditing = !!template
  const [name, setName] = useState(template?.name ?? '')
  const [industry, setIndustry] = useState(template?.industry ?? '')
  const [deliverables, setDeliverables] = useState<TemplateDeliverable[]>(
    template?.deliverables?.length ? [...template.deliverables] : [emptyDeliverable()]
  )
  const [isPending, startTransition] = useTransition()

  function addRow() {
    setDeliverables([...deliverables, emptyDeliverable()])
  }

  function removeRow(index: number) {
    setDeliverables(deliverables.filter((_, i) => i !== index))
  }

  function updateRow(index: number, field: keyof TemplateDeliverable, value: string) {
    setDeliverables(
      deliverables.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validDeliverables = deliverables.filter((d) => d.title.trim())
    if (!name.trim()) {
      toast.error('Template name is required')
      return
    }
    if (validDeliverables.length === 0) {
      toast.error('Add at least one deliverable')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('name', name.trim())
      if (industry) formData.set('industry', industry)
      formData.set('deliverables', JSON.stringify(validDeliverables))

      let result: { ok: boolean; error?: string }

      if (isEditing) {
        formData.set('template_id', template!.id)
        result = await updateTemplateAction(formData)
      } else {
        result = await createTemplateAction(formData)
      }

      if (!result.ok) {
        toast.error(result.error ?? `Failed to ${isEditing ? 'update' : 'create'} template`)
        return
      }

      toast.success(isEditing ? 'Template updated' : 'Template created')
      router.refresh()
      onClose()
    })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit template' : 'New template'}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name + Industry */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Premium Sponsor Package"
              required
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wider block mb-1.5">
              Industry <span className="text-gray-400 font-normal normal-case">(optional)</span>
            </label>
            <Input
              list="industry-suggestions"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Sports, Tech, Nonprofit"
              maxLength={60}
            />
            <datalist id="industry-suggestions">
              {INDUSTRY_SUGGESTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Deliverables */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-gray-500 uppercase tracking-wider">
              Deliverables ({deliverables.length})
            </label>
            <Button type="button" variant="ghost" size="sm" onClick={addRow} className="h-6 text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Add row
            </Button>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto">
            {deliverables.map((d, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center gap-2">
                  {/* Title */}
                  <Input
                    value={d.title}
                    onChange={(e) => updateRow(i, 'title', e.target.value)}
                    placeholder="Deliverable title"
                    className="flex-1 h-8 text-sm"
                  />
                  {/* Category */}
                  <select
                    value={d.category}
                    onChange={(e) => updateRow(i, 'category', e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs w-28"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_CONFIG[cat]?.icon} {CATEGORY_CONFIG[cat]?.label ?? cat}
                      </option>
                    ))}
                  </select>
                  {/* Proof type */}
                  <select
                    value={d.proof_required}
                    onChange={(e) => updateRow(i, 'proof_required', e.target.value)}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs w-24"
                  >
                    {PROOF_TYPES.map((pt) => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                  {/* Remove */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(i)}
                    disabled={deliverables.length <= 1}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {/* Notes */}
                <Input
                  value={d.notes ?? ''}
                  onChange={(e) => updateRow(i, 'notes', e.target.value)}
                  placeholder="Notes (optional)"
                  className="h-7 text-xs text-gray-500 border-dashed ml-0.5"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="bg-kurobeni text-white hover:bg-blackberry"
          >
            {isPending ? 'Saving...' : isEditing ? 'Save changes' : 'Create template'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
