'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/components/ui/sonner'
import { updateApprovalCategoriesAction } from '@/app/(app)/actions/settings'
import { CATEGORIES, CATEGORY_CONFIG } from '@/lib/constants'
import type { DeliverableCategory } from '@/lib/types/database'

const DEFAULT_CATEGORIES: DeliverableCategory[] = ['talent']

interface ApprovalCategoryFormProps {
  currentCategories?: DeliverableCategory[]
}

export function ApprovalCategoryForm({ currentCategories }: ApprovalCategoryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<Set<DeliverableCategory>>(
    new Set(currentCategories ?? DEFAULT_CATEGORIES)
  )

  const toggle = (cat: DeliverableCategory) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) {
        next.delete(cat)
      } else {
        next.add(cat)
      }
      return next
    })
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateApprovalCategoriesAction(Array.from(selected))
      if (result.ok) {
        toast.success('Approval settings saved')
        router.refresh()
      } else {
        toast.error(result.error ?? 'Failed to save')
      }
    })
  }

  const hasChanged =
    selected.size !== (currentCategories ?? DEFAULT_CATEGORIES).length ||
    !Array.from(selected).every((c) => (currentCategories ?? DEFAULT_CATEGORIES).includes(c))

  return (
    <div>
      <div className="space-y-2">
        {CATEGORIES.map((cat) => {
          const config = CATEGORY_CONFIG[cat]
          return (
            <label
              key={cat}
              className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.has(cat)}
                onChange={() => toggle(cat)}
                className="rounded border-gray-300 text-copper focus:ring-copper"
              />
              <span className="text-sm font-medium text-gray-900">{config.label}</span>
              <span className="text-xs text-gray-400">{config.description}</span>
            </label>
          )
        })}
      </div>
      {selected.size === 0 && (
        <p className="text-xs text-amber-600 mt-2">
          No categories selected — all deliverables will auto-advance to proved on proof upload.
        </p>
      )}
      {hasChanged && (
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-white bg-kurobeni hover:bg-blackberry rounded-md px-4 py-2 transition-colors disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      )}
    </div>
  )
}
