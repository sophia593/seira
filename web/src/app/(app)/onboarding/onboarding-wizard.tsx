'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { CATEGORY_CONFIG } from '@/lib/constants'
import { updateOrgProfileAction, completeOnboardingAction } from '@/app/(app)/actions/onboarding'
import { createEventAction } from '@/app/(app)/actions/events'
import { createPartnerAction } from '@/app/(app)/actions/partners'
import type { OrgType, TemplateDeliverable } from '@/lib/types/database'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ORG_TYPES: { value: OrgType; label: string }[] = [
  { value: 'sports', label: 'Sports team / league' },
  { value: 'music', label: 'Music / entertainment' },
  { value: 'festival', label: 'Festival / fair' },
  { value: 'conference', label: 'Conference / expo' },
  { value: 'university', label: 'University / college' },
  { value: 'other', label: 'Other' },
]

const ORG_TYPE_INDUSTRY: Record<string, string | null> = {
  sports: 'Sports',
  music: 'Music',
  festival: 'Festival',
  conference: 'Tech Conference',
  university: null,
  other: null,
}

const STEP_LABELS = ['Workspace', 'Event', 'Partner'] as const

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OnboardingWizardProps {
  orgId: string
  currentOrgName: string
  currentOrgType?: OrgType
  globalTemplates: {
    id: string
    name: string
    industry: string | null
    deliverables: TemplateDeliverable[]
  }[]
}

