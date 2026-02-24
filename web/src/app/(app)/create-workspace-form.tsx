'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createWorkspaceAction } from '@/app/(app)/actions/workspace'

export function CreateWorkspaceForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createWorkspaceAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Failed to create workspace')
        return
      }
      router.push('/onboarding')
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold mb-2">Name your workspace</h1>
        <p className="text-sm text-muted-foreground mb-6">
          This is where your team will manage events and deliverables.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input
              id="name"
              name="name"
              defaultValue="My Workspace"
              required
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" isLoading={isPending}>
            Create Workspace
          </Button>
        </form>
      </div>
    </div>
  )
}
