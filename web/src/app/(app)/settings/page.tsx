'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Save, Loader2, Check, AlertTriangle, Sun, Moon, Monitor, Eye, EyeOff, KeyRound, X } from 'lucide-react'
import { getApi } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/user-store'
import { useOrgStore } from '@/stores/org-store'
import { renameWorkspaceAction } from '@/app/(app)/actions/workspace'
import { toast } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

// =============================================================================
// Constants
// =============================================================================

// =============================================================================
// Main Page
// =============================================================================

export default function SettingsPage() {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const orgId = useOrgStore((state) => state.orgId)
  const orgName = useOrgStore((state) => state.orgName)
  const orgRole = useOrgStore((state) => state.role)
  const setOrg = useOrgStore((state) => state.setOrg)
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch for theme
  useEffect(() => {
    setMounted(true)
  }, [])

  // Workspace form state
  const [workspaceName, setWorkspaceName] = useState('')
  const [initialWorkspaceName, setInitialWorkspaceName] = useState('')
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false)
  const [workspaceSaved, setWorkspaceSaved] = useState(false)
  const [workspaceError, setWorkspaceError] = useState<string | null>(null)

  const canRenameWorkspace = orgRole === 'owner' || orgRole === 'admin'

  // Form state
  const [name, setName] = useState('')
  // Initial values (for dirty checking)
  const [initialName, setInitialName] = useState('')

  // Loading states
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Success states (for inline feedback)
  const [profileSaved, setProfileSaved] = useState(false)

  // Delete account dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Password change
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Dirty checking
  const isWorkspaceDirty = useMemo(() => {
    return workspaceName.trim() !== initialWorkspaceName.trim()
  }, [workspaceName, initialWorkspaceName])

  const isProfileDirty = useMemo(() => {
    return name.trim() !== initialName.trim()
  }, [name, initialName])

  // Initialize workspace form from org store
  useEffect(() => {
    if (orgName) {
      setWorkspaceName(orgName)
      setInitialWorkspaceName(orgName)
    }
  }, [orgName])

  // Initialize form from store
  useEffect(() => {
    if (user) {
      const userName = user.name || ''
      setName(userName)
      setInitialName(userName)
    }
  }, [user])

  // Reset success states when form changes
  useEffect(() => {
    if (isWorkspaceDirty) {
      setWorkspaceSaved(false)
      setWorkspaceError(null)
    }
  }, [isWorkspaceDirty])

  useEffect(() => {
    if (isProfileDirty) {
      setProfileSaved(false)
    }
  }, [isProfileDirty])

  async function handleSaveWorkspace() {
    if (!isWorkspaceDirty || !canRenameWorkspace) return

    setIsSavingWorkspace(true)
    setWorkspaceSaved(false)
    setWorkspaceError(null)

    try {
      const formData = new FormData()
      formData.set('name', workspaceName.trim())

      const result = await renameWorkspaceAction(formData)

      if (!result.ok) {
        setWorkspaceError(result.error ?? 'Failed to rename workspace')
        return
      }

      const trimmed = workspaceName.trim()
      setInitialWorkspaceName(trimmed)
      setOrg({ id: orgId!, name: trimmed, role: orgRole! })

      setWorkspaceSaved(true)
      toast.success('workspace renamed')
      router.refresh()

      setTimeout(() => setWorkspaceSaved(false), 3000)
    } catch {
      setWorkspaceError('something went wrong')
    } finally {
      setIsSavingWorkspace(false)
    }
  }

  async function handleSaveProfile() {
    if (!isProfileDirty) return

    setIsSavingProfile(true)
    setProfileSaved(false)

    try {
      const api = getApi()
      const updated = await api.updateMe({ name: name.trim() || undefined })
      setUser({ ...user!, name: updated.name })

      // Update initial value so dirty check resets
      setInitialName(name.trim())

      // Show success
      setProfileSaved(true)
      toast.success('profile updated')

      // Reset success icon after delay
      setTimeout(() => setProfileSaved(false), 3000)
    } catch {
      toast.error('couldn\'t update profile')
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true)
    setDeleteError(null)

    try {
      const api = getApi()
      await api.deleteAccount()

      // Clear all local stores FIRST
      useUserStore.getState().clear()

      // Sign out from Supabase (session already invalid, but clean up cookies)
      const supabase = createClient()
      await supabase.auth.signOut()

      // Use replace so back button doesn't return to app
      router.replace('/')

      // Show toast after redirect
      toast.success('your account has been deleted')
    } catch {
      // Show error in modal, keep it open so user can retry
      setDeleteError('something went wrong. please try again.')
      setIsDeleting(false)
    }
  }

  function resetPasswordForm() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setPasswordError('')
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmPassword(false)
    setIsPasswordFormOpen(false)
  }

  async function handleChangePassword() {
    setPasswordError('')

    // Validation
    if (!currentPassword) {
      setPasswordError('current password is required')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('new password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("passwords don't match")
      return
    }
    if (currentPassword === newPassword) {
      setPasswordError('new password must be different from current password')
      return
    }

    setIsChangingPassword(true)

    try {
      const supabase = createClient()

      // First, verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user!.email,
        password: currentPassword,
      })

      if (signInError) {
        setPasswordError('current password is incorrect')
        setIsChangingPassword(false)
        return
      }

      // Now update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        if (updateError.message.includes('same')) {
          setPasswordError('new password must be different from current password')
        } else {
          setPasswordError(updateError.message.toLowerCase())
        }
        setIsChangingPassword(false)
        return
      }

      // Success
      toast.success('password updated')
      resetPasswordForm()
    } catch {
      setPasswordError('something went wrong, please try again')
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain">
      <div className="px-6 py-8 md:px-10 md:py-12 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="mt-2 text-muted-foreground text-base leading-relaxed">
            Manage your profile and preferences.
          </p>
        </div>

        {/* Workspace Section */}
        <section className="mb-8 sm:mb-10">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 lowercase">
            workspace
          </h2>
          <div className="space-y-3 sm:space-y-4 p-4 sm:p-6 bg-card rounded-xl border">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="workspaceName" className="text-sm">
                workspace name
              </Label>
              <Input
                id="workspaceName"
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="My Workspace"
                className="text-sm"
                disabled={!canRenameWorkspace}
                maxLength={60}
              />
              {!canRenameWorkspace && (
                <p className="text-xs text-muted-foreground">
                  only owners and admins can rename the workspace
                </p>
              )}
            </div>

            {workspaceError && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {workspaceError}
              </p>
            )}

            {canRenameWorkspace && (
              <SaveButton
                onClick={handleSaveWorkspace}
                isLoading={isSavingWorkspace}
                isSaved={workspaceSaved}
                isDirty={isWorkspaceDirty}
                label="save workspace"
                savedLabel="saved"
              />
            )}
          </div>
        </section>

        {/* Profile Section */}
        <section className="mb-8 sm:mb-10">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 lowercase">
            profile
          </h2>
          <div className="space-y-3 sm:space-y-4 p-4 sm:p-6 bg-card rounded-xl border">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-sm">
                email
              </Label>
              <Input
                id="email"
                type="email"
                value={user.email}
                disabled
                className="bg-muted text-sm"
              />
              <p className="text-xs text-muted-foreground">
                email cannot be changed
              </p>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-sm">
                name
              </Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="your name"
                className="text-sm"
              />
            </div>

            <SaveButton
              onClick={handleSaveProfile}
              isLoading={isSavingProfile}
              isSaved={profileSaved}
              isDirty={isProfileDirty}
              label="save profile"
              savedLabel="saved"
            />
          </div>
        </section>

        {/* Theme Section */}
        <section className="mb-8 sm:mb-10">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 lowercase">
            appearance
          </h2>
          <div className="p-4 sm:p-6 bg-card rounded-xl border">
            <div className="space-y-1.5 sm:space-y-2">
              <Label className="text-sm">theme</Label>
              <div className="flex gap-2">
                <Button
                  variant={mounted && theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="flex-1 gap-2 h-11 sm:h-9"
                >
                  <Sun className="h-4 w-4" />
                  <span className="hidden sm:inline">light</span>
                </Button>
                <Button
                  variant={mounted && theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="flex-1 gap-2 h-11 sm:h-9"
                >
                  <Moon className="h-4 w-4" />
                  <span className="hidden sm:inline">dark</span>
                </Button>
                <Button
                  variant={mounted && theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="flex-1 gap-2 h-11 sm:h-9"
                >
                  <Monitor className="h-4 w-4" />
                  <span className="hidden sm:inline">system</span>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {mounted && theme === 'system'
                  ? `using ${resolvedTheme} mode based on your system`
                  : 'choose your preferred color scheme'}
              </p>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section className="mb-8 sm:mb-10">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 lowercase">
            security
          </h2>
          <div className="p-4 sm:p-6 bg-card rounded-xl border">
            {!isPasswordFormOpen ? (
              // Collapsed state - just show button
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="font-medium text-sm sm:text-base flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-muted-foreground" />
                    password
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    change your account password
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsPasswordFormOpen(true)}
                  className="w-full sm:w-auto"
                >
                  change password
                </Button>
              </div>
            ) : (
              // Expanded state - show form
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm sm:text-base">change password</h3>
                  <button
                    onClick={resetPasswordForm}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Current Password */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="currentPassword" className="text-sm">
                    current password
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => {
                        setCurrentPassword(e.target.value)
                        if (passwordError) setPasswordError('')
                      }}
                      placeholder="enter current password"
                      className="pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      tabIndex={-1}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors w-10 h-10 flex items-center justify-center rounded-lg"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="newPassword" className="text-sm">
                    new password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        if (passwordError) setPasswordError('')
                      }}
                      placeholder="at least 8 characters"
                      className="pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      tabIndex={-1}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors w-10 h-10 flex items-center justify-center rounded-lg"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5 sm:space-y-2">
                  <Label htmlFor="confirmNewPassword" className="text-sm">
                    confirm new password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmNewPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        if (passwordError) setPasswordError('')
                      }}
                      placeholder="re-enter new password"
                      className="pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      tabIndex={-1}
                      className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors w-10 h-10 flex items-center justify-center rounded-lg"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {passwordError && (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {passwordError}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={resetPasswordForm}
                    className="flex-1 sm:flex-none"
                    disabled={isChangingPassword}
                  >
                    cancel
                  </Button>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !currentPassword || !newPassword || !confirmPassword}
                    className="flex-1 sm:flex-none"
                  >
                    {isChangingPassword ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        updating...
                      </>
                    ) : (
                      'update password'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="mb-8 sm:mb-10">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 lowercase text-destructive">
            danger zone
          </h2>
          <div className="p-4 sm:p-6 bg-card rounded-xl border border-destructive/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-medium text-sm sm:text-base">delete account</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  permanently delete your account and all associated data.
                  this action cannot be undone.
                </p>
              </div>
              <Dialog open={deleteDialogOpen} onOpenChange={(open) => {
                if (isDeleting) return // Prevent closing during deletion
                setDeleteDialogOpen(open)
                if (!open) {
                  setDeleteConfirmText('')
                  setDeleteError(null)
                }
              }}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground w-full sm:w-auto"
                  >
                    delete account
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      delete account
                    </DialogTitle>
                    <DialogDescription>
                      this will permanently delete your account and all associated
                      data. this action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-4">
                    {isDeleting ? (
                      <div className="flex flex-col items-center gap-3 py-4 animate-in fade-in duration-200">
                        <Loader2 className="h-6 w-6 animate-spin text-destructive" />
                        <p className="text-sm text-muted-foreground text-center">
                          deleting your account and all data...
                          <br />
                          <span className="text-xs">this may take a moment</span>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="confirm" className="text-sm">
                          type <span className="font-mono font-semibold">DELETE</span> to confirm
                        </Label>
                        <Input
                          id="confirm"
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => {
                            setDeleteConfirmText(e.target.value)
                            if (deleteError) setDeleteError(null)
                          }}
                          placeholder="DELETE"
                          className="font-mono h-11"
                          disabled={isDeleting}
                        />
                      </div>
                    )}
                    {deleteError && (
                      <p className="text-sm text-destructive flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        {deleteError}
                      </p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteDialogOpen(false)
                        setDeleteConfirmText('')
                        setDeleteError(null)
                      }}
                      disabled={isDeleting}
                    >
                      cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          deleting...
                        </>
                      ) : (
                        'delete my account'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// =============================================================================
// Save Button Component
// =============================================================================

interface SaveButtonProps {
  onClick: () => void
  isLoading: boolean
  isSaved: boolean
  isDirty: boolean
  label: string
  savedLabel: string
}

function SaveButton({
  onClick,
  isLoading,
  isSaved,
  isDirty,
  label,
  savedLabel,
}: SaveButtonProps) {
  const isDisabled = isLoading || !isDirty

  // When saved and not dirty, show a clearly disabled grey state
  if (isSaved && !isDirty) {
    return (
      <Button
        disabled
        variant="outline"
        className="lowercase w-full sm:w-auto text-sm opacity-60 bg-muted border-muted"
      >
        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 text-muted-foreground" />
        <span className="text-muted-foreground">{savedLabel}</span>
      </Button>
    )
  }

  return (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      className="lowercase w-full sm:w-auto text-sm"
      variant="default"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin" />
          saving...
        </>
      ) : (
        <>
          <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
          {label}
        </>
      )}
    </Button>
  )
}
