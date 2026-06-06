'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'

// ─── Notification Bell Component (used in headers) ──────────────────────────

export function NotificationBell() {
  const { currentUser, setCurrentView } = useAppStore()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const fetchCount = useCallback(async () => {
    if (!currentUser?.id) return
    try {
      const roleParam = currentUser.role ? `&role=${currentUser.role}` : ''
      const res = await fetch(`/api/notifications?userId=${currentUser.id}&limit=1&filter=unread${roleParam}`)
      if (!res.ok) return
      const data = await res.json()
      setUnreadCount(data.counts?.unread || 0)
    } catch { /* silent */ }
  }, [currentUser])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [fetchCount])

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative size-9 rounded-full hover:bg-accent"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="size-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Quick dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[280px] sm:w-[300px] rounded-xl border bg-card shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-primary" />
              <span className="text-[13px] font-bold">Notifications</span>
              {unreadCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <div className="p-4">
            <div className="flex flex-col items-center gap-2">
              {unreadCount > 0 ? (
                <>
                  <p className="text-[13px] font-medium">{unreadCount} unread notification{unreadCount > 1 ? 's' : ''}</p>
                  <Button
                    className="rounded-xl gap-1.5 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
                    onClick={() => {
                      setIsOpen(false)
                      setCurrentView('notifications')
                    }}
                  >
                    <Bell className="size-3.5" />
                    View All Notifications
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-[13px] text-muted-foreground">No new notifications</p>
                  <Button
                    variant="outline"
                    className="rounded-xl w-full"
                    onClick={() => {
                      setIsOpen(false)
                      setCurrentView('notifications')
                    }}
                  >
                    View All
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Re-export NotificationProvider from notification-provider.tsx ──────────

export { NotificationProvider } from '@/components/notification-provider'
