'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { TALENT_TYPE_CONFIG, TALENT_TYPES } from '@/lib/constants'
import { createTalentAction, updateTalentAction } from '@/app/(app)/actions/talent'
import { toast } from '@/components/ui/sonner'
import type { Talent, TalentType } from '@/lib/types/database'

interface TalentModalProps {
  open: boolean
  onClose: () => void
  talent: Talent | null
}

export function TalentModal({ open, onClose, talent }: TalentModalProps) {
  const isEdit = !!talent
  const [isPending, startTransition] = useTransition()
  const nameRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [type, setType] = useState<TalentType>('player')
  const [affiliation, setAffiliation] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')

  // Sync form state whenever modal opens or talent changes
  useEffect(() => {
    if (open) {
      setName(talent?.name ?? '')
      setType(talent?.type ?? 'player')
      setAffiliation(talent?.affiliation ?? '')
      setContactName(talent?.contact_name ?? '')
      setContactEmail(talent?.contact_email ?? '')
      setNotes(talent?.notes ?? '')
      setPhotoUrl(talent?.photo_url ?? '')
      // Auto-focus name field
      setTimeout(() => nameRef.current?.focus(), 100)
    }
  }, [open, talent])

  function handleClose() {
    onClose()
  }

  function handleSubmit() {
    if (!name.trim()) {
      toast.error('Name is required')
      nameRef.current?.focus()
      return
    }

    const formData = new FormData()
    formData.set('name', name.trim())
    formData.set('type', type)
    if (affiliation.trim()) formData.set('affiliation', affiliation.trim())
    if (contactName.trim()) formData.set('contact_name', contactName.trim())
    if (contactEmail.trim()) formData.set('contact_email', contactEmail.trim())
    if (notes.trim()) formData.set('notes', notes.trim())
    if (photoUrl.trim()) formData.set('photo_url', photoUrl.trim())

    startTransition(async () => {
      const result = isEdit
        ? await updateTalentAction(talent!.id, formData)
        : await createTalentAction(formData)

      if (result.ok) {
        toast.success(isEdit ? 'Talent updated' : 'Talent added')
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
      title={isEdit ? 'Edit Talent' : 'Add Talent'}
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
            {isEdit ? 'Save changes' : 'Add talent'}
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
          <label htmlFor="talent-name" className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            ref={nameRef}
            id="talent-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Jane Smith"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper"
            autoComplete="off"
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Type <span className="text-red-400">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {TALENT_TYPES.map((t) => {
              const cfg = TALENT_TYPE_CONFIG[t]
              const selected = type === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-all ${
                    selected
                      ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor} border shadow-sm`
                      : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span>{cfg.icon}</span>
                  <span className="font-medium">{cfg.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Affiliation */}
        <div>
          <label htmlFor="talent-affiliation" className="block text-sm font-medium text-gray-700 mb-1">
            Affiliation
          </label>
          <input
            id="talent-affiliation"
            type="text"
            value={affiliation}
            onChange={(e) => setAffiliation(e.target.value)}
            placeholder="e.g. Lakers, Universal Music, TikTok"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper"
          />
        </div>

        {/* Contact name + email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="talent-contact-name" className="block text-sm font-medium text-gray-700 mb-1">
              Contact name
            </label>
            <input
              id="talent-contact-name"
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Agent or manager"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper"
            />
          </div>
          <div>
            <label htmlFor="talent-contact-email" className="block text-sm font-medium text-gray-700 mb-1">
              Contact email
            </label>
            <input
              id="talent-contact-email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="agent@example.com"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper"
            />
          </div>
        </div>

        {/* Photo URL */}
        <div>
          <label htmlFor="talent-photo" className="block text-sm font-medium text-gray-700 mb-1">
            Photo URL
          </label>
          <div className="flex gap-3 items-start">
            <input
              id="talent-photo"
              type="url"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper"
            />
            {photoUrl && (
              <img
                src={photoUrl}
                alt="Preview"
                className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-gray-100"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="talent-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="talent-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Availability, special requirements, etc."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-copper/30 focus:border-copper resize-none"
          />
        </div>

        {/* Hidden submit for Enter key */}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
