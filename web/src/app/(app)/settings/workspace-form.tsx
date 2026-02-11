'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { renameWorkspaceAction } from '@/app/(app)/actions/workspace'

interface WorkspaceFormProps {
  orgName: string
  canRename: boolean
}

export function WorkspaceForm({ orgName, canRename }: WorkspaceFormProps) {
  const router = useRouter()
  const [name, setName] = useState(orgName)
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = useMemo(() => name.trim() !== orgName.trim(), [name, orgName])

  async function handleSave() {
    if (!isDirty || !canRename) return

    setIsSaving(true)
    try {
      const formData = new FormData()
      formData.set('name', name.trim())

      const result = await renameWorkspaceAction(formData)

      if (!result.ok) {
        toast.error(result.error ?? 'Failed to rename workspace')
        return
      }

      toast.success('Workspace renamed')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-1.5">
          <label htmlFor="workspace-name" className="text-xs text-gray-500 uppercase tracking-wider">
            Workspace name
          </label>
          <Input
            id="workspace-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Workspace"
            disabled={!canRename || isSaving}
            maxLength={60}
          />
        </div>
        {canRename && (
          <Button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className="bg-gray-900 text-white hover:bg-gray-800 rounded-md"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        )}
      </div>
      {!canRename && (
        <p className="text-xs text-gray-500">
          Only owners and admins can rename the workspace.
        </p>
      )}
    </div>
  )
}
