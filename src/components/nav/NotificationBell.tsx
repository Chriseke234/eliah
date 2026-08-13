'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { Bell, Check, CheckCheck, Info, CheckCircle2, AlertTriangle, AlertCircle, Clock } from 'lucide-react'
import { getUserNotifications, markNotificationAsRead } from '@/app/actions/notifications'
import { type NotificationRow, type NotificationType } from '@/lib/database.types'

const typeIconMap: Record<NotificationType, React.ReactNode> = {
  INFO: <Info className="w-4 h-4 text-blue-400" />,
  SUCCESS: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  WARNING: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  ERROR: <AlertCircle className="w-4 h-4 text-red-400" />,
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface NotificationBellProps {
  align?: 'left' | 'right'
}

export function NotificationBell({ align = 'left' }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isPending, startTransition] = useTransition()
  const bellRef = useRef<HTMLDivElement>(null)

  const loadNotifications = async () => {
    const res = await getUserNotifications()
    setNotifications(res.notifications)
    setUnreadCount(res.unreadCount)
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markNotificationAsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    })
  }

  const handleMarkSingleRead = (id: string) => {
    startTransition(async () => {
      await markNotificationAsRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    })
  }

  return (
    <div ref={bellRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) loadNotifications()
        }}
        className="relative p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label="View notifications"
        aria-expanded={open}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white shadow-lg animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-50 ${
            align === 'left' ? 'left-0' : 'right-0'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isPending}
                className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">No notifications yet</p>
                <p className="text-[11px] text-slate-500">Updates on requests will appear here.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 flex items-start gap-3 transition-colors ${
                    n.read ? 'bg-slate-900/40 opacity-75' : 'bg-slate-900'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {typeIconMap[n.type] ?? <Info className="w-4 h-4 text-violet-400" />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-white truncate">{n.title}</p>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-2.5 h-2.5" /> {timeAgo(n.created_at)}
                      </span>
                    </div>
                    {n.body && <p className="text-xs text-slate-400 line-clamp-2">{n.body}</p>}
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => handleMarkSingleRead(n.id)}
                      disabled={isPending}
                      className="p-1 text-slate-500 hover:text-slate-200 transition-colors flex-shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
