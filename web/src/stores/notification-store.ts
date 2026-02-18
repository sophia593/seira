import { create } from 'zustand'

interface NotificationState {
  unreadCount: number
  isHydrated: boolean

  setUnreadCount: (count: number) => void
  decrement: () => void
  clearAll: () => void
  setHydrated: (hydrated: boolean) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  isHydrated: false,

  setUnreadCount: (count) => set({ unreadCount: count, isHydrated: true }),
  decrement: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
  clearAll: () => set({ unreadCount: 0 }),
  setHydrated: (isHydrated) => set({ isHydrated }),
}))

export const selectUnreadCount = (state: NotificationState) => state.unreadCount
