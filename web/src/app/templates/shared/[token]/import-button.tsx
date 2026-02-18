'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { importSharedTemplateAction } from '@/app/(app)/actions/templates'

export function ImportTemplateButton({ shareToken }: { shareToken: string }) {
  const [isPending, startTransition] = useTransition()
  const [imported, setImported] = useState(false)

  function handleImport() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('share_token', shareToken)
      const result = await importSharedTemplateAction(fd)
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to import template')
        return
      }
      setImported(true)
      toast.success('Template imported to your workspace')
    })
  }

  if (imported) {
    return (
      <div className="text-center">
        <p className="text-sm text-green-600 mb-3">Template added to your workspace.</p>
        <a href="/settings/templates" className="text-sm text-copper hover:underline">
          View your templates
        </a>
      </div>
    )
  }

  return (
    <Button
      onClick={handleImport}
      disabled={isPending}
      className="w-full bg-kurobeni text-white hover:bg-blackberry"
    >
      {isPending ? 'Importing...' : 'Import to my workspace'}
    </Button>
  )
}
