// lib/permissions.ts
// Centralized role permission checks for UI and server actions

import type { OrgRole } from '@/lib/types/database'

/** Owner or admin can manage team members (invite, remove, change roles) */
export function canManageTeam(role: OrgRole): boolean {
  return role === 'owner' || role === 'admin'
}

/** Owner or admin can create/edit/delete templates */
export function canManageTemplates(role: OrgRole): boolean {
  return role === 'owner' || role === 'admin'
}

/** Owner or admin can generate invite links */
export function canInviteMembers(role: OrgRole): boolean {
  return role === 'owner' || role === 'admin'
}

/**
 * Check if actor can remove a target member.
 * Owner can remove anyone (including admins).
 * Admin can remove contributors and viewers (not owners or other admins).
 */
export function canRemoveMember(
  actorRole: OrgRole,
  targetRole: OrgRole
): boolean {
  if (actorRole === 'owner') return targetRole !== 'owner'
  if (actorRole === 'admin') return targetRole !== 'owner' && targetRole !== 'admin'
  return false
}

/** Owner or admin can change member roles */
export function canChangeRole(role: OrgRole): boolean {
  return role === 'owner' || role === 'admin'
}

/**
 * Check if actor can change a specific target's role.
 * Nobody can change the owner's role.
 * Owner and admin can change non-owner roles.
 */
export function canChangeTargetRole(
  actorRole: OrgRole,
  targetRole: OrgRole
): boolean {
  if (targetRole === 'owner') return false
  return actorRole === 'owner' || actorRole === 'admin'
}

/** Only the owner can delete the workspace */
export function canDeleteWorkspace(role: OrgRole): boolean {
  return role === 'owner'
}

/** Only the owner can transfer ownership */
export function canTransferOwnership(role: OrgRole): boolean {
  return role === 'owner'
}

/** Owner or admin can publish/unpublish/delete recaps */
export function canManageRecaps(role: OrgRole): boolean {
  return role === 'owner' || role === 'admin'
}

/** Owner or admin can create, structurally edit, or delete events, partners, and deliverables */
export function canManageContent(role: OrgRole): boolean {
  return role === 'owner' || role === 'admin'
}

/** Owner, admin, or contributor can delete proofs */
export function canDeleteProof(role: OrgRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'contributor'
}

/** Owner, admin, or contributor can update deliverable status and upload proofs */
export function canEditContent(role: OrgRole): boolean {
  return role === 'owner' || role === 'admin' || role === 'contributor'
}
