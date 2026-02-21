/**
 * Returns a human-readable relative time string for an event date.
 * Examples: "Event was yesterday", "Event is in 3 days", "Event is today"
 */
export function relativeEventTime(eventDateStr: string): string {
  const now = new Date()
  const eventDate = new Date(eventDateStr)
  // Compare dates only (strip time)
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())
  const diffDays = Math.round((nowDay.getTime() - eventDay.getTime()) / 86_400_000)

  if (diffDays === 0) return 'Event is today'
  if (diffDays === 1) return 'Event was yesterday'
  if (diffDays > 1) return `Event was ${diffDays} days ago`
  if (diffDays === -1) return 'Event is tomorrow'
  return `Event is in ${Math.abs(diffDays)} days`
}
