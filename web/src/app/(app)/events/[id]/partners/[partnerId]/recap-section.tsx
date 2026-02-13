'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, Copy, Check, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from '@/components/ui/sonner'
import { createRecapAction } from '@/app/(app)/actions/recaps'
import type { RecapReport } from '@/lib/types/database'

interface RecapSectionProps {
  recaps: RecapReport[]
  eventId: string
  partnerId: string
}

export function RecapSection({ recaps, eventId, partnerId }: RecapSectionProps) {
  const router = useRouter()
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    setIsGenerating(true)
    const formData = new FormData()
    formData.append('event_id', eventId)
    formData.append('partner_id', partnerId)

    const result = await createRecapAction(formData)
    if (!result.ok) {
      toast.error(result.error ?? 'Failed to generate recap')
      setIsGenerating(false)
      return
    }
    router.push(`/events/${eventId}/partners/${partnerId}/recap/${result.id}`)
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Recaps</h2>
          {recaps.length > 0 && (
            <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
              {recaps.length}
            </span>
          )}
        </div>
        {recaps.length > 0 && (
          <Button
            size="sm"
            onClick={handleGenerate}
            isLoading={isGenerating}
            className="border-[#C59C79] text-[#C59C79] hover:bg-[#C59C79]/5"
            variant="outline"
          >
            <FileText className="w-4 h-4 mr-1" />
            New Recap
          </Button>
        )}
      </div>

      {recaps.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No recaps yet"
          description="Generate a recap to create a shareable proof summary for this partner."
          action={
            <Button
              size="sm"
              onClick={handleGenerate}
              isLoading={isGenerating}
              className="border-[#C59C79] text-[#C59C79] hover:bg-[#C59C79]/5"
              variant="outline"
            >
              <FileText className="w-4 h-4 mr-1" />
              Generate Recap
            </Button>
          }
        />
      ) : (
        <div className="divide-y divide-gray-100">
          {recaps.map((recap) => (
            <RecapRow
              key={recap.id}
              recap={recap}
              eventId={eventId}
              partnerId={partnerId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function RecapRow({
  recap,
  eventId,
  partnerId,
}: {
  recap: RecapReport
  eventId: string
  partnerId: string
}) {
  const [copied, setCopied] = useState(false)
  const isPublished = recap.status === 'published'

  const shareUrl = isPublished
    ? `${window.location.origin}/recap/${recap.share_token}`
    : null

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const date = new Date(recap.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Link
      href={`/events/${eventId}/partners/${partnerId}/recap/${recap.id}`}
      className="flex items-center gap-4 py-3 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{recap.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{date}</p>
      </div>

      <span
        className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
          isPublished
            ? 'bg-green-100 text-green-700 border-green-200'
            : 'bg-gray-100 text-gray-600 border-gray-200'
        }`}
      >
        {isPublished ? 'Published' : 'Draft'}
      </span>

      {isPublished && (
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      )}
    </Link>
  )
}
