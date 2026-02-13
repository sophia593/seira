// lib/proof-utils.ts
// Proof file utilities — validation, formatting, storage helpers

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ALLOWED_PROOF_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'video/mp4',
  'video/quicktime',
] as const

export type AllowedProofMime = (typeof ALLOWED_PROOF_TYPES)[number]

/** 10 MB in bytes */
export const MAX_PROOF_SIZE = 10 * 1024 * 1024

// ---------------------------------------------------------------------------
// Type checks
// ---------------------------------------------------------------------------

export function isImageType(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

export function isVideoType(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

export function isPdfType(mimeType: string): boolean {
  return mimeType === 'application/pdf'
}

export function isAllowedProofType(mimeType: string): mimeType is AllowedProofMime {
  return (ALLOWED_PROOF_TYPES as readonly string[]).includes(mimeType)
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

export function getProofTypeLabel(mimeType: string): string {
  if (isImageType(mimeType)) return 'Photo'
  if (isVideoType(mimeType)) return 'Video'
  if (isPdfType(mimeType)) return 'PDF'
  return 'File'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ---------------------------------------------------------------------------
// Storage path helpers
// ---------------------------------------------------------------------------

/**
 * Build the storage path for a proof file.
 * Convention: {org_id}/{deliverable_id}/{timestamp}_{sanitized_filename}
 */
export function buildStoragePath(
  orgId: string,
  deliverableId: string,
  fileName: string
): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const ts = Date.now()
  return `${orgId}/${deliverableId}/${ts}_${sanitized}`
}

/**
 * Extract the storage path from a Supabase public URL.
 *
 * Input:  https://<ref>.supabase.co/storage/v1/object/public/proof/org_id/del_id/file.jpg
 * Output: org_id/del_id/file.jpg
 */
export function extractStoragePath(publicUrl: string): string {
  const marker = '/storage/v1/object/public/proof/'
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) {
    throw new Error(`Invalid proof URL: cannot extract storage path from "${publicUrl}"`)
  }
  return publicUrl.slice(idx + marker.length)
}
