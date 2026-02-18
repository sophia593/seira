'use client'

import { useState, useTransition, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Check, Plus, Loader2, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { useOrgStore } from '@/stores/org-store'
import {
  listWorkspacesAction,
  switchWorkspaceAction,
  createWorkspaceAction,
} from '@/app/(app)/actions/workspace'
import { ROLE_CONFIG } from '@/lib/role-config'
import type { OrgRole } from '@/lib/types/database'

// =============================================================================
// Workspace type
// =============================================================================

interface Workspace {
  id: string
  name: string
  role: OrgRole
}

// =============================================================================
// Helper: get role initials badge for workspace dropdown
// =============================================================================

function RoleInitials({ wsRole }: { wsRole: OrgRole }) {
  const cfg = ROLE_CONFIG[wsRole]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded px-1 py-px',
        'text-[8px] font-bold uppercase tracking-widest leading-none',
        cfg.badgeBg,
        cfg.badgeText,
        'border',
        cfg.badgeBorder,
      )}
    >
      <span className={cn('h-1 w-1 rounded-full shrink-0', cfg.dotColor)} />
      {cfg.shortLabel}
    </span>
  )
}

// =============================================================================
// PermissionProgress — small bar showing allowed / total ratio
// =============================================================================

function PermissionProgress({
  allowed,
  total,
  colorClass,
}: {
  allowed: number
  total: number
  colorClass: string
}) {
  const pct = total > 0 ? Math.round((allowed / total) * 100) : 0

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-[3px] rounded-full bg-white/5 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClass)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[8px] tabular-nums text-white/20 font-medium shrink-0 w-6 text-right">
        {pct}%
      </span>
    </div>
  )
}

// =============================================================================
// RoleBadge — collapsible role indicator for the sidebar
// =============================================================================

