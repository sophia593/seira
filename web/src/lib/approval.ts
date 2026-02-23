import type { DeliverableCategory, OrgSettings } from '@/lib/types/database'

const DEFAULT_APPROVAL_CATEGORIES: DeliverableCategory[] = ['talent']

/**
 * Check if a deliverable category requires admin approval before being marked as proved.
 */
export function requiresApproval(
  category: DeliverableCategory,
  settings?: OrgSettings | null,
): boolean {
  const cats = settings?.approval_required_categories ?? DEFAULT_APPROVAL_CATEGORIES
  return cats.includes(category)
}
