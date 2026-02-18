'use client'

import { useState, useEffect, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  UserPlus,
  Camera,
  FileText,
  CheckCircle,
  Shield,
  UserMinus,
  Check,
} from 'lucide-react'
import { useNotificationStore } from '@/stores/notification-store'
import { useOrgStore } from '@/stores/org-store'
import { markNotificationReadAction, markAllNotificationsReadAction } from '@/app/(app)/actions/notifications'
import { toast } from '@/components/ui/sonner'
import type { AppNotification, NotificationType } from '@/lib/types/database'

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  invite_accepted: <UserPlus className="w-4 h-4 text-green-500" />,
  proof_uploaded: <Camera className="w-4 h-4 text-blue-500" />,
  recap_published: <FileText className="w-4 h-4 text-copper" />,
  deliverable_completed: <CheckCircle className="w-4 h-4 text-emerald-500" />,
  member_joined: <UserPlus className="w-4 h-4 text-purple-500" />,
  role_changed: <Shield className="w-4 h-4 text-amber-500" />,
  member_removed: <UserMinus className="w-4 h-4 text-red-400" />,
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function NotificationBell() {
  const router = useRouter()
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const decrement = useNotificationStore((s) => s.decrement)
  const clearAll = useNotificationStore((s) => s.clearAll)
  const orgId = useOrgStore((s) => s.orgId)

  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  const fetchNotifications = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications?org_id=${orgId}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open, fetchNotifications])

  function handleNotificationClick(notification: AppNotification) {
    // Mark as read optimistically
    if (!notification.read_at) {
      decrement()
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, read_at: new Date().toISOString() } : n
        )
      )
      // Fire and forget
      const formData = new FormData()
      formData.set('notification_id', notification.id)
      markNotificationReadAction(formData)
    }

    // Navigate if link exists
    if (notification.link) {
      setOpen(false)
      router.push(notification.link)
    }
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      const result = await markAllNotificationsReadAction()
      if (result.ok) {
        clearAll()
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
        )
        toast.success('All notifications marked as read')
      }
    })
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-10 z-50 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={isPending}
                  className="text-xs text-copper hover:underline disabled:opacity-50"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto">
              {loading && notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-xs text-gray-400">Loading...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-6 h-6 text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No notifications yet</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNotificationClick(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                      !n.read_at ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      {TYPE_ICON[n.type as NotificationType] ?? (
                        <Bell className="w-4 h-4 text-gray-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!n.read_at ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{n.body}</p>
                      )}
                      <p className="text-xs text-gray-300 mt-1">{timeAgo(n.created_at)}</p>
                    </div>

                    {/* Unread dot */}
                    {!n.read_at && (
                      <div className="shrink-0 mt-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