function RoleBadge({ role }: { role: OrgRole }) {
  const [expanded, setExpanded] = useState(false)
  const [hoveredPerm, setHoveredPerm] = useState<string | null>(null)
  const config = ROLE_CONFIG[role]
  const Icon = config.icon

  // Flatten all permission items to compute totals
  const allItems = useMemo(
    () => config.sections.flatMap((s) => s.items),
    [config.sections],
  )
  const allowedCount = allItems.filter((p) => p.allowed).length
  const totalCount = allItems.length

  return (
    <div className="px-3 pt-2 pb-1">
      {/* Collapsed badge trigger */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'group w-full flex items-center gap-2 rounded-lg border px-2.5 py-2',
          'transition-all duration-200 text-left',
          config.badgeBg,
          config.badgeBorder,
          'hover:bg-white/[0.08]',
        )}
      >
        {/* Icon container */}
        <div
          className={cn(
            'relative flex items-center justify-center w-6 h-6 rounded-md shrink-0',
            config.badgeBg,
            'shadow-sm',
            config.glowColor,
          )}
        >
          <Icon className={cn('w-3 h-3', config.accentColor)} />
          {/* Live dot for elevated roles */}
          {(role === 'owner' || role === 'admin') && (
            <span
              className={cn(
                'absolute -top-px -right-px h-1.5 w-1.5 rounded-full',
                config.dotColor,
                'ring-[1.5px] ring-kurobeni',
              )}
            />
          )}
        </div>

        {/* Text block */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span
              className={cn(
                'text-[11px] font-semibold tracking-wide leading-none',
                config.badgeText,
              )}
            >
              {config.label}
            </span>
            <span className="text-[8px] text-white/15 tabular-nums font-medium">
              {allowedCount}/{totalCount}
            </span>
          </div>
          <p className="text-[9px] text-white/20 leading-tight truncate mt-0.5">
            {config.description}
          </p>
        </div>

        {/* Chevron */}
        <ChevronDown
          className={cn(
            'w-2.5 h-2.5 text-white/15 shrink-0 transition-transform duration-200',
            'group-hover:text-white/30',
            expanded && 'rotate-180',
          )}
        />
      </button>

      {/* Expanded permissions panel */}
      {expanded && (
        <div
          className={cn(
            'mt-1.5 rounded-lg border overflow-hidden',
            config.badgeBorder,
            'bg-white/[0.015]',
            'animate-in fade-in slide-in-from-top-1 duration-200',
          )}
        >
          {/* Summary */}
          <div className="px-2.5 pt-2 pb-1.5">
            <p className="text-[9px] text-white/25 leading-relaxed">
              {config.summary}
            </p>
          </div>

          {/* Progress bar */}
          <div className="px-2.5 pb-2">
            <PermissionProgress
              allowed={allowedCount}
              total={totalCount}
              colorClass={config.progressColor}
            />
          </div>

          {/* Sections divider */}
          <div className="border-t border-white/5" />

          {/* Permission sections */}
          <div className="py-1">
            {config.sections.map((section) => (
              <div key={section.heading}>
                {/* Section heading */}
                <div className="px-2.5 pt-1.5 pb-0.5">
                  <p className="text-[8px] uppercase tracking-[0.12em] text-white/15 font-semibold">
                    {section.heading}
                  </p>
                </div>

                {/* Items */}
                <ul className="px-1.5">
                  {section.items.map((perm) => {
                    const PermIcon = perm.icon
                    const isHovered = hoveredPerm === perm.label
                    return (
                      <li
                        key={perm.label}
                        className={cn(
                          'relative flex items-start gap-1.5 px-1.5 py-[3px] rounded-md',
                          'transition-colors duration-100',
                          isHovered && 'bg-white/[0.03]',
                        )}
                        onMouseEnter={() => setHoveredPerm(perm.label)}
                        onMouseLeave={() => setHoveredPerm(null)}
                      >
                        {/* Status icon */}
                        <span className="flex items-center justify-center w-3 h-3 mt-px shrink-0">
                          {perm.allowed ? (
                            <Check className={cn('w-2.5 h-2.5', config.accentColor)} />
                          ) : (
                            <X className="w-2 h-2 text-white/10" />
                          )}
                        </span>

                        {/* Label + detail */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <PermIcon
                              className={cn(
                                'w-2.5 h-2.5 shrink-0',
                                perm.allowed ? 'text-white/25' : 'text-white/8',
                              )}
                            />
                            <span
                              className={cn(
                                'text-[10px] leading-tight',
                                perm.allowed ? 'text-white/45' : 'text-white/15',
                              )}
                            >
                              {perm.label}
                            </span>
                          </div>
                          {/* Hover detail */}
                          {isHovered && (
                            <p className="text-[8px] text-white/15 leading-snug mt-px ml-3.5 animate-in fade-in duration-150">
                              {perm.detail}
                            </p>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          {/* Footer — contextual message for restricted roles */}
          {(role === 'contributor' || role === 'viewer') && (
            <div className="border-t border-white/5 px-2.5 py-2">
              <p className="text-[8px] text-white/15 leading-relaxed">
                {role === 'contributor'
                  ? 'Your role allows you to mark deliverables complete and attach proof files. For structural changes like adding events, partners, or deliverables, reach out to a workspace admin.'
                  : 'You currently have read-only access. If you need to make changes, contact a workspace admin to have your role upgraded.'}
              </p>
            </div>
          )}

          {/* Owner/Admin footer — quick access hint */}
          {(role === 'owner' || role === 'admin') && (
            <div className="border-t border-white/5 px-2.5 py-1.5">
              <p className="text-[8px] text-white/15 leading-relaxed">
                Manage roles from{' '}
                <span className="text-white/30 font-medium">Settings &rarr; Team</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// WorkspaceSwitcher — main exported component
// =============================================================================

export function WorkspaceSwitcher() {
  const router = useRouter()
  const orgId = useOrgStore((state) => state.orgId)
  const orgName = useOrgStore((state) => state.orgName)
  const role = useOrgStore((state) => state.role)
  const setOrg = useOrgStore((state) => state.setOrg)

  const [isOpen, setIsOpen] = useState(false)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasFetched, setHasFetched] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Create workspace inline form state
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const createInputRef = useRef<HTMLInputElement>(null)

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------

  // Fetch workspaces lazily on first open
  useEffect(() => {
    if (isOpen && !hasFetched) {
      setIsLoading(true)
      listWorkspacesAction().then((result) => {
        if (result.ok && result.workspaces) {
          setWorkspaces(result.workspaces)
        }
        setHasFetched(true)
        setIsLoading(false)
      })
    }
  }, [isOpen, hasFetched])

  // Auto-focus create input when toggled
  useEffect(() => {
    if (showCreate) {
      setTimeout(() => createInputRef.current?.focus(), 0)
    }
  }, [showCreate])

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  function handleSwitch(workspace: Workspace) {
    if (workspace.id === orgId) return

    startTransition(async () => {
      const formData = new FormData()
      formData.set('org_id', workspace.id)
      const result = await switchWorkspaceAction(formData)

      if (!result.ok) {
        toast.error(result.error ?? 'Failed to switch workspace')
        return
      }

      if (result.org) {
        setOrg({ id: result.org.id, name: result.org.name, role: result.org.role })
      }

      setIsOpen(false)
      router.refresh()
    })
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return

    startTransition(async () => {
      const formData = new FormData()
      formData.set('name', name)
      const result = await createWorkspaceAction(formData)

      if (!result.ok) {
        toast.error(result.error ?? 'Failed to create workspace')
        return
      }

      toast.success('Workspace created')
      setNewName('')
      setShowCreate(false)
      setHasFetched(false) // Refetch the list
      setIsOpen(false)
      router.refresh()
    })
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (!open) {
      setShowCreate(false)
      setNewName('')
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Workspace dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-full px-4 py-3.5 text-left hover:bg-white/5 transition-colors focus:outline-none"
          >
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[13px] truncate text-white leading-none">
                {orgName || 'Workspace'}
              </span>
              <ChevronDown className="w-2.5 h-2.5 text-white/30 shrink-0" />
            </div>
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={4}
          className="w-72"
        >
          {/* Dropdown header */}
          <DropdownMenuLabel className="text-[8px] uppercase tracking-[0.12em] text-muted-foreground font-medium">
            Workspaces
          </DropdownMenuLabel>

          {/* Workspace list */}
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            workspaces.map((ws) => {
              const wsConfig = ROLE_CONFIG[ws.role]
              const WsIcon = wsConfig.icon
              const isCurrent = ws.id === orgId

              return (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => handleSwitch(ws)}
                  disabled={isPending}
                  className={cn(
                    'cursor-pointer flex items-center gap-2.5 py-2',
                    isCurrent && 'bg-accent/50',
                  )}
                >
                  {/* Workspace initials */}
                  <div
                    className={cn(
                      'w-7 h-7 rounded-md flex items-center justify-center shrink-0',
                      'text-[9px] font-bold tracking-wider',
                      isCurrent
                        ? `${wsConfig.badgeBg} ${wsConfig.badgeText} ring-1 ${wsConfig.ringColor}`
                        : 'bg-primary/5 text-primary/60',
                    )}
                  >
                    {ws.name.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Workspace info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate leading-none">
                      {ws.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <WsIcon className={cn('w-2.5 h-2.5 shrink-0', wsConfig.badgeText)} />
                      <span className={cn('text-[9px] font-medium leading-none', wsConfig.badgeText)}>
                        {wsConfig.label}
                      </span>
                      <span className="text-[8px] text-muted-foreground/50 leading-none">
                        {wsConfig.description}
                      </span>
                    </div>
                  </div>

                  {/* Active indicator */}
                  {isCurrent && (
                    <Check className={cn('w-3 h-3 shrink-0', wsConfig.accentColor)} />
                  )}
                </DropdownMenuItem>
              )
            })
          )}

          <DropdownMenuSeparator />

          {/* Create workspace */}
          {showCreate ? (
            <div className="px-2 py-2" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleCreate} className="flex items-center gap-1.5">
                <Input
                  ref={createInputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Workspace name"
                  className="h-7 text-[11px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setShowCreate(false)
                      setNewName('')
                    }
                  }}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newName.trim() || isPending}
                  className="h-7 px-2 text-[10px] shrink-0"
                >
                  {isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    'Create'
                  )}
                </Button>
              </form>
            </div>
          ) : (
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault()
                setShowCreate(true)
              }}
              className="cursor-pointer"
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              <span className="text-[11px]">Create workspace</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Role indicator badge */}
      {role && <RoleBadge role={role} />}

      {/* Bottom divider for workspace header area */}
      <div className="border-b border-white/10" />
    </>
  )
}
