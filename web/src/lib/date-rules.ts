// lib/date-rules.ts
// Smart date rules for batch deliverable creation

export type DateRule = 'none' | 'event_day' | 'day_before' | '2d_after' | '1w_before' | 'custom'

export const DATE_RULE_OPTIONS: { value: DateRule; label: string }[] = [
  { value: 'none', label: 'No due date' },
  { value: 'event_day', label: 'Day of event' },
  { value: 'day_before', label: '1 day before event' },
  { value: '1w_before', label: '1 week before event' },
  { value: '2d_after', label: '48 hours after event' },
  { value: 'custom', label: 'Custom date' },
]

/**
 * Resolve a date rule against a specific event date.
 * Returns an ISO date string (YYYY-MM-DD) or null.
 */
export function resolveDate(
  rule: DateRule,
  eventDate: string | null,
  customDate?: string
): string | null {
  if (rule === 'none') return null
  if (rule === 'custom') return customDate ?? null
  if (!eventDate) return null

  if (rule === 'event_day') return eventDate

  const d = new Date(eventDate + 'T00:00:00')
  switch (rule) {
    case 'day_before':
      d.setDate(d.getDate() - 1)
      break
    case '1w_before':
      d.setDate(d.getDate() - 7)
      break
    case '2d_after':
      d.setDate(d.getDate() + 2)
      break
  }
  return d.toISOString().slice(0, 10)
}
