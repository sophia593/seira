import { create } from "zustand"

interface UserPreferences {
  home_airport: string | null
  preferred_airlines: string[] | null
  seat_preference: string | null
  cabin_class: string | null
  budget_default: number | null
}

interface User {
  id: string
  email: string
  name: string | null
  avatar_url: string | null
}

interface UserState {
  user: User | null
  preferences: UserPreferences | null
  isLoading: boolean
  isHydrated: boolean

  // Actions
  setUser: (user: User | null) => void
  setPreferences: (preferences: UserPreferences | null) => void
  updatePreferences: (updates: Partial<UserPreferences>) => void
  setLoading: (loading: boolean) => void
  setHydrated: (hydrated: boolean) => void
  reset: () => void
  clear: () => void  // Alias for reset, used by logout
}

const initialState = {
  user: null,
  preferences: null,
  isLoading: true,
  isHydrated: false,
}

export const useUserStore = create<UserState>((set) => ({
  ...initialState,

  setUser: (user) => set({ user }),

  setPreferences: (preferences) => set({ preferences }),

  updatePreferences: (updates) =>
    set((state) => ({
      preferences: state.preferences
        ? { ...state.preferences, ...updates }
        : null,
    })),

  setLoading: (isLoading) => set({ isLoading }),

  setHydrated: (isHydrated) => set({ isHydrated }),

  reset: () => set(initialState),

  clear: () => set(initialState),  // Alias for reset, used by logout
}))

// Selectors for common access patterns
export const selectUser = (state: UserState) => state.user
export const selectPreferences = (state: UserState) => state.preferences
export const selectIsAuthenticated = (state: UserState) => !!state.user
export const selectIsLoading = (state: UserState) => state.isLoading
