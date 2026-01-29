'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Link2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { getApi } from '@/lib/api'
import { toast } from '@/components/ui/sonner'

interface ShareModalProps {
  tripId: string
  existingShareToken?: string | null
  userName?: string | null
}

export function ShareModal({ tripId, existingShareToken, userName }: ShareModalProps) {
  const [open, setOpen] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(existingShareToken ?? null)
  const [copied, setCopied] = useState(false)
  const [sharedByName, setSharedByName] = useState(userName || '')

  const shareUrl = shareToken
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/shared/${shareToken}`
    : null

  const handleGenerateLink = async () => {
    setIsGenerating(true)
    try {
      const api = getApi()
      const result = await api.shareTrip(tripId, sharedByName || undefined)
      setShareToken(result.share_token)
      toast.success('share link created')
    } catch (error) {
      console.error('Failed to generate share link:', error)
      toast.error('failed to create share link')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('failed to copy link')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="lowercase">share this trip</DialogTitle>
          <DialogDescription>
            create a link to share this trip with friends. they can view the itinerary and save it to their own account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Name input (only shown before generating) */}
          {!shareToken && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Your name (optional)
              </label>
              <Input
                placeholder="e.g., Alex"
                value={sharedByName}
                onChange={(e) => setSharedByName(e.target.value)}
                className="lowercase"
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                shown to people who view this shared trip
              </p>
            </div>
          )}

          {/* Share URL display */}
          {shareToken ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Input
                    readOnly
                    value={shareUrl || ''}
                    className="pr-10 font-mono text-sm"
                  />
                  <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                anyone with this link can view your trip details and duplicate it to their account.
              </p>
            </div>
          ) : (
            <Button
              onClick={handleGenerateLink}
              disabled={isGenerating}
              className="w-full gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  creating link...
                </>
              ) : (
                <>
                  <Link2 className="w-4 h-4" />
                  create share link
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
