'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { getApi } from '@/lib/api'
import { useUserStore } from '@/stores/user-store'
import { toast } from '@/components/ui/sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// =============================================================================
// Constants
// =============================================================================

const CABIN_CLASSES = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Premium Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First Class' },
]

const SEAT_PREFERENCES = [
  { value: 'window', label: 'Window' },
  { value: 'aisle', label: 'Aisle' },
  { value: 'middle', label: 'Middle' },
  { value: 'no_preference', label: 'No Preference' },
]

// =============================================================================
// Main Page
// =============================================================================

export default function SettingsPage() {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const preferences = useUserStore((state) => state.preferences)
  const setUser = useUserStore((state) => state.setUser)
  const setPreferences = useUserStore((state) => state.setPreferences)

  // Form state
  const [name, setName] = useState('')
  const [homeAirport, setHomeAirport] = useState('')
  const [cabinClass, setCabinClass] = useState('')
  const [seatPreference, setSeatPreference] = useState('')
  const [budgetDefault, setBudgetDefault] = useState('')

  // Initial values (for dirty checking)
  const [initialName, setInitialName] = useState('')
  const [initialHomeAirport, setInitialHomeAirport] = useState('')
  const [initialCabinClass, setInitialCabinClass] = useState('')
  const [initialSeatPreference, setInitialSeatPreference] = useState('')
  const [initialBudgetDefault, setInitialBudgetDefault] = useState('')

  // Loading states
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPrefs, setIsSavingPrefs] = useState(false)

  // Success states (for inline feedback)
  const [profileSaved, setProfileSaved] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)

  // Dirty checking
  const isProfileDirty = useMemo(() => {
    return name.trim() !== initialName.trim()
  }, [name, initialName])

  const isPreferencesDirty = useMemo(() => {
    return (
      homeAirport.trim().toUpperCase() !== initialHomeAirport.trim().toUpperCase() ||
      cabinClass !== initialCabinClass ||
      seatPreference !== initialSeatPreference ||
      budgetDefault !== initialBudgetDefault
    )
  }, [
    homeAirport,
    initialHomeAirport,
    cabinClass,
    initialCabinClass,
    seatPreference,
    initialSeatPreference,
    budgetDefault,
    initialBudgetDefault,
  ])

  // Initialize form from store
  useEffect(() => {
    if (user) {
      const userName = user.name || ''
      setName(userName)
      setInitialName(userName)
    }
    if (preferences) {
      const airport = preferences.home_airport || ''
      const cabin = preferences.cabin_class || ''
      const seat = preferences.seat_preference || ''
      const budget = preferences.budget_default?.toString() || ''

      setHomeAirport(airport)
      setCabinClass(cabin)
      setSeatPreference(seat)
      setBudgetDefault(budget)

      setInitialHomeAirport(airport)
      setInitialCabinClass(cabin)
      setInitialSeatPreference(seat)
      setInitialBudgetDefault(budget)
    }
  }, [user, preferences])

  // Reset success state when form changes
  useEffect(() => {
    if (isProfileDirty) {
      setProfileSaved(false)
    }
  }, [isProfileDirty])

  useEffect(() => {
    if (isPreferencesDirty) {
      setPrefsSaved(false)
    }
  }, [isPreferencesDirty])

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

  async function handleSavePreferences() {
    if (!isPreferencesDirty) return

    setIsSavingPrefs(true)
    setPrefsSaved(false)

    try {
      const api = getApi()
      const updated = await api.updatePreferences({
        home_airport: homeAirport.trim().toUpperCase() || null,
        cabin_class: cabinClass || null,
        seat_preference: seatPreference || null,
        budget_default: budgetDefault ? parseInt(budgetDefault, 10) : null,
      })
      setPreferences(updated)

      // Update initial values so dirty check resets
      setInitialHomeAirport(homeAirport.trim().toUpperCase())
      setInitialCabinClass(cabinClass)
      setInitialSeatPreference(seatPreference)
      setInitialBudgetDefault(budgetDefault)

      // Show success
      setPrefsSaved(true)
      toast.success('preferences saved')

      // Reset success icon after delay
      setTimeout(() => setPrefsSaved(false), 3000)
    } catch {
      toast.error('couldn\'t save preferences')
    } finally {
      setIsSavingPrefs(false)
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
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Back link */}
        <Link
          href="/chat"
          className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          back to chat
        </Link>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-page-title">settings</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
            manage your profile and travel preferences
          </p>
        </div>

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

        {/* Travel Preferences Section */}
        <section className="mb-8 sm:mb-10">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 lowercase">
            travel preferences
          </h2>
          <div className="space-y-3 sm:space-y-4 p-4 sm:p-6 bg-card rounded-xl border">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="homeAirport" className="text-sm">
                home airport
              </Label>
              <Input
                id="homeAirport"
                type="text"
                value={homeAirport}
                onChange={(e) => setHomeAirport(e.target.value.toUpperCase())}
                placeholder="LAX"
                maxLength={4}
                className="uppercase text-sm"
              />
              <p className="text-xs text-muted-foreground">
                3-letter airport code (e.g., LAX, JFK, ORD)
              </p>
            </div>

            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="cabinClass" className="text-sm">
                  preferred cabin
                </Label>
                <Select value={cabinClass} onValueChange={setCabinClass}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="select cabin class" />
                  </SelectTrigger>
                  <SelectContent>
                    {CABIN_CLASSES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="seatPreference" className="text-sm">
                  seat preference
                </Label>
                <Select value={seatPreference} onValueChange={setSeatPreference}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="select seat preference" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEAT_PREFERENCES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="budget" className="text-sm">
                default budget (USD)
              </Label>
              <Input
                id="budget"
                type="number"
                value={budgetDefault}
                onChange={(e) => setBudgetDefault(e.target.value)}
                placeholder="1000"
                min={0}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                your typical budget for a trip (flights + events)
              </p>
            </div>

            <SaveButton
              onClick={handleSavePreferences}
              isLoading={isSavingPrefs}
              isSaved={prefsSaved}
              isDirty={isPreferencesDirty}
              label="save preferences"
              savedLabel="saved"
            />
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

  return (
    <Button
      onClick={onClick}
      disabled={isDisabled}
      className="lowercase w-full sm:w-auto text-sm"
      variant={isSaved ? 'outline' : 'default'}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin" />
          saving...
        </>
      ) : isSaved ? (
        <>
          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
          {savedLabel}
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
