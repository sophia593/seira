'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/components/ui/sonner'
import { deleteWorkspaceAction, transferOwnershipAction } from '@/app/(app)/actions/workspace'

interface DangerZoneProps {
  orgName: string
  admins: { user_id: string; name: string | null; email: string }[]
}

export function DangerZone({ orgName, admins }: DangerZoneProps) {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [selectedAdmin, setSelectedAdmin] = useState('')
  const [isPending, startTransition] = useTransition()

  const canConfirmDelete = confirmName.trim() === orgName

  function handleDelete() {
    startTransition(async () => {
      const formData = new FormData()
      formData.set('confirm_name', confirmName.trim())
      const result = await deleteWorkspaceAction(formData)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to delete workspace')
        return
      }
      toast.success('Workspace deleted')
      router.push('/login')
    })
  }

  function handleTransfer() {
    if (!selectedAdmin) return
    startTransition(async () => {
      const formData = new FormData()
      formData.set('new_owner_id', selectedAdmin)
      const result = await transferOwnershipAction(formData)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to transfer ownership')
        return
      }
      toast.success('Ownership transferred')
      setShowTransfer(false)
      setSelectedAdmin('')
      router.refresh()
    })
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-red-600 mb-1">Danger Zone</h2>
      <p className="text-sm text-gray-500 mb-4">Irreversible actions for workspace owners.</p>

      <div className="space-y-3">
        {/* Transfer Ownership */}
        {admins.length > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Transfer ownership</p>
              <p className="text-xs text-gray-500">Make another admin the workspace owner.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTransfer(true)}
              className="shrink-0"
            >
              <ArrowRightLeft className="w-4 h-4 mr-1" />
              Transfer
            </Button>
          </div>
        )}

        {/* Delete Workspace */}
        <div className="flex items-center justify-between rounded-lg border border-red-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Delete workspace</p>
            <p className="text-xs text-gray-500">Permanently delete this workspace and all its data.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDelete(true)}
            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 shrink-0"
          >
            <AlertTriangle className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDelete} onOpenChange={(open) => { if (!open) { setShowDelete(false); setConfirmName('') } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{orgName}</strong> and all its events, partners, deliverables, proofs, and team members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-xs text-gray-500 block mb-1.5">
              Type <strong>{orgName}</strong> to confirm
            </label>
            <Input
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={orgName}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!canConfirmDelete || isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? 'Deleting...' : 'Delete workspace'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Transfer ownership dialog */}
      <AlertDialog open={showTransfer} onOpenChange={(open) => { if (!open) { setShowTransfer(false); setSelectedAdmin('') } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transfer ownership</AlertDialogTitle>
            <AlertDialogDescription>
              Choose an admin to become the new workspace owner. You will be demoted to admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label className="text-xs text-gray-500 block mb-1.5">New owner</label>
            <select
              value={selectedAdmin}
              onChange={(e) => setSelectedAdmin(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-gray-400 focus-visible:ring-2 focus-visible:ring-gray-900/10"
            >
              <option value="">Select an admin...</option>
              {admins.map((a) => (
                <option key={a.user_id} value={a.user_id}>
                  {a.name || a.email.split('@')[0]} ({a.email})
                </option>
              ))}
            </select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTransfer}
              disabled={!selectedAdmin || isPending}
              className="bg-kurobeni text-white hover:bg-blackberry"
            >
              {isPending ? 'Transferring...' : 'Transfer ownership'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
