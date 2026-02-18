// lib/role-config.ts
// Shared role configuration used by workspace-switcher and team management

import {
  Shield,
  ShieldCheck,
  PenLine,
  Eye,
  CalendarDays,
  Users,
  ClipboardList,
  Camera,
  FileText,
  Layout,
  UserPlus,
  Trash2,
} from 'lucide-react'
import type { OrgRole } from '@/lib/types/database'

// =============================================================================
// Types
// =============================================================================

export interface PermissionItem {
  label: string
  allowed: boolean
  icon: typeof CalendarDays
  detail: string
}

export interface PermissionSection {
  heading: string
  items: PermissionItem[]
}

export interface RoleConfigEntry {
  label: string
  shortLabel: string
  description: string
  summary: string
  icon: typeof Shield
  accentColor: string
  badgeBg: string
  badgeText: string
  badgeBorder: string
  dotColor: string
  glowColor: string
  ringColor: string
  progressColor: string
  sections: PermissionSection[]
}

// =============================================================================
// Config
// =============================================================================

export const ROLE_CONFIG: Record<OrgRole, RoleConfigEntry> = {
  owner: {
    label: 'Owner',
    shortLabel: 'OWN',
    description: 'Full access to everything',
    summary: 'You have unrestricted access to all features in this workspace, including destructive actions like transferring ownership and deleting the workspace.',
    icon: ShieldCheck,
    accentColor: 'text-amber-300',
    badgeBg: 'bg-amber-400/10',
    badgeText: 'text-amber-300/90',
    badgeBorder: 'border-amber-400/20',
    dotColor: 'bg-amber-400',
    glowColor: 'shadow-amber-400/20',
    ringColor: 'ring-amber-400/30',
    progressColor: 'bg-amber-400',
    sections: [
      {
        heading: 'Content',
        items: [
          { label: 'Create & manage events', allowed: true, icon: CalendarDays, detail: 'Add, edit, archive, and delete events' },
          { label: 'Add & remove partners', allowed: true, icon: Users, detail: 'Create partners, edit details, remove from events' },
          { label: 'Create & edit deliverables', allowed: true, icon: ClipboardList, detail: 'Full CRUD on deliverables, categories, due dates' },
          { label: 'Upload & delete proof', allowed: true, icon: Camera, detail: 'Attach photos, files, and screenshots as proof' },
        ],
      },
      {
        heading: 'Reporting',
        items: [
          { label: 'Generate recaps', allowed: true, icon: FileText, detail: 'Create recap reports from deliverable data' },
          { label: 'Publish & share recaps', allowed: true, icon: FileText, detail: 'Make recaps publicly accessible via share link' },
          { label: 'Manage templates', allowed: true, icon: Layout, detail: 'Create, edit, share, and delete templates' },
        ],
      },
      {
        heading: 'Administration',
        items: [
          { label: 'Invite & manage team', allowed: true, icon: UserPlus, detail: 'Send invites, change roles, remove members' },
          { label: 'Transfer ownership', allowed: true, icon: Shield, detail: 'Transfer workspace ownership to another admin' },
          { label: 'Delete workspace', allowed: true, icon: Trash2, detail: 'Permanently delete the workspace and all data' },
        ],
      },
    ],
  },
  admin: {
    label: 'Admin',
    shortLabel: 'ADM',
    description: 'Manage everything except workspace',
    summary: 'You can manage all content, team members, and templates. Only the workspace owner can transfer ownership or delete the workspace.',
    icon: Shield,
    accentColor: 'text-blue-300',
    badgeBg: 'bg-blue-400/10',
    badgeText: 'text-blue-300/90',
    badgeBorder: 'border-blue-400/20',
    dotColor: 'bg-blue-400',
    glowColor: 'shadow-blue-400/20',
    ringColor: 'ring-blue-400/30',
    progressColor: 'bg-blue-400',
    sections: [
      {
        heading: 'Content',
        items: [
          { label: 'Create & manage events', allowed: true, icon: CalendarDays, detail: 'Add, edit, archive, and delete events' },
          { label: 'Add & remove partners', allowed: true, icon: Users, detail: 'Create partners, edit details, remove from events' },
          { label: 'Create & edit deliverables', allowed: true, icon: ClipboardList, detail: 'Full CRUD on deliverables, categories, due dates' },
          { label: 'Upload & delete proof', allowed: true, icon: Camera, detail: 'Attach photos, files, and screenshots as proof' },
        ],
      },
      {
        heading: 'Reporting',
        items: [
          { label: 'Generate recaps', allowed: true, icon: FileText, detail: 'Create recap reports from deliverable data' },
          { label: 'Publish & share recaps', allowed: true, icon: FileText, detail: 'Make recaps publicly accessible via share link' },
          { label: 'Manage templates', allowed: true, icon: Layout, detail: 'Create, edit, share, and delete templates' },
        ],
      },
      {
        heading: 'Administration',
        items: [
          { label: 'Invite & manage team', allowed: true, icon: UserPlus, detail: 'Send invites, change roles, remove members' },
          { label: 'Transfer ownership', allowed: false, icon: Shield, detail: 'Only the owner can transfer ownership' },
          { label: 'Delete workspace', allowed: false, icon: Trash2, detail: 'Only the owner can delete the workspace' },
        ],
      },
    ],
  },
  contributor: {
    label: 'Contributor',
    shortLabel: 'CTR',
    description: 'Update status & upload proof',
    summary: 'You can update deliverable statuses and upload or remove proof files. Contact an admin to create events, partners, or deliverables.',
    icon: PenLine,
    accentColor: 'text-emerald-300',
    badgeBg: 'bg-emerald-400/10',
    badgeText: 'text-emerald-300/90',
    badgeBorder: 'border-emerald-400/20',
    dotColor: 'bg-emerald-400',
    glowColor: 'shadow-emerald-400/20',
    ringColor: 'ring-emerald-400/30',
    progressColor: 'bg-emerald-400',
    sections: [
      {
        heading: 'Content',
        items: [
          { label: 'Create & manage events', allowed: false, icon: CalendarDays, detail: 'Ask an admin to create or edit events' },
          { label: 'Add & remove partners', allowed: false, icon: Users, detail: 'Ask an admin to manage partners' },
          { label: 'Create & edit deliverables', allowed: false, icon: ClipboardList, detail: 'Ask an admin to add or modify deliverables' },
          { label: 'Update deliverable status', allowed: true, icon: ClipboardList, detail: 'Move deliverables through status workflow' },
          { label: 'Upload & delete proof', allowed: true, icon: Camera, detail: 'Attach and remove proof files on deliverables' },
        ],
      },
      {
        heading: 'Reporting',
        items: [
          { label: 'Generate recaps', allowed: false, icon: FileText, detail: 'Only admins can generate recap reports' },
          { label: 'Publish & share recaps', allowed: false, icon: FileText, detail: 'Only admins can publish recaps' },
          { label: 'Manage templates', allowed: false, icon: Layout, detail: 'Only admins can manage templates' },
        ],
      },
      {
        heading: 'Administration',
        items: [
          { label: 'Invite & manage team', allowed: false, icon: UserPlus, detail: 'Only admins can manage team membership' },
        ],
      },
    ],
  },
  viewer: {
    label: 'Viewer',
    shortLabel: 'VWR',
    description: 'Read-only access',
    summary: 'You have read-only access to this workspace. You can browse events, partners, deliverables, and proof but cannot make any changes.',
    icon: Eye,
    accentColor: 'text-white/40',
    badgeBg: 'bg-white/5',
    badgeText: 'text-white/40',
    badgeBorder: 'border-white/10',
    dotColor: 'bg-white/30',
    glowColor: 'shadow-white/5',
    ringColor: 'ring-white/10',
    progressColor: 'bg-white/30',
    sections: [
      {
        heading: 'Content',
        items: [
          { label: 'View events & partners', allowed: true, icon: CalendarDays, detail: 'Browse all events and partner details' },
          { label: 'View deliverables & proof', allowed: true, icon: ClipboardList, detail: 'See deliverable status and uploaded proof' },
          { label: 'Create or edit anything', allowed: false, icon: PenLine, detail: 'Contact an admin to request edit access' },
          { label: 'Upload or delete proof', allowed: false, icon: Camera, detail: 'Contact an admin to request contributor access' },
        ],
      },
      {
        heading: 'Reporting',
        items: [
          { label: 'View recaps', allowed: true, icon: FileText, detail: 'Read published and draft recaps' },
          { label: 'Generate or publish recaps', allowed: false, icon: FileText, detail: 'Only admins can manage recaps' },
        ],
      },
      {
        heading: 'Administration',
        items: [
          { label: 'Invite & manage team', allowed: false, icon: UserPlus, detail: 'Only admins can manage team membership' },
        ],
      },
    ],
  },
}