// ---------------------------------------------------------------------------
// Step Indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEP_LABELS.map((label, i) => {
        const stepNum = (i + 1) as 1 | 2 | 3
        const isCompleted = stepNum < current
        const isActive = stepNum === current
        const isUpcoming = stepNum > current

        return (
          <div key={label} className="flex items-center">
            {/* Connector line before (except first) */}
            {i > 0 && (
              <div
                className={cn(
                  'w-12 h-px',
                  isUpcoming ? 'bg-gray-200' : 'bg-copper',
                )}
              />
            )}

            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  isCompleted && 'bg-copper text-white',
                  isActive && 'bg-kurobeni text-white',
                  isUpcoming && 'bg-gray-200 text-gray-400',
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span
                className={cn(
                  'text-[10px] tracking-widest uppercase',
                  isActive ? 'text-gray-900 font-medium' : 'text-gray-400',
                )}
              >
                {label}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Wizard
// ---------------------------------------------------------------------------

export function OnboardingWizard({
  currentOrgName,
  currentOrgType,
  globalTemplates,
}: OnboardingWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1
  const [orgName, setOrgName] = useState(currentOrgName === 'My Workspace' ? '' : currentOrgName)
  const [orgType, setOrgType] = useState<OrgType | ''>(currentOrgType ?? '')

  // Step 2
  const [eventName, setEventName] = useState('')
  const [eventVenue, setEventVenue] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [createdEventId, setCreatedEventId] = useState<string | null>(null)

  // Step 3
  const [partnerName, setPartnerName] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  // Filtered templates based on org type
  const filteredTemplates = useMemo(() => {
    if (!orgType) return globalTemplates
    const industry = ORG_TYPE_INDUSTRY[orgType]
    if (!industry) return globalTemplates
    const filtered = globalTemplates.filter((t) => t.industry === industry)
    return filtered.length > 0 ? filtered : globalTemplates
  }, [orgType, globalTemplates])

  const selectedTemplate = selectedTemplateId
    ? globalTemplates.find((t) => t.id === selectedTemplateId) ?? null
    : null

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleStep1 = () => {
    setError(null)
    const name = orgName.trim() || 'My Workspace'

    if (!orgType) {
      setError('Please select an organization type')
      return
    }

    const formData = new FormData()
    formData.set('name', name)
    formData.set('org_type', orgType)

    startTransition(async () => {
      const result = await updateOrgProfileAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Failed to update workspace')
        return
      }
      setStep(2)
    })
  }

  const handleStep2 = () => {
    setError(null)

    if (!eventName.trim()) {
      setError('Event name is required')
      return
    }

    const formData = new FormData()
    formData.set('name', eventName.trim())
    if (eventVenue.trim()) formData.set('venue', eventVenue.trim())
    if (eventDate) formData.set('date', eventDate)

    startTransition(async () => {
      const result = await createEventAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Failed to create event')
        return
      }
      setCreatedEventId(result.id ?? null)
      setStep(3)
    })
  }

  const handleStep3 = () => {
    setError(null)

    if (!partnerName.trim()) {
      setError('Partner name is required')
      return
    }
    if (!createdEventId) {
      setError('No event created — please go back')
      return
    }

    const formData = new FormData()
    formData.set('event_id', createdEventId)
    formData.set('name', partnerName.trim())

    if (selectedTemplate && selectedTemplate.deliverables.length > 0) {
      formData.set('deliverables', JSON.stringify(selectedTemplate.deliverables))
    }

    startTransition(async () => {
      const result = await createPartnerAction(formData)
      if (!result.ok) {
        setError(result.error ?? 'Failed to create partner')
        return
      }
      await completeOnboardingAction()
      router.push(`/events/${createdEventId}`)
    })
  }

  const handleSkip = () => {
    startTransition(async () => {
      await completeOnboardingAction()
      router.push('/dashboard')
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg">
        <StepIndicator current={step} />

        {/* Step 1 — Workspace */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-semibold mb-1">Set up your workspace</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Give your workspace a name and tell us what kind of organization you are.
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="org-name">Workspace name</Label>
                <Input
                  id="org-name"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="e.g., Metro Arena Partnerships"
                  autoFocus
                  disabled={isPending}
                />
              </div>

              <div className="space-y-2">
                <Label>Organization type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {ORG_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      disabled={isPending}
                      onClick={() => setOrgType(t.value)}
                      className={cn(
                        'rounded-lg border px-3 py-2.5 text-sm text-left transition-colors',
                        orgType === t.value
                          ? 'bg-kurobeni text-white border-kurobeni'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {error && <p className="text-sm text-destructive mt-4">{error}</p>}

            <div className="mt-8">
              <Button
                onClick={handleStep1}
                isLoading={isPending}
                loadingText="Saving..."
                className="w-full bg-kurobeni text-white hover:bg-blackberry"
                disabled={!orgType}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Event */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-semibold mb-1">Create your first event</h1>
            <p className="text-sm text-muted-foreground mb-8">
              This could be a game, show, festival, or any activation.
            </p>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="event-name">Event name *</Label>
                <Input
                  id="event-name"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  placeholder="e.g., Home Opener vs. Rivals"
                  autoFocus
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-venue">Venue</Label>
                <Input
                  id="event-venue"
                  value={eventVenue}
                  onChange={(e) => setEventVenue(e.target.value)}
                  placeholder="e.g., Main Arena"
                  disabled={isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="event-date">Date</Label>
                <Input
                  id="event-date"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive mt-4">{error}</p>}

            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setError(null); setStep(1) }}
                disabled={isPending}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <Button
                onClick={handleStep2}
                isLoading={isPending}
                loadingText="Creating..."
                className="flex-1 bg-kurobeni text-white hover:bg-blackberry"
                disabled={!eventName.trim()}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {/* Step 3 — Partner + Template */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-semibold mb-1">Add your first sponsor</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Select a template to pre-fill deliverables, or start blank.
            </p>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="partner-name">Partner name *</Label>
                <Input
                  id="partner-name"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  placeholder="e.g., Acme Corp"
                  autoFocus
                  disabled={isPending}
                />
              </div>

              {/* Template selector */}
              {filteredTemplates.length > 0 && (
                <div className="space-y-2">
                  <Label>Deliverable template</Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setSelectedTemplateId(null)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs transition-colors',
                        selectedTemplateId === null
                          ? 'bg-kurobeni text-white border-kurobeni'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
                      )}
                    >
                      Blank
                    </button>
                    {filteredTemplates.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        disabled={isPending}
                        onClick={() => setSelectedTemplateId(t.id)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs transition-colors',
                          selectedTemplateId === t.id
                            ? 'bg-kurobeni text-white border-kurobeni'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
                        )}
                      >
                        {t.name}
                        <span className="ml-1 opacity-60">({t.deliverables.length})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Template preview */}
              {selectedTemplate && selectedTemplate.deliverables.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-3 space-y-1.5">
                  <p className="text-[10px] tracking-widest text-gray-400 uppercase mb-2">
                    Deliverables ({selectedTemplate.deliverables.length})
                  </p>
                  {selectedTemplate.deliverables.map((d, i) => {
                    const cat = CATEGORY_CONFIG[d.category]
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className={cn('inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium', cat.bgColor, cat.color)}>
                          {cat.label}
                        </span>
                        <span className="text-gray-700 truncate">{d.title}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {error && <p className="text-sm text-destructive mt-4">{error}</p>}

            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={() => { setError(null); setStep(2) }}
                disabled={isPending}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <Button
                onClick={handleStep3}
                isLoading={isPending}
                loadingText="Finishing..."
                className="flex-1 bg-kurobeni text-white hover:bg-blackberry"
                disabled={!partnerName.trim()}
              >
                Finish
              </Button>
            </div>
          </div>
        )}

        {/* Skip link */}
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Skip setup
          </button>
        </div>
      </div>
    </div>
  )
}
