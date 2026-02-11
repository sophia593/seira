'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { seedSampleDataAction } from '@/app/(app)/actions/sample-data'
import { toast } from '@/components/ui/sonner'

export function SampleDataButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const result = await seedSampleDataAction()
      if (!result.ok) {
        toast.error(result.error ?? 'Failed to create sample data')
        return
      }
      toast.success('Sample data created')
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center justify-center border border-gray-200 rounded-md h-9 px-4 text-sm text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
    >
      {isPending ? 'Creating...' : 'Or explore with sample data'}
    </button>
  )
}
