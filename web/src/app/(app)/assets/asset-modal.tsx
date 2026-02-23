'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { createAssetAction, updateAssetAction } from '@/app/(app)/actions/assets'
import { toast } from '@/components/ui/sonner'
import type { Asset } from '@/lib/types/database'

interface AssetModalProps {
  open: boolean
  onClose: () => void
  asset: Asset | null
}

export function AssetModal({ open, onClose, asset }: AssetModalProps) {
  const isEdit = !!asset
  const [isPending, startTransition] = useTransition()
  const nameRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      setName(asset?.name ?? '')
      setCapacity(asset?.capacity != null ? String(asset.capacity) : '')
      setNotes(asset?.notes ?? '')
      setTimeout(() => nameRef.current?.focus(), 100)
    }
  }, [open, asset])

  function handleClose() {
    onClose()
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error('Name is required')
      nameRef.current?.focus()
      return
    }

    if (capacity.trim() !== '') {
      const parsed = parseInt(capacity, 10)
      if (isNaN(parsed) || parsed < 0) {
        toast.error('Capacity must be a positive number or empty for unlimited')
        return
      }
    }

    const formData = new FormData()
    formData.set('name', name.trim())
    if (capacity.trim() !== '') formData.set('capacity', capacity.trim())
    if (notes.trim()) formData.set('notes', notes.trim())

    startTransition(async () => {
      const result = isEdit
        ? await updateAssetAction(asset!.id, formData)
        : await createAssetAction(formData)

      if (result.ok) {
        toast.success(isEdit ? 'Asset updated' : 'Asset added')
        handleClose()
      } else {
        toast.error(result.error ?? 'Something went wrong')
      }
    })
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Edit Asset' : 'Add Asset'}
      className="max-w-lg"
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !name.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-copper text-white text-sm font-medium rounded-lg hover:bg-copper/90 transition-colors disabled:opacity-50"
          >
            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? 'Save changes' : 'Add asset'}
          </button>
        </div>
      }
    >
      <form
        onSubmit={(e) => { e.preventDefault(); handleSubmit() }}
        className="space-y-4"
      >
        {/* Name */}
        <div>
          <label htmlFor="asset-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            ref={nameRef}
            id="asset-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. LED Ribbon"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper"
            autoComplete="off"
          />
        </div>

        {/* Capacity */}
        <div>
          <label htmlFor="asset-capacity" className="block text-sm font-medium text-gray-700 mb-1">
            Capacity
          </label>
          <input
            id="asset-capacity"
            type="number"
            min="0"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Leave empty for unlimited"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper"
          />
          <p className="text-xs text-gray-400 mt-1">
            Maximum number of this asset available. Leave empty for unlimited.
          </p>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="asset-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="asset-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Location, specifications, etc."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper resize-none"
          />
        </div>

        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
